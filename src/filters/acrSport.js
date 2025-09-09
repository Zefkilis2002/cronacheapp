import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, RotateCcw, Download, Zap } from 'lucide-react';

// --------------------- XMP PARSER ---------------------
async function loadAcrXmp() {
  // Simulated XMP data from the provided file
  const xmpSettings = {
    ProcessVersion: '15.4',
    Temp: 6500, // As Shot
    Tint: 0,
    Exposure: 0.00,
    Contrast: 0,
    Highlights: 0,
    Shadows: 0,
    Whites: 0,
    Blacks: 0,
    Clarity: 35, // +35
    Texture: 62, // +62
    Dehaze: 0,
    Vibrance: 0,
    Saturation: 0,
    ToneCurve: [[0,0],[1,1]],
    ToneCurveR: [[0,0],[1,1]],
    ToneCurveG: [[0,0],[1,1]],
    ToneCurveB: [[0,0],[1,1]]
  };
  return xmpSettings;
}

// --------------------- MATH UTILS ---------------------
const M_RGB2XYZ = new Float32Array([
  0.4124564, 0.3575761, 0.1804375,
  0.2126729, 0.7151522, 0.0721750,
  0.0193339, 0.1191920, 0.9503041
]);
const M_XYZ2RGB = new Float32Array([
   3.2404542, -1.5371385, -0.4985314,
  -0.9692660,  1.8760108,  0.0415560,
   0.0556434, -0.2040259,  1.0572252
]);

function mul3x3(a, b) {
  const o = new Float32Array(9);
  for (let r=0;r<3;r++) for (let c=0;c<3;c++) {
    o[r*3+c] = a[r*3+0]*b[0*3+c] + a[r*3+1]*b[1*3+c] + a[r*3+2]*b[2*3+c];
  }
  return o;
}

function xy2XYZ(x, y) {
  const Y = 1.0;
  const X = (x / Math.max(1e-6,y)) * Y;
  const Z = ((1 - x - y) / Math.max(1e-6,y)) * Y;
  return [X,Y,Z];
}

function cct2xy(CCT) {
  const K = Math.max(1000, Math.min(40000, CCT));
  let x;
  if (K <= 7000) {
    x = -4.6070e9/(K*K*K) + 2.9678e6/(K*K) + 0.09911e3/K + 0.244063;
  } else {
    x = -2.0064e9/(K*K*K) + 1.9018e6/(K*K) + 0.24748e3/K + 0.237040;
  }
  const y = -3.000*x*x + 2.870*x - 0.275;
  return [x,y];
}

function applyTint_xy(x, y, tint) {
  const denom = (-2*x + 12*y + 3);
  const upr = (4*x) / denom;
  const vpr = (9*y) / denom;
  const scale = tint / 1000.0;
  const upr2 = upr + 0.0*scale;
  const vpr2 = vpr + 0.05*scale;
  const x2 = (9*upr2) / (6*upr2 - 16*vpr2 + 12);
  const y2 = (4*vpr2) / (6*upr2 - 16*vpr2 + 12);
  return [x2, y2];
}

function bradfordAdaptMatrix(srcXYZ, dstXYZ) {
  const M = new Float32Array([
    0.8951, 0.2664, -0.1614,
   -0.7502, 1.7135,  0.0367,
    0.0389, -0.0685,  1.0296
  ]);
  const Minv = new Float32Array([
    0.9869929, -0.1470543, 0.1599627,
    0.4323053,  0.5183603, 0.0492912,
   -0.0085287,  0.0400428, 0.9684867
  ]);
  const Lms = (X,Y,Z) => [ M[0]*X + M[1]*Y + M[2]*Z,
                           M[3]*X + M[4]*Y + M[5]*Z,
                           M[6]*X + M[7]*Y + M[8]*Z ];
  const [Ls,Ms,Ss] = Lms(srcXYZ[0],srcXYZ[1],srcXYZ[2]);
  const [Ld,Md,Sd] = Lms(dstXYZ[0],dstXYZ[1],dstXYZ[2]);
  const D = new Float32Array([
    Ld/Ls, 0,     0,
    0,     Md/Ms, 0,
    0,     0,     Sd/Ss
  ]);
  return mul3x3(Minv, mul3x3(D, M));
}

