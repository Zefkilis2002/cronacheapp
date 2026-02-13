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
        <button onClick={() => moveLogo(1, 'up')}>lg1↑</button>
        <button onClick={() => moveLogo(1, 'down')}>lg1↓</button>
        <button onClick={() => moveLogo(1, 'left')}>lg1←</button>
        <button onClick={() => moveLogo(1, 'right')}>lg1→</button>
        <button onClick={() => resizeLogo(1, 'increase')}>lg1+</button>
        <button onClick={() => resizeLogo(1, 'decrease')}>lg1−</button>
      </div>

      <div className="toolbar-row">
        {/* Pulsanti per il Logo 2 */}
        <button onClick={() => moveLogo(2, 'up')}>lg2↑</button>
        <button onClick={() => moveLogo(2, 'down')}>lg2↓</button>
        <button onClick={() => moveLogo(2, 'left')}>lg2←</button>
        <button onClick={() => moveLogo(2, 'right')}>lg2→</button>
        <button onClick={() => resizeLogo(2, 'increase')}>lg2+</button>
        <button onClick={() => resizeLogo(2, 'decrease')}>lg2−</button>
      </div>

      <div className="toolbar-row">
        {/* Pulsanti per lo sfondo (ingrandire/ridurre) e per spostare i punteggi */}
        <button onClick={increaseImageSize}>Img+</button>
        <button onClick={decreaseImageSize}>Img−</button>
        <button onClick={() => {
          setScore1Y(prev => prev - 2);
          setScore2Y(prev => prev - 2);
        }}>
          ↑ Y
        </button>
        <button onClick={() => {
          setScore1Y(prev => prev + 2);
          setScore2Y(prev => prev + 2);
        }}>
          ↓ Y
        </button>
      </div>
    </div>
  );
};

export default Toolbar;