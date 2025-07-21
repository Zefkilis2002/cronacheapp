import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Text } from 'react-konva';
import useImage from 'use-image';
import './CanvasNews.css';

// Componente per le immagini di sfondo
const BackgroundImage = ({ bgImage, updateItemPosition, backgroundImages, setBackgroundImages }) => {
  const [image] = useImage(bgImage.src);
  
  return (
    <KonvaImage
      key={bgImage.id}
      image={image}
      x={bgImage.position.x}
      y={bgImage.position.y}
      scaleX={bgImage.scale.scaleX}
      scaleY={bgImage.scale.scaleY}
      draggable={true}
      onDragStart={(e) => {
        // Puoi rimuovere il moveToTop se vuoi che l'immagine non venga portata in primo piano
        // e.target.moveToTop();
      }}
      onDragEnd={(e) => {
        updateItemPosition(
          bgImage.id, 
          { x: e.target.x(), y: e.target.y() }, 
          backgroundImages, 
          setBackgroundImages
        );
      }}
    />
  );
};

// Componente per i loghi
const LogoImage = ({ logo, updateItemPosition, logos, setLogos }) => {
  const [image] = useImage(logo.src);
  
  return (
    <KonvaImage
      key={logo.id}
      image={image}
      x={logo.position.x}
      y={logo.position.y}
      scaleX={logo.scale.scaleX}
      scaleY={logo.scale.scaleY}
      draggable={true}
      onDragEnd={(e) => {
        updateItemPosition(
          logo.id, 
          { x: e.target.x(), y: e.target.y() }, 
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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, scale: 1 });
  
  // Costanti per le dimensioni originali del canvas
  const ORIGINAL_WIDTH = 1440;
  const ORIGINAL_HEIGHT = 1800;
  
  // Funzione per calcolare le dimensioni e la scala
  const calculateDimensions = () => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const maxHeight = window.innerHeight * 0.8;
    let scale = Math.min(containerWidth / ORIGINAL_WIDTH, maxHeight / ORIGINAL_HEIGHT);
    scale = Math.max(0.2, Math.min(scale, 1));
    const scaledWidth = ORIGINAL_WIDTH * scale;
    const scaledHeight = ORIGINAL_HEIGHT * scale;
    
    setDimensions({
      width: scaledWidth,
      height: scaledHeight,
      scale: scale
    });
  };
  
 

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
          width={ORIGINAL_WIDTH}
          height={ORIGINAL_HEIGHT}
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
              />
            ))}
            
            {/* Renderizza il titolo come testo draggable */}
            <Text
              text={title}
              fontSize={titleFontSize}
              fill={titleColor}
              x={titlePosition.x}
              y={titlePosition.y}
              align="center"
              width={ORIGINAL_WIDTH}
              fontFamily={titleFont}
              draggable={true}
              onDragEnd={(e) => setTitlePosition({ x: e.target.x(), y: e.target.y() })}
            />
            {/* Renderizza il testo come testo draggable */}
            <Text
              text={text}
              fontSize={textFontSize}
              fill={textColor}
              x={textPosition.x}
              y={textPosition.y}
              align="center"
              width={ORIGINAL_WIDTH}
              fontFamily={textFont}
              draggable={true}
              onDragEnd={(e) => setTextPosition({ x: e.target.x(), y: e.target.y() })}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default CanvasNews;
