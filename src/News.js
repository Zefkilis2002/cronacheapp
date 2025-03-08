import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text } from 'react-konva';
import useImage from 'use-image';
import './fonts/kenyan coffee bd it.otf';
import './fonts/kenyan coffee bd.otf';
import './fonts/kenyan coffee rg it.otf';
import './fonts/kenyan coffee rg.otf';
import './App.css';
import './News.css';
import { Link } from 'react-router-dom';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sticky, setSticky] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleScroll = () => {
      setSticky(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${sticky ? 'sticky' : ''}`}>
      <div className="navbar-logo">
        <a href="#home">CronacheApp</a>
      </div>
      <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
        <li><Link to="/App" onClick={() => setIsOpen(false)}>FullTime</Link></li>
        <li><Link to="/news" onClick={() => setIsOpen(false)}>News</Link></li>
        <li><a href="#services" onClick={() => setIsOpen(false)}>Coming Soon</a></li>
        <li><a href="#contact" onClick={() => setIsOpen(false)}>About Us</a></li>
      </ul>
      <button className="hamburger" aria-label="Toggle menu" onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>
    </nav>
  );
};

function News() {
  const stageRef = useRef(null);
  const textContainerRef = useRef(null);

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [titleColor, setTitleColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#000000');
  const [titleFont, setTitleFont] = useState('Kenyan Coffee Bold');
  const [textFont, setTextFont] = useState('Kenyan Coffee Regular');
  const [titleFontSize, setTitleFontSize] = useState(180);
  const [textFontSize, setTextFontSize] = useState(100);
  const [userImage, setUserImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState({ scaleX: 1, scaleY: 1 });
  
  const [backgroundImage, setBackgroundImage] = useState('sfumatura.png');
  const [background] = useImage(backgroundImage);
  
  const [logo, setLogo] = useState(null);
  const [logoPosition, setLogoPosition] = useState({ x: 65, y: 1260 });
  const [logoScale, setLogoScale] = useState({ scaleX: 1, scaleY: 1 });
  const [uploadedImage] = useImage(userImage);
  const [uploadedLogo] = useImage(logo);
  const [titlePosition, setTitlePosition] = useState({ x: 0, y: 1200 });
  const [textPosition, setTextPosition] = useState({ x: 0, y: 1385 });

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
    setBackgroundImage(e.target.value);
  };

  const handleTextChange = () => {
    const newText = textContainerRef.current.innerText;
    setText(newText);
  };

  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => setUserImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  const moveElement = (setter, direction) => {
    const delta = 10;
    setter((prevPosition) => ({
      x: direction === 'left' ? prevPosition.x - delta 
         : direction === 'right' ? prevPosition.x + delta 
         : prevPosition.x,  // Mantieni l'asse x invariato se non è specificato
      y: direction === 'up' ? prevPosition.y - delta 
         : direction === 'down' ? prevPosition.y + delta 
         : prevPosition.y,  // Mantieni l'asse y invariato se non è specificato
    }));
  };
  

  const resizeElement = (setter, type) => {
    const scaleChange = 0.1;
    setter((prevScale) => ({
      scaleX: type === 'increase' ? prevScale.scaleX + scaleChange : Math.max(0.1, prevScale.scaleX - scaleChange),
      scaleY: type === 'increase' ? prevScale.scaleY + scaleChange : Math.max(0.1, prevScale.scaleY - scaleChange),
    }));
  };

  const downloadImage = () => {
    const uri = stageRef.current.toDataURL({ pixelRatio: 3 });
    const link = document.createElement('a');
    link.download = 'final_image.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const enlargeTextSize = (setter) => setter((prevSize) => prevSize + 10);
  const shrinkTextSize = (setter) => setter((prevSize) => Math.max(20, prevSize - 10));

  return (
    <div className="App">
      {/* Navigation Bar */}
      <NavBar />
  
      <h1>CE NEWS</h1>
      
      <div className="input-container">
        {/* Sezione per selezionare lo sfondo */}
        <div>
          <label>Scegli lo sfondo:</label>
          <select onChange={handleBackgroundChange} value={backgroundImage}>
            <option value="sfumatura.png">Libero</option>
            <option value="dichiarazioni.png">Dichiarazioni</option>
            <option value="news.png">News</option>
          </select>
        </div>
  
        {/* Sezione per il titolo */}
        <div>
          <label>Titolo:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Inserisci il titolo"
          />
        </div>
  
        <div className="inline-inputs">
          <div>
            <label>Colore del titolo:</label>
            <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} />
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
  
        {/* Sezione per il testo */}
        <div>
          <label>Testo:</label>
          <div
            ref={textContainerRef}
            contentEditable
            onInput={handleTextChange}
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              minHeight: '100px',
              minWidth: '300px',
              whiteSpace: 'pre-wrap',
              direction: 'ltr',
              width: '100%',
              maxWidth: '300px',
              margin: '10px auto'
            }}
          />
        </div>
  
        <div className="inline-inputs">
          <div>
            <label>Colore del testo:</label>
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
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
  
        {/* Bottone per scaricare */}
        <button className="modern-button" onClick={downloadImage}>Scarica Immagine</button>
      </div>
  
      <Stage ref={stageRef} width={1440} height={1800} className="canvas-stage" style={{ border: '1px solid black' }}>
        <Layer>
          {uploadedImage && (
            <KonvaImage
              image={uploadedImage}
              x={imagePosition.x}
              y={imagePosition.y}
              scaleX={imageScale.scaleX}
              scaleY={imageScale.scaleY}
            />
          )}
          {background && <KonvaImage image={background} width={1440} height={1800} />}
          {uploadedLogo && (
            <KonvaImage
              image={uploadedLogo}
              x={logoPosition.x}
              y={logoPosition.y}
              scaleX={logoScale.scaleX}
              scaleY={logoScale.scaleY}
              draggable
              onDragEnd={(e) => setLogoPosition({ x: e.target.x(), y: e.target.y() })}
            />
          )}
          <Text
            text={title}
            fontSize={titleFontSize}
            fill={titleColor}
            x={titlePosition.x}
            y={titlePosition.y}
            align="center"
            width={1440}
            fontFamily={titleFont}
          />
          <Text
            text={text}
            fontSize={textFontSize}
            fill={textColor}
            x={textPosition.x}
            y={textPosition.y}
            align="center"
            width={1440}
            fontFamily={textFont}
          />
        </Layer>
      </Stage>
  
      {/* Toolbar */}
      <div className="toolbar" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <div className="toolbar-inner">
          <button onClick={() => moveElement(setTitlePosition, 'up')}>Tit↑</button>
          <button onClick={() => moveElement(setTitlePosition, 'down')}>Tit↓</button>
          <button onClick={() => enlargeTextSize(setTitleFontSize)}>Tit+</button>
          <button onClick={() => shrinkTextSize(setTitleFontSize)}>Tit-</button>
          <button onClick={() => moveElement(setTextPosition, 'up')}>Testo↑</button>
          <button onClick={() => moveElement(setTextPosition, 'down')}>Testo↓</button>
          <button onClick={() => enlargeTextSize(setTextFontSize)}>Testo+</button>
          <button onClick={() => shrinkTextSize(setTextFontSize)}>Testo-</button>
          <button onClick={() => moveElement(setImagePosition, 'up')}>Sfond↑</button>
          <button onClick={() => moveElement(setImagePosition, 'down')}>Sfond↓</button>
          <button onClick={() => moveElement(setImagePosition, 'right')}>Sfond→</button>
          <button onClick={() => moveElement(setImagePosition, 'left')}>Sfond←</button>
          <button onClick={() => resizeElement(setImageScale, 'increase')}>Sfond+</button>
          <button onClick={() => resizeElement(setImageScale, 'decrease')}>Sfond-</button>
          <button onClick={() => resizeElement(setLogoScale, 'increase')}>Logo+</button>
          <button onClick={() => resizeElement(setLogoScale, 'decrease')}>Logo-</button>
        </div>
      </div>
    </div>
  );

}

export default News;
