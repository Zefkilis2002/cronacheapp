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

  const setLogoRotation = (id, angle) => {
    setLogos(ls => ls.map(l => l.id !== id ? l : ({
      ...l,
      rotation: normalizeAngle(angle)
    })));
  };

  const nudgeLogoRotation = (id, delta) => {
    setLogos(ls => ls.map(l => {
      if (l.id !== id) return l;
      const prev = (typeof l.rotation === 'number') ? l.rotation : 0;
      return { ...l, rotation: normalizeAngle(prev + delta) };
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

        {/* Sezione aggiunta: Rotazione Logo (visibile solo se un logo è selezionato) */}
        {selectedLogo && (
          <div className="toolnews-section">
            <div className="toolnews-row rot-row">
              <button 
                type="button" 
                className="rot-btn" 
                onClick={() => nudgeLogoRotation(selectedLogo, -rotateStep)}
              >
                ↺ {rotateStep}°
              </button>

              <button 
                type="button" 
                className="rot-btn" 
                onClick={() => nudgeLogoRotation(selectedLogo, rotateStep)}
              >
                ↻ {rotateStep}°
              </button>

              <input
                className="rot-slider"
                type="range"
                min="0"
                max="360"
                step={1}
                value={(logos?.find(l => l?.id === selectedLogo)?.rotation ?? 0)}
                onChange={(e) => setLogoRotation(selectedLogo, Number(e.target.value))}
              />

              <div className="deg-input">
                <input
                  type="number"
                  min="0"
                  max="360"
                  step={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={(logos?.find(l => l?.id === selectedLogo)?.rotation ?? 0)}
                  onChange={(e) => setLogoRotation(selectedLogo, Number(e.target.value))}
                />
              </div>

              <button 
                type="button" 
                className="rot-reset" 
                onClick={() => setLogoRotation(selectedLogo, 0)}
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

}

export default ToolbarNews;