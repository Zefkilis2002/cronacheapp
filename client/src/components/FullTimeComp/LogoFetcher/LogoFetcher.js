import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LogoFetcher.css';

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

const LogoFetcher = ({ onLogoSelect, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine API Base URL
  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  const API_BASE_URL = isLocalhost
    ? "http://localhost:5000"
    : "https://cronacheapp.onrender.com";

  const fetchTimeoutRef = useRef(null);

  // Ricerca debouncata stabile basata su ref e callback per evitare ricreazioni ad ogni render
  const performSearch = useCallback((query) => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/search-logos?q=${encodeURIComponent(trimmed)}`);
        
        if (!res.ok) {
          throw new Error(`Errore HTTP! Status: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.status && data.results && data.results.length > 0) {
          setResults(data.results);
        } else {
          setResults([]);
          setError(`Nessun logo trovato per "${trimmed}".`);
        }
      } catch (err) {
        console.error("Errore Fetch:", err);
        setError("Errore di connessione al server.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350); // 350ms di debounce per stabilità assoluta da mobile
  }, [API_BASE_URL]);

  // Pulisce il timer all'unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    performSearch(val);
  };

  const handleSelect = (logoUrl) => {
    if (!logoUrl) {
      console.warn("[LogoFetcher] Tentativo di selezionare un logo con URL indefinito.");
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

        {error && !loading && results.length === 0 && <div className="error-msg">{error}</div>}

        {results.length > 0 && (
          <ul className="results-dropdown">
            {results.map((team, index) => {
              const url = team.logoUrl || team.logo_url;
              return (
                <li key={index} className="result-item" onClick={() => handleSelect(url)}>
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