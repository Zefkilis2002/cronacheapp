// Client del bundle classifiche.
//
// Un solo endpoint (`/api/standings/all`) restituisce TUTTE le tabelle in una
// risposta: regular season, playoff scudetto, gruppo Europa, playout e league
// phase di Coppa di Grecia. Sono stage Flashscore distinti, quindi non si
// ricavano filtrando per posizione un'unica classifica.
//
// La cache è a livello di modulo (non di componente): sopravvive al cambio di
// tab e al remount della pagina, così SET ⚡ dopo il primo giro è istantaneo e
// cambiare variante non costa nessuna fetch.

const resolveApiBase = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  return isLocalhost ? 'http://localhost:5000' : 'https://cronacheapp.onrender.com';
};

const TTL_MS = 5 * 60 * 1000;   // allineato al softTTL del server (300s)
const TIMEOUT_MS = 4000;        // la UI non deve mai restare appesa

let _cache = null;    // { data, meta, at }
let _inflight = null; // Promise condivisa: dedup delle richieste concorrenti

/** Bundle in cache e ancora fresco, oppure null. Sincrono: nessuna rete. */
export const getCachedStandings = () =>
  (_cache && Date.now() - _cache.at < TTL_MS) ? _cache : null;

/**
 * Scarica il bundle (o restituisce quello in cache).
 * Non lancia mai: in caso di errore/timeout risolve a null e il chiamante
 * tiene quello che ha già sul canvas.
 *
 * @param {Object} [options]
 * @param {boolean} [options.force] - ignora la cache e ricarica
 * @returns {Promise<{data: Object, meta: Object, at: number}|null>}
 */
export const fetchStandingsBundle = ({ force = false } = {}) => {
  if (!force) {
    const fresh = getCachedStandings();
    if (fresh) return Promise.resolve(fresh);
  }
  if (_inflight) return _inflight;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  _inflight = fetch(`${resolveApiBase()}/api/standings/all?country=greece`, {
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json || json.success !== true || !json.data) {
        throw new Error('risposta senza dati');
      }
      _cache = { data: json.data, meta: json.meta || {}, at: Date.now() };
      return _cache;
    })
    .catch((err) => {
      // Offseason, offline, timeout: nessun errore in faccia all'utente.
      console.warn('[Standings] bundle non disponibile:', err.message);
      return null;
    })
    .finally(() => {
      clearTimeout(timer);
      _inflight = null;
    });

  return _inflight;
};

/**
 * Avvia il caricamento senza attenderlo (apertura del tab GESTIONE DATI):
 * quando l'utente preme SET ⚡ i dati sono quasi sempre già in memoria.
 */
export const prefetchStandingsBundle = () => {
  if (getCachedStandings() || _inflight) return;
  fetchStandingsBundle();
};
