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
  const [background] = useImage(`/tabellini/${selectedTabellino}`);
  const [uploadedImg] = useImage(userImage);
  const [logo1] = useImage(uploadedLogo1 || `${window.location.origin}${selectedLogo1}`);
  const [logo2] = useImage(uploadedLogo2 || `${window.location.origin}${selectedLogo2}`);

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

      // Get the container's parent dimensions
      const containerWidth = window.innerWidth * 0.9;
      const containerHeight = window.innerHeight * 0.9;

      // Calculate scale while maintaining aspect ratio
      const scale = Math.min(
        containerWidth / originalWidth,
        containerHeight / originalHeight
      );

      // Set fixed dimensions
      stage.width(originalWidth);
      stage.height(originalHeight);
      stage.scale({ x: scale, y: scale });

      // Apply dimensions to container
      const container = stage.container();
      if (container) {
        const scaledWidth = originalWidth * scale;
        const scaledHeight = originalHeight * scale;
        
        container.style.width = `${scaledWidth}px`;
        container.style.height = `${scaledHeight}px`;
        container.style.margin = '0 auto';
        container.style.position = 'relative';
        
        // Prevent mobile browsers from adjusting viewport
        container.style.touchAction = 'none';
        container.style.userSelect = 'none';
        container.style.webkitUserSelect = 'none';
      }

      stage.batchDraw();
    };

    // Initial scaling
    scaleCanvas();

    // Debounce resize handler
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
    if (width > maxWidth || height > maxHeight) {
      return aspectRatio > 1
        ? { width: maxWidth, height: maxWidth / aspectRatio }
        : { width: maxHeight * aspectRatio, height: maxHeight };
    }
    return { width, height };
  };

  return (
    <div className="canvas-container">
      <Stage ref={stageRef} width={1440} height={1800}>
        {/* Layer con clipping per tutti gli elementi */}
        <Layer
          clipX={0}
          clipY={0}
          clipWidth={1440}
          clipHeight={1800}
        >
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
        {/* Layer separato per il bordo, senza clipping */}
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