import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Text } from 'react-konva';
import useImage from 'use-image';
import './CanvasNews.css';

// Componente per le immagini di sfondo
const BackgroundImage = ({ bgImage, updateItemPosition, backgroundImages, setBackgroundImages, scaleFactor }) => {
  const [image] = useImage(bgImage.src);
  
  return (
    <KonvaImage
      key={bgImage.id}
      image={image}
      x={bgImage.position.x * scaleFactor}
      y={bgImage.position.y * scaleFactor}
      scaleX={bgImage.scale.scaleX * scaleFactor}
      scaleY={bgImage.scale.scaleY * scaleFactor}
      draggable={true}
      onDragStart={(e) => {
        // Puoi rimuovere il moveToTop se vuoi che l'immagine non venga portata in primo piano
        // e.target.moveToTop();
      }}
      onDragEnd={(e) => {
        updateItemPosition(
          bgImage.id, 
          { x: e.target.x() / scaleFactor, y: e.target.y() / scaleFactor }, 
          backgroundImages, 
          setBackgroundImages
        );
      }}
    />
  );
};

// Componente per i loghi
const LogoImage = ({ logo, updateItemPosition, logos, setLogos, scaleFactor }) => {
  const [image] = useImage(logo.src);
  
  return (
    <KonvaImage
      key={logo.id}
      image={image}
      x={logo.position.x * scaleFactor}
      y={logo.position.y * scaleFactor}
      scaleX={logo.scale.scaleX * scaleFactor}
      scaleY={logo.scale.scaleY * scaleFactor}
      draggable={true}
      onDragEnd={(e) => {
        updateItemPosition(
          logo.id, 
          { x: e.target.x() / scaleFactor, y: e.target.y() / scaleFactor }, 
          logos, 
          setLogos
        );
      }}
    />
  );
};

function CanvasNews({
  stageRef,
  backgroundImages,
  setBackgroundImages,
  background,
  logos,
  setLogos,
  updateItemPosition,
  title,
  titleFontSize,
  titleColor,
  titlePosition,
  titleFont,
  text,
  textFontSize,
  textColor,
  textPosition,
  textFont,
  setTitlePosition,  // Assicurati di passare questo prop dal componente padre
  setTextPosition    // Assicurati di passare questo prop dal componente padre
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Costanti per le dimensioni originali del canvas
  const ORIGINAL_WIDTH = 1440;
  const ORIGINAL_HEIGHT = 1800;
  
  // Calcola il fattore di scala
  const scaleFactor = dimensions.width ? dimensions.width / ORIGINAL_WIDTH : 1;
  
  // Funzione per calcolare le dimensioni responsive
  const calculateDimensions = () => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const maxHeight = window.innerHeight * 0.8;
    
    // Calcola la scala mantenendo le proporzioni
    const scaleByWidth = containerWidth / ORIGINAL_WIDTH;
    const scaleByHeight = maxHeight / ORIGINAL_HEIGHT;
    const scale = Math.min(scaleByWidth, scaleByHeight, 1); // Non superare la dimensione originale
    
    const scaledWidth = ORIGINAL_WIDTH * scale;
    const scaledHeight = ORIGINAL_HEIGHT * scale;
    
    setDimensions({
      width: scaledWidth,
      height: scaledHeight
    });
  };
  
  useEffect(() => {
    calculateDimensions();
    const handleResize = () => calculateDimensions();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="canvas-container" ref={containerRef}>
      <div 
        className="canvas-wrapper"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`
        }}
      >
        <Stage 
          ref={stageRef} 
          width={dimensions.width}
          height={dimensions.height}
          className="canvas-stage"
        >
          <Layer>
            {/* Renderizza le immagini caricate dall'utente */}
            {[...backgroundImages].reverse().map((bgImage) => (
              <BackgroundImage
                key={bgImage.id}
                bgImage={bgImage}
                updateItemPosition={updateItemPosition}
                backgroundImages={backgroundImages}
                setBackgroundImages={setBackgroundImages}
                scaleFactor={scaleFactor}
              />
            ))}
            
            {/* Renderizza lo sfondo template sopra, ma non interagibile */}
            {background && (
              <KonvaImage 
                image={background} 
                width={ORIGINAL_WIDTH} 
                height={ORIGINAL_HEIGHT} 
                listening={false} 
              />
            )}
            
            {/* Renderizza loghi */}
            {[...logos].reverse().map((logo) => (
              <LogoImage
                key={logo.id}
                logo={logo}
                updateItemPosition={updateItemPosition}
                logos={logos}
                setLogos={setLogos}
                scaleFactor={scaleFactor}
              />
            ))}
            
            {/* Renderizza il titolo come testo draggable */}
            <Text
              text={title}
              fontSize={titleFontSize * scaleFactor}
              fill={titleColor}
              x={titlePosition.x * scaleFactor}
              y={titlePosition.y * scaleFactor}
              align="center"
              width={dimensions.width}
              fontFamily={titleFont}
              draggable={true}
              onDragEnd={(e) => setTitlePosition({ 
                x: e.target.x() / scaleFactor, 
                y: e.target.y() / scaleFactor 
              })}
            />
            {/* Renderizza il testo come testo draggable */}
            <Text
              text={text}
              fontSize={textFontSize * scaleFactor}
              fill={textColor}
              x={textPosition.x * scaleFactor}
              y={textPosition.y * scaleFactor}
              align="center"
              width={dimensions.width}
              fontFamily={textFont}
              draggable={true}
              onDragEnd={(e) => setTextPosition({ 
                x: e.target.x() / scaleFactor, 
                y: e.target.y() / scaleFactor 
              })}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default CanvasNews;