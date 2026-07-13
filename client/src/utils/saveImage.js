// Utility condivisa per salvare un'immagine generata (data URL) in modo
// affidabile su desktop E su iOS (Safari / Chrome, che usano entrambi WebKit).
//
// Problema: su iOS l'attributo `download` degli <a> viene ignorato e cliccare
// un link con un data URL non avvia alcun download (apre l'immagine nella
// stessa scheda o non fa nulla). La soluzione è usare la Web Share API con un
// File, che apre il foglio di condivisione nativo ("Salva immagine" nelle Foto).

// Converte un data URL (es. da stage.toDataURL) in Blob.
export function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function isIOS() {
  const ua = navigator.userAgent || '';
  // iPad su iPadOS 13+ si presenta come "Macintosh": lo distinguiamo dal touch.
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes('Macintosh') && 'ontouchend' in document)
  );
}

// Salva l'immagine. `dataUrl` è il risultato di toDataURL / htmlToImage,
// `filename` include l'estensione (es. "tabellino_123.jpg").
export async function saveImage(dataUrl, filename) {
  const blob = dataUrlToBlob(dataUrl);

  // 1) Percorso preferito su mobile/iOS: condivisione nativa del file.
  if (typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
    } catch (err) {
      // Se l'utente annulla il foglio di condivisione non facciamo altro.
      if (err && err.name === 'AbortError') return;
      // Altrimenti proseguiamo con i fallback.
    }
  }

  // 2) Desktop (e browser che supportano l'attributo download): download diretto.
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const supportsDownload = 'download' in HTMLAnchorElement.prototype;

  if (supportsDownload && !isIOS()) {
    link.download = filename;
    link.href = objectUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    return;
  }

  // 3) Ultimo fallback iOS: apri l'immagine in una nuova scheda così l'utente
  // può fare long-press e "Salva nelle Foto".
  const win = window.open();
  if (win) {
    win.document.write(
      `<html><head><title>${filename}</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>` +
      `<body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;">` +
      `<img src="${objectUrl}" style="max-width:100%;height:auto;" alt="${filename}"/>` +
      `<p style="position:fixed;bottom:12px;left:0;right:0;text-align:center;color:#fff;font-family:sans-serif;font-size:14px;">Tieni premuto sull'immagine e scegli "Salva nelle Foto"</p>` +
      `</body></html>`
    );
    win.document.close();
  } else {
    // Popup bloccato: naviga nella stessa scheda come ultima risorsa.
    window.location.href = objectUrl;
  }
}
