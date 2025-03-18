import React, { useState, useRef, useEffect } from 'react';
import NewsCreator from '../components/NewsCreator/NewsCreator';
import ImagesSelector from '../components/ImagesSelector/ImagesSelector';
import CanvasNews from '../components/CanvasNews/CanvasNews';
import ToolbarNews from '../components/ToolbarNews/ToolbarNews';
import useImage from 'use-image';
import '../fonts.css';
import './News.css';


function NewsEditor() {
  const stageRef = useRef(null);
  const textContainerRef = useRef(null);

  // States for text content
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
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
  
  // States for logos
  const [logos, setLogos] = useState([]);
  
  // States for positioning
  const [titlePosition, setTitlePosition] = useState({ x: 0, y: 1200 });
  const [textPosition, setTextPosition] = useState({ x: 0, y: 1385 });
  
  // States for selection
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [selectedLogo, setSelectedLogo] = useState(null);


  const scaleCanvas = () => {
    const stage = stageRef.current;
    const containerWidth = window.innerWidth * 0.95;
    const containerHeight = window.innerHeight * 0.8;
    const scaleWidth = containerWidth / 1440;
    const scaleHeight = containerHeight / 1800;
    const scale = Math.min(scaleWidth, scaleHeight);

    stage.width(1440 * scale);
    stage.height(1800 * scale);
    stage.scale({ x: scale, y: scale });
  };

  useEffect(() => {
    scaleCanvas();
    window.addEventListener('resize', scaleCanvas);
    return () => window.removeEventListener('resize', scaleCanvas);
  }, []);

  const handleBackgroundChange = (e) => {
    setBackgroundImage(e.target.value);  // Remove path manipulation
  };

  const handleTextChange = () => {
    const newText = textContainerRef.current.innerText;
    setText(newText);
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
    
    const delta = 10;
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
    
    const scaleChange = 0.1;
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

  const handleDragEnd = (id, newPos, itemType) => {
    if (itemType === 'background') {
      updateItemPosition(id, newPos, backgroundImages, setBackgroundImages);
    } else if (itemType === 'logo') {
      updateItemPosition(id, newPos, logos, setLogos);
    }
  };

  const reorderItems = (dragIndex, hoverIndex, items, setter) => {
    const draggedItem = items[dragIndex];
    const updatedItems = [...items];
    
    // Remove the dragged item
    updatedItems.splice(dragIndex, 1);
    // Insert it at the new position
    updatedItems.splice(hoverIndex, 0, draggedItem);
    
    setter(updatedItems);
  };

  const enlargeTextSize = (setter) => setter((prevSize) => prevSize + 10);
  const shrinkTextSize = (setter) => setter((prevSize) => Math.max(20, prevSize - 10));

    // ... existing code ...
  
  const downloadImage = () => {
    const stage = stageRef.current;
      
    // Salva le dimensioni e la scala originali
    const originalWidth = stage.width();
    const originalHeight = stage.height();
    const originalScale = stage.scale();
      
    // Imposta temporaneamente la scala a 1 per l'esportazione
    stage.scale({ x: 1, y: 1 });
    stage.width(1440);
    stage.height(1800);
      
    // Crea l'immagine con alta qualità
    const uri = stage.toDataURL({ 
      pixelRatio: 3,
      mimeType: 'image/png',
      quality: 1,
      width: 1440,
      height: 1800
    });
      
    // Ripristina le dimensioni e la scala originali
    stage.scale(originalScale);
    stage.width(originalWidth);
    stage.height(originalHeight);
      
    // Scarica l'immagine
    const link = document.createElement('a');
    link.download = 'final_image.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    

  return (
    <div className="App">
      <h1>CRONACHE ELLENICHE NEWS</h1>
      <div className="editor-container">
        <div className="controls-container">
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
            downloadImage={downloadImage}
          />
          
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
          />
        </div>
        
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
  textAboveImages={true}  // o false, in base a cosa desideri
/>

        
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
        />
      </div>
    </div>
  );
}

export default NewsEditor;