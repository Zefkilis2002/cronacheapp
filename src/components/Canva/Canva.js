// Canva.js
import React, { useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text } from 'react-konva';
import useImage from 'use-image';

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


  // Funzione helper per calcolare le dimensioni scalate di un'immagine
  const getScaledDimensions = (image, maxWidth, maxHeight) => {
    const { width, height } = image;
    const aspectRatio = width / height;
    if (width > maxWidth || height > maxHeight) {
      return aspectRatio > 1
        ? { width: maxWidth, height: maxWidth / aspectRatio }
        : { width: maxHeight * aspectRatio, height: maxHeight };
    }
    return { width, height };
  };

  // Funzione per scalare il canvas in base alle dimensioni della finestra
  const scaleCanvas = () => {
    const stage = stageRef.current;
    if (stage) {
      const containerWidth = window.innerWidth * 0.8;
      const containerHeight = window.innerHeight * 0.8;
      const scale = Math.min(containerWidth / 1440, containerHeight / 1800);
      stage.width(1440 * scale);
      stage.height(1800 * scale);
      stage.scale({ x: scale, y: scale });
    }
  };

  useEffect(() => {
    scaleCanvas();
    window.addEventListener('resize', scaleCanvas);
    return () => window.removeEventListener('resize', scaleCanvas);
  }, [stageRef]);

  return (
    <div className="canvas-container">
      <Stage ref={stageRef} width={1440} height={1800} style={{ border: '1px solid black' }}>
        {/* Primo layer: immagine principale (da file o Instagram) */}
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
          {instagramImage && (
            <KonvaImage
              image={instagramImage}
              x={imagePosition.x}
              y={imagePosition.y}
              scaleX={imageScale.scaleX}
              scaleY={imageScale.scaleY}
              draggable
              onDragEnd={handleDragEnd}
              onTransformEnd={handleTransform}
            />
          )}
        </Layer>
        {/* Secondo layer: background, loghi e testi */}
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
          {scorersTeam2.map((scorer, index) => (
            <Text
              key={index}
              text={scorer}
              fontSize={50}
              fontFamily="Kenyan Coffee Regular"
              fill="white"
              align="right"
              width={300}
              x={1094}
              y={1510 + index * 60}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canva;
