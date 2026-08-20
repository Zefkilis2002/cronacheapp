// Ricerca automatica dei loghi mancanti.
//
// Stesso percorso di "Cerca Web" in News e FullTime: `/api/search-logos`
// (locale + TheSportsDB) e, per gli URL esterni, `/proxy-image` così l'immagine
// arriva dalla nostra origine e il canvas resta esportabile.
//
// La cache è a livello di modulo e memorizza anche i "non trovato" (null), così
// un nome senza logo non viene richiesto a ogni SET o cambio variante.

import config from '../../config';

const TIMEOUT_MS = 4000;

const _cache = new Map();     // nome normalizzato -> url | null
const _inflight = new Map();  // nome normalizzato -> Promise<url|null>

const norm = (name) => String(name || '').trim().toLowerCase();

// "Paks (Hun)" → "Paks": il suffisso nazione delle coppe europee peggiora la ricerca.
const cleanName = (name) =>
  String(name || '').replace(/\s*\([A-Za-z]{2,3}\)\s*$/, '').trim();

// I loghi esterni passano dal proxy: senza, il canvas verrebbe "sporcato" e
// il download dell'immagine fallirebbe.
const toCanvasUrl = (url) =>
  /^https?:\/\//.test(url)
    ? `${config.API_BASE_URL}/proxy-image?url=${encodeURIComponent(url)}`
    : url;

const fetchOne = (name) => {
  const key = norm(name);
  if (_cache.has(key)) return Promise.resolve(_cache.get(key));
  if (_inflight.has(key)) return _inflight.get(key);

  const query = cleanName(name);
  if (query.length < 2) {
    _cache.set(key, null);
    return Promise.resolve(null);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const task = fetch(
    `${config.API_BASE_URL}/api/search-logos?q=${encodeURIComponent(query)}`,
    { signal: controller.signal }
  )
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      const first = data && data.results && data.results[0];
      const url = first && (first.logoUrl || first.logo_url);
      return url ? toCanvasUrl(url) : null;
    })
    .catch(() => null)
    .then((url) => {
      _cache.set(key, url);
      return url;
    })
    .finally(() => {
      clearTimeout(timer);
      _inflight.delete(key);
    });

  _inflight.set(key, task);
  return task;
};

/**
 * Risolve in parallelo i loghi di un elenco di nomi (duplicati ignorati).
 * @param {string[]} names - nomi come arrivano da Flashscore (in inglese)
 * @returns {Promise<Object>} mappa nome originale → URL pronto per il canvas
 *                            (solo i nomi effettivamente trovati)
 */
export const resolveWebLogos = async (names) => {
  const unique = [...new Set((names || []).filter(Boolean))];
  if (unique.length === 0) return {};

  const urls = await Promise.all(unique.map(fetchOne));
  const found = {};
  unique.forEach((name, i) => {
    if (urls[i]) found[name] = urls[i];
  });
  return found;
};
