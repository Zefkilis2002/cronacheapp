import React from 'react';

function ToolbarNews({
  moveElement,
  resizeElement,
  enlargeTextSize,
  shrinkTextSize,
  setTitlePosition,
  setTextPosition,
  setImagePosition,
  setImageScale,
  setLogoScale,
  setTitleFontSize,
  setTextFontSize
}) {
  return (
    <div className="toolbar" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
      <div className="toolbar-inner">
        <button onClick={() => moveElement(setTitlePosition, 'up')}>Tit↑</button>
        <button onClick={() => moveElement(setTitlePosition, 'down')}>Tit↓</button>
        <button onClick={() => enlargeTextSize(setTitleFontSize)}>Tit+</button>
        <button onClick={() => shrinkTextSize(setTitleFontSize)}>Tit-</button>
        <button onClick={() => moveElement(setTextPosition, 'up')}>Testo↑</button>
        <button onClick={() => moveElement(setTextPosition, 'down')}>Testo↓</button>
        <button onClick={() => enlargeTextSize(setTextFontSize)}>Testo+</button>
        <button onClick={() => shrinkTextSize(setTextFontSize)}>Testo-</button>
        <button onClick={() => moveElement(setImagePosition, 'up')}>Sfond↑</button>
        <button onClick={() => moveElement(setImagePosition, 'down')}>Sfond↓</button>
        <button onClick={() => moveElement(setImagePosition, 'right')}>Sfond→</button>
        <button onClick={() => moveElement(setImagePosition, 'left')}>Sfond←</button>
        <button onClick={() => resizeElement(setImageScale, 'increase')}>Sfond+</button>
        <button onClick={() => resizeElement(setImageScale, 'decrease')}>Sfond-</button>
        <button onClick={() => resizeElement(setLogoScale, 'increase')}>Logo+</button>
        <button onClick={() => resizeElement(setLogoScale, 'decrease')}>Logo-</button>
      </div>
    </div>
  );
}

export default ToolbarNews;