// Canva.js
import React, { useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text } from 'react-konva';
import useImage from 'use-image';
import './Canva.css';

const Canva = ({
  stageRef,
  selectedTabellino,
  userImage,
  instagramImage,
  imagePosition,
  imageScale,
  handleDragEnd,
  handleTransform,
  selectedLogo1,
  selectedLogo2,
  uploadedLogo1,
  uploadedLogo2,
  logo1Position,
  logo2Position,
  logo1Scale,
  logo2Scale,
  score1,
  score2,
  score1Y,
  score2Y,
  scorersTeam1,
  scorersTeam2
}) => {
  // Carica il background in base al tabellino selezionato (passato via props)
  const [background] = useImage(`/tabellini/${selectedTabellino}`);
  // Carica l'immagine principale da file (userImage)
  const [uploadedImg] = useImage(userImage);
  // Carica i loghi (se viene fatto upload, altrimenti usa quello selezionato)
  const [logo1] = useImage(uploadedLogo1 ? uploadedLogo1 : `${window.location.origin}${selectedLogo1}`);
  const [logo2] = useImage(uploadedLogo2 ? uploadedLogo2 : `${window.location.origin}${selectedLogo2}`);

  const proxyUrl = instagramImage && instagramImage !== 'null' 
    ? `http://localhost:5000/proxy-image?url=${encodeURIComponent(instagramImage)}` 
    : null;
  const [instaImg, status] = useImage(proxyUrl, 'anonymous');

  // Improved function to scale canvas with iOS Safari compatibility
  useEffect(() => {
    const scaleCanvas = () => {
      const stage = stageRef.current;
      if (!stage) return;
      
      // Get the parent container dimensions
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight * 0.8;
      
      // Original canvas dimensions
      const originalWidth = 1440;
      const originalHeight = 1800;
      
      // Calculate the scale factor while preserving aspect ratio
      const scale = Math.min(
        containerWidth / originalWidth,
        containerHeight / originalHeight
      ) * 0.85; // 85% to leave some margin
      
      // Apply scale to the stage
      stage.width(originalWidth);
      stage.height(originalHeight);
      stage.scale({ x: scale, y: scale });
      
      // Get the container element
      const container = stage.container();
      if (container) {
        // Apply styles directly to container for consistent behavior across browsers
        container.style.width = `${originalWidth * scale}px`;
        container.style.height = `${originalHeight * scale}px`;
        container.style.position = 'relative';
        container.style.margin = '0 auto';
        
        // Safari iOS specific fix: ensure the konvajs-content element has the right dimensions
        const konvaContent = container.querySelector('.konvajs-content');
        if (konvaContent) {
          konvaContent.style.width = `${originalWidth * scale}px`;
          konvaContent.style.height = `${originalHeight * scale}px`;
          konvaContent.style.position = 'relative';
          konvaContent.style.transform = 'translateZ(0)'; // Force hardware acceleration
          konvaContent.style.left = '0';
          konvaContent.style.top = '0';
          
          // Fix for Safari iOS canvas scaling
          const canvas = konvaContent.querySelector('canvas');
          if (canvas) {
            canvas.style.width = `${originalWidth * scale}px`;
            canvas.style.height = `${originalHeight * scale}px`;
            // Ensure width and height attributes match the scaled dimensions
            canvas.width = originalWidth * scale * window.devicePixelRatio;
            canvas.height = originalHeight * scale * window.devicePixelRatio;
            canvas.style.display = 'block';
          }
        }
      }
      
      // Redraw everything
      stage.batchDraw();
    };

    // Load fonts and then scale the canvas
    const loadFontsAndScale = async () => {
      try {
        const fonts = [
          new FontFace('Kenyan Coffee Bold Italic', 'url(/fonts/kenyan coffee bd it.otf)'),
          new FontFace('Kenyan Coffee Regular', 'url(/fonts/kenyan coffee rg.otf)')
        ];
        
        const loadedFonts = await Promise.all(fonts.map(font => font.load()));
        loadedFonts.forEach(font => document.fonts.add(font));
      } catch (error) {
        console.error('Font loading failed:', error);
      } finally {
        // Scale canvas regardless of font loading success
        scaleCanvas();
        
        // iOS Safari often needs a slight delay to render correctly
        setTimeout(() => {
          scaleCanvas();
        }, 100);
      }
    };
    
    loadFontsAndScale();
    
    // Add resize listener with debounce for better performance
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(scaleCanvas, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Cleanup
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [stageRef]);

  // Helper function to calculate scaled dimensions of an image
  const getScaledDimensions = (image, maxWidth, maxHeight) => {
    if (!image) return { width: 0, height: 0 };
    const { width, height } = image;
    const aspectRatio = width / height;
    if (width > maxWidth || height > maxHeight) {
      return aspectRatio > 1
        ? { width: maxWidth, height: maxWidth / aspectRatio }
        : { width: maxHeight * aspectRatio, height: maxHeight };
    }
    return { width, height };
  };

  return (
    <div className="canvas-container">
      <Stage 
        ref={stageRef} 
        width={1440} 
        height={1800} 
        style={{ border: '2px solid white' }}
      >
        {/* First layer: main image (from file or Instagram) */}
        <Layer>
          {uploadedImg && (
            <KonvaImage
              image={uploadedImg}
              x={imagePosition.x}
              y={imagePosition.y}
              scaleX={imageScale.scaleX}
              scaleY={imageScale.scaleY}
              draggable
              onDragEnd={handleDragEnd}
              onTransformEnd={handleTransform}
            />
          )}
         {proxyUrl && status === 'loaded' && instaImg && (
          <KonvaImage
            image={instaImg}
            x={imagePosition.x}
            y={imagePosition.y}
            scaleX={imageScale.scaleX}
            scaleY={imageScale.scaleY}
            width={instaImg.width}
            height={instaImg.height}
            draggable
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransform}
          />
        )}
        </Layer>
        {/* Second layer: background, logos and texts */}
        <Layer>
          {background && (
            <KonvaImage image={background} width={1440} height={1800} listening={false} />
          )}
          {logo1 && (
            <KonvaImage
              image={logo1}
              x={logo1Position.x}
              y={logo1Position.y}
              scaleX={logo1Scale.scaleX}
              scaleY={logo1Scale.scaleY}
              width={getScaledDimensions(logo1, 200, 200).width}
              height={getScaledDimensions(logo1, 200, 200).height}
            />
          )}
          {logo2 && (
            <KonvaImage
              image={logo2}
              x={logo2Position.x}
              y={logo2Position.y}
              scaleX={logo2Scale.scaleX}
              scaleY={logo2Scale.scaleY}
              width={getScaledDimensions(logo2, 200, 200).width}
              height={getScaledDimensions(logo2, 200, 200).height}
            />
          )}
          <Text
            text={String(score1)}
            fontSize={260}
            fontFamily="Kenyan Coffee Bold Italic"
            fill="white"
            stroke="black"
            strokeWidth={1}
            x={370}
            y={score1Y}
          />
          <Text
            text={String(score2)}
            fontSize={260}
            fontFamily="Kenyan Coffee Bold Italic"
            fill="white"
            stroke="black"
            strokeWidth={1}
            x={930}
            y={score2Y}
          />
          {scorersTeam1.map((scorer, index) => (
            <Text
              key={index}
              text={scorer}
              fontSize={50}
              fontFamily="Kenyan Coffee Regular"
              fill="white"
              x={40}
              y={1510 + index * 60}
            />
          ))}
          {scorersTeam2.map((scorer, index) => {
            const maxLength = 30;
            const displayText = scorer.length > maxLength 
              ? scorer.substring(0, maxLength) + '...' 
              : scorer;
            
            return (
              <Text
                key={index}
                text={displayText}
                fontSize={50}
                fontFamily="Kenyan Coffee Regular"
                fill="white"
                align="right"
                width={400}
                x={994}
                y={1510 + index * 60}
                wrap="none"
                listening={false}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canva;