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
 * @returns [ref da applicare al contenitore dell'anteprima, scala (0 < s <= 1)]
 */
export const usePosterScale = (designWidth) => {
    const containerRef = useRef(null);

    const [scale, setScale] = useState(() => estimateScale(designWidth));

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

            setScale(clampScale(availWidth / designWidth));
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
    }, [designWidth]);

    return [containerRef, scale];
};

// Stima iniziale dalla larghezza della finestra, così nemmeno il primo paint
// mostra il poster a dimensione piena su mobile
const estimateScale = (designWidth) => {
    // window.innerWidth può valere 0 al primo render (tab non ancora
    // dimensionata): in quel caso si parte da 1 e ci pensa la misura reale
    const viewportWidth = window.innerWidth || designWidth;
    return clampScale((viewportWidth - 16) / designWidth);
};

// La scala deve restare positiva e non superare 1: valori <= 0 (o NaN)
// azzererebbero il poster, valori > 1 lo farebbero sbordare
const clampScale = (value) => {
    if (!Number.isFinite(value)) return 1;
    return Math.min(1, Math.max(0.05, value));
};
