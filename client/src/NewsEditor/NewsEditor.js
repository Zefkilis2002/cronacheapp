import React, { useState, useRef, useCallback } from 'react';
import { useCanvasElements } from '../hooks/useCanvasElements';
import { useTextEditor } from '../hooks/useTextEditor';
import NewsCreator from '../components/NewsCreatorComp/NewsCreator/NewsCreator';
import ImagesSelector from '../components/NewsCreatorComp/ImagesSelector/ImagesSelector';
import CanvasNews from '../components/NewsCreatorComp/CanvasNews/CanvasNews';
import ToolbarNews from '../components/NewsCreatorComp/ToolbarNews/ToolbarNews';
import { applyAcrSportFilterToSrc, applyUpscaleFilterToSrc } from '../filters/acrSport';
import useImage from 'use-image';
import '../fonts.css';
import './News.css';


function NewsEditor() {
  const stageRef = useRef(null);
  const textContainerRef = useRef(null);

  const {
    backgroundImages, setBackgroundImages,
    logos, setLogos,
    selectedBackground, setSelectedBackground,
    selectedLogo, setSelectedLogo,
    handleBackgroundUpload, handleLogoUpload,
    removeBackgroundImage, removeLogo,
    reorderItems,
    updateItemPosition, moveElement, resizeElement
  } = useCanvasElements();

  const {
    title, setTitle,
    text,
    richText,
    titleColor, setTitleColor,
    textColor, setTextColor,
    titleFont, setTitleFont,
    textFont, setTextFont,
    titleFontSize, setTitleFontSize,
    textFontSize, setTextFontSize,
    titlePosition, setTitlePosition,
    textPosition, setTextPosition,
    sourceText, setSourceText,
    sourceFont, setSourceFont,
    sourceColor, setSourceColor,
    sourceFontSize, setSourceFontSize,
    sourcePosition, setSourcePosition,
    textAboveImages, setTextAboveImages,
    handleTextChange,
    enlargeTextSize, shrinkTextSize,
    highlightColor, setHighlightColor,
    html
  } = useTextEditor();

  const [backgroundImage, setBackgroundImage] = useState('/sfondoNotizie/sfumatura.png');
  const [background] = useImage(backgroundImage, 'anonymous');
  const [showSelection, setShowSelection] = useState(true);
  const [busyFilter, setBusyFilter] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Passi unificati per controlli UI
  const MOVE_STEP = 2;    // px
  const FONT_STEP = 2;    // px


  const handleBackgroundChange = useCallback((e) => {
    setBackgroundImage(e.target.value);
  }, []);

  const handleTextChangeProxy = useCallback(() => {
    handleTextChange(textContainerRef);
  }, [handleTextChange]);




  // Cache per risultati filtrati per ogni immagine (evita ricalcoli)
  const filteredCacheRef = useRef(new Map());

  const applyAcrSportToSelectedBackground = useCallback(async () => {
    if (!selectedBackground) return;
    const idx = backgroundImages.findIndex(i => i.id === selectedBackground);
    if (idx < 0) return;
    const item = backgroundImages[idx];
    const cacheKey = item.src; // se cambi file cambia key
    try {
      setBusyFilter(true);
      // usa cache se presente
      let cached = filteredCacheRef.current.get(cacheKey);
      if (!cached) {
        cached = await applyAcrSportFilterToSrc(item.src);
        filteredCacheRef.current.set(cacheKey, cached);
      }
      const updated = [...backgroundImages];
      updated[idx] = { ...item, originalSrc: item.originalSrc || item.src, src: cached.url, _revoke: cached._revoke, _acr: 'sport' };
      setBackgroundImages(updated);
    } finally {
      setBusyFilter(false);
    }
  }, [selectedBackground, backgroundImages, setBackgroundImages]);

  const applyUpscaleToSelectedBackground = useCallback(async () => {
    if (!selectedBackground) return;
    const idx = backgroundImages.findIndex(i => i.id === selectedBackground);
    if (idx < 0) return;
    const item = backgroundImages[idx];

    try {
      setBusyFilter(true);
      const cached = await applyUpscaleFilterToSrc(item.originalSrc || item.src);

      const updated = [...backgroundImages];
      updated[idx] = {
        ...item,
        originalSrc: item.originalSrc || item.src,
        src: cached.url,
        _revoke: cached._revoke,
        _acr: 'hd'
      };
      setBackgroundImages(updated);
    } catch (err) {
      console.error('Errore upscale:', err);
      alert('Errore durante il miglioramento HD.');
    } finally {
      setBusyFilter(false);
    }
  }, [selectedBackground, backgroundImages, setBackgroundImages]);

  const removeFilterFromSelectedBackground = useCallback(() => {
    if (!selectedBackground) return;
    const idx = backgroundImages.findIndex(i => i.id === selectedBackground);
    if (idx < 0) return;
    const item = backgroundImages[idx];
    // Revoca il blob URL filtrato
    if (item.src && item.src.startsWith('blob:')) {
      try { URL.revokeObjectURL(item.src); } catch (_) { }
    }
    // Invalida la cache per questa immagine così il prossimo filtro ricalcola
    if (item.originalSrc) {
      filteredCacheRef.current.delete(item.originalSrc);
    }
    const updated = [...backgroundImages];
    updated[idx] = {
      ...item,
      src: item.originalSrc || item.src,
      _revoke: undefined,
      _acr: undefined
    };
    setBackgroundImages(updated);
  }, [selectedBackground, backgroundImages, setBackgroundImages]);

  /*
  // Keyboard shortcuts: arrows to move selected, +/- to resize, Delete to remove
  useEffect(() => {
    const onKeyDown = (e) => {
      // Avoid intercepting when typing in inputs or contenteditable
      const ae = document.activeElement;
      const isTyping = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.getAttribute('contenteditable') === 'true');
      if (isTyping) return;

      const dirMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      if (dirMap[e.key]) {
        e.preventDefault();
        if (selectedBackground) {
          const item = backgroundImages.find(i => i.id === selectedBackground);
          if (item) moveElement(item, setBackgroundImages, backgroundImages, dirMap[e.key]);
        } else if (selectedLogo) {
          const item = logos.find(i => i.id === selectedLogo);
          if (item) moveElement(item, setLogos, logos, dirMap[e.key]);
        } else {
          // Move title by default if nothing is selected
          const delta = 10;
          if (e.key === 'ArrowUp') setTitlePosition(prev => ({ ...prev, y: prev.y - delta }));
          if (e.key === 'ArrowDown') setTitlePosition(prev => ({ ...prev, y: prev.y + delta }));
          if (e.key === 'ArrowLeft') setTitlePosition(prev => ({ ...prev, x: prev.x - delta }));
          if (e.key === 'ArrowRight') setTitlePosition(prev => ({ ...prev, x: prev.x + delta }));
        }
      }

      if ((e.key === '+' || e.key === '=') && (selectedBackground || selectedLogo)) {
        e.preventDefault();
        if (selectedBackground) {
          const item = backgroundImages.find(i => i.id === selectedBackground);
          if (item) resizeElement(item, setBackgroundImages, backgroundImages, 'increase');
        } else if (selectedLogo) {
          const item = logos.find(i => i.id === selectedLogo);
          if (item) resizeElement(item, setLogos, logos, 'increase');
        }
      }
      if ((e.key === '-' || e.key === '_') && (selectedBackground || selectedLogo)) {
        e.preventDefault();
        if (selectedBackground) {
          const item = backgroundImages.find(i => i.id === selectedBackground);
          if (item) resizeElement(item, setBackgroundImages, backgroundImages, 'decrease');
        } else if (selectedLogo) {
          const item = logos.find(i => i.id === selectedLogo);
          if (item) resizeElement(item, setLogos, logos, 'decrease');
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBackground) {
          removeBackgroundImage(selectedBackground);
        } else if (selectedLogo) {
          removeLogo(selectedLogo);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedBackground, selectedLogo, backgroundImages, logos]);
// Remove handleDragEnd function as it's not being used
*/



  // ... existing code ...

  const executeDownload = useCallback(async () => {
    setShowDownloadModal(false);
    const stage = stageRef.current;
    setShowSelection(false);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const originalWidth = stage.width();
    const originalHeight = stage.height();
    const originalScale = stage.scale();

    stage.scale({ x: 1, y: 1 });
    stage.width(1440);
    stage.height(1800);
    stage.batchDraw();

    const uri = stage.toDataURL({
      pixelRatio: 3,
      mimeType: 'image/jpeg',
      quality: 0.92,
      width: 1440,
      height: 1800
    });

    stage.scale(originalScale);
    stage.width(originalWidth);
    stage.height(originalHeight);
    stage.batchDraw();

    const link = document.createElement('a');
    link.download = 'final_image.jpg';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowSelection(true);
  }, []);

  const downloadImage = useCallback(() => {
    let hasEmptySpace = false;
    const stage = stageRef.current;

    if (backgroundImages.length === 0 && logos.length === 0) {
      hasEmptySpace = true;
    } else {
      const layer = stage.getLayers()[0];
      if (layer) {
        const cloneLayer = layer.clone();
        
        cloneLayer.children.forEach(node => {
          if (node.name() !== 'user-image') {
            node.hide();
          }
        });
        
        const tempCanvas = cloneLayer.toCanvas({
          width: 1440,
          height: 1800,
          pixelRatio: 1.0
        });
        
        const ctx = tempCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;
        
        // Use a threshold to detect empty space, preventing anti-aliasing near edges from masking it
        for (let i = 3; i < imageData.length; i += 4) {
          if (imageData[i] < 10) { // Check for highly transparent pixels (alpha < 10)
            hasEmptySpace = true;
            break;
          }
        }
        
        cloneLayer.destroy();
      }
    }

    if (hasEmptySpace) {
      setShowDownloadModal(true);
    } else {
      executeDownload();
    }
  }, [backgroundImages, logos, executeDownload]);


  return (
    <div className="news-editor-container">
      {showDownloadModal && (
        <div className="download-modal-overlay">
          <div className="download-modal-content">
            <p>Attenzione: l'area del canvas è vuota o presenta parti vuote (senza logo e senza immagine di sfondo). Vuoi procedere comunque con il download?</p>
            <div className="download-modal-actions">
              <button className="modal-btn-cancel" onClick={() => setShowDownloadModal(false)}>Annulla</button>
              <button className="modal-btn-confirm" onClick={executeDownload}>Download</button>
            </div>
          </div>
        </div>
      )}
      <h1 className="page-title">NEWS CREATOR</h1>
      <div className="editor-container">

        <CanvasNews
          stageRef={stageRef}
          backgroundImages={backgroundImages}
          setBackgroundImages={setBackgroundImages}
          background={background}
          logos={logos}
          setLogos={setLogos}
          updateItemPosition={updateItemPosition}
          title={title}
          titleFontSize={titleFontSize}
          titleColor={titleColor}
          titlePosition={titlePosition}
          titleFont={titleFont}
          text={text}
          textFontSize={textFontSize}
          textColor={textColor}
          textPosition={textPosition}
          textFont={textFont}
          setTitlePosition={setTitlePosition}
          setTextPosition={setTextPosition}
          sourceText={sourceText}
          sourceFont={sourceFont}
          sourceColor={sourceColor}
          sourceFontSize={sourceFontSize}
          sourcePosition={sourcePosition}
          setSourcePosition={setSourcePosition}
          textAboveImages={textAboveImages}
          selectedBackground={selectedBackground}
          selectedLogo={selectedLogo}
          setSelectedBackground={setSelectedBackground}
          setSelectedLogo={setSelectedLogo}
          showSelection={showSelection}
          richText={richText}
          highlightColor={highlightColor}
          downloadImage={downloadImage}
          isInterviewStyle={backgroundImage.includes('interviste')}
        />

        <div className="news-tab-header">
          <button
            className={`news-tab-button ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            Testi
          </button>
          <button
            className={`news-tab-button ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            Immagini & Sfondi
          </button>
        </div>

        <div className="controls-container">
          {activeTab === 'text' && (
            <NewsCreator
              title={title}
              setTitle={setTitle}
              titleColor={titleColor}
              setTitleColor={setTitleColor}
              titleFont={titleFont}
              setTitleFont={setTitleFont}
              textColor={textColor}
              setTextColor={setTextColor}
              textFont={textFont}
              setTextFont={setTextFont}
              textContainerRef={textContainerRef}
              handleTextChange={handleTextChangeProxy}
              backgroundImage={backgroundImage}
              handleBackgroundChange={handleBackgroundChange}
              textAboveImages={textAboveImages}
              setTextAboveImages={setTextAboveImages}
              downloadImage={downloadImage}
              html={html}
              highlightColor={highlightColor}
              setHighlightColor={setHighlightColor}
              sourceText={sourceText}
              setSourceText={setSourceText}
              sourceFont={sourceFont}
              setSourceFont={setSourceFont}
              sourceColor={sourceColor}
              setSourceColor={setSourceColor}
              sourceFontSize={sourceFontSize}
              setSourceFontSize={setSourceFontSize}
              isInterviewStyle={backgroundImage.includes('interviste')}
            />
          )}

          {activeTab === 'images' && (
            <ImagesSelector
              handleBackgroundUpload={handleBackgroundUpload}
              handleLogoUpload={handleLogoUpload}
              backgroundImages={backgroundImages}
              logos={logos}
              removeBackgroundImage={removeBackgroundImage}
              removeLogo={removeLogo}
              reorderItems={reorderItems}
              setBackgroundImages={setBackgroundImages}
              setLogos={setLogos}
              selectedBackground={selectedBackground}
              selectedLogo={selectedLogo}
              setSelectedBackground={setSelectedBackground}
              setSelectedLogo={setSelectedLogo}
              onApplyAcrSport={applyAcrSportToSelectedBackground}
              onApplyUpscale={applyUpscaleToSelectedBackground}
              onRemoveAcrSport={removeFilterFromSelectedBackground}
              busyFilter={busyFilter}
            />
          )}
        </div>

        <ToolbarNews
          moveElement={moveElement}
          resizeElement={resizeElement}
          enlargeTextSize={enlargeTextSize}
          shrinkTextSize={shrinkTextSize}
          setTitlePosition={setTitlePosition}
          setTextPosition={setTextPosition}
          setSourcePosition={setSourcePosition}
          setTitleFontSize={setTitleFontSize}
          setTextFontSize={setTextFontSize}
          setSourceFontSize={setSourceFontSize}
          backgroundImages={backgroundImages}
          logos={logos}
          setBackgroundImages={setBackgroundImages}
          setLogos={setLogos}
          selectedBackground={selectedBackground}
          selectedLogo={selectedLogo}
          moveStep={MOVE_STEP}
          fontStep={FONT_STEP}
        />
      </div>
    </div>
  );
}

export default NewsEditor;