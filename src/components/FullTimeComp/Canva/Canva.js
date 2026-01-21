import React, { useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Rect } from 'react-konva';
import useImage from 'use-image';
import './Canva.css';

const Canva = ({
  stageRef,
  borderRef,
  selectedTabellino,
  userImage,
  instagramImage,
  imagePosition,
  setImagePosition,
  imageScale,
  setImageScale,
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
  const [background] = useImage(`/tabellini/${selectedTabellino}`);
  const [uploadedImg] = useImage(userImage);
  const [logo1] = useImage(uploadedLogo1 || `${window.location.origin}${selectedLogo1}`);
  const [logo2] = useImage(uploadedLogo2 || `${window.location.origin}${selectedLogo2}`);

  // 🔧 PINCH ZOOM LOGIC (IMAGE ONLY)
  const lastDistRef = React.useRef(0);
  const lastCenterRef = React.useRef(null);
  const animationFrameRef = React.useRef(null);
  const isPinchingRef = React.useRef(false);

  const getDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const getCenter = (p1, p2) => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  };

  const handleTouchStart = (e) => {
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];
    
    if (touch1 && touch2) {
      e.evt.preventDefault();
      // Ferma il drag nativo di Konva se attivo, per dare priorità al pinch
      if (e.target.isDragging()) {
        e.target.stopDrag();
      }
      
      isPinchingRef.current = true;
      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };
      
      lastDistRef.current = getDistance(p1, p2);
      lastCenterRef.current = getCenter(p1, p2);
    }
  };

  const handleTouchMove = (e) => {
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];
    const stage = stageRef.current;

    if (touch1 && touch2 && stage) {
      e.evt.preventDefault();
      
      if (e.target.isDragging()) {
        e.target.stopDrag();
      }

      if (!isPinchingRef.current) {
        // Se inizia il pinch durante il move senza aver intercettato il start (raro ma possibile)
        isPinchingRef.current = true;
        const p1 = { x: touch1.clientX, y: touch1.clientY };
        const p2 = { x: touch2.clientX, y: touch2.clientY };
        lastDistRef.current = getDistance(p1, p2);
        lastCenterRef.current = getCenter(p1, p2);
        return;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const p1 = { x: touch1.clientX, y: touch1.clientY };
        const p2 = { x: touch2.clientX, y: touch2.clientY };

        const currentDist = getDistance(p1, p2);
        const currentCenter = getCenter(p1, p2);

        if (!lastDistRef.current || lastDistRef.current === 0) {
          lastDistRef.current = currentDist;
          lastCenterRef.current = currentCenter;
          return;
        }

        const scaleBy = currentDist / lastDistRef.current;

        // Recupera stato corrente dai props (o refs se vogliamo evitare chiusure vecchie, ma qui è gestito da react render loop)
        // Nota: imageScale e imagePosition vengono aggiornati ad ogni render.
        
        const oldScaleX = imageScale.scaleX;
        const oldScaleY = imageScale.scaleY;
        
        const newScaleX = oldScaleX * scaleBy;
        const newScaleY = oldScaleY * scaleBy;

        // Limiti min/max
        const MIN_SCALE = 0.1;
        const MAX_SCALE = 5;

        if (newScaleX >= MIN_SCALE && newScaleX <= MAX_SCALE) {
          // Calcolo del punto sullo stage (in coordinate locali del canvas non scalato, ma stage stesso è scalato dal responsive logic)
          // La logica responsive scala tutto lo stage. Noi dobbiamo ragionare in coordinate relative allo stage.
          // stage.getPointerPosition() potrebbe essere utile, ma qui abbiamo clientX/Y.
          // Trasformiamo clientX/Y in coordinate dello Stage "virtuale" (1440x1800)
          
          const stageTransform = stage.getAbsoluteTransform().copy().invert();
          const centerInStage = stageTransform.point(currentCenter);
          const lastCenterInStage = stageTransform.point(lastCenterRef.current);

          // Calcolo zoom centrato sull'immagine
          // L'immagine è a (imagePosition.x, imagePosition.y)
          // Il punto sotto il dito (centerInStage) deve rimanere sotto il dito.
          // Formula: newPos = mousePoint - (mousePoint - oldPos) * scaleFactor
          // Ma qui abbiamo anche un movimento (pan) delle dita (currentCenter vs lastCenter).
          
          // Delta spostamento dita (pan)
          const dx = centerInStage.x - lastCenterInStage.x;
          const dy = centerInStage.y - lastCenterInStage.y;

          // Punto relativo all'immagine prima dello zoom
          const imgX = imagePosition.x || centeredX; // Fallback se undefined
          const imgY = imagePosition.y || centeredY;

          const mousePointToImg = {
            x: centerInStage.x - imgX,
            y: centerInStage.y - imgY,
          };

          // Nuova posizione calcolata:
          // 1. Applica Pan
          // 2. Applica Zoom compensando lo spostamento del punto di interesse
          const newPos = {
             x: imgX + dx - (mousePointToImg.x * (scaleBy - 1)),
             y: imgY + dy - (mousePointToImg.y * (scaleBy - 1))
          };

          setImageScale({ scaleX: newScaleX, scaleY: newScaleY });
          setImagePosition(newPos);
          
          lastDistRef.current = currentDist;
          lastCenterRef.current = currentCenter;
        }
      });
    }
  };

  const handleTouchEnd = () => {
    isPinchingRef.current = false;
    lastDistRef.current = 0;
    lastCenterRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const proxyUrl = instagramImage && instagramImage !== 'null'
    ? `http://localhost:5000/proxy-image?url=${encodeURIComponent(instagramImage)}`
    : null;
  const [instaImg, status] = useImage(proxyUrl, 'anonymous');

  useEffect(() => {
    const scaleCanvas = () => {
      const stage = stageRef.current;
      if (!stage) return;

      const originalWidth = 1440;
      const originalHeight = 1800;

      const containerWidth = window.innerWidth * 0.9;
      const containerHeight = window.innerHeight * 0.9;

      const scale = Math.min(
        containerWidth / originalWidth,
        containerHeight / originalHeight
      );

      stage.width(originalWidth);
      stage.height(originalHeight);
      stage.scale({ x: scale, y: scale });

      const container = stage.container();
      if (container) {
        const scaledWidth = originalWidth * scale;
        const scaledHeight = originalHeight * scale;

        container.style.width = `${scaledWidth}px`;
        container.style.height = `${scaledHeight}px`;
        container.style.margin = '0 auto';
        container.style.position = 'relative';
        container.style.touchAction = 'none'; // Importante per disabilitare zoom browser
        container.style.userSelect = 'none';
        container.style.webkitUserSelect = 'none';
      }

      stage.batchDraw();
    };

    scaleCanvas();

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(scaleCanvas, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(scaleCanvas, 100);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [stageRef]);

  const getScaledDimensions = (image, maxWidth, maxHeight) => {
    if (!image) return { width: 0, height: 0 };
    const { width, height } = image;
    const aspectRatio = width / height;
    let scaledWidth, scaledHeight;

    if (aspectRatio > maxWidth / maxHeight) {
      scaledWidth = maxWidth;
      scaledHeight = maxWidth / aspectRatio;
    } else {
      scaledHeight = maxHeight;
      scaledWidth = maxHeight * aspectRatio;
    }

    return { width: scaledWidth, height: scaledHeight };
  };

  // Calcola le dimensioni scalate per l'immagine
  const imageDimensions = getScaledDimensions(instaImg || uploadedImg, 1440, 1800);

  // Calcola la posizione per centrare l'immagine
  const centeredX = (1440 - imageDimensions.width) / 2;
  const centeredY = (1800 - imageDimensions.height) / 2;

  return (
    <div className="canvas-container">
      <Stage 
        ref={stageRef} 
        width={1440} 
        height={1800}
      >
        <Layer clipX={0} clipY={0} clipWidth={1440} clipHeight={1800}>
          {uploadedImg && (
            <KonvaImage
              image={uploadedImg}
              x={imagePosition?.x ?? centeredX}
              y={imagePosition?.y ?? centeredY}
              width={imageDimensions.width}
              height={imageDimensions.height}
              scaleX={imageScale.scaleX}
              scaleY={imageScale.scaleY}
              draggable
              onDragEnd={handleDragEnd}
              onTransformEnd={handleTransform}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          )}
          {proxyUrl && status === 'loaded' && instaImg && (
            <KonvaImage
              image={instaImg}
              x={imagePosition?.x ?? centeredX}
              y={imagePosition?.y ?? centeredY}
              width={imageDimensions.width}
              height={imageDimensions.height}
              scaleX={imageScale.scaleX}
              scaleY={imageScale.scaleY}
              draggable
              onDragEnd={handleDragEnd}
              onTransformEnd={handleTransform}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          )}
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
            fontSize={210}
            fontFamily="Kenyan Coffee Bold Italic"
            fill="white"
            stroke="black"
            strokeWidth={1}
            x={480}
            y={score1Y}
          />
          <Text
            text={String(score2)}
            fontSize={210}
            fontFamily="Kenyan Coffee Bold Italic"
            fill="white"
            stroke="black"
            strokeWidth={1}
            x={835}
            y={score2Y}
          />
          {scorersTeam1.map((scorer, index) => (
            <Text
              key={index}
              text={scorer}
              fontSize={30}
              fontFamily="Benzin-Medium"
              fill="white"
              x={180}
              y={1510 + index * 40}
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
                fontSize={30}
                fontFamily="Benzin-Medium"
                fill="white"
                align="right"
                width={400}
                x={880}
                y={1510 + index * 40}
                wrap="none"
                listening={false}
              />
            );
          })}
        </Layer>
        <Layer>
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
        </Layer>
      </Stage>
    </div>
  );
};

export default Canva;