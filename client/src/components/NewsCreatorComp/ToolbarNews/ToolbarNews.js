import React from 'react';
import './ToolbarNews.css';

function ToolbarNews(props = {}) {
  // Estrai le props con valori di default sicuri
  const {
    moveElement = () => {},
    resizeElement = () => {},
    enlargeTextSize = () => {},
    shrinkTextSize = () => {},
    setTitlePosition = () => {},
    setTextPosition = () => {},
    setTitleFontSize = () => {},
    setTextFontSize = () => {},
    setBackgroundImages = () => {},
    setLogos = () => {},
    selectedBackground = null,
    backgroundImages = null,
    logos = null,
    selectedLogo = null,
    moveStep = 2,  
    fontStep = 2,
    rotateStep = 2,
  } = props || {};

  // Protezione estrema per gli array
  const safeBackgroundImages = backgroundImages && Array.isArray(backgroundImages) ? [...backgroundImages] : [];
  const safeLogos = logos && Array.isArray(logos) ? [...logos] : [];

  // Funzioni per gestire titolo e testo
  const moveTitle = (direction) => {
    if (typeof setTitlePosition !== 'function') return;
    
    try {
      setTitlePosition(prev => {
        const safePrev = prev || { x: 0, y: 1200 };
        const delta = moveStep;
        
        if (direction === 'up') return { ...safePrev, y: safePrev.y - delta };
        if (direction === 'down') return { ...safePrev, y: safePrev.y + delta };
        if (direction === 'left') return { ...safePrev, x: safePrev.x - delta };
        if (direction === 'right') return { ...safePrev, x: safePrev.x + delta };
        return safePrev;
      });
    } catch (error) {
      console.error("Error moving title:", error);
    }
  };

  const moveText = (direction) => {
    if (typeof setTextPosition !== 'function') return;
    
    try {
      setTextPosition(prev => {
        const safePrev = prev || { x: 0, y: 1385 };
        const delta = moveStep;
        
        if (direction === 'up') return { ...safePrev, y: safePrev.y - delta };
        if (direction === 'down') return { ...safePrev, y: safePrev.y + delta };
        if (direction === 'left') return { ...safePrev, x: safePrev.x - delta };
        if (direction === 'right') return { ...safePrev, x: safePrev.x + delta };
        return safePrev;
      });
    } catch (error) {
      console.error("Error moving text:", error);
    }
  };

  const moveSelectedElement = (direction) => {
    if (typeof moveElement !== 'function') return;
    
    try {
      // Verifica che ci sia un elemento selezionato e che gli array esistano
      if (selectedBackground && safeBackgroundImages && safeBackgroundImages.length > 0) {
        // Trova l'elemento selezionato con controlli di sicurezza
        const bgImage = safeBackgroundImages.find(img => img && img.id === selectedBackground);
        if (bgImage) {
          moveElement(bgImage, setBackgroundImages, safeBackgroundImages, direction);
        }
      } else if (selectedLogo && safeLogos && safeLogos.length > 0) {
        // Trova il logo selezionato con controlli di sicurezza
        const logo = safeLogos.find(lg => lg && lg.id === selectedLogo);
        if (logo) {
          moveElement(logo, setLogos, safeLogos, direction);
        }
      }
    } catch (error) {
      console.error("Error moving element:", error);
    }
  };

  const resizeSelectedElement = (type) => {
    if (typeof resizeElement !== 'function') return;
    
    try {
      // Verifica che ci sia un elemento selezionato e che gli array esistano
      if (selectedBackground && safeBackgroundImages && safeBackgroundImages.length > 0) {
        // Trova l'elemento selezionato con controlli di sicurezza
        const bgImage = safeBackgroundImages.find(img => img && img.id === selectedBackground);
        if (bgImage) {
          resizeElement(bgImage, setBackgroundImages, safeBackgroundImages, type);
        }
      } else if (selectedLogo && safeLogos && safeLogos.length > 0) {
        // Trova il logo selezionato con controlli di sicurezza
        const logo = safeLogos.find(lg => lg && lg.id === selectedLogo);
        if (logo) {
          resizeElement(logo, setLogos, safeLogos, type);
        }
      }
    } catch (error) {
      console.error("Error resizing element:", error);
    }
  };

  // Funzioni sicure per i pulsanti
  const safeEnlargeTextSize = (setter) => {
    if (typeof enlargeTextSize === 'function' && typeof setter === 'function') {
      try {
        enlargeTextSize(setter);
      } catch (error) {
        console.error("Error enlarging text:", error);
      }
    }
  };

  const safeShrinkTextSize = (setter) => {
    if (typeof shrinkTextSize === 'function' && typeof setter === 'function') {
      try {
        shrinkTextSize(setter);
      } catch (error) {
        console.error("Error shrinking text:", error);
      }
    }
  };

  const normalizeAngle = (a) => ((a % 360) + 360) % 360;

  const setItemRotation = (id, angle, type) => {
    const setter = type === 'logo' ? setLogos : setBackgroundImages;
    setter(items => items.map(item => item.id !== id ? item : ({
      ...item,
      rotation: normalizeAngle(angle)
    })));
  };

  const nudgeItemRotation = (id, delta, type) => {
    const setter = type === 'logo' ? setLogos : setBackgroundImages;
    setter(items => items.map(item => {
      if (item.id !== id) return item;
      const prev = (typeof item.rotation === 'number') ? item.rotation : 0;
      return { ...item, rotation: normalizeAngle(prev + delta) };
    }));
  };


  // Renderizza il componente solo se è sicuro farlo
  return (
    <div className="toolnews">
      <div className="toolnews-inner">
        <div className="toolnews-section">
          <div className="toolnews-row">
            <button onClick={() => moveTitle('up')}>Tit↑</button>
            <button onClick={() => moveTitle('down')}>Tit↓</button>
            <button onClick={() => safeEnlargeTextSize(setTitleFontSize, fontStep)}>Tit+</button>
            <button onClick={() => safeShrinkTextSize(setTitleFontSize, fontStep)}>Tit-</button>
          </div>
        </div>
        
        <div className="toolnews-section">
          <div className="toolnews-row">
            <button onClick={() => moveText('up')}>Testo↑</button>
            <button onClick={() => moveText('down')}>Testo↓</button>
            <button onClick={() => safeEnlargeTextSize(setTextFontSize, fontStep)}>Testo+</button>
            <button onClick={() => safeShrinkTextSize(setTextFontSize, fontStep)}>Testo-</button>
          </div>
        </div>
        
        <div className="toolnews-section">
          <div className="toolnews-row">
            <button onClick={() => moveSelectedElement('up')}>Elem↑</button>
            <button onClick={() => moveSelectedElement('down')}>Elem↓</button>
            <button onClick={() => moveSelectedElement('right')}>Elem→</button>
            <button onClick={() => moveSelectedElement('left')}>Elem←</button>
            <button onClick={() => resizeSelectedElement('increase')}>Elem+</button>
            <button onClick={() => resizeSelectedElement('decrease')}>Elem-</button>
          </div>
        </div>

        {/* Sezione aggiunta: Rotazione Elemento (visibile se un logo o uno sfondo è selezionato) */}
        {(selectedLogo || selectedBackground) && (() => {
          const activeId = selectedLogo || selectedBackground;
          const activeType = selectedLogo ? 'logo' : 'background';
          const items = selectedLogo ? safeLogos : safeBackgroundImages;
          const activeRotation = items.find(i => i?.id === activeId)?.rotation ?? 0;

          return (
            <div className="toolnews-section">
              <div className="toolnews-row rot-row">
                <button 
                  type="button" 
                  className="rot-btn" 
                  onClick={() => nudgeItemRotation(activeId, -rotateStep, activeType)}
                >
                  ↺ {rotateStep}°
                </button>

                <button 
                  type="button" 
                  className="rot-btn" 
                  onClick={() => nudgeItemRotation(activeId, rotateStep, activeType)}
                >
                  ↻ {rotateStep}°
                </button>

                <input
                  className="rot-slider"
                  type="range"
                  min="0"
                  max="360"
                  step={1}
                  value={activeRotation}
                  onChange={(e) => setItemRotation(activeId, Number(e.target.value), activeType)}
                />

                <div className="deg-input">
                  <input
                    type="number"
                    min="0"
                    max="360"
                    step={1}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={activeRotation}
                    onChange={(e) => setItemRotation(activeId, Number(e.target.value), activeType)}
                  />
                </div>

                <button 
                  type="button" 
                  className="rot-reset" 
                  onClick={() => setItemRotation(activeId, 0, activeType)}
                >
                  Reset
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );

}

export default ToolbarNews;