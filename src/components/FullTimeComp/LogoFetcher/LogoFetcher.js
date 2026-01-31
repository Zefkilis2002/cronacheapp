import React, { useState } from 'react';
import './LogoFetcher.css';

const LogoFetcher = ({ onLogoSelect, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugLog, setDebugLog] = useState('');

  // Helper per determinare l'URL base dell'API (Locale o Produzione)
  const getApiBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return ''; // In produzione usa path relativi (/api/...) gestiti dal proxy/rewrite
  };

  // --- 1. ESTRAZIONE DIRETTA LOGO DA PAGINA (Scraping via Backend) ---
  const fetchPageAndExtract = async (path) => {
    const targetUrl = path.startsWith('http') ? path : `https://football-logos.cc/${path}/`;
    
    // Usiamo il nostro backend per fare scraping (evita problemi CORS e Safari ITP)
    const scrapeEndpoint = `${getApiBaseUrl()}/api/scrape?url=${encodeURIComponent(targetUrl)}`;

    try {
      const response = await fetch(scrapeEndpoint);
      const data = await response.json();
      
      // Il backend restituisce { status: true, content: "<html>..." }
      if (!data.status || !data.content) return null;

      const doc = new DOMParser().parseFromString(data.content, 'text/html');
      
      // Prendiamo TUTTE le immagini per analizzarle
      const allImages = Array.from(doc.querySelectorAll('img'));
      
      // Filtriamo le immagini valide
      const candidates = allImages.map(img => {
          let src = img.getAttribute('src');
          if (!src) return null;
          if (src.startsWith('/')) src = 'https://football-logos.cc' + src;
          
          const filename = src.split('/').pop().toLowerCase();
          
          // CRITERI DI ESCLUSIONE
          if (src.includes('site-logo')) return null;
          if (filename === 'logo.png') return null; // Logo del sito generico
          if (filename === 'placeholder.png') return null;
          if (filename.includes('facebook') || filename.includes('twitter') || filename.includes('instagram')) return null;
          if (img.width > 0 && img.width < 50) return null; // Troppo piccola (icone)

          return src;
      }).filter(Boolean);

      if (candidates.length === 0) return null;

      // CRITERI DI SELEZIONE DEL MIGLIORE
      // 1. Preferiamo immagini che contengono la parola "logo" nel nome file
      const bestMatch = candidates.find(src => src.toLowerCase().includes('logo'));
      
      // 2. Altrimenti prendiamo la prima immagine valida (di solito è quella principale nel content)
      return bestMatch || candidates[0];

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
      // Anche la ricerca usa il nostro proxy backend
      const scrapeEndpoint = `${getApiBaseUrl()}/api/scrape?url=${encodeURIComponent(searchUrl)}`;
      
      const response = await fetch(scrapeEndpoint);
      const data = await response.json();
      if (!data.content) return null;

      const doc = new DOMParser().parseFromString(data.content, 'text/html');
      
      // Cerchiamo link nei risultati che sembrino pagine di squadre (es. /italy/pescara/)
      // I risultati di ricerca di solito sono <a> che contengono il titolo
      const links = Array.from(doc.querySelectorAll('a'));
      let teamLink = links.find(a => {
        const href = a.getAttribute('href');
        if (!href) return false;
        // Escludi pagine di navigazione
        if (href.includes('/page/') || href.includes('/tag/') || href.includes('/category/')) return false;
        
        // Verifica euristica: le pagine squadra di solito sono tipo domain/nazione/squadra/
        try {
            const urlObj = new URL(href, 'https://football-logos.cc');
            const parts = urlObj.pathname.split('/').filter(Boolean);
            // FIX: Accettiamo anche 1 sola parte (es. /olympiakos-logo/)
            return parts.length >= 1;
        } catch (e) {
            return false;
        }
      });

      // Se non troviamo nulla con l'euristica, cerchiamo un link che contenga la query nel testo o href
      if (!teamLink) {
         teamLink = links.find(a => {
             const href = a.getAttribute('href');
             if (!href) return false;
             if (href.includes('/page/') || href.includes('/tag/')) return false;
             return href.toLowerCase().includes(query.toLowerCase());
         });
      }

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

  // --- 4. API AI (Nuova Strategia Intelligente) ---
  const fetchFromAI = async (query) => {
    try {
      // Chiamata dinamica (locale o produzione)
      const res = await fetch(`${getApiBaseUrl()}/api/find-team-info?teamName=${encodeURIComponent(query)}`);
      const json = await res.json();
      
      if (json.status && json.data) {
        return json.data; // { country, teamName, slug_variants, countrySlug }
      }
    } catch (e) {
      console.warn("Errore API AI (Server non attivo o offline?)", e);
    }
    return null;
  };

  const startSearch = async () => {
    if (!inputValue) return;
    setLoading(true);
    setError('');
    setDebugLog('Avvio ricerca...');

    const rawInput = inputValue.trim();
    const inputSlug = slugify(rawInput);
    
    // FASE 1: API (TheSportsDB) - Velocissimo e preciso
    setDebugLog('Consulto database ufficiale...');
    const apiLogo = await fetchFromApi(rawInput);
    if (apiLogo) {
      console.log('Logo trovato via API SportsDB');
      onLogoSelect(apiLogo);
      onClose();
      return; 
    }

    // FASE 2: RICERCA LAMPO (Quick Search) - Prova i percorsi più ovvi
    // Risolve istantaneamente casi come Pisa, Milan, Inter senza aspettare l'AI
    setDebugLog('Ricerca rapida (Top Countries)...');
    const quickAttempts = [
        `italy/${inputSlug}`,
        `spain/${inputSlug}`,
        `england/${inputSlug}`,
        `greece/${inputSlug}`,
        `portugal/${inputSlug}`,
        `france/${inputSlug}`,
        `germany/${inputSlug}`,
        `netherlands/${inputSlug}`
    ];

    for (const path of quickAttempts) {
        // Nota: Qui usiamo fetchPageAndExtract che ora è veloce e usa il backend
        const found = await fetchPageAndExtract(path);
        if (found) {
            console.log('Logo trovato via Quick Search');
            onLogoSelect(found);
            onClose();
            return;
        }
    }

    // FASE 3: AI PREDICTION (GitHub Models)
    // Se la ricerca lampo fallisce, chiediamo all'AI che è più esperta
    setDebugLog('Analisi AI (GitHub Models)...');
    const aiData = await fetchFromAI(rawInput);
    
    if (aiData) {
        setDebugLog(`AI: ${aiData.teamName} (${aiData.country})`);
        
        const variants = aiData.slug_variants || [aiData.slug];
        let aiPaths = [];
        
        // Ordine intelligente: prima il nome semplice nel paese corretto
        variants.forEach(slug => {
            if(!slug) return;
            aiPaths.push(`${aiData.countrySlug}/${slug}`);      // es. greece/olympiacos
        });
        
        // Poi le varianti composte
        variants.forEach(slug => {
            if(!slug) return;
            aiPaths.push(`${aiData.countrySlug}/${slug}-logo`);
            aiPaths.push(`${slug}/${slug}-logo`);
        });

        aiPaths = [...new Set(aiPaths)];

        for (const path of aiPaths) {
            setDebugLog(`Verifico AI: ${path}`);
            const found = await fetchPageAndExtract(path);
            if (found) {
                console.log('Logo trovato via AI Prediction');
                onLogoSelect(found);
                onClose();
                return;
            }
        }
    }

    // FASE 4: RICERCA DIRETTA SU SITO (Fallback finale)
    setDebugLog('Cerco negli archivi online (Fallback)...');
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