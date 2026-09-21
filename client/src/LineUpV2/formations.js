// =============================================================================
// Moduli e disposizione dei giocatori sulla grafica "Lineup v2"
// =============================================================================
//
// Il poster è alto 1800px: le righe del modulo vengono distribuite tra
// l'attacco (in alto) e la difesa (in basso), col portiere staccato in fondo.
// Le posizioni sono calcolate dal modulo invece di essere scritte a mano una
// per una: così qualunque modulo dell'elenco (e anche uno digitato a mano)
// produce un campo sensato, che l'utente può poi ritoccare giocatore per
// giocatore con gli scostamenti.

export const FORMATIONS = [
    '4-3-3', '4-4-2', '4-2-3-1', '4-3-1-2', '4-3-2-1', '4-1-4-1', '4-5-1', '4-2-4',
    '3-5-2', '3-4-3', '3-4-2-1', '3-4-1-2', '3-1-4-2',
    '5-3-2', '5-4-1', '5-2-3',
];

// Riga più alta (attacco) e più bassa (difesa) dei giocatori di movimento, più
// la quota del portiere. Sono le misure prese dal template originale.
export const FIELD = { top: 330, bottom: 1105, gk: 1400 };

/**
 * Reparti del modulo, dalla difesa all'attacco.
 * Accetta anche i moduli col portiere in testa ("1-4-3-3" → "4-3-3").
 */
export function parseLines(formation) {
    const parts = String(formation || '')
        .split(/[-\s]+/)
        .map(n => parseInt(n, 10))
        .filter(n => Number.isFinite(n) && n > 0);

    if (!parts.length) return [4, 3, 3];

    const lines = (parts[0] === 1 && parts.length > 3) ? parts.slice(1) : parts;
    const total = lines.reduce((a, b) => a + b, 0);
    return total === 10 ? lines : [4, 3, 3];
}

/** Posizioni orizzontali (in % della larghezza) di un reparto di `count` uomini. */
function spreadX(count) {
    switch (count) {
        case 1: return [50];
        case 2: return [37, 63];
        case 3: return [26, 50, 74];
        case 4: return [13.5, 38.5, 61.5, 86.5];
        case 5: return [11, 30.5, 50, 69.5, 89];
        default: {
            // Modulo insolito: distribuzione uniforme dentro gli stessi margini
            const out = [];
            for (let i = 0; i < count; i++) out.push(11 + (78 * i) / (count - 1));
            return out;
        }
    }
}

/**
 * Nel template i reparti non sono allineati: in attacco le ali stanno più in
 * basso della punta, in difesa i terzini più in alto dei centrali. Qui lo
 * scarto verticale degli uomini esterni rispetto al centro del reparto.
 */
function staggerOf(rowIndex, rowCount) {
    if (rowCount === 1) return 0;
    if (rowIndex === 0) return 55;              // attacco: esterni più bassi
    if (rowIndex === rowCount - 1) return -70;  // difesa: esterni più alti
    return 0;
}

/**
 * Posizioni di tutti e undici i giocatori, nell'ordine dell'editor:
 * portiere, poi difesa, centrocampo e attacco (dentro ogni reparto da sinistra
 * a destra, come si vedono in campo).
 *
 * @param {string} formation modulo, es. "4-2-3-1"
 * @param {number} spread    1 = distanza tra i reparti del template
 * @returns {Array<{x:number,y:number,scale:number}>}
 */
export function buildPositions(formation, spread = 1) {
    const lines = parseLines(formation);        // difesa → attacco
    const rowCount = lines.length;              // righe di movimento

    // Le righe si allargano/stringono attorno al loro centro, così il campo
    // resta bilanciato anche coi moduli a quattro reparti.
    const mid = (FIELD.top + FIELD.bottom) / 2;
    const top = mid - (mid - FIELD.top) * spread;
    const bottom = mid + (FIELD.bottom - mid) * spread;

    const positions = new Array(11);
    positions[0] = { x: 50, y: FIELD.gk, scale: 0.94 };

    let slot = 1;
    lines.forEach((count, lineIndex) => {
        // lineIndex 0 = difesa, che sulla grafica è la riga più in basso
        const rowIndex = rowCount - 1 - lineIndex;
        const rowY = rowCount === 1
            ? top
            : top + (rowIndex * (bottom - top)) / (rowCount - 1);

        const xs = spreadX(count);
        const stagger = staggerOf(rowIndex, rowCount);
        const center = (count - 1) / 2;

        for (let k = 0; k < count; k++) {
            const distance = center === 0 ? 0 : Math.abs(k - center) / center;
            positions[slot++] = {
                x: xs[k],
                y: rowY + stagger * distance,
                // Le due righe più arretrate sono un po' più piccole: danno
                // profondità al campo in prospettiva.
                scale: rowIndex === rowCount - 1 ? 0.86 : 1,
            };
        }
    });

    return positions;
}

/** Etichette dei ruoli, nello stesso ordine di buildPositions. */
export function roleLabels(formation) {
    const lines = parseLines(formation);
    const bands = ['DIFESA', 'CENTROCAMPO', 'TREQUARTI', 'ATTACCO'];
    const labels = ['PORTIERE'];
    lines.forEach((count, i) => {
        const band = i === lines.length - 1 ? 'ATTACCO' : bands[Math.min(i, bands.length - 1)];
        for (let k = 0; k < count; k++) labels.push(`${band} ${k + 1}`);
    });
    return labels;
}
