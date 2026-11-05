import { useLayoutEffect, useRef, useState } from 'react';

export function fitCanvasPreview(width, height, availableWidth, availableHeight, border = 2) {
  const scale = Math.max(0.001, Math.min(1, (availableWidth - border * 2) / width, (availableHeight - border * 2) / height));
  return { width: width * scale, height: height * scale, scale };
}

// The Konva viewport and the frame share the same dimensions. The scene keeps
// its design coordinates, so preview fitting never changes the exported image.
export function useCanvasPreview(width, height) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState(() => fitCanvasPreview(width, height, window.innerWidth - 32, window.innerHeight * 0.85));
  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => {
      const style = window.getComputedStyle(element);
      const availableWidth = element.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
      if (availableWidth <= 0) return;
      const next = fitCanvasPreview(width, height, availableWidth, window.innerHeight * 0.85);
      setDimensions(previous => previous.width === next.width && previous.height === next.height ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [width, height]);
  return [containerRef, dimensions];
}
