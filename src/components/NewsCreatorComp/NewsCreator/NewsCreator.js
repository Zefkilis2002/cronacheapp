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
  textAboveImages,
  setTextAboveImages,
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
          <option value="/sfondoNotizie/news2.png">News 2</option>
          <option value="/sfondoNotizie/news3.png">News 3</option>
          <option value="/sfondoNotizie/breaking.png">Breaking</option>
          <option value="/sfondoNotizie/roumor.png">Roumor</option>
          <option value="/sfondoNotizie/citation.png">Citation</option>
        </select>
      </div>

      {/* Opzione: testo sopra immagini e loghi */}
      <div>
        <label>Testo sopra immagini e loghi:</label>
        <input
          type="checkbox"
          checked={!!textAboveImages}
          onChange={(e) => setTextAboveImages(e.target.checked)}
        />
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
            <option value="Benzin-Bold.ttf">Benzin Bold</option>
            <option value="Benzin-ExtraBold.ttf">Benzin Extra Bold</option>
            <option value="Benzin-Medium.ttf">Benzin Medium</option>
            <option value="Benzin-Regular.ttf">Benzin Regular</option>
            <option value="Benzin-SemiBold.ttf">Benzin Semi Bold</option>
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

          {/* NUOVO: controlli selezione colore */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14 }}>Colore parole selezionate:</span>
            <input
              type="color"
              onChange={(e) => {
                const color = e.target.value;
                const sel = document.getSelection();
                const editor = textContainerRef?.current;
                if (!sel || sel.rangeCount === 0 || !editor || !editor.contains(sel.anchorNode)) return;

                // tentativo standard
                try {
                  document.execCommand('styleWithCSS', false, true);
                  document.execCommand('foreColor', false, color);
                } catch (_) {
                  // fallback: avvolgi la selezione in uno span colorato
                  try {
                    const range = sel.getRangeAt(0);
                    if (!range.collapsed) {
                      const span = document.createElement('span');
                      span.style.color = color;
                      range.surroundContents(span);
                    }
                  } catch (_) {}
                }
                // Notifica il parent per ricalcolare il richText
                if (typeof handleTextChange === 'function') handleTextChange();
              }}
              title="Seleziona una parola/frase nell'editor sopra, poi scegli un colore"
              style={{ width: 40, height: 32 }}
            />
            <button
              type="button"
              onClick={() => {
                const sel = document.getSelection();
                const editor = textContainerRef?.current;
                if (!sel || sel.rangeCount === 0 || !editor || !editor.contains(sel.anchorNode)) return;

                // prova a rimuovere formattazione
                try {
                  document.execCommand('removeFormat');
                } catch (_) {
                  // fallback: rimuovi solo il colore dagli span nella selezione
                  try {
                    const range = sel.getRangeAt(0);
                    if (!range.collapsed) {
                      const frag = range.cloneContents();
                      frag.querySelectorAll && frag.querySelectorAll('span').forEach(s => s.style && (s.style.color = ''));
                      range.deleteContents();
                      range.insertNode(frag);
                    }
                  } catch (_) {}
                }
                if (typeof handleTextChange === 'function') handleTextChange();
              }}
              className="modern-button"
              style={{ padding: '6px 10px' }}
            >
              Pulisci colore selezione
            </button>
          </div>
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
            <option value="Benzin-Bold.ttf">Benzin Bold</option>
            <option value="Benzin-ExtraBold.ttf">Benzin Extra Bold</option>
            <option value="Benzin-Medium.ttf">Benzin Medium</option>
            <option value="Benzin-Regular.ttf">Benzin Regular</option>
            <option value="Benzin-SemiBold.ttf">Benzin Semi Bold</option>
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
