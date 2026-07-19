import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LogoFetcher.css';
import config from '../../../config';
import { TEAM_LOGOS, TEAM_NAME_MAP } from '../../../utils/LogoConstants';
import { pingServer } from '../../../utils/serverWarmup';

// Sotto-componente per gestire il caricamento dell'immagine con skeleton loader e lazy loading
const DropdownLogo = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="logo-wrapper">
      {!loaded && <div className="logo-skeleton"></div>}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`result-logo ${loaded ? 'loaded' : ''}`}
      />
    </div>
  );
};

// =============================================================================
// RICERCA LOCALE ISTANTANEA (zero rete)
// I loghi greci sono già nel bundle: si mostrano subito, mentre la ricerca
// remota (TheSportsDB via backend) arriva in un secondo momento.
// =============================================================================

const ACRONYMS = new Set(['PAOK', 'AEK', 'OFI', 'AEL']);

// "AEL_LARISSA" → "AEL Larissa"
const LOCAL_TEAMS = Object.entries(TEAM_LOGOS).map(([key, path]) => ({
  name: key
    .split('_')
    .map(w => (ACRONYMS.has(w) ? w : w.charAt(0) + w.slice(1).toLowerCase()))
    .join(' '),
  logoUrl: path,
}));

function searchLocalTeams(query) {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const matchedPaths = new Set();
  const results = [];

  for (const team of LOCAL_TEAMS) {
    if (team.name.toLowerCase().includes(q)) {
      matchedPaths.add(team.logoUrl);
      results.push(team);
    }
  }

  // Match sugli alias (es. "olympiacos", "pas giannina", "aek atene")
  for (const [alias, path] of Object.entries(TEAM_NAME_MAP)) {
    if (matchedPaths.has(path)) continue;
    if (alias.includes(q)) {
      const team = LOCAL_TEAMS.find(t => t.logoUrl === path);
      if (team) {
        matchedPaths.add(path);
        results.push(team);
      }
    }
  }

  return results.slice(0, 6);
}

const REMOTE_DEBOUNCE_MS = 300;
const SLOW_HINT_AFTER_MS = 2500;   // dopo 2.5s mostra l'avviso cold start
const REMOTE_TIMEOUT_MS = 60000;   // il cold start di Render può durare ~45s

const LogoFetcher = ({ onLogoSelect, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = config.API_BASE_URL;

  const debounceRef = useRef(null);
  const slowHintTimerRef = useRef(null);
  const abortRef = useRef(null);
  const currentQueryRef = useRef('');

  // Appena si apre il modal, sveglia il server: quando l'utente avrà finito
  // di digitare, il cold start sarà già in corso da qualche secondo
  useEffect(() => {
    pingServer();
  }, []);

  const performSearch = useCallback((query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (slowHintTimerRef.current) clearTimeout(slowHintTimerRef.current);
    setSlowHint(false);

    const trimmed = query.trim();
    currentQueryRef.current = trimmed;

    // Annulla l'eventuale richiesta remota precedente ancora in volo
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError('');
      return;
    }

    // 1) RISULTATI LOCALI ISTANTANEI (nessuna attesa di rete)
    const localResults = searchLocalTeams(trimmed);
    setResults(localResults);
    setError('');
    setLoading(true);

    // 2) RICERCA REMOTA debouncata, in merge sui locali quando arriva
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);

      // Se il server è freddo la risposta tarda: avvisa l'utente
      slowHintTimerRef.current = setTimeout(() => {
        if (currentQueryRef.current === trimmed) setSlowHint(true);
      }, SLOW_HINT_AFTER_MS);

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/search-logos?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Errore HTTP! Status: ${res.status}`);
        }

        const data = await res.json();

        // Evita race conditions: scarta i risultati se l'utente ha già digitato altro
        if (currentQueryRef.current !== trimmed) return;

        const remote = (data.status && data.results) ? data.results : [];

        // Merge: locali prima, remoti non duplicati dopo
        const seenUrls = new Set(localResults.map(t => t.logoUrl));
        const seenNames = new Set(localResults.map(t => t.name.toLowerCase()));
        const merged = [...localResults];
        for (const team of remote) {
          const url = team.logoUrl || team.logo_url;
          if (!url) continue;
          if (seenUrls.has(url) || seenNames.has((team.name || '').toLowerCase())) continue;
          seenUrls.add(url);
          seenNames.add((team.name || '').toLowerCase());
          merged.push(team);
        }

        setResults(merged.slice(0, 10));
        if (merged.length === 0) {
          setError(`Nessun logo trovato per "${trimmed}".`);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (currentQueryRef.current !== trimmed) return; // richiesta superata
        console.error('Errore Fetch:', err);
        // Se abbiamo almeno i risultati locali, non disturbare l'utente
        if (localResults.length === 0) {
          setError('Errore di connessione al server.');
          setResults([]);
        }
      } finally {
        if (currentQueryRef.current === trimmed) {
          setLoading(false);
          setSlowHint(false);
        }
        if (slowHintTimerRef.current) clearTimeout(slowHintTimerRef.current);
      }
    }, REMOTE_DEBOUNCE_MS);
  }, [API_BASE_URL]);

  // Pulisce timer e richieste in volo all'unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (slowHintTimerRef.current) clearTimeout(slowHintTimerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    performSearch(val);
  };

  const handleSelect = (logoUrl) => {
    if (!logoUrl) {
      console.warn('[LogoFetcher] Tentativo di selezionare un logo con URL indefinito.');
      return;
    }
    // Evita il proxy per le risorse interne /loghi/ per massimizzare la velocità
    const isExternal = logoUrl.startsWith('http://') || logoUrl.startsWith('https://');
    const finalUrl = isExternal
      ? `${API_BASE_URL}/proxy-image?url=${encodeURIComponent(logoUrl)}`
      : logoUrl;
    onLogoSelect(finalUrl);
    onClose();
  };

  return (
    <div className="logo-fetcher-overlay">
      <div className="logo-fetcher-modal modern-mode">
        <h3>Trova Logo</h3>
        <p className="instruction">Ricerca Globale (Club & Nazionali) 🌍</p>

        <div className="search-container">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Cerca squadra (es. Roma, Grecia)..."
            className="modern-input"
            autoFocus
          />
          {loading && <div className="spinner-small">⏳</div>}
        </div>

        {slowHint && loading && (
          <div className="error-msg" style={{ color: '#f0ad4e' }}>
            ⏳ Sto svegliando il server... la prima ricerca può richiedere fino a 40s.
          </div>
        )}

        {error && !loading && results.length === 0 && <div className="error-msg">{error}</div>}

        {results.length > 0 && (
          <ul className="results-dropdown">
            {results.map((team, index) => {
              const url = team.logoUrl || team.logo_url;
              return (
                <li key={url || index} className="result-item" onClick={() => handleSelect(url)}>
                  <DropdownLogo src={url} alt={team.name} />
                  <div className="result-info">
                    <span className="result-name">{team.name}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="simple-actions">
          <button className="cancel-btn" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoFetcher;
