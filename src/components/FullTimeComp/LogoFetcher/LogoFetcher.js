import React, { useState } from 'react';
import './LogoFetcher.css';

const LogoFetcher = ({ onLogoSelect, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Funzione per formattare la stringa in stile URL (lowercase e trattini)
  const formatSlug = (text) => text.trim().toLowerCase().replace(/\s+/g, '-');

  // Funzione per capitalizzare le parole (per il fallback dell'immagine diretta)
  const capitalize = (text) => text.split(/[\s-]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('%20');

  // Dizionario per aiutare SOLO la ricerca API (trovare la nazione), 
  // MA non deve sostituire il tentativo di usare il nome originale nell'URL.
  const API_SEARCH_HELPERS = {
    'inter': 'inter milan',
    'paok': 'paok thessaloniki',
    'aek': 'aek athens',
    'sporting': 'sporting cp',
    'man utd': 'manchester united',
    'man city': 'manchester city'
    // Rimossi Young Boys, Kairat, Olympiakos per evitare che l'alias sporchi l'URL se il sito usa il nome corto
  };

  // --- API HELPER ---
  const fetchTeamData = async (teamName) => {
    try {
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.teams && data.teams.length > 0) {
        return {
            country: data.teams[0].strCountry,
            team: data.teams[0].strTeam,
            teamShort: data.teams[0].strTeamShort
        };
      }
      return null;
    } catch (e) { return null; }
  };

  // --- GOOGLE SEARCH HELPER ---
  const searchAndFetchGoogle = async (query) => {
    try {
      const searchUrl = `https://www.google.com/search?q=site:football-logos.cc+${encodeURIComponent(query)}&gbv=1`;
      const proxyUrl = `http://localhost:5000/proxy-image?url=${encodeURIComponent(searchUrl)}`;
      
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error('Google search failed');
      
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const links = Array.from(doc.querySelectorAll('a'));
      const match = links.find(a => {
        const href = a.getAttribute('href');
        return href && href.includes('football-logos.cc/') && !href.includes('google.com');
      });
      
      if (match) {
        let targetUrl = match.getAttribute('href');
        if (targetUrl.startsWith('/url?q=')) {
          const urlParams = new URLSearchParams(targetUrl.split('?')[1]);
          targetUrl = urlParams.get('q');
        }
        return targetUrl;
      }
      throw new Error('Nessun risultato Google');
    } catch (e) {
      throw e;
    }
  };

  // --- PAGE EXTRACTOR ---
  const extractImageFromPage = async (pageUrl) => {
    const proxyUrl = `http://localhost:5000/proxy-image?url=${encodeURIComponent(pageUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('Page 404');
    
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // DEBUG: Cerca di capire cosa c'è
    // console.log("HTML scaricato:", html.substring(0, 500));

    // STRATEGIA DI ESTRAZIONE MIGLIORATA
    // 1. Cerca immagine nel container principale tipico (.logo o #logo)
    let img = doc.querySelector('.logo img') || doc.querySelector('#logo img');
    
    // 2. Se non c'è, cerca immagini che sembrano loghi basandosi su src
    if (!img) {
      // Cerca immagini con "logos" o "media/img" nel percorso
      const candidates = Array.from(doc.querySelectorAll('img'));
      img = candidates.find(i => {
         const src = i.getAttribute('src');
         return src && (src.includes('/logos/') || src.includes('/media/img/') || src.includes('.png') || src.includes('.svg'));
      });
    }

    // 3. Caso speciale: Meta tag OpenGraph (spesso affidabile)
    let imgUrl = img ? img.getAttribute('src') : null;
    if (!imgUrl) {
      const ogImage = doc.querySelector('meta[property="og:image"]');
      if (ogImage) imgUrl = ogImage.content;
    }

    if (imgUrl) {
      // Normalizzazione URL
      if (imgUrl.startsWith('/')) {
        imgUrl = 'https://football-logos.cc' + imgUrl;
      }
      
      // Fix proxy params (rimozione wrapper localhost)
      if (imgUrl.includes('localhost') && imgUrl.includes('?url=')) {
         const urlParams = new URLSearchParams(new URL(imgUrl).search);
         if (urlParams.get('url')) imgUrl = urlParams.get('url');
      }

      // Se è un SVG, proviamo a vedere se c'è una versione PNG (opzionale, ma Konva gestisce SVG meglio se convertiti)
      // Ma per ora ritorniamo quello che troviamo.
      return imgUrl;
    }
    
    throw new Error('Img not found');
  };

  // --- MAIN FUNCTION ---
  const fetchLogo = async () => {
    if (!inputValue) return;
    setLoading(true);
    setError('');

    const originalInput = inputValue.trim();
    const lowerInput = originalInput.toLowerCase();
    const parts = originalInput.split(' ');
    
    // Determina il termine da usare per l'API (può essere l'alias)
    // MA manteniamo originalInput per costruire l'URL
    const apiSearchTerm = API_SEARCH_HELPERS[lowerInput] || originalInput;

    try {
      let candidates = [];

      // 1. ANALISI INPUT E GENERAZIONE CANDIDATI
      if (parts.length === 1 || API_SEARCH_HELPERS[lowerInput]) {
        // A. Tentativo API per trovare la NAZIONE
        const apiData = await fetchTeamData(apiSearchTerm);
        
        if (apiData) {
          const c = formatSlug(apiData.country);
          
          // CANDIDATI BASATI SU API + INPUT ORIGINALE
          
          // 1. Priorità assoluta: {Country}/{Input Utente} (es. italy/inter)
          candidates.push(`https://football-logos.cc/${c}/${formatSlug(originalInput)}/`);
          
          // 2. Short Name API (es. czech-republic/slavia-praha se API restituisce quello)
          if (apiData.teamShort) candidates.push(`https://football-logos.cc/${c}/${formatSlug(apiData.teamShort)}/`);
          
          // 3. Full Name API (es. italy/internazionale)
          candidates.push(`https://football-logos.cc/${c}/${formatSlug(apiData.team)}/`);
          
          // 4. Alias Name (se diverso dall'originale)
          if (apiSearchTerm !== originalInput) {
             candidates.push(`https://football-logos.cc/${c}/${formatSlug(apiSearchTerm)}/`);
          }
        }
        
        // B. Tentativo "Nazionale" (Fallback se API fallisce o per sicurezza)
        candidates.push(`https://football-logos.cc/${formatSlug(originalInput)}/`);
        
      } else {
        // Caso: "Italy Roma" (Esplicito)
        const country = formatSlug(parts[0]);
        const team = formatSlug(parts.slice(1).join(' '));
        candidates.push(`https://football-logos.cc/${country}/${team}/`);
      }

      // 2. ESECUZIONE TENTATIVI (Stop al primo successo)
      // Rimuoviamo duplicati dalla lista candidati
      candidates = [...new Set(candidates)];
      
      let foundLogo = null;
      for (const url of candidates) {
        try {
          console.log("Checking:", url);
          foundLogo = await extractImageFromPage(url);
          if (foundLogo) break;
        } catch (e) {}
      }

      // 3. FALLBACK GOOGLE
      if (!foundLogo) {
        console.log("Candidati diretti falliti, provo Google...");
        try {
          const googlePageUrl = await searchAndFetchGoogle(originalInput);
          foundLogo = await extractImageFromPage(googlePageUrl);
        } catch (e) {
          console.warn("Google fallito:", e);
        }
      }

      // 4. RISULTATO
      if (foundLogo) {
        onLogoSelect(foundLogo);
        onClose();
      } else {
        // Fallback immagine cieca basata sull'input originale
        const finalFallback = parts.length > 1 
          ? `https://football-logos.cc/logos/${capitalize(parts[0])}/${capitalize(parts.slice(1).join(' '))}.png`
          : `https://football-logos.cc/logos/${capitalize(parts[0])}/${capitalize(parts[0])}.png`;
        
        // Non mostriamo errore bloccante, ma impostiamo il fallback
        console.log("Fallback immagine finale:", finalFallback);
        onLogoSelect(finalFallback);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logo-fetcher-overlay">
      <div className="logo-fetcher-modal simple-mode">
        <h3>Carica Logo</h3>
        <p className="instruction">
          Scrivi <b>Nazione</b> spazio <b>Squadra</b>.<br/>
          <small>Esempi: <i>Italy Roma</i>, <i>Portugal Benfica</i>, <i>Brazil</i></small>
        </p>
        
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder="Es. Italy Roma"
          className="simple-input"
          onKeyDown={(e) => e.key === 'Enter' && fetchLogo()}
          autoFocus
        />

        {error && <div className="error-msg">{error}</div>}

        <div className="simple-actions">
          <button className="confirm-btn" onClick={fetchLogo} disabled={loading || !inputValue}>
            {loading ? 'Ricerca...' : 'Carica Logo'}
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoFetcher;