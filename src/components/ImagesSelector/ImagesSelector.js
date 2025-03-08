import React from 'react';

function ImagesSelector({ handleBackgroundUpload, handleLogoUpload }) {
  return (
    <div className="images-selector">
      {/* Caricamento immagine di sfondo */}
      <div>
        <label>Carica immagine di sfondo:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleBackgroundUpload}
          style={{
            display: 'block',
            marginTop: '10px',
            padding: '10px',
            border: '2px solid #b4ff00',
            borderRadius: '5px',
            backgroundColor: '#1e1e2d',
            color: '#b4ff00',
            width: '100%',
            maxWidth: '300px'
          }}
        />
      </div>

      {/* Caricamento logo */}
      <div>
        <label>Carica logo:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          style={{
            display: 'block',
            marginTop: '10px',
            padding: '10px',
            border: '2px solid #b4ff00',
            borderRadius: '5px',
            backgroundColor: '#1e1e2d',
            color: '#b4ff00',
            width: '100%',
            maxWidth: '300px'
          }}
        />
      </div>
    </div>
  );
}

export default ImagesSelector;