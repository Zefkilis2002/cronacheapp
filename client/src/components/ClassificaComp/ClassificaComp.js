import React, { useState, useRef, useCallback, useEffect } from 'react';
import CanvaClassifica from './CanvaClassifica';
import ImageControl from './ImageControl';
import ClassificaToolBar from './ClassificaToolBar';
import { INITIAL_ROWS, TEAMS_LIST, normalizeTeamName } from './DatiClassifica';
import './ClassificaComp.css';

const ClassificaComp = () => {
  const [selectedBackground, setSelectedBackground] = useState('AltaClassifica.png');
  const [userImage, setUserImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState({ scaleX: 1, scaleY: 1 });
  const [filterApplied, setFilterApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('vision');

  // Data State
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [originalData, setOriginalData] = useState([]);
  const [isTopHalf, setIsTopHalf] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const stageRef = useRef(null);
  const borderRef = useRef(null);

  const handleSetUserImage = (img) => {
    setUserImage(img);
  };

  const handleIncreaseImageSize = () => {
    setImageScale(prev => ({ scaleX: prev.scaleX + 0.1, scaleY: prev.scaleY + 0.1 }));
  };

  const handleDecreaseImageSize = () => {
    setImageScale(prev => ({
      scaleX: Math.max(0.1, prev.scaleX - 0.1),
      scaleY: Math.max(0.1, prev.scaleY - 0.1)
    }));
  };

  // --- FUNZIONE DI AGGIORNAMENTO RIGHE (Spostata qui e wrappata in useCallback) ---
  const updateRows = useCallback((data, topHalf) => {
    if (!data || data.length === 0) return;

    // Filtra in base a Alta/Bassa classifica
    const filtered = data.filter(item => {
      const r = parseInt(item.rank);
      // Alta: 1-7, Bassa: 8-14 (o il resto)
      return topHalf ? (r >= 1 && r <= 7) : (r >= 8);
    });

    // Mappa i dati nel formato righe
    const newRows = filtered.slice(0, 7).map((item, i) => { // Prendi max 7 elementi
      const mappedName = normalizeTeamName(item.team);
      let tIndex = TEAMS_LIST.indexOf(mappedName);

      if (tIndex === -1) {
        console.warn(`Team not found in list: ${item.team} -> ${mappedName}`);
        tIndex = 0; // Fallback
      }

      return {
        id: i,
        teamIndex: tIndex,
        p: item.p,
        w: item.w,
        d: item.d,
        l: item.l,
        gd: item.gd,
        pts: item.pts
      };
    });

    // Riempi con righe vuote se sono meno di 7
    while (newRows.length < 7) {
      newRows.push({
        id: newRows.length,
        teamIndex: 0,
        p: '-', w: '-', d: '-', l: '-', gd: '-', pts: '-'
      });
    }

    setRows(newRows);
  }, []); // Dipendenze vuote perché usa solo costanti esterne o parametri

  // --- FETCHING DATI ---
  const fetchStandings = async () => {
    setIsFetching(true);
    try {
      console.log("Fetching standings for Greece Super League...");

      const hostname = window.location.hostname;

      // LOGICA IBRIDA URL:
      // 1. Se sei su localhost o 127.0.0.1 -> Usa http://localhost:5000
      // 2. Se sei su qualsiasi altro dominio (es. Firebase, Render, IP locale dal telefono) -> Usa Render
      const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

      const API_BASE_URL = isLocalhost
        ? "http://localhost:5000"
        : "https://cronacheapp.onrender.com";

      console.log(`[NETWORK] Environment: ${hostname}. Using API: ${API_BASE_URL}`);

      // Aggiungi timestamp per evitare cache aggressiva su mobile
      const res = await fetch(`${API_BASE_URL}/api/standings?country=greece&league=super-league&_t=${Date.now()}`);

      if (!res.ok) {
        throw new Error(`Errore HTTP! Status: ${res.status}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Risposta non valida (HTML):", text.substring(0, 200));
        throw new Error("Il server ha risposto con HTML invece di JSON. Controlla l'URL.");
      }

      const json = await res.json();
      console.log("Fetch result:", json);

      if (json.success && json.data) {
        setOriginalData(json.data);
        updateRows(json.data, isTopHalf); // Ora updateRows è definita e sicura
      } else {
        alert("Errore nel recupero dati: " + (json.error || "Formato non valido"));
      }
    } catch (e) {
      console.error("Failed to fetch standings:", e);
      alert(`Errore di connessione: ${e.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  // --- EFFETTO PER AGGIORNAMENTO AUTOMATICO AL CAMBIO TAB (Alta/Bassa) ---
  useEffect(() => {
    if (originalData.length > 0) {
      updateRows(originalData, isTopHalf);
    } else {
      // Se non abbiamo dati, resettiamo alle righe iniziali vuote
      setRows(INITIAL_ROWS);
    }
  }, [isTopHalf, originalData, updateRows]);

  const handleTeamClick = (rowIndex) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row;
      const nextIndex = (row.teamIndex + 1) % TEAMS_LIST.length;
      return { ...row, teamIndex: nextIndex };
    }));
  };

  const handleValueClick = (rowIndex, field) => {
    const currentValue = rows[rowIndex][field];
    const newValue = prompt(`Inserisci nuovo valore per ${field.toUpperCase()}:`, currentValue);
    if (newValue !== null) {
      setRows(prev => prev.map((row, i) => {
        if (i !== rowIndex) return row;
        return { ...row, [field]: newValue };
      }));
    }
  };

  const handleDownload = () => {
    const stage = stageRef.current;
    if (!stage) return;

    try {
      if (borderRef.current) {
        borderRef.current.visible(false);
      }

      const currentScale = stage.scale();
      const currentSize = { width: stage.width(), height: stage.height() };

      stage.scale({ x: 1, y: 1 });
      stage.size({ width: 2000, height: 2500 }); // Risoluzione export
      stage.batchDraw();

      const uri = stage.toDataURL({
        pixelRatio: 1.5,
        mimeType: 'image/jpeg',
        quality: 0.95
      });

      stage.scale(currentScale);
      stage.size(currentSize);
      if (borderRef.current) {
        borderRef.current.visible(true);
      }
      stage.batchDraw();

      const link = document.createElement('a');
      link.download = `classifica_${Date.now()}.jpg`;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (e) {
      console.error('Download error:', e);
      alert('Errore durante il download');
    }
  };

  return (
    <div className="classifica-comp">
      <CanvaClassifica
        stageRef={stageRef}
        borderRef={borderRef}
        selectedBackground={selectedBackground}
        userImage={userImage}
        imagePosition={imagePosition}
        setImagePosition={setImagePosition}
        imageScale={imageScale}
        setImageScale={setImageScale}
        rows={rows}
        onTeamClick={handleTeamClick}
        onValueClick={handleValueClick}
      />

      <div className="classifica-tab-header">
        <button
          className={`classifica-tab-button ${activeTab === 'vision' ? 'active' : ''}`}
          onClick={() => setActiveTab('vision')}
        >
          VISION
        </button>
        <button
          className={`classifica-tab-button ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          GESTIONE DATI
        </button>
      </div>

      <div className="classifica-panel">
        {activeTab === 'vision' && (
          <div style={{ width: '100%' }}>
            <div className="control-group">
              <h3>PERSONALIZZAZIONE VISIVA</h3>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <select
                  value={selectedBackground}
                  onChange={(e) => setSelectedBackground(e.target.value)}
                  className="neon-select"
                >
                  <option value="AltaClassifica.png">Alta Classifica (1-7)</option>
                  <option value="BassaClassica.png">Bassa Classifica (8-14)</option>
                </select>
              </div>

              <ImageControl
                userImage={userImage}
                setUserImage={handleSetUserImage}
                filterApplied={filterApplied}
                setFilterApplied={setFilterApplied}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                handleDownload={handleDownload}
              />
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div style={{ width: '100%' }}>
            <div className="control-group">
              <h3>GESTIONE DATI</h3>
              <div className="control-row">
                <select
                  value={isTopHalf ? 'top' : 'bottom'}
                  onChange={(e) => setIsTopHalf(e.target.value === 'top')}
                  className="neon-select"
                  style={{ flexGrow: 1 }}
                >
                  <option value="top">Alta Classifica (1-7)</option>
                  <option value="bottom">Bassa Classifica (8-14)</option>
                </select>

                <button
                  onClick={fetchStandings}
                  disabled={isFetching}
                  className="neon-button"
                  title="Aggiorna Dati da Flashscore"
                  style={{
                    backgroundColor: '#b4ff00',
                    color: '#00061b',
                    boxShadow: '0 0 15px rgba(180, 255, 0, 0.4)',
                    minWidth: '120px'
                  }}
                >
                  {isFetching ? "ATTENDI..." : "SET ⚡"}
                </button>
              </div>

              {isFetching && (
                <div className="loading-container">
                  <div className="loading-bar">
                    <div className="loading-bar-animation"></div>
                  </div>
                  <p className="loading-text">
                    Recupero dati in corso... (richiede ~10-15 secondi)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ClassificaToolBar
        userImage={userImage}
        increaseImageSize={handleIncreaseImageSize}
        decreaseImageSize={handleDecreaseImageSize}
      />
    </div>
  );
};

export default ClassificaComp;