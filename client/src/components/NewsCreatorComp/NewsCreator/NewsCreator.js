import React from 'react';
import './NewsCreator.css';

function NewsCreator({
  title,
  setTitle,
  titleColor,
  setTitleColor,
  titleFont,
  setTitleFont,
  titleFontSize,
  setTitleFontSize,
  textColor,
  setTextColor,
  textFont,
  setTextFont,
  textFontSize,
  setTextFontSize,
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
  setTitlePosition,
  setTextPosition,
  setSourcePosition,
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
              <option value="/sfondoNotizie/sfumaturaGrande.png">Sfumatura2</option>
              <option value="/sfondoNotizie/interviste.png">Intervista</option>
              <option value="/sfondoNotizie/dichiarazioni.png">Dichiarazioni</option>
              <option value="/sfondoNotizie/news.png">News</option>
              <option value="/sfondoNotizie/news2.png">News 2</option>
              <option value="/sfondoNotizie/news3.png">News 3</option>
              <option value="/sfondoNotizie/breaking.png">Breaking</option>
              <option value="/sfondoNotizie/roumor.png">Roumor</option>
              <option value="/sfondoNotizie/citation.png">Citation</option>
              <option value="/sfondoNotizie/notizia.png">Notizia Sky Sport</option>
              <option value="/sfondoNotizie/curiosità-azzurra.png">Curiosità Azzurra</option>
              <option value="/sfondoNotizie/curiosità-blu.png">Curiosità Blu</option>
              <option value="/sfondoNotizie/curiosità-gialla.png">Curiosità Gialla</option>
              <option value="/sfondoNotizie/curiosità-nera.png">Curiosità Nera</option>
              <option value="/sfondoNotizie/curiosità-rossa.png">Curiosità Rossa</option>
              <option value="/sfondoNotizie/curiosità-verde.png">Curiosità Verde</option>
              <option value="/sfondoNotizie/vuoto.png">Vuoto</option>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(180, 255, 0, 0.3)', paddingBottom: '0.5rem', marginBottom: '0.2rem' }}>
          <h3 className="group-title" style={{ margin: 0, border: 'none', padding: 0 }}>Titolo</h3>
          {setTitlePosition && (
            <button
              type="button"
              className="clean-button"
              onClick={() => setTitlePosition(prev => ({ ...prev, x: 0 }))}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem', borderColor: '#4a4a5c', color: '#bbb', cursor: 'pointer' }}
              title="Centra orizzontalmente"
            >
              ↔ Centra
            </button>
          )}
        </div>
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
              <option value="Kuunari-Black-Condensed">Kuunari Black Condensed</option>
            </select>
          </div>
          <div>
            <label>Dimensione titolo:</label>
            <div className="font-size-control">
              <button
                type="button"
                className="clean-button font-size-btn"
                onClick={() => setTitleFontSize(prev => Math.max(10, (Number(prev) || 10) - 2))}
              >-</button>
              <input
                type="number"
                min="10"
                max="500"
                value={titleFontSize || ''}
                onChange={(e) => setTitleFontSize(Number(e.target.value) || 0)}
                className="font-size-input"
              />
              <button
                type="button"
                className="clean-button font-size-btn"
                onClick={() => setTitleFontSize(prev => (Number(prev) || 10) + 2)}
              >+</button>
            </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(180, 255, 0, 0.3)', paddingBottom: '0.5rem', marginBottom: '0.2rem' }}>
          <h3 className="group-title" style={{ margin: 0, border: 'none', padding: 0 }}>Testo Principale</h3>
          {setTextPosition && (
            <button
              type="button"
              className="clean-button"
              onClick={() => setTextPosition(prev => ({ ...prev, x: 0 }))}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem', borderColor: '#4a4a5c', color: '#bbb', cursor: 'pointer' }}
              title="Centra orizzontalmente"
            >
              ↔ Centra
            </button>
          )}
        </div>

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
              <option value="Kuunari-Black-Condensed">Kuunari Black Condensed</option>
            </select>
          </div>
          <div>
            <label>Dimensione testo:</label>
            <div className="font-size-control">
              <button
                type="button"
                className="clean-button font-size-btn"
                onClick={() => setTextFontSize(prev => Math.max(10, (Number(prev) || 10) - 2))}
              >-</button>
              <input
                type="number"
                min="10"
                max="500"
                value={textFontSize || ''}
                onChange={(e) => setTextFontSize(Number(e.target.value) || 0)}
                className="font-size-input"
              />
              <button
                type="button"
                className="clean-button font-size-btn"
                onClick={() => setTextFontSize(prev => (Number(prev) || 10) + 2)}
              >+</button>
            </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(180, 255, 0, 0.3)', paddingBottom: '0.5rem', marginBottom: '0.2rem' }}>
              <h3 className="group-title" style={{ margin: 0, border: 'none', padding: 0 }}>Fonte (Intervista)</h3>
              {setSourcePosition && (
                <button
                  type="button"
                  className="clean-button"
                  onClick={() => setSourcePosition(prev => ({ ...prev, x: 0 }))}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem', borderColor: '#4a4a5c', color: '#bbb', cursor: 'pointer' }}
                  title="Centra orizzontalmente"
                >
                  ↔ Centra
                </button>
              )}
            </div>
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
                  <option value="Kuunari-Black-Condensed">Kuunari Black Condensed</option>
                </select>
              </div>
              <div>
                <label>Dimensione fonte:</label>
                <div className="font-size-control">
                  <button
                    type="button"
                    className="clean-button font-size-btn"
                    onClick={() => setSourceFontSize(prev => Math.max(10, (Number(prev) || 10) - 2))}
                  >-</button>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={sourceFontSize || ''}
                    onChange={(e) => setSourceFontSize(Number(e.target.value) || 0)}
                    className="font-size-input"
                  />
                  <button
                    type="button"
                    className="clean-button font-size-btn"
                    onClick={() => setSourceFontSize(prev => (Number(prev) || 10) + 2)}
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
