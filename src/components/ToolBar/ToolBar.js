// Toolbar.js
import React from 'react';
import './ToolBar.css';
/**
 * Riceve in props le funzioni di controllo già definite nel parent (ad esempio FullTimeResults),
 * come moveLogo, resizeLogo, increaseImageSize, decreaseImageSize, setScore1Y, setScore2Y.
 */
const Toolbar = ({
  moveLogo,
  resizeLogo,
  increaseImageSize,
  decreaseImageSize,
  setScore1Y,
  setScore2Y
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-row">
        {/* Pulsanti per il Logo 1 */}
        <button onClick={() => moveLogo(1, 'up')}>Log1↑</button>
        <button onClick={() => moveLogo(1, 'down')}>Log1↓</button>
        <button onClick={() => moveLogo(1, 'left')}>Log1←</button>
        <button onClick={() => moveLogo(1, 'right')}>Log1→</button>
        <button onClick={() => resizeLogo(1, 'increase')}>Log1+</button>
        <button onClick={() => resizeLogo(1, 'decrease')}>Log1−</button>
      </div>

      <div className="toolbar-row">
        {/* Pulsanti per il Logo 2 */}
        <button onClick={() => moveLogo(2, 'up')}>Log2↑</button>
        <button onClick={() => moveLogo(2, 'down')}>Log2↓</button>
        <button onClick={() => moveLogo(2, 'left')}>Log2←</button>
        <button onClick={() => moveLogo(2, 'right')}>Log2→</button>
        <button onClick={() => resizeLogo(2, 'increase')}>Log2+</button>
        <button onClick={() => resizeLogo(2, 'decrease')}>Log2−</button>
      </div>

      <div className="toolbar-row">
        {/* Pulsanti per lo sfondo (ingrandire/ridurre) e per spostare i punteggi */}
        <button onClick={increaseImageSize}>Sfond+</button>
        <button onClick={decreaseImageSize}>Sfond−</button>
        <button onClick={() => {
          setScore1Y(prev => prev - 10);
          setScore2Y(prev => prev - 10);
        }}>
          ↑ Punti
        </button>
        <button onClick={() => {
          setScore1Y(prev => prev + 10);
          setScore2Y(prev => prev + 10);
        }}>
          ↓ Punti
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
