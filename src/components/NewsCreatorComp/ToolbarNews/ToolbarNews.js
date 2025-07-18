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
        const delta = 10;
        
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
        const delta = 10;
        
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

  // Renderizza il componente solo se è sicuro farlo
  return (
    <div className="toolnews">
      <div className="toolnews-inner">
        <div className="toolnews-section">
          <div className="toolnews-row">
            <button onClick={() => moveTitle('up')}>Tit↑</button>
            <button onClick={() => moveTitle('down')}>Tit↓</button>
            <button onClick={() => safeEnlargeTextSize(setTitleFontSize)}>Tit+</button>
            <button onClick={() => safeShrinkTextSize(setTitleFontSize)}>Tit-</button>
          </div>
        </div>
        
        <div className="toolnews-section">
          <div className="toolnews-row">
            <button onClick={() => moveText('up')}>Testo↑</button>
            <button onClick={() => moveText('down')}>Testo↓</button>
            <button onClick={() => safeEnlargeTextSize(setTextFontSize)}>Testo+</button>
            <button onClick={() => safeShrinkTextSize(setTextFontSize)}>Testo-</button>
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
      </div>
    </div>
  );
}

export default ToolbarNews;