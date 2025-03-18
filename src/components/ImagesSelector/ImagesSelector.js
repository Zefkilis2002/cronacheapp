import React, { useRef } from 'react';
import './ImagesSelector.css';

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
  selectedLogo
}) {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  
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

  const handleLogoSelect = (logo) => {
    setSelectedLogo(logo.id);
    setSelectedBackground(null);
  };

  return (
    <div className="images-selector">
      {/* Sezione immagini di sfondo */}
      <div className="image-upload-section">
        <h3>Immagini di sfondo (max 5):</h3>
        <div className="upload-control-row">
          <input
            type="file"
            accept="image/*"
            onChange={handleBackgroundUpload}
            className="file-input"
            disabled={backgroundImages.length >= 5}
            id="background-upload"
            style={{ display: 'none' }}
          />
          <label htmlFor="background-upload" className="file-input">
            Scegli l'immagine di sfondo
          </label>
          
          <div className="thumbnails-container">
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
        <div className="upload-control-row">
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
          
          <div className="thumbnails-container">
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
    </div>
  );
}

export default ImagesSelector;