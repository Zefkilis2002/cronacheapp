import React, { useState, useRef } from 'react';
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
  const [isFetching, setIsFetching] = useState(false); // rename to distinguish from ImageControl isLoading
  const stageRef = useRef(null);
  const borderRef = useRef(null);

  // Helper to reset position/scale when new image loaded
  const handleSetUserImage = (img) => {
    setUserImage(img);
    // Optional: Reset position/scale on new image? 
    // Usually good UX to reset or keep center. 
    // For now, let's keep it simple.
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

  const fetchStandings = async () => {
    setIsFetching(true);
    try {
      console.log("Fetching standings for Greece Super League...");
      // Using direct absolute URL to bypass potentially broken local proxy
      const res = await fetch('http://localhost:5000/api/standings?country=greece&league=super-league');
      const json = await res.json();
      console.log("Fetch result:", json);
      if (json.success && json.data) {
        console.log("Data received, updating rows...", json.data);
        setOriginalData(json.data);
        updateRows(json.data, isTopHalf);
      } else {
        console.error("Fetch failed or no data:", json);
        alert("Errore nel recupero dati: " + (json.error || "Formato non valido"));
      }
    } catch (e) {
      console.error("Failed to fetch standings:", e);
    } finally {
      setIsFetching(false);
    }
  };


  React.useEffect(() => {
    if (originalData.length > 0) {
      updateRows(originalData, isTopHalf);
    } else {
      setRows(INITIAL_ROWS);
    }
  }, [isTopHalf, originalData]);

  const updateRows = (data, topHalf) => {
    const filtered = data.filter(item => {
      const r = parseInt(item.rank);
      return topHalf ? (r >= 1 && r <= 7) : (r >= 8 && r <= 14);
    });

    const newRows = filtered.map((item, i) => {
      const mappedName = normalizeTeamName(item.team);
      let tIndex = TEAMS_LIST.indexOf(mappedName);
      if (tIndex === -1) {
        console.warn(`Team not found in list: ${item.team} -> ${mappedName}`);
        tIndex = 0;
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

    while (newRows.length < 7) {
      newRows.push({
        id: newRows.length,
        teamIndex: 0,
        p: '-', w: '-', d: '-', l: '-', gd: '-', pts: '-'
      });
    }

    setRows(newRows);
  };

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
      // Hide border for export
      if (borderRef.current) {
        borderRef.current.visible(false);
      }

      // Save current state
      const currentScale = stage.scale();
      const currentSize = { width: stage.width(), height: stage.height() };

      // Set scale for export (reset to 1:1 of original size)
      stage.scale({ x: 1, y: 1 });
      stage.size({ width: 2000, height: 2500 });
      stage.batchDraw();

      const uri = stage.toDataURL({
        pixelRatio: 1.5, // High quality
        mimeType: 'image/jpeg',
        quality: 0.95
      });

      // Restore state
      stage.scale(currentScale);
      stage.size(currentSize);
      if (borderRef.current) {
        borderRef.current.visible(true);
      }
      stage.batchDraw();

      // Download link
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
        {/* Section 1: Background & Image Control */}
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

        {/* Section 2: Data & Scraping */}
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

              {/* Loading Bar */}
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