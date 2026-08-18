import React, { useState, useRef, useEffect, useCallback } from 'react';
import CanvaClassifica from './CanvaClassifica';
import ImageControl from './ImageControl';
import ClassificaToolBar from './ClassificaToolBar';
import { VARIANTS, VARIANT_ORDER, TEAMS, resolveTeam } from './classificaVariants';
import { saveImage } from '../../utils/saveImage';
import { CLASSIFICA_LAYOUT } from '../../config/layoutConstants';
import './ClassificaComp.css';

// Costruisce le righe di default (deep copy) per una variante
const buildDefaultRows = (variantId) =>
  VARIANTS[variantId].defaults.map((d, i) => ({ id: i, ...d }));

// Righe con le squadre della variante ma tutte le statistiche a 0
// (stagione non ancora iniziata). Riempimento istantaneo, zero rete.
const buildZeroedRows = (variantId) =>
  VARIANTS[variantId].defaults.map((d, i) => ({
    ...d, id: i, p: '0', w: '0', d: '0', l: '0', gd: '0', pts: '0'
  }));

const ClassificaComp = () => {
  const [variantId, setVariantId] = useState('1-7');
  const [rows, setRows] = useState(() => buildDefaultRows('1-7'));

  const [userImage, setUserImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState({ scaleX: 1, scaleY: 1 });
  const [filterApplied, setFilterApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('vision');

  const [originalData, setOriginalData] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  const stageRef = useRef(null);
  const variant = VARIANTS[variantId];

  const handleSetUserImage = (img) => setUserImage(img);
  const handleIncreaseImageSize = () =>
    setImageScale(prev => ({ scaleX: prev.scaleX + 0.1, scaleY: prev.scaleY + 0.1 }));
  const handleDecreaseImageSize = () =>
    setImageScale(prev => ({ scaleX: Math.max(0.1, prev.scaleX - 0.1), scaleY: Math.max(0.1, prev.scaleY - 0.1) }));

  // Applica i dati (fetch) alla variante corrente in base all'intervallo posizioni
  const applyDataToVariant = useCallback((data, vId) => {
    const v = VARIANTS[vId];
    const [minR, maxR] = v.rankRange;
    const defaults = buildDefaultRows(vId);

    if (!data || data.length === 0) {
      setRows(defaults);
      return;
    }

    // Ordina per posizione e filtra le squadre nell'intervallo della variante
    const filtered = data
      .filter(item => {
        const rk = parseInt(item.rank, 10);
        return rk >= minR && rk <= maxR;
      })
      .sort((a, b) => parseInt(a.rank, 10) - parseInt(b.rank, 10));

    const newRows = defaults.map((def, i) => {
      const item = filtered[i];
      if (!item) return def; // fallback su default se manca il dato
      const team = resolveTeam(item.team); // {name, logo} corretti e robusti
      return {
        id: i,
        pos: String(item.rank),
        name: team.name,
        logo: team.logo,
        p: String(item.p),
        w: String(item.w),
        d: String(item.d),
        l: String(item.l),
        gd: item.gd,
        pts: String(item.pts)
      };
    });

    setRows(newRows);
  }, []);

  // Cambio variante: se ho già dei dati li riapplico, altrimenti default
  useEffect(() => {
    if (originalData.length > 0) {
      applyDataToVariant(originalData, variantId);
    } else {
      setRows(buildDefaultRows(variantId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId]);

  const fetchStandings = async () => {
    // 1) RIEMPIMENTO ISTANTANEO: squadre della variante con statistiche a 0.
    //    La stagione non è ancora iniziata → nessuna attesa, nessuna rete.
    setRows(buildZeroedRows(variantId));

    // 2) Aggiornamento live in background (se la stagione è già iniziata):
    //    non blocca l'operazione, con timeout breve. Se arrivano numeri reali
    //    sovrascrive; altrimenti restano gli 0.
    setIsFetching(true);
    try {
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      const API_BASE_URL = isLocalhost ? 'http://localhost:5000' : 'https://cronacheapp.onrender.com';

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `${API_BASE_URL}/api/standings?country=greece&league=super-league&fast=1&_t=${Date.now()}`,
        { signal: controller.signal }
      );
      clearTimeout(timer);

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            // Applica i dati live SOLO se la stagione è davvero iniziata
            // (almeno una squadra ha partite giocate o punti). In preseason
            // il feed restituisce tabelle a 0 con squadre non mappate: in quel
            // caso teniamo il riempimento pulito a 0 con le squadre corrette.
            const seasonStarted = json.data.some(t =>
              (parseInt(t.p, 10) > 0) || (parseInt(t.pts, 10) > 0)
            );
            if (seasonStarted) {
              setOriginalData(json.data);
              applyDataToVariant(json.data, variantId);
            }
          }
        }
      }
    } catch (e) {
      // Offseason / timeout / offline: manteniamo il riempimento a 0 senza errori.
      console.warn('[Standings] live sync non disponibile:', e.message);
    } finally {
      setIsFetching(false);
    }
  };

  // Click sul logo/nome: cicla tra le squadre disponibili
  const handleTeamClick = (rowId) => {
    setRows(prev => prev.map((row) => {
      if (row.id !== rowId) return row;
      const idx = TEAMS.findIndex(t => t.name === row.name);
      const next = TEAMS[(idx + 1) % TEAMS.length];
      return { ...row, name: next.name, logo: next.logo };
    }));
  };

  const handleValueClick = (rowId, field) => {
    const target = rows.find(r => r.id === rowId);
    if (!target) return;
    const newValue = prompt(`Inserisci nuovo valore per ${field.toUpperCase()}:`, target[field]);
    if (newValue !== null) {
      setRows(prev => prev.map((row) => row.id === rowId ? { ...row, [field]: newValue } : row));
    }
  };

  const handleDownload = () => {
    const stage = stageRef.current;
    if (!stage) return;
    try {
      const currentScale = stage.scale();
      const currentSize = { width: stage.width(), height: stage.height() };

      stage.scale({ x: 1, y: 1 });
      stage.size({ width: CLASSIFICA_LAYOUT.STAGE.WIDTH, height: CLASSIFICA_LAYOUT.STAGE.HEIGHT });
      stage.batchDraw();

      const uri = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/jpeg', quality: 0.95 });

      stage.scale(currentScale);
      stage.size(currentSize);
      stage.batchDraw();

      saveImage(uri, `classifica_${Date.now()}.jpg`);
    } catch (e) {
      console.error('Download error:', e);
      alert('Errore durante il download');
    }
  };

  return (
    <div className="classifica-comp">
      <CanvaClassifica
        stageRef={stageRef}
        variant={variant}
        rows={rows}
        userImage={userImage}
        imagePosition={imagePosition}
        setImagePosition={setImagePosition}
        imageScale={imageScale}
        setImageScale={setImageScale}
        onTeamClick={handleTeamClick}
        onValueClick={handleValueClick}
        onDownload={handleDownload}
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
                  value={variantId}
                  onChange={(e) => setVariantId(e.target.value)}
                  className="neon-select"
                >
                  {VARIANT_ORDER.map(id => (
                    <option key={id} value={id}>{VARIANTS[id].label}</option>
                  ))}
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
                  value={variantId}
                  onChange={(e) => setVariantId(e.target.value)}
                  className="neon-select"
                  style={{ flexGrow: 1 }}
                >
                  {VARIANT_ORDER.map(id => (
                    <option key={id} value={id}>{VARIANTS[id].label}</option>
                  ))}
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
                  {isFetching ? 'ATTENDI...' : 'SET ⚡'}
                </button>
              </div>

              {isFetching && (
                <div className="loading-container">
                  <div className="loading-bar">
                    <div className="loading-bar-animation"></div>
                  </div>
                  <p className="loading-text">
                    Classifica compilata · sincronizzazione dati live...
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
