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
  downloadImage,
  html,
  highlightColor,
  setHighlightColor,
  sourceText,
  setSourceText,
  sourceFont,
  setSourceFont,
  sourceColor,
  setSourceColor,
  sourceFontSize,
  setSourceFontSize,
  isInterviewStyle
}) {
  React.useEffect(() => {
    if (textContainerRef.current && textContainerRef.current.innerHTML !== html) {
      textContainerRef.current.innerHTML = html;
    }
  }, []); // Run on mount

  return (
    <div className="news-controls">

      {/* Gruppo 1: Impostazioni Generali (Sfondo e Toggle) */}
      <div className="control-group">
        <h3 className="group-title">Impostazioni Generali</h3>
        <div className="row">
          <div>
            <label>Scegli lo sfondo:</label>
            <select
              className="sfondo-selector"
              onChange={handleBackgroundChange}
              value={backgroundImage}
            >
              <option value="/sfondoNotizie/sfumatura.png">Sfumatura</option>
              <option value="/sfondoNotizie/interviste.png">Intervista</option>
              <option value="/sfondoNotizie/dichiarazioni.png">Dichiarazioni</option>
              <option value="/sfondoNotizie/news.png">News</option>
              <option value="/sfondoNotizie/news2.png">News 2</option>
              <option value="/sfondoNotizie/news3.png">News 3</option>
              <option value="/sfondoNotizie/breaking.png">Breaking</option>
              <option value="/sfondoNotizie/roumor.png">Roumor</option>
              <option value="/sfondoNotizie/citation.png">Citation</option>
              <option value="/sfondoNotizie/notizia.png">Notizia Sky Sport</option>
            </select>
          </div>
          <div className="checkbox-container">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={!!textAboveImages}
                onChange={(e) => setTextAboveImages(e.target.checked)}
              />
              Testo sopra immagini e loghi
            </label>
          </div>
        </div>
      </div>

      <hr className="separator" />

      {/* Gruppo 2: Configurazione Titolo */}
      <div className="control-group">
        <h3 className="group-title">Titolo</h3>
        <div className="full-width-item">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Inserisci il titolo qui..."
            className="title-input"
          />
        </div>
        <div className="row" style={{ marginTop: '1rem' }}>
          <div>
            <label>Font del titolo:</label>
            <select value={titleFont} onChange={(e) => setTitleFont(e.target.value)}>
              <option value="SkateSans-Regular">SkateSans Regular</option>
              <option value="Kenyan Coffee Regular">Kenyan Coffee Regular</option>
              <option value="Kenyan Coffee Bold">Kenyan Coffee Bold</option>
              <option value="Kenyan Coffee Regular Italic">Kenyan Coffee Regular Italic</option>
              <option value="Kenyan Coffee Bold Italic">Kenyan Coffee Bold Italic</option>
              <option value="Benzin-Bold">Benzin Bold</option>
              <option value="Benzin-ExtraBold">Benzin Extra Bold</option>
              <option value="Benzin-Medium">Benzin Medium</option>
              <option value="Benzin-Regular">Benzin Regular</option>
              <option value="Benzin-Semibold">Benzin Semi Bold</option>
              <option value="Allotrope-Bold">Sky Sport (Allotrope Bold)</option>
            </select>
          </div>
          <div>
            <label>Colore del titolo:</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={titleColor}
                onChange={(e) => setTitleColor(e.target.value)}
              />
              <span className="color-value">{titleColor}</span>
            </div>
          </div>
        </div>
      </div>

      <hr className="separator" />

      {/* Gruppo 3: Configurazione Testo */}
      <div className="control-group">
        <h3 className="group-title">Testo Principale</h3>

        {/* Editor Testo */}
        <div className="full-width-item">
          <div
            ref={textContainerRef}
            contentEditable
            onInput={handleTextChange}
            className="text-editor"
            placeholder="Scrivi qui il testo della notizia..."
          />
        </div>

        {/* Strumenti Formattazione Selezione */}
        <div className="selection-tools">
          <span className="tool-label">Formattazione Selezione:</span>
          <div className="tool-actions">
            <input
              type="color"
              onChange={(e) => {
                const color = e.target.value;
                const sel = document.getSelection();
                const editor = textContainerRef?.current;
                if (!sel || sel.rangeCount === 0 || !editor || !editor.contains(sel.anchorNode)) return;

                try {
                  document.execCommand('styleWithCSS', false, true);
                  document.execCommand('foreColor', false, color);
                } catch (_) {
                  try {
                    const range = sel.getRangeAt(0);
                    if (!range.collapsed) {
                      const span = document.createElement('span');
                      span.style.color = color;
                      range.surroundContents(span);
                    }
                  } catch (_) { }
                }
                if (typeof handleTextChange === 'function') handleTextChange();
              }}
              title="Cambia colore testo selezionato"
              className="mini-color-picker"
            />
            <button
              type="button"
              onClick={() => {
                const sel = document.getSelection();
                const editor = textContainerRef?.current;
                if (!sel || sel.rangeCount === 0 || !editor || !editor.contains(sel.anchorNode)) return;

                try {
                  document.execCommand('removeFormat');
                } catch (_) {
                  try {
                    const range = sel.getRangeAt(0);
                    if (!range.collapsed) {
                      const frag = range.cloneContents();
                      frag.querySelectorAll && frag.querySelectorAll('span').forEach(s => s.style && (s.style.color = ''));
                      range.deleteContents();
                      range.insertNode(frag);
                    }
                  } catch (_) { }
                }
                if (typeof handleTextChange === 'function') handleTextChange();
              }}
              className="clean-button"
              title="Rimuovi formattazione dalla selezione"
            >
              Pulisci Stile
            </button>
          </div>
        </div>

        {/* Font e Colore Generale Testo */}
        <div className="row" style={{ marginTop: '1rem' }}>
          <div>
            <label>Font del testo:</label>
            <select value={textFont} onChange={(e) => setTextFont(e.target.value)}>
              <option value="SkateSans-Regular">SkateSans Regular</option>
              <option value="Kenyan Coffee Regular">Kenyan Coffee Regular</option>
              <option value="Kenyan Coffee Bold">Kenyan Coffee Bold</option>
              <option value="Kenyan Coffee Regular Italic">Kenyan Coffee Regular Italic</option>
              <option value="Kenyan Coffee Bold Italic">Kenyan Coffee Bold Italic</option>
              <option value="Benzin-Regular">Benzin Regular</option>
              <option value="Benzin-Medium">Benzin Medium</option>
              <option value="Benzin-Semibold">Benzin Semi Bold</option>
              <option value="Allotrope-Bold">Sky Sport (Allotrope Bold)</option>
            </select>
          </div>
          <div>
            <label>Colore base testo:</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
              <span className="color-value">{textColor}</span>
            </div>
          </div>
          <div>
            <label>Colore evidenziazione (*):</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value)}
              />
              <span className="color-value">{highlightColor}</span>
            </div>
          </div>
        </div>
      </div>

      <hr className="separator" />

      {isInterviewStyle && (
        <>
          <div className="control-group">
            <h3 className="group-title">Fonte (Intervista)</h3>
            <div className="full-width-item">
              <input
                type="text"
                value={sourceText || ''}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Es: BERND LENO OLE.GR"
                className="title-input"
              />
            </div>
            <div className="row" style={{ marginTop: '1rem' }}>
              <div>
                <label>Font della fonte:</label>
                <select value={sourceFont || 'Kenyan Coffee Regular'} onChange={(e) => setSourceFont(e.target.value)}>
                  <option value="Kenyan Coffee Regular">Kenyan Coffee Regular</option>
                  <option value="Kenyan Coffee Bold">Kenyan Coffee Bold</option>
                  <option value="SkateSans-Regular">SkateSans Regular</option>
                  <option value="Benzin-Bold">Benzin Bold</option>
                </select>
              </div>
              <div>
                <label>Dimensione fonte:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '50px' }}>
                  <button 
                    className="clean-button" 
                    onClick={() => setSourceFontSize(prev => prev - 2)}
                    style={{ fontSize: '1.2rem', width: '35px', height: '35px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >-</button>
                  <span style={{ minWidth: '40px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>{sourceFontSize}</span>
                  <button 
                    className="clean-button" 
                    onClick={() => setSourceFontSize(prev => prev + 2)}
                    style={{ fontSize: '1.2rem', width: '35px', height: '35px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >+</button>
                </div>
              </div>
              <div>
                <label>Colore base fonte:</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={sourceColor || '#ffffff'}
                    onChange={(e) => setSourceColor(e.target.value)}
                  />
                  <span className="color-value">{sourceColor || '#ffffff'}</span>
                </div>
              </div>
            </div>
          </div>
          <hr className="separator" />
        </>
      )}

      {/* Action Footer */}
      <div className="action-footer">
        <button className="modern-button download-btn" onClick={downloadImage}>
          Download
        </button>
      </div>
    </div>
  );
}

export default NewsCreator;
