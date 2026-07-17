import React, { useRef, useState, useEffect } from 'react';
import './ImagesSelector.css';
import LogoFetcher from '../../FullTimeComp/LogoFetcher/LogoFetcher';

function ImagesSelector({
  handleBackgroundUpload,
  handleLogoUpload,
  backgroundImages,
  logos,
  removeBackgroundImage,
  removeLogo,
  reorderItems,
  setBackgroundImages,
  setLogos,
  setSelectedBackground,
  setSelectedLogo,
  selectedBackground,
  selectedLogo,
  onApplyAcrSport,
  onApplyUpscale,
  onRemoveAcrSport,
  busyFilter,
  copiedTransform,
  copyItemTransform,
  pasteItemTransform,
  applyTransformToAll,
  isTransferStyle = false,
  externalLogoSearchConfig = null,
  setExternalLogoSearchConfig = null
}) {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [showLogoSearch, setShowLogoSearch] = useState(false);
  const [logoSearchOptions, setLogoSearchOptions] = useState(null);
  const [showBackgroundSearch, setShowBackgroundSearch] = useState(false);

  useEffect(() => {
    if (externalLogoSearchConfig) {
      setLogoSearchOptions(externalLogoSearchConfig);
      setShowLogoSearch(true);
      if (setExternalLogoSearchConfig) setExternalLogoSearchConfig(null);
    }
  }, [externalLogoSearchConfig, setExternalLogoSearchConfig]);

  const handleDragStart = (e, type, index) => {
    dragItem.current = { type, index };
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, type, index) => {
    e.preventDefault();
    dragOverItem.current = { type, index };
  };

  const handleDrop = (e) => {
    e.preventDefault();

    if (dragItem.current && dragOverItem.current &&
      dragItem.current.type === dragOverItem.current.type &&
      dragItem.current.index !== dragOverItem.current.index) {

      const { type, index: dragIndex } = dragItem.current;
      const { index: hoverIndex } = dragOverItem.current;

      if (type === 'background') {
        reorderItems(dragIndex, hoverIndex, backgroundImages, setBackgroundImages);
      } else if (type === 'logo') {
        reorderItems(dragIndex, hoverIndex, logos, setLogos);
      }
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleBackgroundSelect = (image) => {
    setSelectedBackground(image.id);
    setSelectedLogo(null);
  };

  const handleBackgroundFromSearch = (url) => {
    const newBg = {
      id: `bg-${Date.now()}`,
      src: url,
      originalSrc: url,
      position: { x: 0, y: 0 },
      scale: { scaleX: 1, scaleY: 1 },
      blurRadius: 0
    };
    setBackgroundImages([...backgroundImages, newBg]);
    setSelectedBackground(newBg.id);
    setSelectedLogo(null);
  };

  const handleLogoSelect = (logo) => {
    setSelectedLogo(logo.id);
    setSelectedBackground(null);
  };

  const handleLogoFromSearch = (url) => {
    const customOptions = logoSearchOptions || {};
    const isTransfer = isTransferStyle || (selectedBackground && backgroundImages.find(b => b.id === selectedBackground)?.src?.includes('Trasferimento'));
    
    let customId = customOptions.id;
    let customPosition = customOptions.position;
    let customScale = customOptions.scale;

    if (!customId && isTransfer) {
      if (!logos.some(l => l.id === 'transfer-logo-1')) {
        customId = 'transfer-logo-1';
        customPosition = { x: 500, y: 1380 };
        customScale = { scaleX: 0.75, scaleY: 0.75 };
      } else if (!logos.some(l => l.id === 'transfer-logo-2')) {
        customId = 'transfer-logo-2';
        customPosition = { x: 950, y: 1380 };
        customScale = { scaleX: 0.75, scaleY: 0.75 };
      }
    }

    const newLogo = {
      id: customId || `logo-${Date.now()}`,
      src: url,
      position: customPosition || { x: 65, y: 1260 },
      scale: customScale || { scaleX: 0.4, scaleY: 0.4 },
      targetMaxDimension: customOptions.targetMaxDimension || (customId === 'transfer-logo-1' || customId === 'transfer-logo-2' ? 280 : null),
      blurRadius: 0
    };

    if (customId) {
      setLogos(prev => {
        const existingIdx = prev.findIndex(l => l.id === customId);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            src: url,
            position: customPosition || updated[existingIdx].position,
            scale: customScale || { scaleX: 0.75, scaleY: 0.75 },
            targetMaxDimension: customOptions.targetMaxDimension || (customId === 'transfer-logo-1' || customId === 'transfer-logo-2' ? 280 : updated[existingIdx].targetMaxDimension)
          };
          return updated;
        }
        return [newLogo, ...prev];
      });
    } else {
      setLogos([...logos, newLogo]);
    }
    setSelectedLogo(newLogo.id);
    setSelectedBackground(null);
    setLogoSearchOptions(null);
    setShowLogoSearch(false);
  };

  return (
    <div className="images-selector">
      {/* Sezione immagini di sfondo */}
      <div className="image-upload-section">
        <h3>Immagini di sfondo:</h3>
        <div className="logo-actions-row" style={{ marginBottom: '10px' }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleBackgroundUpload}
            className="file-input"
            id="background-upload"
            style={{ display: 'none' }}
          />
          <label htmlFor="background-upload" className="logo-selector">
            Scegli immagine
          </label>

          <button
            className="logo-selector"
            onClick={() => setShowBackgroundSearch(true)}
          >
            Cerca web
          </button>
        </div>

        <div className="logo-actions-row" style={{ marginBottom: '15px' }}>
          <button
            className="logo-selector"
            disabled={!selectedBackground || busyFilter}
            onClick={onApplyAcrSport}
            title="Applica il filtro Camera Raw Sport allo sfondo selezionato"
          >
            {busyFilter ? '...' : 'Filtro RAW'}
          </button>

          <button
            className="logo-selector"
            disabled={!selectedBackground || busyFilter}
            onClick={onRemoveAcrSport}
            title="Rimuovi il filtro dallo sfondo selezionato"
          >
            Rimuovi filtro
          </button>

          <button
            className="logo-selector"
            disabled={!selectedBackground || busyFilter}
            onClick={onApplyUpscale}
            title="Raddoppia risoluzione e nitidezza"
            style={{ borderColor: '#00ccff', color: '#00ccff' }}
          >
            {busyFilter ? '...' : 'Migliora HD'}
          </button>
        </div>

        {(selectedBackground || backgroundImages.length > 0) && (() => {
          const activeBgId = selectedBackground || backgroundImages[0]?.id;
          return (
            <div className="logo-actions-row" style={{ marginBottom: '15px' }}>
              <button
                className="logo-selector"
                onClick={() => copyItemTransform && copyItemTransform(activeBgId, 'background')}
                title="Copia posizione, dimensione, rotazione e sfocatura di questa immagine"
              >
                Copia Trasf.
              </button>

              <button
                className="logo-selector"
                disabled={!copiedTransform}
                onClick={() => pasteItemTransform && pasteItemTransform(activeBgId, 'background')}
                title="Incolla le trasformazioni copiate su questa immagine"
              >
                Incolla Trasf.
              </button>

              <button
                className="logo-selector"
                onClick={() => applyTransformToAll && applyTransformToAll(activeBgId, 'background')}
                title="Applica posizione, dimensione, rotazione e sfocatura di questa immagine a tutte le altre immagini di sfondo"
                style={{ borderColor: '#b4ff00', color: '#b4ff00' }}
              >
                Applica a Tutte
              </button>
            </div>
          );
        })()}

        {(selectedBackground || backgroundImages.length > 0) && (() => {
          const activeBgId = selectedBackground || backgroundImages[0]?.id;
          const currentBlur = backgroundImages.find(img => img.id === activeBgId)?.blurRadius || 0;
          return (
            <div className="blur-panel">
              <label className="blur-label">
                Sfocatura Sfondo (Blur): {currentBlur}px
              </label>
              <div className="blur-row-controls">
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={currentBlur}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setBackgroundImages(prev => prev.map(img => 
                      img.id !== activeBgId ? img : { ...img, blurRadius: val }
                    ));
                  }}
                  className="blur-slider"
                />
                <button
                  type="button"
                  className="blur-reset-btn"
                  onClick={() => {
                    setBackgroundImages(prev => prev.map(img => 
                      img.id !== activeBgId ? img : { ...img, blurRadius: 0 }
                    ));
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          );
        })()}

        <div className="thumbnails-row">
          <div className="thumbnails-container" style={{ margin: 0, width: '100%' }}>
            {backgroundImages.map((image, index) => (
              <div
                key={image.id}
                className={`thumbnail ${selectedBackground === image.id ? 'selected-thumbnail' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, 'background', index)}
                onDragOver={(e) => handleDragOver(e, 'background', index)}
                onDrop={handleDrop}
                onClick={() => handleBackgroundSelect(image)}
              >
                <img src={image.src} alt={`Background ${index + 1}`} />
                <button
                  className="remove-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBackgroundImage(image.id);
                    if (selectedBackground === image.id) {
                      setSelectedBackground(null);
                    }
                  }}
                  title="Rimuovi immagine"
                >
                  ×
                </button>
                <span className="level-indicator">{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sezione loghi */}
      <div className="image-upload-section">
        {(isTransferStyle || (selectedBackground && backgroundImages.find(b => b.id === selectedBackground)?.src?.includes('Trasferimento'))) && (
          <div style={{ marginBottom: '1.5rem', background: 'rgba(180, 255, 0, 0.05)', border: '1px solid rgba(180, 255, 0, 0.3)', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{ color: '#b4ff00', marginTop: 0, marginBottom: '0.8rem' }}>⚽ Loghi Trasferimento (◄ ►)</h3>
            
            {/* Logo 1 */}
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.7rem', borderRadius: '6px', marginBottom: '0.7rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: '600', color: '#fff', fontSize: '0.88rem' }}>◄ Squadra di Partenza (Sinistra)</span>
                {logos?.some(l => l.id === 'transfer-logo-1') && (
                  <button
                    type="button"
                    className="clean-button"
                    onClick={() => removeLogo && removeLogo('transfer-logo-1')}
                    style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderColor: '#e3001b', color: '#e3001b' }}
                  >
                    × Rimuovi
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload && handleLogoUpload(e, { id: 'transfer-logo-1', position: { x: 500, y: 1380 }, targetMaxDimension: 280, scale: { scaleX: 0.75, scaleY: 0.75 } })}
                  className="file-input"
                  id="transfer-logo-1-upload-is"
                  style={{ display: 'none' }}
                />
                <label htmlFor="transfer-logo-1-upload-is" className="logo-selector" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem', cursor: 'pointer', margin: 0 }}>
                  📁 Carica
                </label>
                <button
                  type="button"
                  className="logo-selector"
                  onClick={() => {
                    setLogoSearchOptions({ id: 'transfer-logo-1', position: { x: 500, y: 1380 }, targetMaxDimension: 280, scale: { scaleX: 0.75, scaleY: 0.75 } });
                    setShowLogoSearch(true);
                  }}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
                >
                  🌐 Cerca web
                </button>
                {logos?.find(l => l.id === 'transfer-logo-1') && (
                  <span style={{ fontSize: '0.8rem', color: '#b4ff00', marginLeft: 'auto' }}>✓ Inserito</span>
                )}
              </div>
            </div>

            {/* Logo 2 */}
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.7rem', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: '600', color: '#fff', fontSize: '0.88rem' }}>► Squadra di Arrivo (Destra)</span>
                {logos?.some(l => l.id === 'transfer-logo-2') && (
                  <button
                    type="button"
                    className="clean-button"
                    onClick={() => removeLogo && removeLogo('transfer-logo-2')}
                    style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderColor: '#e3001b', color: '#e3001b' }}
                  >
                    × Rimuovi
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload && handleLogoUpload(e, { id: 'transfer-logo-2', position: { x: 950, y: 1380 }, targetMaxDimension: 280, scale: { scaleX: 0.75, scaleY: 0.75 } })}
                  className="file-input"
                  id="transfer-logo-2-upload-is"
                  style={{ display: 'none' }}
                />
                <label htmlFor="transfer-logo-2-upload-is" className="logo-selector" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem', cursor: 'pointer', margin: 0 }}>
                  📁 Carica
                </label>
                <button
                  type="button"
                  className="logo-selector"
                  onClick={() => {
                    setLogoSearchOptions({ id: 'transfer-logo-2', position: { x: 950, y: 1380 }, targetMaxDimension: 280, scale: { scaleX: 0.75, scaleY: 0.75 } });
                    setShowLogoSearch(true);
                  }}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
                >
                  🌐 Cerca web
                </button>
                {logos?.find(l => l.id === 'transfer-logo-2') && (
                  <span style={{ fontSize: '0.8rem', color: '#b4ff00', marginLeft: 'auto' }}>✓ Inserito</span>
                )}
              </div>
            </div>
          </div>
        )}

        <h3>Loghi (max 8):</h3>

        {/* Buttons Row */}
        <div className="logo-actions-row">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const isTransfer = isTransferStyle || (selectedBackground && backgroundImages.find(b => b.id === selectedBackground)?.src?.includes('Trasferimento'));
              let options = null;
              if (isTransfer) {
                if (!logos.some(l => l.id === 'transfer-logo-1')) {
                  options = { id: 'transfer-logo-1', position: { x: 500, y: 1380 }, targetMaxDimension: 280, scale: { scaleX: 0.75, scaleY: 0.75 } };
                } else if (!logos.some(l => l.id === 'transfer-logo-2')) {
                  options = { id: 'transfer-logo-2', position: { x: 950, y: 1380 }, targetMaxDimension: 280, scale: { scaleX: 0.75, scaleY: 0.75 } };
                }
              }
              handleLogoUpload(e, options);
            }}
            className="file-input"
            disabled={logos.length >= 8}
            id="logo-upload"
            style={{ display: 'none' }}
          />
          <label htmlFor="logo-upload" className="logo-selector">
            Scegli il logo
          </label>

          <button
            className="logo-selector"
            onClick={() => {
              setLogoSearchOptions(null);
              setShowLogoSearch(true);
            }}
            disabled={logos.length >= 8}
          >
            Cerca web
          </button>
        </div>





        {/* Thumbnails Row */}
        <div className="thumbnails-row">
          <div className="thumbnails-container" style={{ margin: 0, width: '100%' }}>
            {logos.map((logo, index) => (
              <div
                key={logo.id}
                className={`thumbnail ${selectedLogo === logo.id ? 'selected-thumbnail' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, 'logo', index)}
                onDragOver={(e) => handleDragOver(e, 'logo', index)}
                onDrop={handleDrop}
                onClick={() => handleLogoSelect(logo)}
              >
                <img src={logo.src} alt={`Logo ${index + 1}`} />
                <button
                  className="remove-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLogo(logo.id);
                    if (selectedLogo === logo.id) {
                      setSelectedLogo(null);
                    }
                  }}
                  title="Rimuovi logo"
                >
                  ×
                </button>
                <span className="level-indicator">{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showLogoSearch && (
        <LogoFetcher
          onLogoSelect={handleLogoFromSearch}
          onClose={() => {
            setShowLogoSearch(false);
            setLogoSearchOptions(null);
          }}
        />
      )}

      {showBackgroundSearch && (
        <LogoFetcher
          onLogoSelect={handleBackgroundFromSearch}
          onClose={() => setShowBackgroundSearch(false)}
        />
      )}
    </div>
  );
}

export default ImagesSelector;