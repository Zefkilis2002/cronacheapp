import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Calcola la scala con cui riscalare un poster a dimensione fissa perché
 * riempia la larghezza disponibile senza mai superare la dimensione di design.
 *
 * Il poster viene renderizzato sempre alla sua risoluzione di design e solo
 * riscalato via transform: così mobile e desktop mostrano la stessa identica
 * immagine, solo di dimensioni diverse.
 *
 * @param {number} designWidth larghezza di design del poster in px
 * @param {{ maxScale?: number }} [options] maxScale limita la scala massima
 *        dell'anteprima (default 1). Con un valore < 1 il poster viene mostrato
 *        più piccolo nella pagina pur restando identico in proporzioni: è solo
 *        un fattore di zoom uniforme applicato sopra al fit sulla larghezza.
 * @returns [ref da applicare al contenitore dell'anteprima, scala (0 < s <= maxScale)]
 */
export const usePosterScale = (designWidth, options = {}) => {
    const maxScale = clampMax(options.maxScale);
    const containerRef = useRef(null);

    const [scale, setScale] = useState(() => estimateScale(designWidth, maxScale));

    // useLayoutEffect: misura e corregge la scala PRIMA che il browser disegni,
    // così su mobile non appare mai il poster a dimensione piena
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const compute = () => {
            const styles = window.getComputedStyle(el);
            const availWidth = el.clientWidth
                - parseFloat(styles.paddingLeft)
                - parseFloat(styles.paddingRight);

            // Se il contenitore non è ancora misurabile (clientWidth 0 durante
            // il primo layout) si tiene la scala corrente invece di calcolarne
            // una non valida: una scala <= 0 renderebbe il poster invisibile
            if (!Number.isFinite(availWidth) || availWidth <= 0) return;

            setScale(clampScale(availWidth / designWidth, maxScale));
        };

        compute();
        const resizeObserver = new ResizeObserver(compute);
        resizeObserver.observe(el);
        window.addEventListener('resize', compute);
        window.addEventListener('orientationchange', compute);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', compute);
            window.removeEventListener('orientationchange', compute);
        };
    }, [designWidth, maxScale]);

    return [containerRef, scale];
};

// Stima iniziale dalla larghezza della finestra, così nemmeno il primo paint
// mostra il poster a dimensione piena su mobile
const estimateScale = (designWidth, maxScale) => {
    // window.innerWidth può valere 0 al primo render (tab non ancora
    // dimensionata): in quel caso si parte da 1 e ci pensa la misura reale
    const viewportWidth = window.innerWidth || designWidth;
    return clampScale((viewportWidth - 16) / designWidth, maxScale);
};

// maxScale valido: numero in (0, 1]. Qualunque valore fuori range o non
// numerico torna a 1 (nessun rimpicciolimento aggiuntivo)
const clampMax = (value) => {
    if (!Number.isFinite(value) || value <= 0 || value > 1) return 1;
    return value;
};

// La scala deve restare positiva e non superare maxScale: valori <= 0 (o NaN)
// azzererebbero il poster, valori > maxScale lo farebbero più grande del voluto
const clampScale = (value, maxScale = 1) => {
    if (!Number.isFinite(value)) return maxScale;
    return Math.min(maxScale, Math.max(0.05, value));
};
