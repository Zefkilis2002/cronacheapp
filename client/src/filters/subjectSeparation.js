// --------------------------------------------------------------------------
// Separazione Soggetto / Sfondo
//
// Usa MediaPipe Image Segmenter (modello Selfie Multiclass) che gira su GPU
// via WebGL: segmentazione della persona in ~1 secondo. Produce due livelli:
//   - subject   : PNG con il soggetto ritagliato (sfondo trasparente)
//   - background: immagine originale con l'area del soggetto ricostruita
//                 (inpainting veloce) così da poter spostare i due livelli
//                 indipendentemente.
//
// Il modello viene scaricato al primo utilizzo e poi resta in cache: le volte
// successive l'elaborazione è quasi istantanea.
// --------------------------------------------------------------------------

import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';

const INP_MAX = 256;  // scala di lavoro per l'inpainting dello sfondo
const OUT_MAX = 1600; // lato lungo massimo dei livelli prodotti (il canvas notizie è ~1080px)

const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
// Modello leggero (~250KB) persona/sfondo: download rapido e inferenza veloce.
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

// --------------------------- SEGMENTER (singleton) ---------------------------

let segmenterPromise = null;
let warmed = false;

async function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
      const makeWith = (delegate) => ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: 'IMAGE',
        outputCategoryMask: false,
        outputConfidenceMasks: true
      });
      try {
        return await makeWith('GPU');
      } catch (e) {
        console.warn('MediaPipe GPU non disponibile, uso CPU:', e);
        return makeWith('CPU');
      }
    })();
  }
  return segmenterPromise;
}

// Precarica il modello e "scalda" la GPU (compilazione shader) con una piccola
// inferenza fittizia, così il primo utilizzo reale è già rapido.
export async function warmupSegmenter() {
  if (warmed) return;
  warmed = true;
  try {
    const s = await getSegmenter();
    const c = makeCanvas(64, 64);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 64, 64);
    const r = s.segment(c);
    if (r.confidenceMasks) r.confidenceMasks.forEach(m => m.close());
    if (r.categoryMask) r.categoryMask.close();
  } catch (e) {
    warmed = false; // riprova al prossimo tentativo
  }
}

// --------------------------- UTILITY IMMAGINE ---------------------------

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (typeof src === 'string' && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Caricamento immagine fallito'));
    img.src = src;
  });
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function getImageData(source, w, h) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, w, h);
  try {
    return { imageData: ctx.getImageData(0, 0, w, h), canvas: c, ctx };
  } catch (e) {
    throw new Error('Impossibile leggere i pixel (immagine protetta da CORS).');
  }
}

function canvasToResult(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      resolve({ url, blob, _revoke: () => URL.revokeObjectURL(url) });
    }, type, quality);
  });
}

// --------------------------- BOX BLUR (canale singolo) ---------------------------

