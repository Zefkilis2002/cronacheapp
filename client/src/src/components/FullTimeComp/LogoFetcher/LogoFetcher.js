import React, { useState } from 'react';
import './LogoFetcher.css';

const LogoFetcher = ({ onLogoSelect, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugLog, setDebugLog] = useState('');

  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/'/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .trim();
  };

  // --- 1. ESTRAZIONE DIRETTA LOGO DA PAGINA (Scraping) ---
  const fetchPageAndExtract = async (path) => {
    // Se path è già un URL completo, usalo, altrimenti costruisci l'URL di football-logos
    const targetUrl = path.startsWith('http') ? path : `https://football-logos.cc/${path}/`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

    try {
      const response = await fetch(proxyUrl);
      const data = await response.json();
      if (!data.contents) return null;

      const doc = new DOMParser().parseFromString(data.contents, 'text/html');
      
      // A. Selettore specifico per pagina squadra
      let imgNode = doc.querySelector('#logo img') || doc.querySelector('.logo img');
      
      // B. Fallback: cerca l'immagine principale nel contenuto se il selettore specifico fallisce
      if (!imgNode) {
         imgNode = doc.querySelector('.post img') || doc.querySelector('.entry-content img');
      }

      if (!imgNode) return null;

      let imgUrl = imgNode.getAttribute('src');
      if (imgUrl.startsWith('/')) {
        imgUrl = 'https://football-logos.cc' + imgUrl;
      }

      // Filtri anti-spam (evita loghi del sito o placeholder)
      if (imgUrl.includes('site-logo') || imgUrl.endsWith('logo.png')) return null;
      
      return imgUrl;

    } catch (e) {
      console.warn(`Scraping fallito su: ${path}`, e);
      return null;
    }
  };

  // --- 2. RICERCA SUL SITO (Nuova Strategia Robusta) ---
  const searchOnSite = async (query) => {
    try {
      // Usa la ricerca interna di football-logos.cc
      const searchUrl = `https://football-logos.cc/?s=${encodeURIComponent(query)}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}`;
      
      const response = await fetch(proxyUrl);
      const data = await response.json();
      if (!data.contents) return null;

      const doc = new DOMParser().parseFromString(data.contents, 'text/html');
      
      // Cerchiamo link nei risultati che sembrino pagine di squadre (es. /italy/pescara/)
      // I risultati di ricerca di solito sono <a> che contengono il titolo
      const links = Array.from(doc.querySelectorAll('a'));
      const teamLink = links.find(a => {
        const href = a.getAttribute('href');
        if (!href) return false;
        // Escludi pagine di navigazione
        if (href.includes('/page/') || href.includes('/tag/') || href.includes('/category/')) return false;
        
        // Verifica euristica: le pagine squadra di solito sono tipo domain/nazione/squadra/
        try {
            const urlObj = new URL(href, 'https://football-logos.cc');
            const parts = urlObj.pathname.split('/').filter(Boolean);
            // Ci aspettiamo almeno 2 parti (nazione/squadra)
            return parts.length >= 2;
        } catch (e) {
            return false;
        }
      });

      if (teamLink) {
        let href = teamLink.getAttribute('href');
        return href.replace(/^\/+|\/+$/g, ''); // Pulisci slash
      }
    } catch (e) {
      console.warn("Ricerca sito fallita", e);
    }
    return null;
  };

  // --- 3. API THE SPORTS DB (Priorità Massima) ---
  const fetchFromApi = async (query) => {
    try {
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (data.teams && data.teams.length > 0) {
        const team = data.teams[0];
        // Preferiamo il badge (logo) diretto se disponibile
        if (team.strTeamBadge) return team.strTeamBadge;
      }
    } catch (e) {
      console.error("Errore API SportsDB", e);
    }
    return null;
  };

  const startSearch = async () => {
    if (!inputValue) return;
    setLoading(true);
    setError('');
    setDebugLog('Avvio ricerca...');

    const rawInput = inputValue.trim();
    
    // FASE 1: API (TheSportsDB) - Velocissimo e preciso
    // Risolve il 90% dei casi con loghi ufficiali di alta qualità
    setDebugLog('Consulto database ufficiale...');
    const apiLogo = await fetchFromApi(rawInput);
    if (apiLogo) {
      console.log('Logo trovato via API');
      onLogoSelect(apiLogo);
      onClose();
      return; 
    }

    // FASE 2: RICERCA DIRETTA SU SITO (Scraping Search) - Molto affidabile
    // Se l'API fallisce, cerchiamo "manualmente" sul sito di loghi
    setDebugLog('Cerco negli archivi online...');
    const sitePath = await searchOnSite(rawInput);
    if (sitePath) {
      setDebugLog(`Trovata corrispondenza: ${sitePath}`);
      const scrapedLogo = await fetchPageAndExtract(sitePath);
      if (scrapedLogo) {
        onLogoSelect(scrapedLogo);
        onClose();
        return;
      }
    }

    // FASE 3: TENTATIVI FALLBACK (Per casi disperati)
    // Se anche la ricerca fallisce, proviamo a indovinare URL comuni
    setDebugLog('Provo combinazioni standard...');
    const inputSlug = slugify(rawInput);
    const attempts = [
        `italy/${inputSlug}`,
        `england/${inputSlug}`,
        `spain/${inputSlug}`,
        `${inputSlug}/${inputSlug}-logo`
    ];

    for (const path of attempts) {
        const found = await fetchPageAndExtract(path);
        if (found) {
            onLogoSelect(found);
            onClose();
            return;
        }
    }

    setError(`Nessun logo trovato per "${inputValue}".`);
    setLoading(false);
  };

  return (
    <div className="logo-fetcher-overlay">
      <div className="logo-fetcher-modal simple-mode">
        <h3>Trova Logo</h3>
        <p className="instruction">
          Inserisci il nome della squadra (es. <i>Pescara, Real Madrid</i>).
        </p>
        
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder="Nome squadra..."
          className="simple-input"
          onKeyDown={(e) => e.key === 'Enter' && startSearch()}
          autoFocus
          disabled={loading}
        />

        {debugLog && <div style={{fontSize:'10px', color:'#888', marginTop:'8px', fontStyle:'italic', maxWidth:'100%', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{debugLog}</div>}
        {error && <div className="error-msg">{error}</div>}

        <div className="simple-actions">
          <button className="confirm-btn" onClick={startSearch} disabled={loading || !inputValue}>
            {loading ? 'Ricerca...' : 'Cerca'}
          </button>
          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoFetcher;
