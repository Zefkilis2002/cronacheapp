import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Group } from 'react-konva';
import useImage from 'use-image';
import './CanvasNews.css';

// Componente per le immagini di sfondo
const BackgroundImage = ({ bgImage, updateItemPosition, backgroundImages, setBackgroundImages, isSelected = false, onSelect = () => {}, showSelection = true }) => {
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
      stroke={(showSelection && isSelected) ? '#b4ff00' : undefined}
      strokeWidth={(showSelection && isSelected) ? 3 : 0}
      shadowBlur={(showSelection && isSelected) ? 10 : 0}
      onClick={onSelect}
      onTap={onSelect}
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
const LogoImage = ({ logo, updateItemPosition, logos, setLogos, isSelected = false, onSelect = () => {} , showSelection = true }) => {
  const [image] = useImage(logo.src);
  
  return (
    <KonvaImage
      key={logo.id}
      image={image}
      x={logo.position.x}
      y={logo.position.y}
      scaleX={logo.scale.scaleX}
      scaleY={logo.scale.scaleY}
      rotation={logo.rotation || 0} 
      offsetX={image ? image.width / 2 : 0}
      offsetY={image ? image.height / 2 : 0}
      draggable={true}
      stroke={(showSelection && isSelected) ? '#b4ff00' : undefined}
      strokeWidth={(showSelection && isSelected) ? 3 : 0}
      shadowBlur={(showSelection && isSelected) ? 10 : 0}
      onClick={onSelect}
      onTap={onSelect}
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
  richText,
  textFontSize,
  textColor,
  textPosition,
  textFont,
  setTitlePosition,
  setTextPosition,
  textAboveImages = true,
  selectedBackground = null,
  selectedLogo = null,
  setSelectedBackground = () => {}, 
  setSelectedLogo = () => {}, 
  showSelection = true
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, scale: 1 });

  // cosa stai controllando con la tastiera: 'title' | 'text' | null
  const [selectedText, setSelectedText] = useState(null);

  // scala locale per titolo e testo
  const [titleScale, setTitleScale] = useState({ x: 1, y: 1 });
  const [textScale,  setTextScale ] = useState({ x: 1, y: 1 });

  // 🔧 COSTANTI FISSE - NON CAMBIANO MAI
  const ORIGINAL_WIDTH = 1440;
  const ORIGINAL_HEIGHT = 1800;
  
  // 🔧 STABILIZZAZIONE AVANZATA
  const stableStateRef = useRef({
    isInitialized: false,
    lastValidDimensions: { width: 0, height: 0, scale: 1 },
    lastContainerWidth: 0,
    lastViewportHeight: 0,
    resizeTimer: null,
    orientationTimer: null,
    isCalculating: false,
    skipCount: 0,
    forceUpdate: false
  });

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const nudgePos = (p, dx, dy) => ({ x: p.x + dx, y: p.y + dy });

  // Sensibilità per i tasti
  const KEY_MOVE_STEP = 2;
  const KEY_SCALE_STEP = 0.02;
  const KEY_ROTATE_STEP = 2;
  const normalizeAngle = (a) => ((a % 360) + 360) % 360;

  const measureCtxRef = useRef(null);
  useEffect(() => {
    const c = document.createElement('canvas');
    measureCtxRef.current = c.getContext('2d');
  }, []);

  const measureWidth = (t, fontFamily, fontSize) => {
    const ctx = measureCtxRef.current;
    if (!ctx) return 0;
    ctx.font = `${fontSize}px ${fontFamily}`;
    const m = ctx.measureText(t || '');
    return m.width || 0;
  };

  const calculateDimensions = useCallback(() => {
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
  }, []);

  // useEffect per il calcolo iniziale e il resize - versione sicura per mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateDimensions();
    }, 100);
    
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        calculateDimensions();
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [containerRef, calculateDimensions]);

  useEffect(() => {
    if (stageRef.current && dimensions.scale > 0) {
      requestAnimationFrame(() => {
        if (stageRef.current) {
          // Usa le dimensioni calcolate (scalate) per il canvas viewport
          stageRef.current.width(dimensions.width);
          stageRef.current.height(dimensions.height);
          stageRef.current.scale({ x: dimensions.scale, y: dimensions.scale });
          stageRef.current.batchDraw();
        }
      });
    }
  }, [dimensions, stageRef]);

  // Gestione tastiera
  const handleKeyDown = (e) => {
    const step = KEY_MOVE_STEP;
    const upF = 1 + KEY_SCALE_STEP;
    const downF = 1 / (1 + KEY_SCALE_STEP);

    let handled = true;

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
      const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

      if (selectedLogo) {
        const logo = logos.find(l => l.id === selectedLogo);
        if (logo) {
          updateItemPosition(selectedLogo, nudgePos(logo.position, dx, dy), logos, setLogos);
        }
      } else if (selectedBackground) {
        const bg = backgroundImages.find(b => b.id === selectedBackground);
        if (bg) {
          updateItemPosition(selectedBackground, nudgePos(bg.position, dx, dy), backgroundImages, setBackgroundImages);
        }
      } else if (selectedText === 'title') {
        setTitlePosition(p => nudgePos(p, dx, dy));
      } else if (selectedText === 'text') {
        setTextPosition(p => nudgePos(p, dx, dy));
      } else {
        handled = false;
      }
    } else if (e.key === '+' || e.key === '=' || e.key === 'NumpadAdd') {
      if (selectedLogo) {
        setLogos(ls => ls.map(l => l.id !== selectedLogo ? l : ({
          ...l,
          scale: {
            scaleX: clamp(l.scale.scaleX * upF, 0.05, 8),
            scaleY: clamp(l.scale.scaleY * upF, 0.05, 8),
          }
        })));
      } else if (selectedBackground) {
        setBackgroundImages(bs => bs.map(b => b.id !== selectedBackground ? b : ({
          ...b,
          scale: {
            scaleX: clamp(b.scale.scaleX * upF, 0.05, 8),
            scaleY: clamp(b.scale.scaleY * upF, 0.05, 8),
          }
        })));
      } else if (selectedText === 'title') {
        setTitleScale(s => ({ x: s.x * upF, y: s.y * upF }));
      } else if (selectedText === 'text') {
        setTextScale(s => ({ x: s.x * upF, y: s.y * upF }));
      } else {
        handled = false;
      }
    } else if (e.key === '-' || e.key === '_' || e.key === 'NumpadSubtract') {
      if (selectedLogo) {
        setLogos(ls => ls.map(l => l.id !== selectedLogo ? l : ({
          ...l,
          scale: {
            scaleX: clamp(l.scale.scaleX * downF, 0.05, 8),
            scaleY: clamp(l.scale.scaleY * downF, 0.05, 8),
          }
        })));
      } else if (selectedBackground) {
        setBackgroundImages(bs => bs.map(b => b.id !== selectedBackground ? b : ({
          ...b,
          scale: {
            scaleX: clamp(b.scale.scaleX * downF, 0.05, 8),
            scaleY: clamp(b.scale.scaleY * downF, 0.05, 8),
          }
        })));
      } else if (selectedText === 'title') {
        setTitleScale(s => ({ x: s.x * downF, y: s.y * downF }));
      } else if (selectedText === 'text') {
        setTextScale(s => ({ x: s.x * downF, y: s.y * downF }));
      } else {
        handled = false;
      }
    } else if (e.key === '[' || e.key === ']' || e.key === 'NumpadDivide' || e.key === 'NumpadMultiply') {
      if (!selectedLogo) {
        handled = false;
      } else {
        const dir = (e.key === ']' || e.key === 'NumpadMultiply') ? 1 : -1;
        const delta = KEY_ROTATE_STEP * dir;

        setLogos(ls => ls.map(l => {
          if (l.id !== selectedLogo) return l;
          const prev = (typeof l.rotation === 'number') ? l.rotation : 0;
          return { ...l, rotation: normalizeAngle(prev + delta) };
        }));
      }
    } else {
      handled = false;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Componenti Rich Text e Multi Line Text
  const RichTextGroup = ({ lines, x, y, fontFamily, fontSize, defaultColor, onClick = () => {} }) => {
    const lineHeight = Math.round(fontSize * 1);
    let yOffset = 0;
    const elements = [];

    lines.forEach((segments, li) => {
      if (!segments || segments.length === 0 || (segments.length === 1 && !segments[0].text)) {
        yOffset += lineHeight;
        return;
      }
      const totalWidth = segments.reduce((acc, s) => acc + measureWidth(s.text || '', fontFamily, fontSize), 0);
      const startX = -totalWidth / 2;
      let xOffset = 0;

      segments.forEach((segment, si) => {
        const segmentWidth = measureWidth(segment.text || '', fontFamily, fontSize);
        const segmentColor = segment.color || defaultColor;

        elements.push(
          <Text
            key={`rt-${li}-${si}`}
            text={segment.text || ''}
            fontSize={fontSize}
            fill={segmentColor}
            x={startX + xOffset}
            y={yOffset}
            align="left"
            fontFamily={fontFamily}
          />
        );

        xOffset += segmentWidth;
      });

      yOffset += lineHeight;
    });

    return (
      <Group
        x={x + ORIGINAL_WIDTH / 2}
        y={y}
        draggable
        scaleX={textScale.x}
        scaleY={textScale.y}
        onClick={onClick}
        onTap={onClick}
        onDragEnd={(e) => setTextPosition({ x: e.target.x() - ORIGINAL_WIDTH / 2, y: e.target.y() })}
      >
        {elements}
      </Group>
    );
  };

  const MultiLineText = ({ text, x, y, fontFamily, fontSize, color, width }) => {
    const lineHeight = Math.round(fontSize * 1.25);
    const elements = [];
    
    if (!text) return null;
    
    const lines = text.split('\n');
    
    lines.forEach((line, i) => {
      elements.push(
        <Text
          key={`line-${i}`}
          text={line}
          fontSize={fontSize}
          fill={color}
          x={0}
          y={i * lineHeight}
          align="center"
          width={width}
          fontFamily={fontFamily}
          listening={false}
        />
      );
    });
    
    return (
      <Group
        x={x}
        y={y}
        draggable
        onDragEnd={(e) => setTextPosition({ x: e.target.x(), y: e.target.y() })}
      >
        {elements}
      </Group>
    );
  };

  // 🔧 MULTI-TOUCH PINCH ZOOM LOGIC
  const lastDistRef = useRef(0);

  const getDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const handleTouchMove = (e) => {
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      // e.evt.preventDefault(); // Spesso gestito da touch-action CSS, ma utile qui se non blocca lo scroll
      const dist = getDistance(
        { x: touch1.clientX, y: touch1.clientY },
        { x: touch2.clientX, y: touch2.clientY }
      );

      if (lastDistRef.current === 0) {
        lastDistRef.current = dist;
        return;
      }

      const scale = dist / lastDistRef.current;
      
      if (selectedLogo) {
        setLogos(ls => ls.map(l => {
          if (l.id !== selectedLogo) return l;
          return {
            ...l,
            scale: {
              scaleX: l.scale.scaleX * scale,
              scaleY: l.scale.scaleY * scale
            }
          };
        }));
      } else if (selectedBackground) {
        setBackgroundImages(bs => bs.map(b => {
          if (b.id !== selectedBackground) return b;
          return {
            ...b,
            scale: {
              scaleX: b.scale.scaleX * scale,
              scaleY: b.scale.scaleY * scale
            }
          };
        }));
      }

      lastDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    lastDistRef.current = 0;
  };

  return (
    <div className="canvas-container" ref={containerRef}>
      <div 
        className="canvas-wrapper"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          outline: 'none',
          maxWidth: '100%',
          overflow: 'hidden',
          position: 'relative',
          margin: '0 auto',
          // 🔧 OTTIMIZZAZIONI MOBILE SPECIFICHE
          touchAction: 'none', // IMPORTANTE: Disabilita pan/zoom browser
          WebkitTapHighlightColor: 'transparent',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTextSizeAdjust: '100%',
          // 🔧 STABILIZZAZIONE LAYOUT
          minWidth: '200px',
          minHeight: '250px',
          boxSizing: 'border-box',
        }}
      >
        <Stage 
          ref={stageRef} 
          width={ORIGINAL_WIDTH}
          height={ORIGINAL_HEIGHT}
          className="canvas-stage"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            position: 'absolute',
            left: '0',
            top: '0',
            transformOrigin: 'top left',
            // 🔧 OTTIMIZZAZIONI RENDERING
            transform: 'translate3d(0,0,0)',
            WebkitTransform: 'translate3d(0,0,0)',
            WebkitTextSizeAdjust: '100%',
            touchAction: 'none',
            // 🔧 STABILIZZAZIONE DIMENSIONI
            width: '100%',
            objectFit: 'contain',
          }}
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
                isSelected={selectedBackground === bgImage.id}
                onSelect={() => { setSelectedBackground(bgImage.id); setSelectedLogo(null); }}
                showSelection={showSelection}
              />
            ))}

            {!textAboveImages && (
              <>
                <Text
                  text={title}
                  fontSize={titleFontSize}
                  fill={titleColor}
                  x={titlePosition.x + (ORIGINAL_WIDTH / 2)}
                  y={titlePosition.y}
                  align="center"
                  offsetX={measureWidth(title, titleFont, titleFontSize) / 2}
                  fontFamily={titleFont}
                  scaleX={titleScale.x}
                  scaleY={titleScale.y}
                  draggable={true}
                  onClick={() => setSelectedText('title')}
                  onTap={() => setSelectedText('title')}
                  onDragEnd={(e) => {
                    const newX = e.target.x() - (ORIGINAL_WIDTH / 2);
                    const newY = e.target.y();
                    setTitlePosition({ x: newX, y: newY });
                  }}
                />

                {(richText && richText.length > 0) ? (
                  <RichTextGroup
                    lines={richText}
                    x={textPosition.x}
                    y={textPosition.y}
                    fontFamily={textFont}
                    fontSize={textFontSize}
                    defaultColor={textColor}
                    onClick={() => setSelectedText('text')}
                  />
                ) : (
                  <MultiLineText
                    text={text}
                    fontSize={textFontSize}
                    color={textColor}
                    x={textPosition.x}
                    y={textPosition.y}
                    width={ORIGINAL_WIDTH}
                    fontFamily={textFont}
                  />
                )}
              </>
            )}

            {/* Background template */}
            {background && (
              <KonvaImage 
                image={background} 
                width={ORIGINAL_WIDTH}
                height={ORIGINAL_HEIGHT}
                listening={false} 
              />
            )}
            
            {/* Loghi */}
            {[...logos].reverse().map((logo) => (
              <LogoImage
                key={logo.id}
                logo={logo}
                updateItemPosition={updateItemPosition}
                logos={logos}
                setLogos={setLogos}
                isSelected={selectedLogo === logo.id}
                onSelect={() => { setSelectedLogo(logo.id); setSelectedBackground(null); }}
                showSelection={showSelection}
              />
            ))}
            
            {/* Testo sopra le immagini */}
            {textAboveImages && (
              <>
                <Text
                  text={title}
                  fontSize={titleFontSize}
                  fill={titleColor}
                  x={titlePosition.x + (ORIGINAL_WIDTH / 2)}
                  y={titlePosition.y}
                  align="center"
                  offsetX={measureWidth(title, titleFont, titleFontSize) / 2}
                  fontFamily={titleFont}
                  draggable={true}
                  onDragEnd={(e) => {
                    const newX = e.target.x() - (ORIGINAL_WIDTH / 2);
                    const newY = e.target.y();
                    setTitlePosition({ x: newX, y: newY });
                  }}
                />

                {(richText && richText.length > 0) ? (
                  <RichTextGroup
                    lines={richText}
                    x={textPosition.x}
                    y={textPosition.y}
                    fontFamily={textFont}
                    fontSize={textFontSize}
                    defaultColor={textColor}
                  />
                ) : (
                  <Text
                    text={text}
                    fontSize={textFontSize}
                    fill={textColor}
                    x={textPosition.x + (ORIGINAL_WIDTH / 2)}
                    y={textPosition.y}
                    align="center"
                    offsetX={measureWidth(text, textFont, textFontSize) / 2}
                    fontFamily={textFont}
                    draggable={true}
                    onDragEnd={(e) => {
                      const newX = e.target.x() - (ORIGINAL_WIDTH / 2);
                      const newY = e.target.y();
                      setTextPosition({ x: newX, y: newY });
                    }}
                  />
                )}
              </>
            )}

          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default CanvasNews;