import React from 'react';
import { Stage, Layer, Image as KonvaImage, Text } from 'react-konva';

function CanvasNews({
  stageRef,
  uploadedImage,
  imagePosition,
  imageScale,
  background,
  uploadedLogo,
  logoPosition,
  logoScale,
  setLogoPosition,
  title,
  titleFontSize,
  titleColor,
  titlePosition,
  titleFont,
  text,
  textFontSize,
  textColor,
  textPosition,
  textFont
}) {
  return (
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
  );
}

export default CanvasNews;