function wbMatrixFromTempTint(tempK, tint) {
  const [x,y] = applyTint_xy(...cct2xy(Math.max(1000, tempK || 6500)), tint || 0);
  const src = xy2XYZ(x,y);
  const d65 = xy2XYZ(0.3127, 0.3290);
  const Ad = bradfordAdaptMatrix(src, d65);
  return mul3x3(M_XYZ2RGB, mul3x3(Ad, M_RGB2XYZ));
}

// --------------------- WEBGL CORE ---------------------
function createGL(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const gl = canvas.getContext('webgl2', { premultipliedAlpha:false, desynchronized:true })
      || canvas.getContext('webgl',  { premultipliedAlpha:false, desynchronized:true });
  if (!gl) throw new Error('WebGL non disponibile');
  return { gl, canvas };
}

function compile(gl, t, src) {
  const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)||'shader');
  return s;
}

function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)||'program');
  return p;
}

function makeTex(gl, w, h, data=null, linear=true) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, linear?gl.LINEAR:gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, linear?gl.LINEAR:gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  return t;
}

function makeFBO(gl, tex) {
  const f = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, f);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return f;
}

function drawQuad(gl) {
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1,-1, 1,-1, -1,1,  1,-1, 1,1, -1,1
  ]), gl.STATIC_DRAW);
  return b;
}

