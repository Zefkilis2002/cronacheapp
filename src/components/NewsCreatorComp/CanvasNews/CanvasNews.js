import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Group } from 'react-konva';
import useImage from 'use-image';
import './CanvasNews.css';

// Componente per le immagini di sfondo
const BackgroundImage = ({ bgImage, updateItemPosition, backgroundImages, setBackgroundImages, isSelected = false, onSelect = () => {}, showSelection = true }) => {
  const [image] = useImage(bgImage.src);
  // Aggiungi un ref per memorizzare la posizione iniziale durante il drag
  const initialPosition = useRef({ x: 0, y: 0 });
  // Aggiungi un flag per tracciare se siamo in modalità touch
  const isTouchDevice = useRef(false);
  
  // Funzione per gestire l'inizio del drag
  const handleDragStart = (e) => {
    // Memorizza la posizione iniziale
    initialPosition.current = {
      x: e.target.x(),
      y: e.target.y()
    };
    
    // Determina se siamo su un dispositivo touch
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };
  
  // Funzione per gestire la fine del drag con stabilizzazione
  const handleDragEnd = (e) => {
    // Calcola la distanza di spostamento
    const dx = Math.abs(e.target.x() - initialPosition.current.x);
    const dy = Math.abs(e.target.y() - initialPosition.current.y);
    
    // Se lo spostamento è minimo su dispositivi touch, potrebbe essere un tap accidentale
    // In questo caso, ripristina la posizione originale
    if (isTouchDevice.current && dx < 5 && dy < 5) {
      e.target.position(initialPosition.current);
      e.target.getLayer().batchDraw();
      return;
    }
    
    // Altrimenti, aggiorna normalmente la posizione
    updateItemPosition(
      bgImage.id, 
      { x: e.target.x(), y: e.target.y() }, 
      backgroundImages, 
      setBackgroundImages
    );
  };
  
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    />
  );
};

