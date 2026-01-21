import React, { useState, useRef, useEffect } from 'react';
import NewsCreator from '../components/NewsCreatorComp/NewsCreator/NewsCreator';
import ImagesSelector from '../components/NewsCreatorComp/ImagesSelector/ImagesSelector';
import CanvasNews from '../components/NewsCreatorComp/CanvasNews/CanvasNews';
import ToolbarNews from '../components/NewsCreatorComp/ToolbarNews/ToolbarNews';
import CameraRawSportFilter, { applyAcrSportFilterToSrc, applyUpscaleFilterToSrc } from '../filters/acrSport';
import useImage from 'use-image';
import '../fonts.css';
import './News.css';


function NewsEditor() {
  const stageRef = useRef(null);
  const textContainerRef = useRef(null);

  // States for text content
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [richText, setRichText] = useState([]); 


  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [titleFont, setTitleFont] = useState('Kenyan Coffee Bold');
  const [textFont, setTextFont] = useState('Kenyan Coffee Regular');
  const [titleFontSize, setTitleFontSize] = useState(180);
  const [textFontSize, setTextFontSize] = useState(100);

  
  // States for background images
  const [backgroundImages, setBackgroundImages] = useState([]);
  const [backgroundImage, setBackgroundImage] = useState('/sfondoNotizie/sfumatura.png');  
  const [background] = useImage(backgroundImage);
  const [showSelection, setShowSelection] = useState(true);

  const [busyFilter, setBusyFilter] = useState(false);

  
  // States for logos
  const [logos, setLogos] = useState([]);
  
  // States for positioning
  const [titlePosition, setTitlePosition] = useState({ x: 0, y: 1200 });
  const [textPosition, setTextPosition] = useState({ x: 0, y: 1385 });
  
  // States for selection
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [selectedLogo, setSelectedLogo] = useState(null);

  // Layering
  const [textAboveImages, setTextAboveImages] = useState(true);
  const [activeTab, setActiveTab] = useState('text');

  // Passi unificati per controlli UI
  const MOVE_STEP  = 2;    // px
  const SCALE_STEP = 0.02; // 2%
  const FONT_STEP  = 2;    // px


  const handleBackgroundChange = (e) => {
    setBackgroundImage(e.target.value);  // Remove path manipulation
  };

  const handleTextChange = () => {
    const html = textContainerRef.current.innerHTML;
    const plain = textContainerRef.current.innerText;
    setText(plain);

    // Parse HTML -> righe di segmenti { text, color | null }
    const container = document.createElement('div');
    container.innerHTML = html;

    const lines = [];
    let current = [];

    const flush = () => {
      // Anche se current è vuoto, aggiungi una riga vuota per preservare gli a capo
      const merged = [];
      for (const seg of current) {
        if (!seg.text && seg.text !== '') continue; // Permetti stringhe vuote
        if (merged.length && merged[merged.length - 1].color === seg.color) {
          merged[merged.length - 1].text += seg.text;
        } else {
          merged.push({ text: seg.text, color: seg.color });
        }
      }
      // Se non ci sono segmenti, aggiungi una riga vuota
      lines.push(merged.length > 0 ? merged : [{ text: '', color: null }]);
      current = [];
    };

    const pushText = (t, color) => {
      const text = (t || '').replace(/\u00A0/g, ' '); // normalizza NBSP
      current.push({ text, color: color || null });
    };

    // Funzione per convertire colori rgb() in hex
    const rgbToHex = (rgb) => {
      if (!rgb || rgb === 'inherit' || rgb === 'initial') return null;
      if (rgb.startsWith('#')) return rgb;
      
      const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      }
      return rgb;
    };

    const walk = (node, inheritedColor = null) => {
      if (!node) return;
      
      if (node.nodeType === 3) { // TEXT_NODE
        pushText(node.nodeValue, inheritedColor);
        return;
      }
      
      if (node.nodeType !== 1) return; // non ELEMENT_NODE

      const tag = node.tagName;
      let nodeColor = inheritedColor;

      // Controlla vari modi in cui il colore può essere specificato
      if (node.style && node.style.color) {
        nodeColor = rgbToHex(node.style.color);
      } else if (node.getAttribute && node.getAttribute('color')) {
        nodeColor = node.getAttribute('color');
      }

      // Gestione dei tag che creano nuove righe
      if (tag === 'BR') { 
        flush(); 
        return; 
      }
      
      if (tag === 'DIV') {
        // Se il DIV non è il primo nodo, crea una nuova riga prima
        if (current.length > 0) flush();
        Array.from(node.childNodes).forEach(child => walk(child, nodeColor));
        flush(); // Flush dopo il DIV per creare la nuova riga
        return;
      }
      
      if (tag === 'P') {
        // Simile ai DIV, i paragrafi creano nuove righe
        if (current.length > 0) flush();
        Array.from(node.childNodes).forEach(child => walk(child, nodeColor));
        flush();
        return;
      }
      
      // Per tutti gli altri tag, processa i figli con il colore corrente
      Array.from(node.childNodes).forEach(child => walk(child, nodeColor));
    };

    Array.from(container.childNodes).forEach(n => walk(n, null));
    
    // Se non ci sono state flush, flush l'ultima riga
    if (current.length > 0) flush();
    
    // Non filtrare le righe vuote - sono necessarie per preservare gli a capo
    setRichText(lines);
    
    console.log('Rich text parsed:', lines); // Debug
  };



  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (backgroundImages.length >= 5) {
      alert("Puoi caricare al massimo 5 immagini di sfondo");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newImage = {
        id: `bg-${Date.now()}`,
        src: ev.target.result,
        position: { x: 0, y: 0 },
        scale: { scaleX: 1, scaleY: 1 }
      };
      const updatedImages = [newImage, ...backgroundImages];
      setBackgroundImages(updatedImages);
      // Auto-select the newly uploaded image
      setSelectedBackground(newImage.id);
      setSelectedLogo(null);
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = null;
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (logos.length >= 8) {
      alert("Puoi caricare al massimo 8 loghi");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newLogo = {
        id: `logo-${Date.now()}`,
        src: ev.target.result,
        position: { x: 65, y: 1260 },
        scale: { scaleX: 1, scaleY: 1 }
      };
      const updatedLogos = [newLogo, ...logos];
      setLogos(updatedLogos);
      // Auto-select the newly uploaded logo
      setSelectedLogo(newLogo.id);
      setSelectedBackground(null);
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = null;
  };

  const removeBackgroundImage = (id) => {
    setBackgroundImages(backgroundImages.filter(image => image.id !== id));
    if (selectedBackground === id) {
      setSelectedBackground(null);
    }
  };

  const removeLogo = (id) => {
    setLogos(logos.filter(logo => logo.id !== id));
    if (selectedLogo === id) {
      setSelectedLogo(null);
    }
  };

  const moveElement = (item, setter, items, direction) => {
    const itemIndex = items.findIndex(i => i.id === item.id);
    if (itemIndex === -1) return;
    
    const delta = MOVE_STEP;
    const updatedItems = [...items];
    const updatedItem = { ...updatedItems[itemIndex] };
    
    if (direction === 'left') {
      updatedItem.position.x -= delta;
    } else if (direction === 'right') {
      updatedItem.position.x += delta;
    } else if (direction === 'up') {
      updatedItem.position.y -= delta;
    } else if (direction === 'down') {
      updatedItem.position.y += delta;
    }
    
    updatedItems[itemIndex] = updatedItem;
    setter(updatedItems);
  };

  const resizeElement = (item, setter, items, type) => {
    const itemIndex = items.findIndex(i => i.id === item.id);
    if (itemIndex === -1) return;
    
    const scaleChange = SCALE_STEP;
    const updatedItems = [...items];
    const updatedItem = { ...updatedItems[itemIndex] };
    
    if (type === 'increase') {
      updatedItem.scale.scaleX += scaleChange;
      updatedItem.scale.scaleY += scaleChange;
    } else {
      updatedItem.scale.scaleX = Math.max(0.1, updatedItem.scale.scaleX - scaleChange);
      updatedItem.scale.scaleY = Math.max(0.1, updatedItem.scale.scaleY - scaleChange);
    }
    
    updatedItems[itemIndex] = updatedItem;
    setter(updatedItems);
  };

  const updateItemPosition = (id, newPosition, items, setter) => {
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex === -1) return;
    
    const updatedItems = [...items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      position: newPosition
    };
    
    setter(updatedItems);
  };