// CORRECTED VERTEX SHADER - fixes the flip issue
const VS = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){
  vUv = 0.5 * (aPos + 1.0);   // niente flip qui
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;


const srgb2lin = `
vec3 srgb2lin(vec3 c){ return pow(c, vec3(2.2)); }
vec3 lin2srgb(vec3 c){ return pow(max(c,0.0), vec3(1.0/2.2)); }
float luma(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }
`;

const FS_WB_EXPO = `
precision mediump float; varying vec2 vUv;
uniform sampler2D uTex; uniform mat3 uWB; uniform float uEV;
${srgb2lin}
void main(){
  vec4 t = texture2D(uTex, vUv);
  vec3 c = srgb2lin(t.rgb);
  c = uWB * c;
  c *= pow(2.0, uEV);
  gl_FragColor = vec4(c, t.a);
}
`;

const FS_TONE = `
precision mediump float; varying vec2 vUv;
uniform sampler2D uTex; 
uniform float uHighlights;
uniform float uShadows;
uniform float uWhites;
uniform float uBlacks;
uniform float uContrast;
${srgb2lin}

float softLUT(float x, float amt, float lo, float hi){
  float wHi = smoothstep(lo, 1.0, x);
  float wLo = 1.0 - smoothstep(0.0, hi, x);
  float up = 1.0 - (1.0 - x) * (1.0 - amt*0.8);
  float dn = x * (1.0 + amt*0.8);
  float y = mix(x, up, max(0.0, amt)*wHi);
  y = mix(y, dn, max(0.0, amt)*wLo);
  return clamp(y, 0.0, 10.0);
}

vec3 adjustWhites(vec3 c, float w){
  float k = w/100.0;
  return clamp(1.0 - (1.0 - c)*(1.0 - 0.9*k), 0.0, 10.0);
}

vec3 adjustBlacks(vec3 c, float b){
  float k = b/100.0;
  return clamp(c*(1.0 + 0.9*k), 0.0, 10.0);
}

vec3 applyContrast(vec3 c, float k){
  float f = (k>=0.0) ? (1.0 + k/100.0) : (1.0 + k/200.0);
  return mix(vec3(0.18), c, f);
}

void main(){
  vec4 t = texture2D(uTex, vUv);
  vec3 c = t.rgb;
  float Y = luma(c);
  float hAmt = max(0.0, uHighlights/100.0);
  float sAmt = max(0.0, uShadows/100.0);
  float Yh = softLUT(Y, hAmt, 0.5, 0.3);
  float Ys = softLUT(Y, sAmt, 0.6, 0.4);
  float Y2 = mix(Y, Yh, smoothstep(0.5,1.0,Y));
  Y2 = mix(Y2, Ys, smoothstep(0.5,0.0,Y));
  vec3 chroma = c / max(Y, 1e-5);
  c = chroma * Y2;
  c = adjustWhites(c, uWhites);
  c = adjustBlacks(c, uBlacks);
  c = applyContrast(c, uContrast);
  gl_FragColor = vec4(c, t.a);
}
`;

const FS_BILATERAL = `
precision mediump float; varying vec2 vUv;
uniform sampler2D uTex; uniform vec2 uDir; uniform float uSigmaS; uniform float uSigmaR;
${srgb2lin}

float weightSpatial(int i){
  if (i==0) return 0.227000;
  if (i==1 || i==-1) return 0.194600;
  if (i==2 || i==-2) return 0.121600;
  if (i==3 || i==-3) return 0.054000;
  return 0.016200;
}

void main(){
  vec3 c0 = texture2D(uTex, vUv).rgb; 
  float y0 = luma(c0);
  float wSum = 0.0; vec3 acc = vec3(0.0);

  for(int i=-4;i<=4;i++){
    vec2 offs = uDir * float(i);
    vec3 ck = texture2D(uTex, vUv + offs).rgb;
    float yr = luma(ck);
    float wS = weightSpatial(i);
    float wR = exp(-pow((yr - y0) / (uSigmaR + 1e-6), 2.0));
    float w = wS * wR;
    acc += ck * w; wSum += w;
  }

  gl_FragColor = vec4(acc / max(wSum, 1e-6), 1.0);
}
`;

const FS_DETAIL = `
precision mediump float; varying vec2 vUv;
uniform sampler2D uBase;
uniform sampler2D uBlurS;
uniform sampler2D uBlurL;
uniform float uClarity; uniform float uTexture;

float luma(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }

float tanh_approx(float x){
  x = clamp(x, -10.0, 10.0);
  float e2x = exp(2.0*x);
  return (e2x - 1.0) / (e2x + 1.0);
}

void main(){
  vec3 base = texture2D(uBase, vUv).rgb;
  vec3 bs   = texture2D(uBlurS, vUv).rgb;
  vec3 bl   = texture2D(uBlurL, vUv).rgb;

  vec3 hi  = base - bs;
  vec3 mid = bs - bl;

  float cAmt = uClarity/100.0;
  float tAmt = uTexture/100.0;

  vec3 clarity = vec3(
    tanh_approx(mid.r * (1.8*cAmt)),
    tanh_approx(mid.g * (1.8*cAmt)),
    tanh_approx(mid.b * (1.8*cAmt))
  );
  vec3 texture = vec3(
    tanh_approx(hi.r  * (2.2*tAmt)),
    tanh_approx(hi.g  * (2.2*tAmt)),
    tanh_approx(hi.b  * (2.2*tAmt))
  );

  vec3 outc = base + clarity + texture;
  gl_FragColor = vec4(clamp(outc, 0.0, 1.0), 1.0);
}
`;

const FS_FINISH = `
precision mediump float; varying vec2 vUv;
uniform sampler2D uTex;
uniform float uVibrance; uniform float uSaturation;
${srgb2lin}

vec3 vibranceSaturation(vec3 srgb, float vib, float sat){
  float maxc = max(max(srgb.r, srgb.g), srgb.b);
  float minc = min(min(srgb.r, srgb.g), srgb.b);
  float lum = (maxc + minc)*0.5;
  float S = (maxc-minc) / max(1e-5, 1.0 - abs(2.0*lum-1.0));
  float vF = vib/100.0, sF = sat/100.0;
  float add = vF * (1.0 - S);
  float newS = clamp(S + add + sF, 0.0, 2.0);
  vec3 g = vec3(lum);
  return mix(g, srgb, newS/(S+1e-5));
}

void main(){
  vec3 c = texture2D(uTex, vUv).rgb;
  vec3 s = lin2srgb(c);
  s = vibranceSaturation(s, uVibrance, uSaturation);
  gl_FragColor = vec4(clamp(s,0.0,1.0), 1.0);
}
`;

// Apply Camera Raw Sport Filter
async function applyCameraRawSportFilter(imageElement) {
  const s = await loadAcrXmp();
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  ctx.drawImage(imageElement, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;

  const { gl, canvas: glCanvas } = createGL(W, H);
  const quad = drawQuad(gl);

  // Create textures
  // Create textures
const texSrc = makeTex(gl, W, H, null);
gl.bindTexture(gl.TEXTURE_2D, texSrc);

// FLIP SOLO QUI: la sorgente viene flippata in upload
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

gl.texImage2D(
  gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0,
  gl.RGBA, gl.UNSIGNED_BYTE, imageData.data
);


  const texA = makeTex(gl, W, H);
  const texB = makeTex(gl, W, H);
  const fboA = makeFBO(gl, texA);
  const fboB = makeFBO(gl, texB);

  const W2 = Math.max(1, W>>1), H2 = Math.max(1, H>>1);
  const texDS = makeTex(gl, W2, H2);
  const texBLUR1 = makeTex(gl, W2, H2);
  const texBLUR2 = makeTex(gl, W2, H2);
  const fboDS = makeFBO(gl, texDS);
  const fboBLUR1 = makeFBO(gl, texBLUR1);
  const fboBLUR2 = makeFBO(gl, texBLUR2);

  gl.viewport(0,0,W,H);

  // Pass 0: WB + Exposure
  const progWB = program(gl, VS, FS_WB_EXPO);
  const p0 = {
    pos: gl.getAttribLocation(progWB, 'aPos'),
    uTex: gl.getUniformLocation(progWB, 'uTex'),
    uWB:  gl.getUniformLocation(progWB, 'uWB'),
    uEV:  gl.getUniformLocation(progWB, 'uEV'),
  };
  gl.useProgram(progWB);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fboA);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.enableVertexAttribArray(p0.pos);
  gl.vertexAttribPointer(p0.pos, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texSrc); gl.uniform1i(p0.uTex, 0);

  const wb = wbMatrixFromTempTint(s.Temp, s.Tint);
  gl.uniformMatrix3fv(p0.uWB, false, wb);
  gl.uniform1f(p0.uEV, s.Exposure);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Pass 1: Tone
  const progTone = program(gl, VS, FS_TONE);
  const p1 = {
    pos: gl.getAttribLocation(progTone, 'aPos'),
    uTex: gl.getUniformLocation(progTone, 'uTex'),
    uH: gl.getUniformLocation(progTone, 'uHighlights'),
    uS: gl.getUniformLocation(progTone, 'uShadows'),
    uW: gl.getUniformLocation(progTone, 'uWhites'),
    uB: gl.getUniformLocation(progTone, 'uBlacks'),
    uC: gl.getUniformLocation(progTone, 'uContrast'),
  };
  gl.useProgram(progTone);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
  gl.enableVertexAttribArray(p1.pos);
  gl.vertexAttribPointer(p1.pos, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texA); gl.uniform1i(p1.uTex, 0);
  gl.uniform1f(p1.uH, s.Highlights);
  gl.uniform1f(p1.uS, s.Shadows);
  gl.uniform1f(p1.uW, s.Whites);
  gl.uniform1f(p1.uB, s.Blacks);
  gl.uniform1f(p1.uC, s.Contrast);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Downscale
  gl.viewport(0,0,W2,H2);
  const progCopy = program(gl, VS, `
    precision mediump float; varying vec2 vUv; uniform sampler2D uTex;
    void main(){ gl_FragColor = texture2D(uTex, vUv); }
  `);
  const pc = { pos: gl.getAttribLocation(progCopy, 'aPos'), uTex: gl.getUniformLocation(progCopy, 'uTex') };
  gl.useProgram(progCopy);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fboDS);
  gl.enableVertexAttribArray(pc.pos);
  gl.vertexAttribPointer(pc.pos, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texB); gl.uniform1i(pc.uTex, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Bilateral filtering
  const progBil = program(gl, VS, FS_BILATERAL);
  const pb = {
    pos: gl.getAttribLocation(progBil, 'aPos'),
    uTex: gl.getUniformLocation(progBil, 'uTex'),
    uDir: gl.getUniformLocation(progBil, 'uDir'),
    uSigmaS: gl.getUniformLocation(progBil, 'uSigmaS'),
    uSigmaR: gl.getUniformLocation(progBil, 'uSigmaR'),
  };
  gl.useProgram(progBil);
  gl.enableVertexAttribArray(pb.pos);
  gl.vertexAttribPointer(pb.pos, 2, gl.FLOAT, false, 0, 0);

  // Small blur (texture)
  gl.bindFramebuffer(gl.FRAMEBUFFER, fboBLUR1);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texDS); gl.uniform1i(pb.uTex, 0);
  gl.uniform2f(pb.uDir, 1.0/W2, 0.0); gl.uniform1f(pb.uSigmaS, 2.0); gl.uniform1f(pb.uSigmaR, 0.2);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fboBLUR2);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texBLUR1);
  gl.uniform2f(pb.uDir, 0.0, 1.0/H2);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Large blur (clarity)
  gl.bindFramebuffer(gl.FRAMEBUFFER, fboBLUR1);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texBLUR2);
  gl.uniform2f(pb.uDir, 1.0/W2, 0.0); gl.uniform1f(pb.uSigmaS, 5.0); gl.uniform1f(pb.uSigmaR, 0.25);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fboBLUR2);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texBLUR1);
  gl.uniform2f(pb.uDir, 0.0, 1.0/H2);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Detail enhancement
  gl.viewport(0,0,W,H);
  const progDet = program(gl, VS, FS_DETAIL);
  const pd = {
    pos: gl.getAttribLocation(progDet, 'aPos'),
    uBase: gl.getUniformLocation(progDet, 'uBase'),
    uBS: gl.getUniformLocation(progDet, 'uBlurS'),
    uBL: gl.getUniformLocation(progDet, 'uBlurL'),
    uCl: gl.getUniformLocation(progDet, 'uClarity'),
    uTx: gl.getUniformLocation(progDet, 'uTexture'),
  };
  gl.useProgram(progDet);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fboA);
  gl.enableVertexAttribArray(pd.pos);
  gl.vertexAttribPointer(pd.pos, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texB); gl.uniform1i(pd.uBase, 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texBLUR2); gl.uniform1i(pd.uBS, 1);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, texBLUR1); gl.uniform1i(pd.uBL, 2);

  gl.uniform1f(pd.uCl, s.Clarity);
  gl.uniform1f(pd.uTx, s.Texture);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Final pass
  const progFin = program(gl, VS, FS_FINISH);
  const pf = {
    pos: gl.getAttribLocation(progFin, 'aPos'),
    uTex: gl.getUniformLocation(progFin, 'uTex'),
    uV: gl.getUniformLocation(progFin, 'uVibrance'),
    uS: gl.getUniformLocation(progFin, 'uSaturation'),
  };
  gl.useProgram(progFin);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.enableVertexAttribArray(pf.pos);
  gl.vertexAttribPointer(pf.pos, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texA); gl.uniform1i(pf.uTex, 0);
  gl.uniform1f(pf.uV, s.Vibrance);
  gl.uniform1f(pf.uS, s.Saturation);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  return new Promise(resolve => {
    glCanvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      resolve({ url, blob });
    }, 'image/jpeg', 0.92);
  });
}

