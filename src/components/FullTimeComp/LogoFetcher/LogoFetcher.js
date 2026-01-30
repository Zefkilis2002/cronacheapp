import React, { useState } from 'react';
import './LogoFetcher.css';

const LogoFetcher = ({ onLogoSelect, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // --- 1. OVERRIDES MANUALI (Per casi disperati) ---
  const MANUAL_OVERRIDES = {
    'inter': 'italy/inter',
    'milan': 'italy/milan',
    'juve': 'italy/juventus',
    'real madrid': 'spain/real-madrid',
    'man utd': 'england/manchester-united',
    'man city': 'england/manchester-city',
    'bayern': 'germany/bayern-munchen',
    'slavia': 'czech-republic/slavia-praha',
    'pescara': 'italy/pescara', 
    'kairat': 'kazakhstan/kairat'
  };

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

  // --- 2. VALIDATORE PAGINA (Il cuore della correzione) ---
  const validateAndExtractLogo = (html, teamSlug) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    // A. PROTEZIONE HOME PAGE / CATEGORIE
    // Se il titolo è generico o non contiene il nome cercato (circa), è un redirect errato.
    const pageTitle = doc.querySelector('title')?.innerText.toLowerCase() || "";
    const isHomePage = pageTitle === "football logos" || pageTitle.includes("all leagues");
    
    // Se siamo finiti sulla home o su una pagina lista, scartare.
    if (isHomePage) return null;

    // B. ESTRAZIONE
    // 1. Cerca og:image (massima qualità)
    let imgUrl = doc.querySelector('meta[property="og:image"]')?.content;
    
    // 2. Fallback su div logo
    if (!imgUrl) {
      const img = doc.querySelector('.logo img') || doc.querySelector('#logo img');
      if (img) imgUrl = img.getAttribute('src');
    }

    if (imgUrl) {
      if (imgUrl.startsWith('/')) imgUrl = 'https://football-logos.cc' + imgUrl;
      
      // Controllo finale: se l'immagine è il banner del sito ("logo.png" generico), scarta.
      if (imgUrl.includes('site-logo') || imgUrl.endsWith('/logo.png')) return null;
      
      return imgUrl;
    }
    return null;
  };

  // --- 3. FETCH CONCORRENTE (Per la velocità) ---
  const checkUrl = async (path, teamSlug) => {
    const targetUrl = `https://football-logos.cc/${path}/`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('404');
      const html = await response.text();
      
      // Validazione rigorosa
      const logo = validateAndExtractLogo(html, teamSlug);
      if (logo) return logo;
      throw new Error('No logo in page');
    } catch (e) {
      throw e; // Rilancia errore per Promise.any
    }
  };

  const fetchTeamData = async (teamName) => {
    try {
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`);
      const data = await res.json();
      if (data.teams?.[0]) {
        return {
          country: slugify(data.teams[0].strCountry),
          team: slugify(data.teams[0].strTeam),
          alt: slugify(data.teams[0].strTeamShort || '')
        };
      }
    } catch (_) {}
    return null;
  };

  // --- 4. LOGICA PRINCIPALE ---
  const fetchLogo = async () => {
    if (!inputValue) return;
    setLoading(true);
    setError('');
    setStatusMessage('Ricerca ultra-veloce...');

    const rawInput = inputValue.toLowerCase().trim();
    let candidates = [];

    // 1. Override manuale
    if (MANUAL_OVERRIDES[rawInput]) {
      candidates.push(MANUAL_OVERRIDES[rawInput]);
    }

    const parts = rawInput.split(' ');
    const term = slugify(rawInput);

    // 2. Generazione Strategie URL
    if (parts.length === 1) {
        // Solo nome (es. "Pescara")
        // Strategia API (trova il paese)
        const apiData = await fetchTeamData(rawInput);
        if (apiData) {
            candidates.push(`${apiData.country}/${apiData.team}`);       // italy/pescara
            if (apiData.alt) candidates.push(`${apiData.country}/${apiData.alt}`);
        }
        
        // Strategia Nazionale
        candidates.push(`${term}/${term}-national-team`); // italy/italy-national-team
    } else {
        // Nome + Paese o Nome Lungo (es. "Italy Pescara" o "Real Madrid")
        const country = slugify(parts[0]);
        const team = slugify(parts.slice(1).join(' '));
        
        // Se l'utente ha scritto "Italy Pescara"
        candidates.push(`${country}/${team}`); 
        
        // Se l'utente ha scritto "Real Madrid" (senza paese)
        const apiData = await fetchTeamData(rawInput);
        if (apiData) {
            candidates.push(`${apiData.country}/${apiData.team}`);
        }
    }

    // Rimuovi duplicati
    candidates = [...new Set(candidates)];
    
    // --- ESECUZIONE PARALLELA ---
    try {
      // Crea un array di promesse (tutti i tentativi partono insieme)
      const promises = candidates.map(path => checkUrl(path, term));
      
      // Promise.any aspetta IL PRIMO che ha successo e ignora i fallimenti (se ce n'è almeno uno buono)
      const foundLogo = await Promise.any(promises);
      
      onLogoSelect(foundLogo);
      onClose();
    } catch (err) {
      // Se arriviamo qui, TUTTE le promesse sono fallite
      console.error("Nessun logo trovato:", err);
      setError(`Nessun logo trovato per "${inputValue}". Prova "Nazione Squadra" (es. Italy Pescara).`);
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="logo-fetcher-overlay">
      <div className="logo-fetcher-modal simple-mode">
        <h3>Trova Logo</h3>
        <p className="instruction">
          Scrivi il nome della squadra (o <i>Nazione Squadra</i> per sicurezza).
        </p>
        
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder="Es. Pescara, Kairat, Brazil..."
          className="simple-input"
          onKeyDown={(e) => e.key === 'Enter' && fetchLogo()}
          autoFocus
          disabled={loading}
        />

        {statusMessage && <div className="status-msg" style={{color:'#b4ff00'}}>{statusMessage}</div>}
        {error && <div className="error-msg">{error}</div>}

        <div className="simple-actions">
          <button className="confirm-btn" onClick={fetchLogo} disabled={loading || !inputValue}>
            {loading ? 'Cercando...' : 'Cerca'}
          </button>
          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoFetcher;
