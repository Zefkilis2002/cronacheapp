import React, { useEffect } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import DatiClassifica from './DatiClassifica';
import { CLASSIFICA_LAYOUT } from '../../config/layoutConstants';
import './CanvaClassifica.css';

const CanvaClassifica = ({
  stageRef,
  borderRef,
  selectedBackground,
  userImage,
  imagePosition,
  setImagePosition,
  imageScale,
  setImageScale,
  rows,
  onTeamClick,
  onValueClick
}) => {
  const [background] = useImage(`/sfondoClassifica/${selectedBackground}`);
  const [uploadedImg] = useImage(userImage);

  // 🔧 PINCH ZOOM LOGIC (ADAPTED FROM FullTime)
  const lastDistRef = React.useRef(0);
  const lastCenterRef = React.useRef(null);
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
      const oldScaleX = imageScale.scaleX;
      const oldScaleY = imageScale.scaleY;
      const newScaleX = oldScaleX * scaleBy;
      const newScaleY = oldScaleY * scaleBy;

      const MIN_SCALE = 0.1;
      const MAX_SCALE = 5;

      if (newScaleX >= MIN_SCALE && newScaleX <= MAX_SCALE) {
        // Calculate zoom centered on pinch
        const stageTransform = stage.getAbsoluteTransform().copy().invert();
        const centerInStage = stageTransform.point(currentCenter);
        const lastCenterInStage = stageTransform.point(lastCenterRef.current);

        const dx = centerInStage.x - lastCenterInStage.x;
        const dy = centerInStage.y - lastCenterInStage.y;

        const imgX = imagePosition.x;
        const imgY = imagePosition.y;

        const mousePointToImg = {
          x: centerInStage.x - imgX,
          y: centerInStage.y - imgY,
        };

        const newPos = {
          x: imgX + dx - (mousePointToImg.x * (scaleBy - 1)),
          y: imgY + dy - (mousePointToImg.y * (scaleBy - 1))
        };

        setImageScale({ scaleX: newScaleX, scaleY: newScaleY });
        setImagePosition(newPos);

        lastDistRef.current = currentDist;
        lastCenterRef.current = currentCenter;
      }
    }
  };

  const handleTouchEnd = () => {
    isPinchingRef.current = false;
    lastDistRef.current = 0;
    lastCenterRef.current = null;
  };

  useEffect(() => {
    const scaleCanvas = () => {
      const stage = stageRef.current;
      if (!stage) return;

      const originalWidth = CLASSIFICA_LAYOUT.STAGE.WIDTH;
      const originalHeight = CLASSIFICA_LAYOUT.STAGE.HEIGHT;

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
        container.style.touchAction = 'none';
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

  // Initial centering logic if image just loaded and position is 0,0 (simplification)
  // Ideally handled in parent or once on load.

  return (
    <div className="canvas-classifica-container">
      <Stage ref={stageRef} width={CLASSIFICA_LAYOUT.STAGE.WIDTH} height={CLASSIFICA_LAYOUT.STAGE.HEIGHT}>
        <Layer clipX={0} clipY={0} clipWidth={CLASSIFICA_LAYOUT.STAGE.WIDTH} clipHeight={CLASSIFICA_LAYOUT.STAGE.HEIGHT}>
          {/* Rettangolo di sfondo per visibilità */}
          <Rect
            x={0}
            y={0}
            width={CLASSIFICA_LAYOUT.STAGE.WIDTH}
            height={CLASSIFICA_LAYOUT.STAGE.HEIGHT}
            fill="#00061b"
          />

          {/* User Image Layer - Behind table */}
          {uploadedImg && (
            <KonvaImage
              image={uploadedImg}
              x={imagePosition.x}
              y={imagePosition.y}
              scaleX={imageScale.scaleX}
              scaleY={imageScale.scaleY}
              draggable
              onDragEnd={(e) => {
                setImagePosition({ x: e.target.x(), y: e.target.y() });
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          )}

          {/* Table Background Grid */}
          {background && (
            <KonvaImage
              image={background}
              width={CLASSIFICA_LAYOUT.STAGE.WIDTH}
              height={CLASSIFICA_LAYOUT.STAGE.HEIGHT}
              listening={false}
            />
          )}

          {/* Standings Data Layer */}
          <DatiClassifica
            rows={rows}
            onTeamClick={onTeamClick}
            onValueClick={onValueClick}
          />

        </Layer>
        <Layer>
          <Rect
            ref={borderRef}
            x={CLASSIFICA_LAYOUT.STAGE.BORDER.X}
            y={CLASSIFICA_LAYOUT.STAGE.BORDER.Y}
            width={CLASSIFICA_LAYOUT.STAGE.BORDER.WIDTH}
            height={CLASSIFICA_LAYOUT.STAGE.BORDER.HEIGHT}
            stroke={CLASSIFICA_LAYOUT.STAGE.BORDER.STROKE}
            strokeWidth={CLASSIFICA_LAYOUT.STAGE.BORDER.STROKE_WIDTH}
            listening={false}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default CanvaClassifica;