// React Component
function CameraRawSportFilter() {
  const [originalImage, setOriginalImage] = useState(null);
  const [filteredImage, setFilteredImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target.result);
      setFilteredImage(null);
      setShowComparison(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const applyFilter = useCallback(async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = originalImage;
      });

      const result = await applyCameraRawSportFilter(img);
      setFilteredImage(result.url);
      setShowComparison(true);
    } catch (error) {
      console.error('Errore durante l\'applicazione del filtro:', error);
      alert('Errore durante l\'elaborazione dell\'immagine');
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage]);

  const resetImage = useCallback(() => {
    if (filteredImage) {
      URL.revokeObjectURL(filteredImage);
    }
    setOriginalImage(null);
    setFilteredImage(null);
    setShowComparison(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [filteredImage]);

  const downloadImage = useCallback(() => {
    if (!filteredImage) return;
    
    const link = document.createElement('a');
    link.href = filteredImage;
    link.download = 'camera-raw-sport-filtered.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredImage]);

  const toggleComparison = useCallback(() => {
    setShowComparison(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="h-8 w-8 text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Camera Raw Sport Filter
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Applica il filtro professionale Adobe Camera Raw Sport alle tue immagini con elaborazione WebGL ottimizzata
          </p>
        </div>

        {/* Upload Section */}
        {!originalImage && (
          <div className="max-w-2xl mx-auto mb-8">
            <div 
              className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center hover:border-blue-400 transition-all duration-300 cursor-pointer bg-gray-800/50 backdrop-blur-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Carica la tua immagine</h3>
              <p className="text-gray-400 mb-4">
                Clicca qui o trascina un file per iniziare
              </p>
              <div className="text-sm text-gray-500">
                Formati supportati: JPG, PNG, WebP • Max 20MB
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Image Display and Controls */}
        {originalImage && (
          <div className="space-y-8">
            {/* Control Panel */}
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={applyFilter}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
              >
                <Zap className="h-5 w-5" />
                {isProcessing ? 'Elaborazione...' : 'Applica Filtro Sport'}
              </button>

              {filteredImage && (
                <>
                  <button
                    onClick={toggleComparison}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                  >
                    <ImageIcon className="h-5 w-5" />
                    {showComparison ? 'Nascondi Confronto' : 'Mostra Confronto'}
                  </button>

                  <button
                    onClick={downloadImage}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                  >
                    <Download className="h-5 w-5" />
                    Scarica Risultato
                  </button>
                </>
              )}

              <button
                onClick={resetImage}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-gray-500/25"
              >
                <RotateCcw className="h-5 w-5" />
                Reset
              </button>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex items-center justify-center space-x-4 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <div className="text-blue-400 font-semibold">
                  Elaborazione dell'immagine con filtro Camera Raw Sport...
                </div>
              </div>
            )}

            {/* Image Display */}
            <div className="grid gap-8">
              {showComparison && filteredImage ? (
                /* Comparison View */
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-center text-gray-300">
                      Immagine Originale
                    </h3>
                    <div className="relative rounded-xl overflow-hidden shadow-2xl bg-gray-800">
                      <img
                        src={originalImage}
                        alt="Originale"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-center text-blue-400">
                      Con Filtro Sport
                    </h3>
                    <div className="relative rounded-xl overflow-hidden shadow-2xl bg-gray-800">
                      <img
                        src={filteredImage}
                        alt="Filtrato"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                      <div className="absolute top-4 right-4 bg-blue-600/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                        Sport Filter
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Single Image View */
                <div className="max-w-4xl mx-auto">
                  <div className="relative rounded-xl overflow-hidden shadow-2xl bg-gray-800">
                    <img
                      src={filteredImage || originalImage}
                      alt={filteredImage ? "Immagine filtrata" : "Immagine originale"}
                      className="w-full h-auto max-h-screen object-contain"
                    />
                    {filteredImage && (
                      <div className="absolute top-4 right-4 bg-blue-600/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                        Camera Raw Sport Applied
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Filter Info */}
            {filteredImage && (
              <div className="max-w-4xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
                <h4 className="text-lg font-semibold mb-4 text-blue-400">
                  Impostazioni Filtro Camera Raw Sport
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Texture:</span>
                      <span className="text-white">+62</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Clarity:</span>
                      <span className="text-white">+35</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">White Balance:</span>
                      <span className="text-white">As Shot</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Process Version:</span>
                      <span className="text-white">15.4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Curve:</span>
                      <span className="text-white">Linear</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Profile:</span>
                      <span className="text-white">Default Color</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-gray-700">
          <p className="text-gray-500">
            Filtro Camera Raw Sport implementato con WebGL per prestazioni ottimali
          </p>
        </div>
      </div>
    </div>
  );
}


// Wrapper compatibile con NewsEditor: prende una URL di sorgente e restituisce { url, _revoke }
export async function applyAcrSportFilterToSrc(srcUrl, xmpUrl = '/filters/Camera Raw Sport.xmp') {
  // carica l'immagine dalla src
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = srcUrl;
  });

  // usa la pipeline già implementata nel file
  const { url } = await applyCameraRawSportFilter(img);

  // restituisce stesso shape che NewsEditor si aspetta
  return { 
    url, 
    _revoke: () => { try { URL.revokeObjectURL(url); } catch(_) {} } 
  };
}

export default CameraRawSportFilter;