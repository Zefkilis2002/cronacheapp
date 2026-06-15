import { useState, useCallback } from 'react';
import { NEWS_LAYOUT } from '../config/layoutConstants';

export function useTextEditor() {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [html, setHtml] = useState('');
  const [richText, setRichText] = useState([]);
  
  const [highlightColor, setHighlightColor] = useState('#e3001b');
  
  const [titleColor, setTitleColor] = useState(NEWS_LAYOUT.TITLE.color);
  const [textColor, setTextColor] = useState(NEWS_LAYOUT.TEXT.color);
  const [titleFont, setTitleFont] = useState(NEWS_LAYOUT.TITLE.fontFamily);
  const [textFont, setTextFont] = useState(NEWS_LAYOUT.TEXT.fontFamily);
  const [titleFontSize, setTitleFontSize] = useState(NEWS_LAYOUT.TITLE.fontSize);
  const [textFontSize, setTextFontSize] = useState(NEWS_LAYOUT.TEXT.fontSize);

  const [titlePosition, setTitlePosition] = useState({ x: NEWS_LAYOUT.TITLE.startX, y: NEWS_LAYOUT.TITLE.startY });
  const [textPosition, setTextPosition] = useState({ x: NEWS_LAYOUT.TEXT.startX, y: NEWS_LAYOUT.TEXT.startY });

  // Nuovi stati per l'opzione Intervista
  const [sourceText, setSourceText] = useState('');
  const [sourceFont, setSourceFont] = useState('Kenyan Coffee Regular');
  const [sourceColor, setSourceColor] = useState('#ffffff');
  const [sourceFontSize, setSourceFontSize] = useState(61);
  const [sourcePosition, setSourcePosition] = useState({ x: NEWS_LAYOUT.TEXT.startX, y: NEWS_LAYOUT.TEXT.startY + 150 });

  const [textAboveImages, setTextAboveImages] = useState(true);

  const handleTextChange = useCallback((textContainerRef) => {
    if (!textContainerRef.current) return;
    const htmlContent = textContainerRef.current.innerHTML;
    const plain = textContainerRef.current.innerText;
    setText(plain);
    setHtml(htmlContent);

    const container = document.createElement('div');
    container.innerHTML = htmlContent;

    const lines = [];
    let current = [];

    const flush = () => {
      const merged = [];
      for (const seg of current) {
        if (!seg.text && seg.text !== '') continue;
        if (merged.length && merged[merged.length - 1].color === seg.color) {
          merged[merged.length - 1].text += seg.text;
        } else {
          merged.push({ text: seg.text, color: seg.color });
        }
      }
      lines.push(merged.length > 0 ? merged : [{ text: '', color: null }]);
      current = [];
    };

    const pushText = (t, color) => {
      const textValue = (t || '').replace(/\u00A0/g, ' ');
      current.push({ text: textValue, color: color || null });
    };

    const rgbToHex = (rgb) => {
      if (!rgb || rgb === 'inherit' || rgb === 'initial') return null;
      if (rgb.startsWith('#')) return rgb;

      const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      }
      return rgb;
    };

    const walk = (node, inheritedColor = null) => {
      if (!node) return;
      if (node.nodeType === 3) { // TEXT_NODE
        pushText(node.nodeValue, inheritedColor);
        return;
      }
      if (node.nodeType !== 1) return; // NOT ELEMENT_NODE

      const tag = node.tagName;
      let nodeColor = inheritedColor;

      if (node.style && node.style.color) {
        nodeColor = rgbToHex(node.style.color);
      } else if (node.getAttribute && node.getAttribute('color')) {
        nodeColor = node.getAttribute('color');
      }

      if (tag === 'BR') {
        flush();
        return;
      }

      if (tag === 'DIV' || tag === 'P') {
        if (current.length > 0) flush();
        Array.from(node.childNodes).forEach(child => walk(child, nodeColor));
        flush();
        return;
      }

      Array.from(node.childNodes).forEach(child => walk(child, nodeColor));
    };

    Array.from(container.childNodes).forEach(n => walk(n, null));
    if (current.length > 0) flush();

    setRichText(lines);
  }, []);

  const enlargeTextSize = useCallback((setter, step = 2) => setter(prev => prev + step), []);
  const shrinkTextSize = useCallback((setter, step = 2) => setter(prev => Math.max(NEWS_LAYOUT.MIN_FONT_SIZE, prev - step)), []);

  return {
    title, setTitle,
    text, setText,
    html, setHtml,
    richText, setRichText,
    highlightColor, setHighlightColor,
    titleColor, setTitleColor,
    textColor, setTextColor,
    titleFont, setTitleFont,
    textFont, setTextFont,
    titleFontSize, setTitleFontSize,
    textFontSize, setTextFontSize,
    titlePosition, setTitlePosition,
    textPosition, setTextPosition,
    sourceText, setSourceText,
    sourceFont, setSourceFont,
    sourceColor, setSourceColor,
    sourceFontSize, setSourceFontSize,
    sourcePosition, setSourcePosition,
    textAboveImages, setTextAboveImages,
    handleTextChange,
    enlargeTextSize, shrinkTextSize
  };
}
