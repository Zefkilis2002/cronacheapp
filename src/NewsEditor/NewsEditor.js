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
  const [titleColor, setTitleColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#000000');
  const [titleFont, setTitleFont] = useState('Kenyan Coffee Bold');
  const [textFont, setTextFont] = useState('Kenyan Coffee Regular');
  const [titleFontSize, setTitleFontSize] = useState(180);
  const [textFontSize, setTextFontSize] = useState(100);
  
  // States for images
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
  
  // States for positioning
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
         : prevPosition.x,
      y: direction === 'up' ? prevPosition.y - delta 
         : direction === 'down' ? prevPosition.y + delta 
         : prevPosition.y,
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
      <h1>CE NEWS</h1>
      
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
          />
        </div>
        
        <CanvasNews 
          stageRef={stageRef}
          uploadedImage={uploadedImage}
          imagePosition={imagePosition}
          imageScale={imageScale}
          background={background}
          uploadedLogo={uploadedLogo}
          logoPosition={logoPosition}
          logoScale={logoScale}
          setLogoPosition={setLogoPosition}
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
        />
        
        <ToolbarNews 
          moveElement={moveElement}
          resizeElement={resizeElement}
          enlargeTextSize={enlargeTextSize}
          shrinkTextSize={shrinkTextSize}
          setTitlePosition={setTitlePosition}
          setTextPosition={setTextPosition}
          setImagePosition={setImagePosition}
          setImageScale={setImageScale}
          setLogoScale={setLogoScale}
          setTitleFontSize={setTitleFontSize}
          setTextFontSize={setTextFontSize}
        />
      </div>
    </div>
  );
}

export default NewsEditor;