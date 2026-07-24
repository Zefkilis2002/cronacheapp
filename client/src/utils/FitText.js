import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * Testo su una riga che si rimpicciolisce da solo quando non ci sta.
 *
 * Misura offsetWidth (larghezza di LAYOUT, che il transform non altera) e
 * applica uno scale: così funziona con qualunque font, senza dover conoscere
 * la larghezza media dei caratteri — che tra i font del progetto va da 0.42
 * a 0.99 em, quindi una formula sui caratteri non basterebbe.
 *
 * @param text      testo da mostrare
 * @param maxWidth  larghezza massima in px di design
 * @param className classe CSS del contenitore
 * @param style     stile inline (font, colore, ...)
 * @param nudgeY    spostamento verticale in px (per centrare otticamente il
 *                  maiuscolo: le maiuscole stanno in alto nella riga e lasciano
 *                  vuoto lo spazio dei discendenti sotto). Scala con lo scale.
 */
const FitText = ({ text, maxWidth, className, style = {}, nudgeY = 0 }) => {
    const ref = useRef(null);
    const [scale, setScale] = useState(1);

    // I font custom vengono caricati dopo il primo layout: senza la seconda
    // misura su document.fonts.ready la scala resterebbe quella del fallback
    const signature = `${text}|${maxWidth}|${style.fontSize}|${style.fontFamily}|${style.letterSpacing}`;

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;

        const measure = () => {
            const natural = el.offsetWidth;
            if (!natural || !maxWidth) return;
            setScale(natural > maxWidth ? maxWidth / natural : 1);
        };

        measure();

        let alive = true;
        if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => { if (alive) measure(); });
        }
        return () => { alive = false; };
    }, [signature, maxWidth]);

    return (
        <div
            ref={ref}
            className={className}
            style={{ ...style, transform: `scale(${scale}) translateY(${nudgeY}px)`, transformOrigin: 'center center' }}
        >
            {text}
        </div>
    );
};

export default FitText;
