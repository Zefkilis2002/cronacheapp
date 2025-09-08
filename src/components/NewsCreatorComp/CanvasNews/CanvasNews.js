import React, { useEffect, useState, useRef } from 'react';
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
      onDragStart={(e) => {
        // Puoi rimuovere il moveToTop se vuoi che l'immagine non venga portata in primo piano
        // e.target.moveToTop();
      }}
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

  // scala locale per titolo e testo (così puoi ridurre/aumentare con i tasti)
  const [titleScale, setTitleScale] = useState({ x: 1, y: 1 });
  const [textScale,  setTextScale ] = useState({ x: 1, y: 1 });


  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const nudgePos = (p, dx, dy) => ({ x: p.x + dx, y: p.y + dy });

  const handleKeyDown = (e) => {
    const step  = KEY_MOVE_STEP;
    const upF   = 1 + KEY_SCALE_STEP;
    const downF = 1 / (1 + KEY_SCALE_STEP);

    let handled = true;

    // FRECCE = sposta a piccoli passi
    if (
      e.key === 'ArrowUp'   ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight'
    ) {
      const dx = e.key === 'ArrowLeft'  ? -step : e.key === 'ArrowRight' ? step : 0;
      const dy = e.key === 'ArrowUp'    ? -step : e.key === 'ArrowDown'  ? step : 0;

      if (selectedLogo) {
        const logo = logos.find(l => l.id === selectedLogo);
        if (logo) {
          updateItemPosition(
            selectedLogo,
            nudgePos(logo.position, dx, dy),
            logos,
            setLogos
          );
        }
      } else if (selectedBackground) {
        const bg = backgroundImages.find(b => b.id === selectedBackground);
        if (bg) {
          updateItemPosition(
            selectedBackground,
            nudgePos(bg.position, dx, dy),
            backgroundImages,
            setBackgroundImages
          );
        }
      } else if (selectedText === 'title') {
        setTitlePosition(p => nudgePos(p, dx, dy));
      } else if (selectedText === 'text') {
        setTextPosition(p => nudgePos(p, dx, dy));
      } else {
        handled = false;
      }
    }

    // + / = / NumpadAdd  => ingrandisci a piccoli passi
    else if (e.key === '+' || e.key === '=' || e.key === 'NumpadAdd') {
      if (selectedLogo) {
        setLogos(ls => ls.map(l => l.id !== selectedLogo ? l : ({
          ...l,
          scale: {
            scaleX: clamp(l.scale.scaleX * upF,   0.05, 8),
            scaleY: clamp(l.scale.scaleY * upF,   0.05, 8),
          }
        })));
      } else if (selectedBackground) {
        setBackgroundImages(bs => bs.map(b => b.id !== selectedBackground ? b : ({
          ...b,
          scale: {
            scaleX: clamp(b.scale.scaleX * upF,   0.05, 8),
            scaleY: clamp(b.scale.scaleY * upF,   0.05, 8),
          }
        })));
      } else if (selectedText === 'title') {
        setTitleScale(s => ({ x: s.x * upF, y: s.y * upF }));
      } else if (selectedText === 'text') {
        setTextScale (s => ({ x: s.x * upF, y: s.y * upF }));
      } else {
        handled = false;
      }
    }

    // - / _ / NumpadSubtract  => rimpicciolisci a piccoli passi
    else if (e.key === '-' || e.key === '_' || e.key === 'NumpadSubtract') {
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
        setTextScale (s => ({ x: s.x * downF, y: s.y * downF }));
      } else {
        handled = false;
      }
    }

    // [ / ] / NumpadDivide / NumpadMultiply  => ruota i LOGHI a piccoli passi
    else if (
      e.key === '[' || e.key === ']' ||
      e.key === 'NumpadDivide' || e.key === 'NumpadMultiply'
    ) {
      if (!selectedLogo) {
        handled = false;
      } else {
        const dir   = (e.key === ']' || e.key === 'NumpadMultiply') ? 1 : -1;
        const delta = KEY_ROTATE_STEP * dir;

        setLogos(ls => ls.map(l => {
          if (l.id !== selectedLogo) return l;
          const prev = (typeof l.rotation === 'number') ? l.rotation : 0;
          return { ...l, rotation: normalizeAngle(prev + delta) };
        }));
      }
    }

    else {
      handled = false;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };



    
    
    // Costanti per le dimensioni originali del canvas
    const ORIGINAL_WIDTH = 1440;
    const ORIGINAL_HEIGHT = 1800;

    // 🚦 Sensibilità (passi) per i tasti
    const KEY_MOVE_STEP  = 2;     // 2 px per pressione freccia
    const KEY_SCALE_STEP = 0.02;  // 2% per + / -
    const KEY_FONT_STEP  = 2;     // 2 px (se lo userai per font)
    const KEY_ROTATE_STEP = 2;      // 🔁 2° per pressione
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

    // ✅ aggiungi onClick con default noop
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
              // ❌ prima avevi listening={false}; toglilo così i click/tap funzionano
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
          scaleX={textScale.x}   // ✅ applica la scala del testo
          scaleY={textScale.y}
          onClick={onClick}
          onTap={onClick}
          onDragEnd={(e) => setTextPosition({ x: e.target.x() - ORIGINAL_WIDTH / 2, y: e.target.y() })}
        >
          {elements}
        </Group>
      );
    };


  
  // Nuovo componente per gestire il testo normale con ritorni a capo
  const MultiLineText = ({ text, x, y, fontFamily, fontSize, color, width }) => {
    const lineHeight = Math.round(fontSize * 1.25);
    const elements = [];
    
    if (!text) return null;
    
    // Dividi il testo in righe
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
  
  // Funzione per calcolare le dimensioni e la scala
  const calculateDimensions = () => {
  if (!containerRef.current) return;
  
  // Get container dimensions
  const containerWidth = containerRef.current.clientWidth;
  
  // FIX: Use visualViewport API where available for more stable mobile dimensions
  const viewportHeight = 'visualViewport' in window ? 
    window.visualViewport.height : 
    window.innerHeight;
  
  // FIX: Add a small buffer to avoid rapid oscillations between values
  const maxHeight = viewportHeight * 0.85;
  
  // Calculate scale while maintaining aspect ratio
  let scale = Math.min(containerWidth / ORIGINAL_WIDTH, maxHeight / ORIGINAL_HEIGHT);
  
  // FIX: Add a small hysteresis to prevent tiny fluctuations from causing layout shifts
  const currentScale = dimensions.scale || 0;
  if (Math.abs(scale - currentScale) < 0.01 && currentScale > 0) {
    scale = currentScale; // Keep the current scale if the change is negligible
  }
  
  // Limit scale to reasonable values
  scale = Math.max(0.2, Math.min(scale, 1.5)); // Slightly increased max scale for flexibility
  
  // Calculate scaled dimensions
  const scaledWidth = Math.round(ORIGINAL_WIDTH * scale);
  const scaledHeight = Math.round(ORIGINAL_HEIGHT * scale);
  
  // FIX: Only update if dimensions changed significantly
  if (
    Math.abs(scaledWidth - (dimensions.width || 0)) > 1 || 
    Math.abs(scaledHeight - (dimensions.height || 0)) > 1
  ) {
    setDimensions({
      width: scaledWidth,
      height: scaledHeight,
      scale: scale
    });
  }
};
  
  // useEffect per il calcolo iniziale e il resize - versione migliorata per mobile
  useEffect(() => {
    const safeCalculateDimensions = () => {
      if (containerRef.current) {
        calculateDimensions();
      }
    };

    // FIX: Use a more sophisticated debounce with leading edge execution
    let resizeTimeout;
    let lastExecution = 0;
    const DEBOUNCE_TIME = 100;
    const MIN_EXECUTION_INTERVAL = 50;
    
    const handleResize = () => {
      const now = Date.now();
      // Only process if enough time has passed since last execution
      if (now - lastExecution > MIN_EXECUTION_INTERVAL) {
        safeCalculateDimensions();
        lastExecution = now;
      }
      
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        safeCalculateDimensions();
        lastExecution = Date.now();
      }, DEBOUNCE_TIME);
    };

    // FIX: Remove scroll listener - it causes unnecessary recalculations during interaction
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    
    // FIX: Add iOS-specific handling for viewport changes
    if ('visualViewport' in window) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }

    // Initial calculation with proper timing
    const initialCalculation = () => {
      // Use requestAnimationFrame for smoother initial layout
      requestAnimationFrame(() => {
        if (containerRef.current) {
          calculateDimensions();
          
          // Additional calculation after images might have loaded
          setTimeout(calculateDimensions, 300);
        }
      });
    };
    
    // FIX: Use multiple timing strategies for reliable initialization
    initialCalculation();
    setTimeout(initialCalculation, 100);
    setTimeout(initialCalculation, 500);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      
      if ('visualViewport' in window) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, [containerRef, dimensions.scale]);

  // useEffect per applicare le dimensioni al stage - versione robusta
  useEffect(() => {
  if (stageRef.current && dimensions.scale > 0) {
    const applyDimensions = () => {
      if (!stageRef.current) return;
      
      try {
        // FIX: Only update if dimensions actually changed
        const currentWidth = stageRef.current.width();
        const currentHeight = stageRef.current.height();
        const currentScale = stageRef.current.scaleX();
        
        if (
          Math.abs(currentWidth - ORIGINAL_WIDTH) > 1 ||
          Math.abs(currentHeight - ORIGINAL_HEIGHT) > 1 ||
          Math.abs(currentScale - dimensions.scale) > 0.01
        ) {
          // Set dimensions
          stageRef.current.width(ORIGINAL_WIDTH);
          stageRef.current.height(ORIGINAL_HEIGHT);
          
          // Apply scale
          const newScale = { x: dimensions.scale, y: dimensions.scale };
          stageRef.current.scale(newScale);
          
          // FIX: Only one batchDraw is needed - the second one was causing flickering
          stageRef.current.batchDraw();
        }
      } catch (error) {
        console.error('Error applying dimensions to stage:', error);
      }
    };
    
    // FIX: Use a more reliable timing approach
    const applyWithRetry = (attempts = 0) => {
      if (stageRef.current && dimensions.scale > 0) {
        applyDimensions();
      } else if (attempts < 3) {
        setTimeout(() => applyWithRetry(attempts + 1), 50);
      }
    };
    
    applyWithRetry();
  }
}, [dimensions, stageRef]);

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
          // Proprietà CSS migliorate per la stabilità su dispositivi mobili
          maxWidth: '100%',
          overflow: 'hidden',
          position: 'relative',
          margin: '0 auto',  // Centra il canvas orizzontalmente
          touchAction: 'none',  // Previene comportamenti touch indesiderati
          WebkitTapHighlightColor: 'transparent',  // Rimuove l'evidenziazione al tocco su iOS
          transform: 'translateZ(0)',  // Forza l'accelerazione hardware
          backfaceVisibility: 'hidden',  // Migliora le performance di rendering
          willChange: 'transform',  // Suggerisce al browser di ottimizzare le trasformazioni
          userSelect: 'none'  // Previene la selezione del testo indesiderata
        }}
      >
        <Stage 
          ref={stageRef} 
          width={ORIGINAL_WIDTH}
          height={ORIGINAL_HEIGHT}
          className="canvas-stage"
          style={{
            // Stile migliorato per lo stage
            maxWidth: '100%',
            height: 'auto',
            display: 'block',  // Rimuove spazi bianchi indesiderati
            position: 'absolute',  // Posizionamento assoluto per evitare spostamenti
            left: '0',
            top: '0',
            transformOrigin: 'top left'  // Punto di origine per le trasformazioni
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

            {/* Se textAboveImages è false, metti il testo sotto il template e i loghi */}
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

            
            {/* Renderizza lo sfondo template sopra, non interagibile */}
            {background && (
              <KonvaImage 
                image={background} 
                width={ORIGINAL_WIDTH} 
                height={ORIGINAL_HEIGHT} 
                listening={false} 
              />
            )}
            
            {/* Renderizza loghi */}
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
            
            {/* Se textAboveImages è true, metti il testo in cima a tutto */}
            {textAboveImages && (
              <>
                <Text
                  text={title}
                  fontSize={titleFontSize}
                  fill={titleColor}
                  x={titlePosition.x + (ORIGINAL_WIDTH / 2)}
                  y={titlePosition.y}
                  align="center"
                  offsetX={measureWidth(title, titleFont, titleFontSize) / 2} // Centra rispetto al punto di ancoraggio
                  fontFamily={titleFont}
                  draggable={true}
                  onDragEnd={(e) => {
                    // Calcola la posizione relativa al centro
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