import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  const [selectedText, setSelectedText] = useState(null);
  const [titleScale, setTitleScale] = useState({ x: 1, y: 1 });
  const [textScale, setTextScale] = useState({ x: 1, y: 1 });
  
  // Ref per tracciare le dimensioni stabili
  const stableDimensionsRef = useRef({ width: 0, height: 0, scale: 1 });
  const resizeTimeoutRef = useRef(null);
  const isCalculatingRef = useRef(false);

  // Costanti
  const ORIGINAL_WIDTH = 1440;
  const ORIGINAL_HEIGHT = 1800;
  const KEY_MOVE_STEP = 2;
  const KEY_SCALE_STEP = 0.02;
  const KEY_ROTATE_STEP = 2;
  
  // Canvas di misura per il testo
  const measureCtxRef = useRef(null);
  useEffect(() => {
    const c = document.createElement('canvas');
    measureCtxRef.current = c.getContext('2d');
  }, []);

  const measureWidth = useCallback((t, fontFamily, fontSize) => {
    const ctx = measureCtxRef.current;
    if (!ctx) return 0;
    ctx.font = `${fontSize}px ${fontFamily}`;
    const m = ctx.measureText(t || '');
    return m.width || 0;
  }, []);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const nudgePos = (p, dx, dy) => ({ x: p.x + dx, y: p.y + dy });
  const normalizeAngle = (a) => ((a % 360) + 360) % 360;

  // Funzione ottimizzata per calcolare le dimensioni
  const calculateDimensions = useCallback(() => {
    if (!containerRef.current || isCalculatingRef.current) return;
    
    isCalculatingRef.current = true;
    
    try {
      // Usa getBoundingClientRect per misurazioni più accurate
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width || containerRef.current.clientWidth;
      
      // Usa visualViewport se disponibile (più stabile su mobile)
      const viewportHeight = window.visualViewport 
        ? window.visualViewport.height 
        : window.innerHeight;
      
      // Calcola l'altezza massima con un valore fisso per evitare fluttuazioni
      const maxHeight = Math.min(viewportHeight * 0.8, 1800);
      
      // Calcola la scala con protezione contro valori anomali
      let scale = Math.min(
        containerWidth / ORIGINAL_WIDTH, 
        maxHeight / ORIGINAL_HEIGHT
      );
      
      // Limita la scala con valori più conservativi
      scale = Math.max(0.3, Math.min(scale, 1));
      
      // Arrotonda per evitare calcoli con decimali infiniti
      scale = Math.round(scale * 100) / 100;
      
      const scaledWidth = Math.round(ORIGINAL_WIDTH * scale);
      const scaledHeight = Math.round(ORIGINAL_HEIGHT * scale);
      
      // Verifica che i valori siano sensati prima di aggiornare
      if (scaledWidth > 0 && scaledHeight > 0 && !isNaN(scale)) {
        const newDimensions = {
          width: scaledWidth,
          height: scaledHeight,
          scale: scale
        };
        
        // Aggiorna solo se ci sono cambiamenti significativi (> 1%)
        const prevScale = stableDimensionsRef.current.scale;
        if (Math.abs(scale - prevScale) > 0.01 || prevScale === 1) {
          stableDimensionsRef.current = newDimensions;
          setDimensions(newDimensions);
        }
      }
    } finally {
      isCalculatingRef.current = false;
    }
  }, []);

  // Debounce robusto per gestire gli eventi
  const debouncedCalculate = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    
    resizeTimeoutRef.current = setTimeout(() => {
      calculateDimensions();
    }, 150); // Delay ottimizzato per mobile
  }, [calculateDimensions]);

  // Setup iniziale e gestione eventi ottimizzata
  useEffect(() => {
    let isMounted = true;
    
    // Calcolo iniziale dopo che il DOM è pronto
    const initializeCanvas = () => {
      if (!isMounted) return;
      calculateDimensions();
    };
    
    // Usa requestAnimationFrame per il primo calcolo
    requestAnimationFrame(initializeCanvas);
    
    // Handler unificato per tutti gli eventi di resize
    const handleResize = () => {
      if (!isMounted) return;
      debouncedCalculate();
    };
    
    // Gestione specifica per il visual viewport (mobile)
    const handleViewportChange = () => {
      if (!isMounted) return;
      // Su mobile, attendi che lo scroll si stabilizzi
      setTimeout(() => {
        if (isMounted) {
          calculateDimensions();
        }
      }, 300);
    };
    
    // Aggiungi listener con opzioni ottimizzate
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Listener specifico per mobile con visual viewport
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange, { passive: true });
      window.visualViewport.addEventListener('scroll', handleViewportChange, { passive: true });
    }
    
    // Listener per cambio orientamento (solo mobile)
    const mediaQuery = window.matchMedia('(orientation: portrait)');
    const handleOrientationChange = () => {
      if (!isMounted) return;
      setTimeout(() => {
        if (isMounted) {
          calculateDimensions();
        }
      }, 500); // Delay maggiore per cambio orientamento
    };
    mediaQuery.addListener(handleOrientationChange);
    
    // Cleanup
    return () => {
      isMounted = false;
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
      mediaQuery.removeListener(handleOrientationChange);
    };
  }, [calculateDimensions, debouncedCalculate]);

  // Applicazione dimensioni allo stage ottimizzata
  useEffect(() => {
    if (!stageRef.current || dimensions.scale <= 0) return;
    
    // Usa requestAnimationFrame per sincronizzare con il rendering
    const applyDimensions = () => {
      if (!stageRef.current) return;
      
      try {
        // Blocca temporaneamente il rendering durante l'aggiornamento
        stageRef.current.listening(false);
        
        // Imposta dimensioni e scala
        stageRef.current.width(ORIGINAL_WIDTH);
        stageRef.current.height(ORIGINAL_HEIGHT);
        stageRef.current.scale({ x: dimensions.scale, y: dimensions.scale });
        
        // Riabilita il rendering e forza un ridisegno
        stageRef.current.listening(true);
        stageRef.current.batchDraw();
      } catch (error) {
        console.error('Errore applicazione dimensioni:', error);
      }
    };
    
    requestAnimationFrame(applyDimensions);
  }, [dimensions, stageRef]);

  // Handler per i tasti (invariato ma ottimizzato)
  const handleKeyDown = useCallback((e) => {
    const step = KEY_MOVE_STEP;
    const upF = 1 + KEY_SCALE_STEP;
    const downF = 1 / (1 + KEY_SCALE_STEP);
    let handled = true;

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
        e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
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
    } else if (e.key === '[' || e.key === ']' || 
               e.key === 'NumpadDivide' || e.key === 'NumpadMultiply') {
      if (selectedLogo) {
        const dir = (e.key === ']' || e.key === 'NumpadMultiply') ? 1 : -1;
        const delta = KEY_ROTATE_STEP * dir;
        setLogos(ls => ls.map(l => {
          if (l.id !== selectedLogo) return l;
          const prev = (typeof l.rotation === 'number') ? l.rotation : 0;
          return { ...l, rotation: normalizeAngle(prev + delta) };
        }));
      } else {
        handled = false;
      }
    } else {
      handled = false;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [selectedLogo, selectedBackground, selectedText, logos, backgroundImages, 
      updateItemPosition, setLogos, setBackgroundImages, setTitlePosition, setTextPosition]);

  // Componente RichTextGroup ottimizzato
  const RichTextGroup = useMemo(() => ({ lines, x, y, fontFamily, fontSize, defaultColor, onClick = () => {} }) => {
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
  }, [measureWidth, textScale, setTextPosition, ORIGINAL_WIDTH]);

  // Componente MultiLineText
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
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          perspective: 1000,
          willChange: 'transform',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      >
        <Stage 
          ref={stageRef} 
          width={ORIGINAL_WIDTH}
          height={ORIGINAL_HEIGHT}
          className="canvas-stage"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            transformOrigin: 'top left'
          }}
        >
          <Layer>
            {/* Immagini di sfondo */}
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

            {/* Testo sotto le immagini se textAboveImages è false */}
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

            {/* Template di sfondo */}
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
            
            {/* Testo sopra tutto se textAboveImages è true */}
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
                  <Text
                    text={text}
                    fontSize={textFontSize}
                    fill={textColor}
                    x={textPosition.x + (ORIGINAL_WIDTH / 2)}
                    y={textPosition.y}
                    align="center"
                    offsetX={measureWidth(text, textFont, textFontSize) / 2}
                    fontFamily={textFont}
                    scaleX={textScale.x}
                    scaleY={textScale.y}
                    draggable={true}
                    onClick={() => setSelectedText('text')}
                    onTap={() => setSelectedText('text')}
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