// Componente per i loghi
const LogoImage = ({ logo, updateItemPosition, logos, setLogos, isSelected = false, onSelect = () => {} , showSelection = true }) => {
  const [image] = useImage(logo.src);
  // Aggiungi un ref per memorizzare la posizione iniziale durante il drag
  const initialPosition = useRef({ x: 0, y: 0 });
  // Aggiungi un flag per tracciare se siamo in modalità touch
  const isTouchDevice = useRef(false);
  
  // Funzione per gestire l'inizio del drag
  const handleDragStart = (e) => {
    // Memorizza la posizione iniziale
    initialPosition.current = {
      x: e.target.x(),
      y: e.target.y()
    };
    
    // Determina se siamo su un dispositivo touch
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };
  
  // Funzione per gestire la fine del drag con stabilizzazione
  const handleDragEnd = (e) => {
    // Calcola la distanza di spostamento
    const dx = Math.abs(e.target.x() - initialPosition.current.x);
    const dy = Math.abs(e.target.y() - initialPosition.current.y);
    
    // Se lo spostamento è minimo su dispositivi touch, potrebbe essere un tap accidentale
    // In questo caso, ripristina la posizione originale
    if (isTouchDevice.current && dx < 5 && dy < 5) {
      e.target.position(initialPosition.current);
      e.target.getLayer().batchDraw();
      return;
    }
    
    // Altrimenti, aggiorna normalmente la posizione
    updateItemPosition(
      logo.id, 
      { x: e.target.x(), y: e.target.y() }, 
      logos, 
      setLogos
    );
  };
  
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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
  
  // Funzione per calcolare le dimensioni e la scala - versione migliorata per stabilità mobile
  const calculateDimensions = () => {
    if (!containerRef.current) return;
    
    // Ottieni le dimensioni effettive del container con un minimo garantito
    // per evitare valori troppo piccoli che potrebbero causare problemi
    const containerWidth = Math.max(containerRef.current.clientWidth, 320); // minimo 320px
    
    // Calcola l'altezza massima disponibile in modo più stabile
    // Usa una percentuale più conservativa dell'altezza della finestra
    const maxHeight = Math.max(window.innerHeight * 0.7, 480); // minimo 480px
    
    // Calcola la scala mantenendo l'aspect ratio
    let scale = Math.min(containerWidth / ORIGINAL_WIDTH, maxHeight / ORIGINAL_HEIGHT);
    
    // Limita la scala tra 0.25 e 1 per evitare dimensioni troppo piccole
    // Aumentiamo il minimo da 0.2 a 0.25 per evitare che diventi troppo piccolo su mobile
    scale = Math.max(0.25, Math.min(scale, 1));
    
    // Arrotonda la scala a 3 decimali per evitare calcoli imprecisi
    scale = Math.round(scale * 1000) / 1000;
    
    // Calcola le dimensioni scalate in modo preciso
    const scaledWidth = Math.round(ORIGINAL_WIDTH * scale);
    const scaledHeight = Math.round(ORIGINAL_HEIGHT * scale);
    
    // Aggiorna lo stato con i valori calcolati solo se sono effettivamente cambiati
    // per evitare re-render inutili che potrebbero causare instabilità
    setDimensions(prev => {
      // Se le dimensioni sono quasi identiche (entro 1px e 0.001 di scala), non aggiornare
      if (
        Math.abs(prev.width - scaledWidth) <= 1 && 
        Math.abs(prev.height - scaledHeight) <= 1 &&
        Math.abs(prev.scale - scale) <= 0.001
      ) {
        return prev;
      }
      
      return {
        width: scaledWidth,
        height: scaledHeight,
        scale: scale
      };
    });
  };
  
  // useEffect per il calcolo iniziale e il resize - versione migliorata per stabilità mobile
  useEffect(() => {
    // Flag per tracciare se il componente è montato
    let isMounted = true;
    
    // Funzione per calcolare le dimensioni in modo sicuro
    const safeCalculateDimensions = () => {
      // Verifica che il componente sia ancora montato
      if (isMounted && containerRef.current) {
        calculateDimensions();
      }
    };
    
    // Calcolo iniziale con un delay più lungo per assicurarsi che il DOM sia completamente pronto
    const initialTimer = setTimeout(safeCalculateDimensions, 200);
    
    // Secondo calcolo dopo un tempo maggiore per gestire eventuali ritardi nel rendering
    const secondaryTimer = setTimeout(safeCalculateDimensions, 500);
    
    // Terzo calcolo ancora più ritardato per catturare eventuali cambiamenti tardivi
    // Particolarmente utile su dispositivi mobili dove il rendering può essere più lento
    const tertiaryTimer = setTimeout(safeCalculateDimensions, 1000);
    
    // Variabile per tenere traccia dell'ultimo timestamp di resize
    // per limitare la frequenza degli aggiornamenti
    let lastResizeTime = 0;
    const RESIZE_THROTTLE = 100; // ms tra un calcolo e l'altro
    
    // Handler per il resize con throttling e debounce combinati
    // per massima stabilità su dispositivi mobili
    let resizeTimeout;
    const handleResize = () => {
      // Throttling: limita la frequenza dei calcoli immediati
      const now = Date.now();
      if (now - lastResizeTime > RESIZE_THROTTLE) {
        lastResizeTime = now;
        safeCalculateDimensions();
      }
      
      // Debounce: cancella eventuali timeout pendenti
      clearTimeout(resizeTimeout);
      
      // Pianifica un calcolo finale dopo che l'utente ha smesso di ridimensionare
      resizeTimeout = setTimeout(safeCalculateDimensions, 300);
    };

    // Aggiungi listener per eventi di resize
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Aggiungi listener specifici per dispositivi mobili
    window.addEventListener('orientationchange', () => {
      // Per orientationchange, esegui calcoli multipli a intervalli crescenti
      // poiché questo evento può richiedere più tempo per stabilizzarsi
      setTimeout(safeCalculateDimensions, 100);
      setTimeout(safeCalculateDimensions, 500);
      setTimeout(safeCalculateDimensions, 1000);
    }, { passive: true });
    
    // Rimuovi l'event listener per scroll che potrebbe causare troppi ricalcoli
    // e sostituiscilo con un listener più specifico per touchmove/touchend
    // che è più rilevante per i dispositivi mobili
    let touchTimeout;
    const handleTouchEnd = () => {
      clearTimeout(touchTimeout);
      touchTimeout = setTimeout(safeCalculateDimensions, 300);
    };
    
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup function migliorata
    return () => {
      // Imposta il flag di montaggio a false per evitare aggiornamenti di stato
      // dopo lo smontaggio del componente
      isMounted = false;
      
      // Pulisci tutti i timer
      clearTimeout(initialTimer);
      clearTimeout(secondaryTimer);
      clearTimeout(tertiaryTimer);
      clearTimeout(resizeTimeout);
      clearTimeout(touchTimeout);
      
      // Rimuovi tutti gli event listener
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);  // Rimuovi containerRef dalle dipendenze per evitare ricreazioni inutili

  // useEffect per applicare le dimensioni al stage - versione ultra-stabile per mobile
  useEffect(() => {
    // Verifica che lo stage e la scala siano validi
    if (stageRef.current && dimensions.scale > 0) {
      // Flag per evitare aggiornamenti simultanei che potrebbero causare instabilità
      let isUpdating = false;
      
      // Funzione per applicare le dimensioni in modo sicuro
      const applyDimensions = () => {
        // Evita aggiornamenti simultanei
        if (isUpdating) return;
        isUpdating = true;
        
        // Verifica nuovamente che lo stage esista
        if (stageRef.current) {
          try {
            // Imposta le dimensioni originali
            stageRef.current.width(ORIGINAL_WIDTH);
            stageRef.current.height(ORIGINAL_HEIGHT);
            
            // Applica la scala in modo uniforme, arrotondando a 3 decimali per stabilità
            const scale = Math.round(dimensions.scale * 1000) / 1000;
            const newScale = { x: scale, y: scale };
            stageRef.current.scale(newScale);
            
            // Assicurati che la posizione sia esattamente 0,0 per evitare spostamenti
            stageRef.current.position({ x: 0, y: 0 });
            
            // Forza il ridisegno completo dello stage
            stageRef.current.batchDraw();
            
            // Esegui una serie di ridisegni a intervalli crescenti
            // per assicurarsi che tutto sia aggiornato correttamente
            const redrawTimes = [50, 200, 500];
            redrawTimes.forEach(delay => {
              setTimeout(() => {
                if (stageRef.current) {
                  // Riapplica posizione e scala per sicurezza
                  stageRef.current.position({ x: 0, y: 0 });
                  stageRef.current.scale(newScale);
                  stageRef.current.batchDraw();
                }
                // Sblocca gli aggiornamenti solo dopo l'ultimo ridisegno
                if (delay === redrawTimes[redrawTimes.length - 1]) {
                  isUpdating = false;
                }
              }, delay);
            });
          } catch (error) {
            console.error('Errore durante l\'applicazione delle dimensioni allo stage:', error);
            isUpdating = false;
          }
        } else {
          isUpdating = false;
        }
      };
      
      // Usa requestAnimationFrame per sincronizzare con il ciclo di rendering del browser
      // e aggiungi un piccolo ritardo per assicurarsi che il DOM sia pronto
      setTimeout(() => requestAnimationFrame(applyDimensions), 10);
    }
  }, [dimensions]);  // Rimuovi stageRef dalle dipendenze per evitare ricreazioni inutili

  // Previeni eventi touch indesiderati che potrebbero causare problemi di rendering
  const preventTouchDefault = (e) => {
    // Previeni solo gli eventi che potrebbero causare zoom o scroll indesiderato
    if (e.touches && e.touches.length > 1) {
      e.preventDefault();
    }
  };

  return (
    <div 
      className="canvas-container" 
      ref={containerRef}
      // Aggiungi event listener per prevenire zoom pinch su iOS
      onTouchStart={preventTouchDefault}
    >
      <div 
        className="canvas-wrapper"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        // Aggiungi event listener per prevenire comportamenti touch indesiderati
        onTouchMove={preventTouchDefault}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          outline: 'none',
          // Proprietà CSS ottimizzate per la stabilità e performance su dispositivi mobili
          maxWidth: '100%',
          overflow: 'hidden',
          position: 'relative',
          margin: '0 auto',  // Centra il canvas orizzontalmente
          touchAction: 'pan-x pan-y',  // Consenti solo pan, non zoom
          WebkitTapHighlightColor: 'transparent',  // Rimuove l'evidenziazione al tocco su iOS
          transform: 'translate3d(0,0,0)',  // Forza l'accelerazione hardware in modo più efficace
          backfaceVisibility: 'hidden',  // Migliora le performance di rendering
          willChange: 'transform',  // Suggerisce al browser di ottimizzare le trasformazioni
          userSelect: 'none',  // Previene la selezione del testo indesiderata
          WebkitOverflowScrolling: 'touch',  // Migliora lo scrolling su iOS
          WebkitUserSelect: 'none',  // Versione specifica per Safari
          MozUserSelect: 'none',  // Versione specifica per Firefox
          msUserSelect: 'none',  // Versione specifica per IE/Edge
          perspective: '1000px',  // Migliora la qualità delle trasformazioni 3D
          transformStyle: 'preserve-3d'  // Mantiene le trasformazioni 3D
        }}
      >
        <Stage 
          ref={stageRef} 
          width={ORIGINAL_WIDTH}
          height={ORIGINAL_HEIGHT}
          className="canvas-stage"
          // Aggiungi proprietà per migliorare la performance di Konva su mobile
          perfectDrawEnabled={false}  // Disabilita il perfect drawing per migliorare le performance
          listening={true}  // Assicurati che gli eventi siano catturati
          style={{
            // Stile ottimizzato per lo stage
            maxWidth: '100%',
            height: 'auto',
            display: 'block',  // Rimuove spazi bianchi indesiderati
            position: 'absolute',  // Posizionamento assoluto per evitare spostamenti
            left: '0',
            top: '0',
            transformOrigin: 'top left',  // Punto di origine per le trasformazioni
            transform: 'translate3d(0,0,0)',  // Forza l'accelerazione hardware
            WebkitTransform: 'translate3d(0,0,0)',  // Versione specifica per Safari
            backfaceVisibility: 'hidden'  // Migliora le performance di rendering
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