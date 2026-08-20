import React, { useState, useRef, useEffect, useCallback } from 'react';
import CanvaClassifica from './CanvaClassifica';
import ImageControl from './ImageControl';
import ClassificaToolBar from './ClassificaToolBar';
import { VARIANTS, VARIANT_ORDER, TEAMS, resolveTeam } from './classificaVariants';
import { fetchStandingsBundle, getCachedStandings, prefetchStandingsBundle } from './standingsApi';
import { resolveWebLogos } from './logoSearch';
import { saveImage } from '../../utils/saveImage';
import { CLASSIFICA_LAYOUT } from '../../config/layoutConstants';
import './ClassificaComp.css';

// Costruisce le righe di default (deep copy) per una variante
const buildDefaultRows = (variantId) =>
  VARIANTS[variantId].defaults.map((d, i) => ({ id: i, ...d }));

// Righe con le squadre della variante ma tutte le statistiche a 0
// (fase non ancora attiva). Riempimento istantaneo, zero rete.
const buildZeroedRows = (variantId) =>
  VARIANTS[variantId].defaults.map((d, i) => ({
    ...d, id: i, p: '0', w: '0', d: '0', l: '0', gd: '0', pts: '0'
  }));

// Estrae dal bundle le righe che alimentano una variante.
// Scudetto / Europa / retrocessione sono stage a sé: si prendono tutte le
// righe dello stage (sliceByRank false). 1-7 / 8-14 e coppa spezzano invece
// un'unica tabella per posizione.
const selectRowsForVariant = (tables, variantId) => {
  const v = VARIANTS[variantId];
  const source = (tables && tables[v.dataKey]) || [];
  if (source.length === 0) return [];

  const [minR, maxR] = v.rankRange;
  const picked = v.sliceByRank
    ? source.filter(item => {
      const rk = parseInt(item.rank, 10);
      return rk >= minR && rk <= maxR;
    })
    : source.slice();

  return picked.sort((a, b) => parseInt(a.rank, 10) - parseInt(b.rank, 10));
};

const ClassificaComp = () => {
  const [variantId, setVariantId] = useState('1-7');
  const [rows, setRows] = useState(() => buildDefaultRows('1-7'));

  const [userImage, setUserImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState({ scaleX: 1, scaleY: 1 });
  const [filterApplied, setFilterApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('vision');

  // Tutte le tabelle del bundle: { regular, scudetto, europa, retrocessione, coppa }.
  // Tenerle tutte in memoria significa 0 fetch al cambio di variante.
  const [standings, setStandings] = useState(() => {
    const cached = getCachedStandings();
    return cached ? cached.data : null;
  });
  const [isFetching, setIsFetching] = useState(false);

  const stageRef = useRef(null);
  const variant = VARIANTS[variantId];

  const handleSetUserImage = (img) => setUserImage(img);
  const handleIncreaseImageSize = () =>
    setImageScale(prev => ({ scaleX: prev.scaleX + 0.1, scaleY: prev.scaleY + 0.1 }));
  const handleDecreaseImageSize = () =>
    setImageScale(prev => ({ scaleX: Math.max(0.1, prev.scaleX - 0.1), scaleY: Math.max(0.1, prev.scaleY - 0.1) }));

  // Applica al canvas la tabella della variante corrente. Puramente locale.
  const applyDataToVariant = useCallback((tables, vId) => {
    const selected = selectRowsForVariant(tables, vId);

    // Fase non ancora attiva (playoff non iniziati, coppa non partita):
    // squadre del template con statistiche a 0, nessun dato inventato.
    if (selected.length === 0) {
      setRows(buildZeroedRows(vId));
      return;
    }

    // Il numero di righe segue lo stage reale, non il mockup: un gruppo può
    // avere meno squadre (Europa a 4) o più (retrocessione a 6) del template.
    // Il layout del canvas è calcolato su rows.length, quindi si adatta.
    setRows(selected.map((item, i) => {
      const team = resolveTeam(item.team); // {name, logo} corretti e robusti
      return {
        id: i,
        pos: String(item.rank),
        srcName: item.team, // nome Flashscore: serve alla ricerca web del logo
        name: team.name,
        logo: team.logo,
        p: String(item.p),
        w: String(item.w),
        d: String(item.d),
        l: String(item.l),
        gd: item.gd,
        pts: String(item.pts)
      };
    }));
  }, []);

  // Cambio variante: se ho già le tabelle le riapplico (nessuna rete),
  // altrimenti torno ai default del mockup.
  useEffect(() => {
    if (standings) {
      applyDataToVariant(standings, variantId);
    } else {
      setRows(buildDefaultRows(variantId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId, standings]);

  // Loghi mancanti (nazionali, squadre fuori dalle leghe greche): li cerca
  // sul web con lo stesso endpoint di "Cerca Web" di News/FullTime e li
  // innesta nelle righe. La cache di logoSearch è di modulo, quindi ogni
  // nome costa una sola richiesta per sessione.
  useEffect(() => {
    const mancanti = rows.filter(r => !r.logo && r.srcName).map(r => r.srcName);
    if (mancanti.length === 0) return undefined;

    let annullato = false;
    resolveWebLogos(mancanti).then(trovati => {
      if (annullato || Object.keys(trovati).length === 0) return;
      setRows(prev => prev.map(r =>
        (r.logo || !r.srcName || !trovati[r.srcName]) ? r : { ...r, logo: trovati[r.srcName] }
      ));
    });
    return () => { annullato = true; };
  }, [rows]);

  // Prefetch: al mount e all'apertura di GESTIONE DATI. Quando l'utente
  // preme SET ⚡ il bundle è quasi sempre già in memoria.
  useEffect(() => {
    prefetchStandingsBundle();
  }, []);

  useEffect(() => {
    if (activeTab === 'data') prefetchStandingsBundle();
  }, [activeTab]);

  const fetchStandings = async () => {
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const cached = getCachedStandings();

    // Percorso caldo: tabelle già in memoria → ripopolamento immediato, zero rete.
    if (cached) {
      setStandings(cached.data);
      applyDataToVariant(cached.data, variantId);
      const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      console.log(`[Standings] SET ${variantId} (cache calda) in ${Math.round(t1 - t0)}ms`);
      return;
    }

    // Percorso freddo: riempimento ottimistico a 0 (istantaneo) e un solo
    // round-trip verso il server, che restituisce tutte le tabelle insieme.
    setRows(buildZeroedRows(variantId));
    setIsFetching(true);
    try {
      const bundle = await fetchStandingsBundle();
      if (bundle) {
        setStandings(bundle.data);
        applyDataToVariant(bundle.data, variantId);
      }
      const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      console.log(`[Standings] SET ${variantId} (rete) in ${Math.round(t1 - t0)}ms`);
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
