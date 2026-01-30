import React, { useState } from 'react';
import './LogoFetcher.css';

const LogoFetcher = ({ onLogoSelect, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // --- 1. MAPPATURA MANUALE (CASI DIFFICILI) ---
  // Se una squadra non esce mai, aggiungi qui la parte finale dell'URL.
  // Es: se l'url è football-logos.cc/england/newcastle-united-fc/ -> scrivi 'newcastle': 'england/newcastle-united-fc'
  const MANUAL_OVERRIDES = {
    'inter': 'italy/inter',
    'milan': 'italy/milan',
    'juve': 'italy/juventus',
    'juventus': 'italy/juventus',
    'real': 'spain/real-madrid',
    'real madrid': 'spain/real-madrid',
    'atletico': 'spain/atletico-madrid',
    'barca': 'spain/fc-barcelona',
    'barcelona': 'spain/fc-barcelona',
    'man utd': 'england/manchester-united',
    'man city': 'england/manchester-city',
    'psg': 'france/paris-saint-germain',
    'bayern': 'germany/bayern-munchen',
    'young boys': 'switzerland/young-boys',
    'slavia': 'czech-republic/slavia-praha',
    'olympiakos': 'greece/olympiakos',
    'paok': 'greece/paok',
    'aek': 'greece/aek',
    'panathinaikos': 'greece/panathinaikos'
  };

  // --- 2. UTILITÀ SLUGIFY ---
  // Trasforma "São Paulo" -> "sao-paulo", "O'Higgins" -> "ohiggins"
  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD') // Separa accenti
      .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
      .replace(/'/g, '') // Rimuove apostrofi uniti
      .replace(/\s+/g, '-') // Spazi in trattini
      .replace(/[^\w-]+/g, '') // Rimuove char non alfanumerici
      .replace(/--+/g, '-') // Rimuove doppi trattini
      .trim();
  };

  // --- 3. HELPER RICERCA API ---
  const fetchTeamData = async (teamName) => {
    try {
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.teams && data.teams.length > 0) {
        return {
          country: slugify(data.teams[0].strCountry),
          team: slugify(data.teams[0].strTeam),
          alternate: slugify(data.teams[0].strTeamShort || '')
        };
      }
      return null;
    } catch (e) { return null; }
  };

  // --- 4. ESTRAZIONE IMMAGINE DALLA PAGINA ---
  const checkUrlForLogo = async (targetPath) => {
    const pageUrl = `https://football-logos.cc/${targetPath}/`;
    // Proxy AllOrigins per aggirare CORS e scaricare l'HTML
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(pageUrl)}`;

    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) return null; // 404 o errore server

      const html = await res.text();
      
      // Controllo rapido se siamo in una pagina 404 del sito target
      if (html.includes("Page not found") || html.includes("404 Error")) return null;

      const doc = new DOMParser().parseFromString(html, 'text/html');

      // A. Metodo Migliore: Open Graph Image (Di solito è il PNG ad alta risoluzione)
      let imgUrl = null;
      const metaOg = doc.querySelector('meta[property="og:image"]');
      if (metaOg) {
        imgUrl = metaOg.content;
      }

      // B. Metodo Fallback: Cerca nel div .logo
      if (!imgUrl) {
        const logoDivImg = doc.querySelector('.logo img') || doc.querySelector('#logo img');
        if (logoDivImg) imgUrl = logoDivImg.getAttribute('src');
      }

      // Validazione URL trovato
      if (imgUrl) {
        // Fix per URL relativi
        if (imgUrl.startsWith('/')) {
            imgUrl = 'https://football-logos.cc' + imgUrl;
        }
        // Se l'immagine è l'icona di default del sito o placeholder, scartala
        if (imgUrl.includes('logo-default') || imgUrl.length < 20) return null;
        
        return imgUrl;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  // --- 5. FUNZIONE PRINCIPALE ---
  const fetchLogo = async () => {
    if (!inputValue) return;
    setLoading(true);
    setError('');
    setStatusMessage('Analisi richiesta...');
    
    const rawInput = inputValue.toLowerCase().trim();
    let candidates = [];

    // --- FASE A: CONTROLLO MANUALE ---
    if (MANUAL_OVERRIDES[rawInput]) {
      candidates.push(MANUAL_OVERRIDES[rawInput]);
    }

    // --- FASE B: GENERAZIONE CANDIDATI URL ---
    const parts = rawInput.split(' ');
    
    // Se l'input è una sola parola (es. "Italy", "Brazil", "Inter")
    if (parts.length === 1) {
      const term = slugify(parts[0]);
      // 1. Ipotesi Nazionale: paese/paese-national-team (es. brazil/brazil-national-team)
      candidates.push(`${term}/${term}-national-team`);
      // 2. Ipotesi Club famoso (senza paese nell'input): Cerchiamo info su API
      setStatusMessage('Ricerca informazioni team...');
      const apiInfo = await fetchTeamData(parts[0]);
      if (apiInfo) {
        candidates.push(`${apiInfo.country}/${apiInfo.team}`); // es. italy/inter
        if (apiInfo.alternate) candidates.push(`${apiInfo.country}/${apiInfo.alternate}`);
      }
    } 
    // Se l'input è due o più parole (es. "Italy Roma", "Real Madrid")
    else {
      // 1. Ipotesi: Prima parola = Paese, Resto = Squadra (es. "Italy Roma")
      const country = slugify(parts[0]);
      const team = slugify(parts.slice(1).join(' '));
      candidates.push(`${country}/${team}`);
      candidates.push(`${country}/${team}-fc`); // Variabile comune

      // 2. Ipotesi: Tutto è il nome della squadra (es. "Real Madrid") -> serve API per il paese
      setStatusMessage('Verifica database...');
      const apiInfo = await fetchTeamData(rawInput);
      if (apiInfo) {
        candidates.push(`${apiInfo.country}/${apiInfo.team}`);
        candidates.push(`${apiInfo.country}/${slugify(rawInput)}`); // Usa input originale + paese API
      } else {
        // Fallback API fallita: prova a trattare tutto come nazionale
        const fullSlug = slugify(rawInput);
        candidates.push(`${fullSlug}/${fullSlug}-national-team`);
      }
    }

    // Rimuovi duplicati
    candidates = [...new Set(candidates)];
    console.log("Tentativi URL:", candidates);

    // --- FASE C: RICERCA PARALLELA ---
    setStatusMessage(`Scansione di ${candidates.length} percorsi...`);
    
    let foundImage = null;

    // Proviamo i candidati uno alla volta per non saturare, o in Promise.all per velocità
    // Qui usiamo un loop sequenziale per fermarci al primo successo (risparmia banda)
    for (const candidate of candidates) {
        foundImage = await checkUrlForLogo(candidate);
        if (foundImage) {
            console.log(`Trovato su: ${candidate}`);
            break;
        }
    }

    // --- RISULTATO ---
    if (foundImage) {
      onLogoSelect(foundImage);
      onClose();
    } else {
      setError('Logo non trovato automaticamente. Prova a specificare "Nazione Squadra" (es. "Spain Barcelona").');
    }
    
    setLoading(false);
    setStatusMessage('');
  };

  return (
    <div className="logo-fetcher-overlay">
      <div className="logo-fetcher-modal simple-mode">
        <h3>Carica Logo (Web)</h3>
        <p className="instruction">
          Inserisci <b>Nazione Squadra</b> o solo il nome.<br/>
          <small>Es: <i>Italy Inter</i>, <i>Brazil</i>, <i>Real Madrid</i></small>
        </p>
        
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder="Es. Greece PAOK, Italy Milan..."
          className="simple-input"
          onKeyDown={(e) => e.key === 'Enter' && fetchLogo()}
          autoFocus
          disabled={loading}
        />

        {statusMessage && <div className="status-msg" style={{color: '#b4ff00', fontSize: '0.8rem', marginTop:'5px'}}>{statusMessage}</div>}
        {error && <div className="error-msg">{error}</div>}

        <div className="simple-actions">
          <button className="confirm-btn" onClick={fetchLogo} disabled={loading || !inputValue}>
            {loading ? 'Ricerca...' : 'Trova Logo'}
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
