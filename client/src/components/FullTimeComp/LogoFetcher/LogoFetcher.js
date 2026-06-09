import React, { useState, useEffect } from 'react';
import './LogoFetcher.css';

const LogoFetcher = ({ onLogoSelect, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(inputValue);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  // Determine API Base URL
  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  const API_BASE_URL = isLocalhost
    ? "http://localhost:5000"
    : "https://cronacheapp.onrender.com";

  // Search effect
  useEffect(() => {
    const fetchLogos = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const res = await fetch(`${API_BASE_URL}/api/search-logos?q=${encodeURIComponent(debouncedQuery)}`);
        
        if (!res.ok) {
          throw new Error(`Errore HTTP! Status: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.status && data.results && data.results.length > 0) {
          setResults(data.results);
        } else {
          setResults([]);
          setError(`Nessun logo trovato per "${debouncedQuery}".`);
        }
      } catch (err) {
        console.error("Errore Fetch:", err);
        setError("Errore di connessione al server.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogos();
  }, [debouncedQuery, API_BASE_URL]);

  const handleSelect = (logoUrl) => {
    // Uso il proxy per evitare qualsiasi problema di CORS con le immagini nel Canvas
    const proxyUrl = `${API_BASE_URL}/proxy-image?url=${encodeURIComponent(logoUrl)}`;
    onLogoSelect(proxyUrl);
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
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Cerca squadra (es. Roma, France)..."
            className="modern-input"
            autoFocus
          />
          {loading && <div className="spinner-small">⏳</div>}
        </div>

        {error && !loading && results.length === 0 && <div className="error-msg">{error}</div>}

        {results.length > 0 && (
          <ul className="results-dropdown">
            {results.map((team, index) => (
              <li key={index} className="result-item" onClick={() => handleSelect(team.logo_url)}>
                <img src={team.logo_url} alt={team.name} className="result-logo" />
                <div className="result-info">
                  <span className="result-name">{team.name}</span>
                  <span className="result-country">{team.country}</span>
                </div>
              </li>
            ))}
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