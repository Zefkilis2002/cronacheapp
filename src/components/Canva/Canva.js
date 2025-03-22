// Canva.js
import React, { useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Rect } from 'react-konva';
import useImage from 'use-image';
import './Canva.css';

const Canva = ({
  stageRef,
  borderRef, // Aggiungi qui la borderRef
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
  scorersTeam2,

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

      // Ottieni le dimensioni del contenitore (finestra)
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight * 0.8;

      // Dimensioni originali del canvas
      const originalWidth = 1440;
      const originalHeight = 1800;

      // Calcola lo scale preservando il rapporto d'aspetto e lascia un margine
      const scale = Math.min(
        containerWidth / originalWidth,
        containerHeight / originalHeight
      ) * 0.85;

      // Applica le dimensioni originali e lo scaling allo stage
      stage.width(originalWidth);
      stage.height(originalHeight);
      stage.scale({ x: scale, y: scale });

      // Imposta lo stile del container dello stage
      const container = stage.container();
      if (container) {
        // Imposta le dimensioni del container includendo il bordo (box-sizing: border-box)
        container.style.boxSizing = 'border-box';
        container.style.width = `${originalWidth * scale}px`;
        container.style.height = `${originalHeight * scale}px`;
        container.style.position = 'relative';
        container.style.margin = '0 auto';

        // Gestione del contenitore di Konva (con classe .konvajs-content)
        const konvaContent = container.querySelector('.konvajs-content');
        if (konvaContent) {
          // Utilizza le dimensioni interne reali del container (clientWidth/Height escludono i bordi)
          const innerWidth = container.clientWidth;
          const innerHeight = container.clientHeight;

          konvaContent.style.width = `${innerWidth}px`;
          konvaContent.style.height = `${innerHeight}px`;
          konvaContent.style.position = 'relative';
          konvaContent.style.transform = 'translateZ(0)'; // Forza l'accelerazione hardware
          konvaContent.style.left = '0';
          konvaContent.style.top = '0';

          // Imposta il canvas interno in base alle dimensioni effettive del contenitore
          const canvas = konvaContent.querySelector('canvas');
          if (canvas) {
            canvas.style.width = `${innerWidth}px`;
            canvas.style.height = `${innerHeight}px`;
            // Imposta gli attributi width/height in base al devicePixelRatio per una resa nitida
            canvas.width = innerWidth * window.devicePixelRatio;
            canvas.height = innerHeight * window.devicePixelRatio;
            canvas.style.display = 'block';
          }
        }
      }

      // Ridisegna tutto lo stage
      stage.batchDraw();
    };

    // Funzione per caricare i font e scalare il canvas
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
        // Scala il canvas indipendentemente dal successo del caricamento dei font
        scaleCanvas();

        // iOS Safari spesso necessita di un piccolo ritardo per il rendering corretto
        setTimeout(() => {
          scaleCanvas();
        }, 100);
      }
    };

    loadFontsAndScale();

    // Aggiungi un listener per il resize con debounce per migliori prestazioni
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
          
          {/* Questa aggiunta garantisce che la cornice in basso sia visibile */}
          {/* Layer superiore: disegna il bordo sopra tutto */}
          <Rect
            ref={borderRef}
            x={0}
            y={0}
            width={1440}
            height={1800}
            stroke="white"
            strokeWidth={5}
            listening={false}
          />

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