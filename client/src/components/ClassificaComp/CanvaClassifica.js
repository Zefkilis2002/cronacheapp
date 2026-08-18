import React, { useEffect, useState } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import DatiClassifica from './DatiClassifica';
import { CLASSIFICA_LAYOUT } from '../../config/layoutConstants';
import './CanvaClassifica.css';

const STAGE_W = CLASSIFICA_LAYOUT.STAGE.WIDTH;
const STAGE_H = CLASSIFICA_LAYOUT.STAGE.HEIGHT;

// Loghi header: competizione (sinistra) e pagina (destra)
const HeaderLogos = ({ stageRef }) => {
  const H = CLASSIFICA_LAYOUT.HEADER;
  const [compLogo] = useImage(CLASSIFICA_LAYOUT.COMP_LOGO);
  const [pageLogo] = useImage(CLASSIFICA_LAYOUT.PAGE_LOGO);

  // I loghi header possono caricarsi dopo l'ultimo redraw: forziamo un
  // batchDraw quando arrivano, altrimenti restano invisibili sul canvas.
  useEffect(() => {
    if ((compLogo || pageLogo) && stageRef && stageRef.current) {
      stageRef.current.batchDraw();
    }
  }, [compLogo, pageLogo, stageRef]);

  const compW = compLogo ? compLogo.width * (H.LEFT_LOGO_H / compLogo.height) : 0;
  const pageW = pageLogo ? pageLogo.width * (H.RIGHT_LOGO_H / pageLogo.height) : 0;
  const maxH = Math.max(H.LEFT_LOGO_H, H.RIGHT_LOGO_H);

  return (
    <>
      {compLogo && (
        <KonvaImage
          image={compLogo}
          x={H.LEFT_X}
          y={H.PAD_TOP + (maxH - H.LEFT_LOGO_H) / 2}
          width={compW}
          height={H.LEFT_LOGO_H}
          listening={false}
        />
      )}
      {pageLogo && (
        <KonvaImage
          image={pageLogo}
          x={H.RIGHT_X - pageW}
          y={H.PAD_TOP + (maxH - H.RIGHT_LOGO_H) / 2}
          width={pageW}
          height={H.RIGHT_LOGO_H}
          listening={false}
        />
      )}
    </>
  );
};

const BORDER = 3; // bordo bianco esterno attorno al canva

const CanvaClassifica = ({
  stageRef,
  variant,
  rows,
  userImage,
  imagePosition,
  setImagePosition,
  imageScale,
  setImageScale,
  onTeamClick,
  onValueClick,
  onDownload
}) => {
  const [uploadedImg] = useImage(userImage);
  const [, setFontTick] = useState(0);

  // Ridisegna quando i font (Oswald / IBM Plex Mono) sono pronti
  useEffect(() => {
    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts) {
      Promise.all([
        document.fonts.load('600 40px Oswald'),
        document.fonts.load('500 29px Oswald'),
        document.fonts.load('400 19px "IBM Plex Mono"')
      ]).catch(() => {}).finally(() => {
        document.fonts.ready.then(() => {
          if (!cancelled) {
            setFontTick(t => t + 1);
            if (stageRef.current) stageRef.current.batchDraw();
          }
        });
      });
    }
    return () => { cancelled = true; };
  }, [stageRef]);

  // 🔧 PINCH ZOOM LOGIC
  const lastDistRef = React.useRef(0);
  const lastCenterRef = React.useRef(null);
  const isPinchingRef = React.useRef(false);

  const getDistance = (p1, p2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  const getCenter = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });

  const handleTouchStart = (e) => {
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];
    if (touch1 && touch2) {
      e.evt.preventDefault();
      if (e.target.isDragging()) e.target.stopDrag();
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
      if (e.target.isDragging()) e.target.stopDrag();

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
      const newScaleX = imageScale.scaleX * scaleBy;
      const newScaleY = imageScale.scaleY * scaleBy;
      const MIN_SCALE = 0.1;
      const MAX_SCALE = 5;

      if (newScaleX >= MIN_SCALE && newScaleX <= MAX_SCALE) {
        const stageTransform = stage.getAbsoluteTransform().copy().invert();
        const centerInStage = stageTransform.point(currentCenter);
        const lastCenterInStage = stageTransform.point(lastCenterRef.current);

        const dx = centerInStage.x - lastCenterInStage.x;
        const dy = centerInStage.y - lastCenterInStage.y;

        const mousePointToImg = {
          x: centerInStage.x - imagePosition.x,
          y: centerInStage.y - imagePosition.y,
        };

        const newPos = {
          x: imagePosition.x + dx - (mousePointToImg.x * (scaleBy - 1)),
          y: imagePosition.y + dy - (mousePointToImg.y * (scaleBy - 1))
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

      // Misura il contenitore ESTERNO (non il wrapper col bordo, che si
      // adatta al canva stesso), sottraendo padding e spessore del bordo.
      const outer = stage.container()?.closest('.canvas-classifica-container');
      let containerWidth = 0;
      if (outer) {
        const outerStyle = window.getComputedStyle(outer);
        containerWidth = outer.clientWidth
          - parseFloat(outerStyle.paddingLeft)
          - parseFloat(outerStyle.paddingRight);
      }
      if (!containerWidth || containerWidth <= 0) {
        containerWidth = window.innerWidth * 0.95;
      }
      containerWidth -= 2 * BORDER;
      const containerHeight = window.innerHeight * 0.95 - 2 * BORDER;

      const scale = Math.min(containerWidth / STAGE_W, containerHeight / STAGE_H);
      const scaledWidth = STAGE_W * scale;
      const scaledHeight = STAGE_H * scale;

      stage.width(scaledWidth);
      stage.height(scaledHeight);
      stage.scale({ x: scale, y: scale });

      const container = stage.container();
      if (container) {
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
    window.addEventListener('orientationchange', handleResize);

    let resizeObserver;
    const outer = stageRef.current?.container()?.closest('.canvas-classifica-container');
    if (outer && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(outer);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(resizeTimeout);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [stageRef]);

  return (
    <div className="canvas-classifica-container">
      <div className="canvas-classifica-wrapper">
        <button
          className="canvas-download-btn"
          onClick={onDownload}
          title="Scarica Immagine"
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
        <Stage ref={stageRef} width={STAGE_W} height={STAGE_H}>
        <Layer clipX={0} clipY={0} clipWidth={STAGE_W} clipHeight={STAGE_H}>
          {/* Sfondo scuro base */}
          <Rect x={0} y={0} width={STAGE_W} height={STAGE_H} fill={CLASSIFICA_LAYOUT.BG_FILL} />

          {/* Foto utente (dietro) */}
          {uploadedImg && (
            <KonvaImage
              image={uploadedImg}
              x={imagePosition.x}
              y={imagePosition.y}
              scaleX={imageScale.scaleX}
              scaleY={imageScale.scaleY}
              draggable
              onDragEnd={(e) => setImagePosition({ x: e.target.x(), y: e.target.y() })}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          )}

          {/* Overlay gradiente scuro */}
          <Rect
            x={0}
            y={0}
            width={STAGE_W}
            height={STAGE_H}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: STAGE_H }}
            fillLinearGradientColorStops={CLASSIFICA_LAYOUT.OVERLAY_STOPS}
            listening={false}
          />

          {/* Header loghi */}
          <HeaderLogos stageRef={stageRef} />

          {/* Tabella classifica */}
          <DatiClassifica
            variant={variant}
            rows={rows}
            onTeamClick={onTeamClick}
            onValueClick={onValueClick}
          />
        </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default CanvaClassifica;
