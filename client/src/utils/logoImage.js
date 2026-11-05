// The canvas must use the original artwork, never a provider's preview size.
export function originalLogoUrl(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.hostname === 'thesportsdb.com' || url.hostname.endsWith('.thesportsdb.com')) {
      url.pathname = url.pathname.replace(/\/(?:tiny|small|medium|preview)\/?$/i, '');
    }
    return url.href;
  } catch {
    return value;
  }
}

export function isFlashscoreThumbnail(value) {
  try {
    const url = new URL(value);
    return ['flashscore.com', 'flashscore.it', 'diretta.it'].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)) && url.pathname.startsWith('/res/image/data/');
  } catch {
    return false;
  }
}
