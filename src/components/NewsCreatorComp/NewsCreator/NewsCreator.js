import React from 'react';
import './NewsCreator.css';

function NewsCreator({
  title,
  setTitle,
  titleColor,
  setTitleColor,
  titleFont,
  setTitleFont,
  textColor,
  setTextColor,
  textFont,
  setTextFont,
  textContainerRef,
  handleTextChange,
  backgroundImage,
  handleBackgroundChange,
  downloadImage
}) {
  return (
    <div className="news-controls">
      {/* Sezione per selezionare lo sfondo */}
      <div>
        <label>Scegli lo sfondo:</label>
        <select 
          className="sfondo-selector" 
          onChange={handleBackgroundChange} 
          value={backgroundImage}  // Changed from split('/').pop()
        >
          <option value="/sfondoNotizie/sfumatura.png">Sfumatura</option>
          <option value="/sfondoNotizie/dichiarazioni.png">Dichiarazioni</option>
          <option value="/sfondoNotizie/news.png">News</option>
        </select>
      </div>

      {/* Prima riga: Titolo, Colore titolo, Font titolo */}
      <div className="row">
        <div>
          <label>Titolo:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Inserisci il titolo"
          />
        </div>
        <div>
          <label>Colore del titolo:</label>
          <input
            type="color"
            value={titleColor}
            onChange={(e) => setTitleColor(e.target.value)}
          />
        </div>
        <div>
          <label>Font del titolo:</label>
          <select value={titleFont} onChange={(e) => setTitleFont(e.target.value)}>
            <option value="Kenyan Coffee Regular">Kenyan Coffee Regular</option>
            <option value="Kenyan Coffee Bold">Kenyan Coffee Bold</option>
            <option value="Kenyan Coffee Regular Italic">Kenyan Coffee Regular Italic</option>
            <option value="Kenyan Coffee Bold Italic">Kenyan Coffee Bold Italic</option>
          </select>
        </div>
      </div>

      {/* Seconda riga: Testo, Colore testo, Font testo */}
      <div className="row">
        <div>
          <label>Testo:</label>
          <div
            ref={textContainerRef}
            contentEditable
            onInput={handleTextChange}
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              minHeight: '80px',
              minWidth: '200px',
              whiteSpace: 'pre-wrap',
            }}
          />
        </div>
        <div>
          <label>Colore del testo:</label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
        </div>
        <div>
          <label>Font del testo:</label>
          <select value={textFont} onChange={(e) => setTextFont(e.target.value)}>
            <option value="Kenyan Coffee Regular">Kenyan Coffee Regular</option>
            <option value="Kenyan Coffee Bold">Kenyan Coffee Bold</option>
            <option value="Kenyan Coffee Regular Italic">Kenyan Coffee Regular Italic</option>
            <option value="Kenyan Coffee Bold Italic">Kenyan Coffee Bold Italic</option>
          </select>
        </div>
      </div>

      {/* Bottone per scaricare */}
      <button className="modern-button" onClick={downloadImage}>
        Scarica Immagine
      </button>
    </div>
  );
}

export default NewsCreator;