// Cache per risultati filtrati per ogni immagine (evita ricalcoli)
const filteredCacheRef = useRef(new Map());

  const applyAcrSportToSelectedBackground = async () => {
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
        cached = await applyAcrSportFilterToSrc(item.src, '/filters/Camera Raw Sport.xmp');
        filteredCacheRef.current.set(cacheKey, cached);
      }
      const updated = [...backgroundImages];
      updated[idx] = { ...item, originalSrc: item.originalSrc || item.src, src: cached.url, _revoke: cached._revoke, _acr: 'sport' };
      setBackgroundImages(updated);
    } finally {
      setBusyFilter(false);
    }
  };

  const applyUpscaleToSelectedBackground = async () => {
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
  };

  const removeFilterFromSelectedBackground = () => {
    if (!selectedBackground) return;
    const idx = backgroundImages.findIndex(i => i.id === selectedBackground);
    if (idx < 0) return;
    const item = backgroundImages[idx];
    // ripristina la sorgente originale e libera l’URL blob
    if (item._revoke && item.src && item.src.startsWith('blob:')) {
      try { item._revoke(); } catch(_) {}
    }
    const updated = [...backgroundImages];
    updated[idx] = { 
      ...item, 
      src: item.originalSrc || item.src, 
      _revoke: undefined, 
      _acr: undefined 
    };
    setBackgroundImages(updated);
  };

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

  const reorderItems = (dragIndex, hoverIndex, items, setter) => {
    const draggedItem = items[dragIndex];
    const updatedItems = [...items];
    
    // Remove the dragged item
    updatedItems.splice(dragIndex, 1);
    // Insert it at the new position
    updatedItems.splice(hoverIndex, 0, draggedItem);
    
    setter(updatedItems);
  };

  const enlargeTextSize = (setter, step = FONT_STEP) =>
    setter(prev => prev + step);
  const shrinkTextSize  = (setter, step = FONT_STEP) =>
    setter(prev => Math.max(20, prev - step));

    // ... existing code ...
  
    const downloadImage = async () => {
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
    };
    
    

  return (
    <div className="App">
      <h1>CRONACHE ELLENICHE NEWS</h1>
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
          textAboveImages={textAboveImages}
          selectedBackground={selectedBackground}
          selectedLogo={selectedLogo}
          setSelectedBackground={setSelectedBackground}
          setSelectedLogo={setSelectedLogo}
          showSelection={showSelection}
          richText={richText}
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
              handleTextChange={handleTextChange}
              backgroundImage={backgroundImage}
              handleBackgroundChange={handleBackgroundChange}
              textAboveImages={textAboveImages}
              setTextAboveImages={setTextAboveImages}
              downloadImage={downloadImage}
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
          setTitleFontSize={setTitleFontSize}
          setTextFontSize={setTextFontSize}
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