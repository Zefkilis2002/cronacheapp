import React, { useState } from 'react';
// IMPORTANTE: Assicurati che i puntini siano giusti per arrivare a src/firebase.js
import { db } from '../../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import './LogoFetcher.css';

const LogoFetcher = ({ onLogoSelect, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugLog, setDebugLog] = useState('');

  const searchLogo = async () => {
    if (!inputValue) return;

    setLoading(true);
    setError('');
    setDebugLog('Ricerca avviata...');

    const searchTerm = inputValue.toLowerCase().trim();
    // 1. Prova con l'ID pulito (Es. "juventus" trova "juventus")
    const cleanId = searchTerm.replace(/[^a-z0-9]/g, '');

    try {
      // --- TENTATIVO 1: ID ESATTO (Velocissimo) ---
      if (cleanId.length > 1) {
        const docRef = doc(db, "teams", cleanId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("✅ Trovato per ID:", data.name);
          onLogoSelect(data.logo_url);
          onClose();
          return;
        }
      }

      // --- TENTATIVO 2: PAROLA CHIAVE (Se l'ID fallisce) ---
      // Cerca nei "keywords" (es. cerca "milan" dentro ["ac", "milan"])
      setDebugLog('ID non trovato, provo per parola chiave...');

      const q = query(
        collection(db, "teams"),
        where("keywords", "array-contains", searchTerm)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Prendi il primo risultato trovato
        const data = querySnapshot.docs[0].data();
        console.log("✅ Trovato per Keyword:", data.name);
        onLogoSelect(data.logo_url);
        onClose();
        return;
      }

      // --- NESSUN RISULTATO ---
      setError(`Nessun logo trovato per "${inputValue}".`);
      setDebugLog('Nessuna corrispondenza.');

    } catch (err) {
      console.error("Errore Firebase:", err);
      setError("Errore di connessione.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logo-fetcher-overlay">
      <div className="logo-fetcher-modal simple-mode">
        <h3>Trova Logo</h3>
        <p className="instruction">Database Cloud Attivo 🟢</p>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Cerca squadra (es. Milan)..."
          className="simple-input"
          onKeyDown={(e) => e.key === 'Enter' && searchLogo()}
          autoFocus
          disabled={loading}
        />

        {debugLog && <div className="debug-text" style={{ fontSize: '10px', color: '#999', marginTop: 5 }}>{debugLog}</div>}
        {error && <div className="error-msg">{error}</div>}

        <div className="simple-actions">
          <button className="confirm-btn" onClick={searchLogo} disabled={loading}>
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