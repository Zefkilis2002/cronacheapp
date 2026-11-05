import config from '../config';

const entries = new Map();
const pending = new Map();
const MAX_ENTRIES = 250;

export function getCachedJson(path) {
  const item = entries.get(path);
  if (!item || item.expires <= Date.now()) {
    entries.delete(path);
    return null;
  }
  return item.data;
}

function subscribe(task, signal) {
  if (!signal) return task;
  if (signal.aborted) return Promise.reject(new DOMException('Richiesta annullata', 'AbortError'));
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('Richiesta annullata', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    task.then(
      value => { signal.removeEventListener('abort', abort); if (!signal.aborted) resolve(value); },
      error => { signal.removeEventListener('abort', abort); reject(error); }
    );
  });
}

// Cancellation belongs to each subscriber; shared transport remains reusable.
export function requestJson(path, { ttl = 60000, timeout = 65000, signal } = {}) {
  if (signal?.aborted) return Promise.reject(new DOMException('Richiesta annullata', 'AbortError'));
  const cached = getCachedJson(path);
  if (cached) return subscribe(Promise.resolve(cached), signal);
  let task = pending.get(path);
  if (!task) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    task = fetch(`${config.API_BASE_URL}${path}`, { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || data.status === false || data.success === false) {
          throw new Error(data.message || `Errore HTTP ${response.status}`);
        }
        if (ttl > 0 && !data.degraded) {
          if (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value);
          const lifetime = Array.isArray(data.results) && data.results.length === 0 ? Math.min(ttl, 60000) : ttl;
          entries.set(path, { data, expires: Date.now() + lifetime });
        }
        return data;
      })
      .finally(() => { clearTimeout(timer); pending.delete(path); });
    pending.set(path, task);
  }
  return subscribe(task, signal);
}

export function toCanvasUrl(value) {
  if (!value || typeof value !== 'string') return null;
  if (value.startsWith('/loghi/') || value.startsWith('data:image/') || value.startsWith('blob:')) return value;
  try {
    const url = new URL(value, window.location.origin);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const api = new URL(config.API_BASE_URL);
    if (url.origin === api.origin && url.pathname === '/proxy-image') return url.href;
    return `${config.API_BASE_URL}/proxy-image?url=${encodeURIComponent(url.href)}`;
  } catch {
    return null;
  }
}