function boxBlur(src, w, h, radius) {
  if (radius <= 0) return src;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const win = radius * 2 + 1;
  for (let y = 0; y < h; y++) {
    let acc = 0;
    const row = y * w;
    for (let x = -radius; x <= radius; x++) acc += src[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / win;
      acc += src[row + Math.min(w - 1, x + radius + 1)] - src[row + Math.max(0, x - radius)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -radius; y <= radius; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / win;
      acc += tmp[Math.min(h - 1, y + radius + 1) * w + x] - tmp[Math.max(0, y - radius) * w + x];
    }
  }
  return out;
}

// --------------------------- INPAINTING SFONDO ---------------------------

// Riempie l'area del soggetto propagando i colori di sfondo (region growing)
// su una versione ridotta, poi un box blur per ammorbidire.
// `invalidSmall`: Uint8Array (iw x ih) con 1 = pixel del soggetto da riempire.
function inpaintBackground(img, invalidSmall, iw, ih) {
  const { imageData } = getImageData(img, iw, ih);
  const src = imageData.data;

  const r = new Float32Array(iw * ih);
  const g = new Float32Array(iw * ih);
  const b = new Float32Array(iw * ih);
  const known = new Uint8Array(iw * ih);
  for (let p = 0; p < iw * ih; p++) {
    r[p] = src[p * 4]; g[p] = src[p * 4 + 1]; b[p] = src[p * 4 + 2];
    known[p] = invalidSmall[p] ? 0 : 1;
  }

  const maxIters = iw + ih;
  for (let it = 0; it < maxIters; it++) {
    const newlyR = [], newlyG = [], newlyB = [], newlyP = [];
    for (let y = 0; y < ih; y++) {
      for (let x = 0; x < iw; x++) {
        const p = y * iw + x;
        if (known[p]) continue;
        let sr = 0, sg = 0, sb = 0, c = 0;
        if (x > 0 && known[p - 1])       { sr += r[p - 1]; sg += g[p - 1]; sb += b[p - 1]; c++; }
        if (x < iw - 1 && known[p + 1])  { sr += r[p + 1]; sg += g[p + 1]; sb += b[p + 1]; c++; }
        if (y > 0 && known[p - iw])      { sr += r[p - iw]; sg += g[p - iw]; sb += b[p - iw]; c++; }
        if (y < ih - 1 && known[p + iw]) { sr += r[p + iw]; sg += g[p + iw]; sb += b[p + iw]; c++; }
        if (c > 0) { newlyP.push(p); newlyR.push(sr / c); newlyG.push(sg / c); newlyB.push(sb / c); }
      }
    }
    if (newlyP.length === 0) break;
    for (let i = 0; i < newlyP.length; i++) {
      const p = newlyP[i];
      r[p] = newlyR[i]; g[p] = newlyG[i]; b[p] = newlyB[i]; known[p] = 1;
    }
  }

  const bR = boxBlur(r, iw, ih, 3);
  const bG = boxBlur(g, iw, ih, 3);
  const bB = boxBlur(b, iw, ih, 3);

  const fillCanvas = makeCanvas(iw, ih);
  const fillCtx = fillCanvas.getContext('2d');
  const fillData = fillCtx.createImageData(iw, ih);
  for (let p = 0; p < iw * ih; p++) {
    fillData.data[p * 4] = bR[p];
    fillData.data[p * 4 + 1] = bG[p];
    fillData.data[p * 4 + 2] = bB[p];
    fillData.data[p * 4 + 3] = 255;
  }
  fillCtx.putImageData(fillData, 0, 0);
  return fillCanvas;
}

function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

// --------------------------- GUIDED FILTER (edge-aware matting) ---------------------------
// Rifinisce una maschera morbida `p` usando l'immagine guida `I` (stessa
// dimensione, valori 0..1): l'alpha viene "agganciata" ai contorni reali
// dell'immagine, trasformando bordi sfocati da upsampling in bordi netti.
// Riferimento: He, Sun, Tang - "Guided Image Filtering".
function guidedFilter(I, p, w, h, radius, eps) {
  const N = w * h;
  const meanI = boxBlur(I, w, h, radius);
  const meanP = boxBlur(p, w, h, radius);
  const Ip = new Float32Array(N);
  const II = new Float32Array(N);
  for (let i = 0; i < N; i++) { Ip[i] = I[i] * p[i]; II[i] = I[i] * I[i]; }
  const meanIp = boxBlur(Ip, w, h, radius);
  const meanII = boxBlur(II, w, h, radius);
  const a = new Float32Array(N);
  const b = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const varI = meanII[i] - meanI[i] * meanI[i];
    const covIp = meanIp[i] - meanI[i] * meanP[i];
    const ai = covIp / (varI + eps);
    a[i] = ai;
    b[i] = meanP[i] - ai * meanI[i];
  }
  const meanA = boxBlur(a, w, h, radius);
  const meanB = boxBlur(b, w, h, radius);
  const q = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const v = meanA[i] * I[i] + meanB[i];
    q[i] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
  return q;
}

