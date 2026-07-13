import React, { useRef, useState } from 'react';
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
  applyTransformToAll
}) {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [showLogoSearch, setShowLogoSearch] = useState(false);
  const [showBackgroundSearch, setShowBackgroundSearch] = useState(false);

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
    const newLogo = {
      id: `logo-${Date.now()}`,
      src: url,
      position: { x: 65, y: 1260 },
      scale: { scaleX: 0.4, scaleY: 0.4 }, // Ulteriormente ridotta la dimensione (0.4) per immagini web ad alta risoluzione
      blurRadius: 0
    };
    setLogos([...logos, newLogo]);
    setSelectedLogo(newLogo.id);
    setSelectedBackground(null);
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
        <h3>Loghi (max 8):</h3>

        {/* Buttons Row */}
        <div className="logo-actions-row">
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
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
            onClick={() => setShowLogoSearch(true)}
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
          onClose={() => setShowLogoSearch(false)}
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