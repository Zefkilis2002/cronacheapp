import React, { useState } from 'react';
import './LogoFetcher.css';

const LogoFetcher = ({ onLogoSelect, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugLog, setDebugLog] = useState(''); // Per vedere cosa succede

  // Funzione di pulizia stringhe (slug)
  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // via accenti
      .replace(/'/g, '')
      .replace(/\s+/g, '-') // spazi -> trattini
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .trim();
  };

  // --- 1. ESTRAZIONE DIRETTA (Logic Semplificata) ---
  const fetchPageAndExtract = async (path) => {
    const targetUrl = `https://football-logos.cc/${path}/`;
    // Usa AllOrigins come proxy (è il più affidabile per l'HTML testuale)
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

    try {
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      // Se il proxy dice che c'è stato un errore HTTP (es. 404)
      if (!data.contents) return null;

      const html = data.contents;
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // --- PUNTO CRITICO: RICONOSCERE LA PAGINA SQUADRA ---
      // Le pagine squadra hanno SEMPRE un div con id="logo" o class="logo" che contiene l'immagine principale.
      // Le pagine "griglia" (quelle sbagliate) hanno tanti loghi ma non un #logo principale univoco in quel modo.
      
      let imgNode = doc.querySelector('#logo img') || doc.querySelector('.logo img');
      
      if (!imgNode) {
        // Ultimo tentativo: OpenGraph image
        const ogImage = doc.querySelector('meta[property="og:image"]');
        if (ogImage) return ogImage.content;
        return null;
      }

      let imgUrl = imgNode.getAttribute('src');

      // Se l'immagine è relativa, aggiungi il dominio
      if (imgUrl.startsWith('/')) {
        imgUrl = 'https://football-logos.cc' + imgUrl;
      }

      // Filtro Anti-Spazzatura:
      // Se l'immagine si chiama "logo.png" (generico del sito) o è il banner, scartala.
      if (imgUrl.includes('site-logo') || imgUrl.endsWith('/logo.png')) return null;

      return imgUrl;

    } catch (e) {
      console.warn(`Fallito tentativo su: ${path}`, e);
      return null;
    }
  };

  // --- 2. RECUPERO DATI NAZIONE (API ESTERNA) ---
  const getTeamDetails = async (query) => {
    try {
      // TheSportsDB è ottimo per capire che "Kairat" è in "Kazakhstan"
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (data.teams && data.teams.length > 0) {
        return {
          country: slugify(data.teams[0].strCountry),
          team: slugify(data.teams[0].strTeam),
          alt: slugify(data.teams[0].strTeamShort || '')
        };
      }
    } catch (e) {
      console.error("Errore API SportsDB", e);
    }
    return null;
  };

  // --- 3. FUNZIONE PRINCIPALE ---
  const startSearch = async () => {
    if (!inputValue) return;
    setLoading(true);
    setError('');
    setDebugLog('Analisi in corso...');

    const rawInput = inputValue.toLowerCase().trim();
    const inputSlug = slugify(rawInput);
    const parts = rawInput.split(' ');

    let attempts = [];

    // A. COSTRUZIONE LISTA TENTATIVI
    
    // 1. Se l'utente ha scritto "Nazione Squadra" (es. "Italy Pescara")
    if (parts.length > 1) {
      const country = slugify(parts[0]);
      const team = slugify(parts.slice(1).join(' '));
      attempts.push(`${country}/${team}`); // italy/pescara
    }

    // 2. Chiediamo all'API di dirci la nazione (es. input "Kairat" -> API dice Kazakhstan)
    const apiData = await getTeamDetails(rawInput);
    
    if (apiData) {
      // Tentativo API preciso (es. kazakhstan/kairat)
      attempts.push(`${apiData.country}/${apiData.team}`);
      // Tentativo con nome corto API
      if (apiData.alt) attempts.push(`${apiData.country}/${apiData.alt}`);
      // Tentativo ibrido: Nazione API + Input Utente (es. kazakhstan/kairat-almaty)
      if (inputSlug !== apiData.team) attempts.push(`${apiData.country}/${inputSlug}`);
    } else {
      // Se l'API fallisce, proviamo l'input come se fosse una nazionale
      attempts.push(`${inputSlug}/${inputSlug}-national-team`);
    }

    // 3. Fallback "Disperato": Se l'utente ha scritto solo "Pescara" e l'API ha fallito
    // Proviamo a indovinare nazioni calcistiche comuni se non abbiamo info
    if (parts.length === 1 && !apiData) {
       attempts.push(`italy/${inputSlug}`);
       attempts.push(`england/${inputSlug}`);
       attempts.push(`spain/${inputSlug}`);
    }

    // Rimuovi duplicati
    attempts = [...new Set(attempts)];
    setDebugLog(`Provo URL: ${attempts.join(', ')}`);

    // B. ESECUZIONE (Sequenziale veloce per fermarsi al primo successo)
    let foundUrl = null;
    
    for (const path of attempts) {
      foundUrl = await fetchPageAndExtract(path);
      if (foundUrl) {
        console.log("Logo trovato su:", path);
        break; // Trovato! Interrompi il ciclo.
      }
    }

    if (foundUrl) {
      onLogoSelect(foundUrl);
      onClose();
    } else {
      setError(`Logo non trovato. Prova a scrivere "Nazione Squadra" (es. Italy Pescara).`);
    }
    
    setLoading(false);
  };

  return (
    <div className="logo-fetcher-overlay">
      <div className="logo-fetcher-modal simple-mode">
        <h3>Carica Logo</h3>
        <p className="instruction">
          Inserisci il nome (es. <i>Pescara, Kairat</i>) o <i>Nazione Squadra</i>.
        </p>
        
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder="Es. Pescara"
          className="simple-input"
          onKeyDown={(e) => e.key === 'Enter' && startSearch()}
          autoFocus
          disabled={loading}
        />

        {debugLog && <div style={{fontSize:'10px', color:'#666', marginTop:'5px', whiteSpace: 'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%'}}>{debugLog}</div>}
        {error && <div className="error-msg">{error}</div>}

        <div className="simple-actions">
          <button className="confirm-btn" onClick={startSearch} disabled={loading || !inputValue}>
            {loading ? '...' : 'Cerca'}
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