// --------------------------- PIPELINE PRINCIPALE ---------------------------

export async function separateSubjectFromSrc(src) {
  const img = await loadImage(src);
  const W0 = img.naturalWidth, H0 = img.naturalHeight;
  if (!W0 || !H0) throw new Error('Dimensioni immagine non valide.');

  // Risoluzione di lavoro limitata: inferenza e compositing restano leggeri
  // anche con immagini enormi (il canvas notizie è ~1080px).
  const outScale = Math.min(1, OUT_MAX / Math.max(W0, H0));
  const W = Math.max(1, Math.round(W0 * outScale));
  const H = Math.max(1, Math.round(H0 * outScale));
  const { imageData: workData, canvas: workCanvas } = getImageData(img, W, H);

  // 1) Segmentazione della persona (GPU) -> maschera di confidenza [0..1].
  const segmenter = await getSegmenter();
  const seg = segmenter.segment(workCanvas);
  const mask = seg.confidenceMasks && seg.confidenceMasks[0];
  if (!mask) throw new Error('Segmentazione non riuscita.');
  const mw = mask.width, mh = mask.height;
  const prob = mask.getAsFloat32Array().slice(); // copia prima di liberare
  if (seg.confidenceMasks) seg.confidenceMasks.forEach(m => m.close());
  if (seg.categoryMask) seg.categoryMask.close();

  // 2) Probabilità grezza portata a piena risoluzione di lavoro
  //    (upsampling bilineare della maschera 256px).
  const probMaskCanvas = makeCanvas(mw, mh);
  {
    const pmCtx = probMaskCanvas.getContext('2d');
    const pmImg = pmCtx.createImageData(mw, mh);
    for (let p = 0; p < mw * mh; p++) {
      const v = prob[p] * 255;
      pmImg.data[p * 4] = v; pmImg.data[p * 4 + 1] = v; pmImg.data[p * 4 + 2] = v; pmImg.data[p * 4 + 3] = 255;
    }
    pmCtx.putImageData(pmImg, 0, 0);
  }
  const probUpCanvas = makeCanvas(W, H);
  const puCtx = probUpCanvas.getContext('2d', { willReadFrequently: true });
  puCtx.imageSmoothingEnabled = true;
  puCtx.drawImage(probMaskCanvas, 0, 0, W, H);
  const probUpData = puCtx.getImageData(0, 0, W, H).data;
  const probFull = new Float32Array(W * H);
  for (let p = 0; p < W * H; p++) probFull[p] = probUpData[p * 4] / 255;

  // 3) Rifinitura dei bordi con GUIDED FILTER: la maschera viene agganciata ai
  //    contorni reali dell'immagine (luminanza) -> bordi netti e ben definiti
  //    invece dell'alone morbido prodotto dal semplice upsampling.
  const guide = new Float32Array(W * H);
  const wd = workData.data;
  for (let p = 0; p < W * H; p++) {
    guide[p] = (0.299 * wd[p * 4] + 0.587 * wd[p * 4 + 1] + 0.114 * wd[p * 4 + 2]) / 255;
  }
  const gfRadius = Math.max(2, Math.round(Math.min(W, H) * 0.01));
  const refined = guidedFilter(guide, probFull, W, H, gfRadius, 1e-4);

  // 4) Curva alpha netta e leggermente interna: il taglio cade appena dentro il
  //    soggetto, così sparisce l'alone chiaro sullo sfondo. Solo un micro-feather
  //    di 1px per l'anti-alias (un feather ampio ricreerebbe la fascia sfumata).
  const alphaArr = new Float32Array(W * H);
  let fgCount = 0;
  for (let p = 0; p < W * H; p++) {
    const r0 = refined[p];
    alphaArr[p] = smoothstep(0.52, 0.60, r0) * 255;
    if (r0 > 0.5) fgCount++;
  }
  if (fgCount === 0) throw new Error('Nessun soggetto rilevato nell\'immagine.');
  const alpha = boxBlur(alphaArr, W, H, 1); // Float32 (0..255), canale singolo

  // 5) LIVELLO SFONDO ricostruito (inpainting sull'area del soggetto).
  const iScale = Math.min(1, INP_MAX / Math.max(W, H));
  const iw = Math.max(1, Math.round(W * iScale));
  const ih = Math.max(1, Math.round(H * iScale));
  const invalidSmall = new Uint8Array(iw * ih);
  for (let y = 0; y < ih; y++) {
    const my = Math.min(mh - 1, (y * mh / ih) | 0);
    for (let x = 0; x < iw; x++) {
      const mx = Math.min(mw - 1, (x * mw / iw) | 0);
      invalidSmall[y * iw + x] = prob[my * mw + mx] > 0.5 ? 1 : 0;
    }
  }
  const fillCanvas = inpaintBackground(workCanvas, invalidSmall, iw, ih);
  const fillFull = makeCanvas(W, H);
  const ffCtx = fillFull.getContext('2d', { willReadFrequently: true });
  ffCtx.imageSmoothingEnabled = true;
  ffCtx.drawImage(fillCanvas, 0, 0, W, H);
  const fillFullData = ffCtx.getImageData(0, 0, W, H).data;

  // 6) LIVELLO SOGGETTO: RGB + alpha, con DECONTAMINAZIONE del colore ai bordi.
  //    I pixel semi-trasparenti sono una miscela soggetto/sfondo: stimiamo il
  //    colore puro del soggetto F = (C - (1-a)*B) / a usando lo sfondo ricostruito
  //    come B, così sparisce l'alone colorato lungo i contorni.
  const subjData = new Uint8ClampedArray(workData.data);
  for (let p = 0; p < W * H; p++) {
    const a255 = alpha[p];
    subjData[p * 4 + 3] = a255;
    const a = a255 / 255;
    // Solo sui bordi abbastanza opachi: su pixel molto trasparenti la formula
    // dividerebbe per un valore minuscolo amplificando la luminosità (alone).
    if (a > 0.35 && a < 0.95) {
      const inv = 1 - a;
      subjData[p * 4]     = (subjData[p * 4]     - inv * fillFullData[p * 4])     / a;
      subjData[p * 4 + 1] = (subjData[p * 4 + 1] - inv * fillFullData[p * 4 + 1]) / a;
      subjData[p * 4 + 2] = (subjData[p * 4 + 2] - inv * fillFullData[p * 4 + 2]) / a;
    }
  }
  const subjectCanvas = makeCanvas(W, H);
  subjectCanvas.getContext('2d').putImageData(new ImageData(subjData, W, H), 0, 0);

  // 7) LIVELLO SFONDO finale: originale con l'area del soggetto sostituita dal fill.
  const bgCanvas = makeCanvas(W, H);
  const bgData = new Uint8ClampedArray(workData.data);
  for (let p = 0; p < W * H; p++) {
    const a = alpha[p] / 255; // 1 = soggetto -> usa il riempimento
    if (a > 0.01) {
      const inv = 1 - a;
      bgData[p * 4]     = bgData[p * 4]     * inv + fillFullData[p * 4]     * a;
      bgData[p * 4 + 1] = bgData[p * 4 + 1] * inv + fillFullData[p * 4 + 1] * a;
      bgData[p * 4 + 2] = bgData[p * 4 + 2] * inv + fillFullData[p * 4 + 2] * a;
    }
    bgData[p * 4 + 3] = 255;
  }
  bgCanvas.getContext('2d').putImageData(new ImageData(bgData, W, H), 0, 0);

  // 5) Esporta i due livelli.
  const subject = await canvasToResult(subjectCanvas, 'image/png');
  const background = await canvasToResult(bgCanvas, 'image/jpeg', 0.95);

  return { subject, background, width: W, height: H };
}
