// Palette e stili maglia per la grafica Starting XI.
//
// Flashscore pubblica formazioni, numeri e loghi ma NON i colori delle maglie:
// quelli arrivano da qui. Prima si cerca un preset curato (esatto per i club
// che ricorrono di più), altrimenti i colori vengono ricavati dal logo della
// squadra, che nel calcio segue quasi sempre i colori sociali.

/** Stili di maglia disponibili nell'editor. */
export const KIT_PATTERNS = [
    { id: 'solid', label: 'Tinta unita' },
    { id: 'stripes', label: 'Strisce verticali' },
    { id: 'hoops', label: 'Strisce orizzontali' },
    { id: 'halves', label: 'Metà e metà' },
    { id: 'sash', label: 'Banda diagonale' },
    { id: 'gradient', label: 'Sfumatura' },
];

/**
 * Un kit è definito da:
 *   primary   colore dominante del corpo maglia
 *   secondary secondo colore del motivo (usato solo se pattern ≠ solid)
 *   pattern   uno degli id in KIT_PATTERNS
 *   number    colore del numero e del colletto
 */
const kit = (primary, secondary, pattern, number) => ({ primary, secondary, pattern, number });

/**
 * Preset curati. Le chiavi sono nomi normalizzati (vedi normalizeTeamName):
 * minuscolo, senza suffisso nazione e senza prefissi societari.
 */
export const KIT_PRESETS = {
    // --- Super League greca ---
    'olympiakos': kit('#e30613', '#ffffff', 'stripes', '#ffffff'),
    'panathinaikos': kit('#008040', '#ffffff', 'solid', '#ffffff'),
    'paok': kit('#000000', '#ffffff', 'stripes', '#ffffff'),
    'aek': kit('#f5c518', '#000000', 'solid', '#000000'),
    'aris': kit('#f5c518', '#000000', 'solid', '#000000'),
    'ofi': kit('#000000', '#ffffff', 'hoops', '#ffffff'),
    'ofi crete': kit('#000000', '#ffffff', 'hoops', '#ffffff'),
    'atromitos': kit('#0a4a9c', '#ffffff', 'solid', '#ffffff'),
    'volos': kit('#0a3d8f', '#ffffff', 'solid', '#ffffff'),
    'asteras tripolis': kit('#f5c518', '#0a3d8f', 'solid', '#0a3d8f'),
    'panetolikos': kit('#00843d', '#ffffff', 'stripes', '#ffffff'),
    'levadiakos': kit('#008040', '#ffffff', 'solid', '#ffffff'),
    'kifisia': kit('#8b1a3a', '#ffffff', 'solid', '#ffffff'),
    'panserraikos': kit('#8b0000', '#ffffff', 'solid', '#ffffff'),
    'lamia': kit('#0a3d8f', '#ffffff', 'stripes', '#ffffff'),
    'kallithea': kit('#ffffff', '#000000', 'solid', '#000000'),
    'athens kallithea': kit('#ffffff', '#000000', 'solid', '#000000'),
    'larissa': kit('#7a0f1c', '#ffffff', 'solid', '#ffffff'),
    'ael': kit('#7a0f1c', '#ffffff', 'solid', '#ffffff'),
    'iraklis': kit('#0a76c4', '#ffffff', 'solid', '#ffffff'),
    'iraklis 1908': kit('#0a76c4', '#ffffff', 'solid', '#ffffff'),
    'kalamata': kit('#000000', '#ffffff', 'stripes', '#ffffff'),
    'panionios': kit('#0a3d8f', '#ffffff', 'solid', '#ffffff'),
    'giannina': kit('#0a3d8f', '#ffffff', 'stripes', '#ffffff'),
    'greece': kit('#0d5eaf', '#ffffff', 'solid', '#ffffff'),
    'grecia': kit('#0d5eaf', '#ffffff', 'solid', '#ffffff'),

    // --- Club europei ricorrenti nelle coppe ---
    'arsenal': kit('#ef0107', '#ffffff', 'solid', '#ffffff'),
    'real madrid': kit('#ffffff', '#dbdbdb', 'solid', '#00529f'),
    'barcelona': kit('#a50044', '#004d98', 'stripes', '#ffcb05'),
    'girona': kit('#e4002b', '#ffffff', 'stripes', '#ffffff'),
    'atletico madrid': kit('#cb3524', '#ffffff', 'stripes', '#0a2e5c'),
    'juventus': kit('#000000', '#ffffff', 'stripes', '#ffffff'),
    'inter': kit('#0068a8', '#000000', 'stripes', '#ffffff'),
    'milan': kit('#fb090b', '#000000', 'stripes', '#ffffff'),
    'napoli': kit('#12a0d7', '#ffffff', 'solid', '#ffffff'),
    'roma': kit('#8e1f2f', '#f0bc42', 'solid', '#f0bc42'),
    'lazio': kit('#87d8f7', '#ffffff', 'solid', '#ffffff'),
    'fiorentina': kit('#582c83', '#ffffff', 'solid', '#ffffff'),
    'bologna': kit('#1a2f48', '#a21c26', 'stripes', '#ffffff'),
    'liverpool': kit('#c8102e', '#ffffff', 'solid', '#ffffff'),
    'manchester united': kit('#da020e', '#ffffff', 'solid', '#ffffff'),
    'manchester city': kit('#6cabdd', '#ffffff', 'solid', '#ffffff'),
    'chelsea': kit('#034694', '#ffffff', 'solid', '#ffffff'),
    'tottenham': kit('#ffffff', '#dbdbdb', 'solid', '#132257'),
    'newcastle': kit('#000000', '#ffffff', 'stripes', '#ffffff'),
    'aston villa': kit('#95bfe5', '#670e36', 'halves', '#ffffff'),
    'bayern munich': kit('#dc052d', '#ffffff', 'solid', '#ffffff'),
    'borussia dortmund': kit('#fde100', '#000000', 'solid', '#000000'),
    'bayer leverkusen': kit('#e32221', '#000000', 'solid', '#ffffff'),
    'rb leipzig': kit('#ffffff', '#dd0741', 'solid', '#dd0741'),
    'psg': kit('#004170', '#da291c', 'sash', '#ffffff'),
    'paris saint germain': kit('#004170', '#da291c', 'sash', '#ffffff'),
    'marseille': kit('#ffffff', '#2faee0', 'solid', '#2faee0'),
    'lyon': kit('#ffffff', '#da291c', 'solid', '#003d7c'),
    'monaco': kit('#e63946', '#ffffff', 'halves', '#ffffff'),
    'lille': kit('#e01e13', '#ffffff', 'solid', '#ffffff'),
    'benfica': kit('#e30613', '#ffffff', 'solid', '#ffffff'),
    'fc porto': kit('#00428c', '#ffffff', 'stripes', '#ffffff'),
    'porto': kit('#00428c', '#ffffff', 'stripes', '#ffffff'),
    'sporting': kit('#008057', '#ffffff', 'hoops', '#ffffff'),
    'ajax': kit('#ffffff', '#d2122e', 'sash', '#d2122e'),
    'psv': kit('#ed1c24', '#ffffff', 'solid', '#ffffff'),
    'feyenoord': kit('#ffffff', '#d20a11', 'halves', '#000000'),
    'nijmegen': kit('#e30613', '#008040', 'halves', '#ffffff'),
    'celtic': kit('#018749', '#ffffff', 'hoops', '#ffffff'),
    'rangers': kit('#1b458f', '#ffffff', 'solid', '#ffffff'),
    'galatasaray': kit('#a90432', '#fbb800', 'halves', '#ffffff'),
    'fenerbahce': kit('#ffed00', '#00285e', 'hoops', '#ffffff'),
    'besiktas': kit('#000000', '#ffffff', 'stripes', '#ffffff'),
    'club brugge': kit('#0a2a5e', '#000000', 'stripes', '#ffffff'),
    'anderlecht': kit('#5a2d81', '#ffffff', 'solid', '#ffffff'),
    'red bull salzburg': kit('#ffffff', '#d1052b', 'solid', '#d1052b'),
    'salzburg': kit('#ffffff', '#d1052b', 'solid', '#d1052b'),
    'shakhtar donetsk': kit('#f36c21', '#000000', 'stripes', '#ffffff'),
    'dinamo kiev': kit('#ffffff', '#0057b8', 'solid', '#0057b8'),
    'slavia praha': kit('#ffffff', '#d7182a', 'halves', '#d7182a'),
    'sparta praha': kit('#8b1a1a', '#ffffff', 'solid', '#ffffff'),
    'bodo glimt': kit('#ffd200', '#000000', 'solid', '#000000'),
    'midtjylland': kit('#000000', '#e4032e', 'stripes', '#ffffff'),
    'fc copenhagen': kit('#ffffff', '#122e59', 'solid', '#122e59'),
    'young boys': kit('#ffec00', '#000000', 'halves', '#000000'),
    'crvena zvezda': kit('#c8102e', '#ffffff', 'stripes', '#ffffff'),
    'ludogorets': kit('#00893d', '#ffffff', 'solid', '#ffffff'),
    'maccabi tel aviv': kit('#f8d000', '#0033a0', 'solid', '#0033a0'),
    'ferencvaros': kit('#009a44', '#ffffff', 'stripes', '#ffffff'),
    'legia warszawa': kit('#ffffff', '#046a38', 'solid', '#046a38'),
    'basel': kit('#e2001a', '#0b2a5b', 'halves', '#ffffff'),
    'rijeka': kit('#ffffff', '#005baa', 'stripes', '#005baa'),
    'dinamo zagreb': kit('#0d51a1', '#ffffff', 'solid', '#ffffff'),
};

/** Kit di fallback: neutro e leggibile su qualunque sfondo. */
export const DEFAULT_KIT = kit('#1f2a44', '#ffffff', 'solid', '#ffffff');

/** Kit del portiere: distinto dai compagni, come in campo. */
export const DEFAULT_GK_KIT = kit('#2fbd77', '#157a4c', 'solid', '#ffffff');

/**
 * Normalizza un nome squadra per il lookup: toglie il suffisso nazione delle
 * coppe europee ("PAOK (Gre)"), la punteggiatura e i prefissi/suffissi
 * societari più comuni (FC, AC, SC, CF, AS, 1908...).
 */
export function normalizeTeamName(teamName) {
    if (!teamName) return '';
    let s = teamName
        .replace(/\s*\([A-Za-z]{2,3}\)\s*$/i, '')   // "(Gre)", "(NED)"
        .toLowerCase()
        .replace(/[.'`]/g, '')
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    s = s
        .replace(/^(fc|ac|as|sc|cf|sv|ss|us|afc|cd|rc|sk|fk|nk|hnk|bsc)\s+/i, '')
        .replace(/\s+(fc|ac|as|sc|cf|sv|ss|us|afc|cd|rc|sk|fk|nk|bk|if)$/i, '')
        .trim();

    return s;
}

/**
 * Cerca il preset di una squadra: match esatto, poi contenimento (il nome più
 * lungo vince, per non far scattare "aek" dentro un nome che lo contiene).
 */
export function findKitPreset(teamName) {
    const name = normalizeTeamName(teamName);
    if (!name) return null;
    if (KIT_PRESETS[name]) return { ...KIT_PRESETS[name] };

    const keys = Object.keys(KIT_PRESETS).sort((a, b) => b.length - a.length);
    for (const key of keys) {
        if (key.length < 4) continue;
        if (name === key || name.includes(key) || key.includes(name)) {
            return { ...KIT_PRESETS[key] };
        }
    }
    return null;
}

// =============================================================================
// Fallback: colori ricavati dal logo
// =============================================================================

const luminance = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

const toHex = (r, g, b) =>
    '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

/**
 * Estrae i due colori dominanti dal logo della squadra.
 *
 * I pixel vengono raggruppati in celle di colore grossolane (4 bit per canale):
 * i loghi hanno poche tinte piatte, quindi le celle più popolose sono proprio i
 * colori sociali. Si scartano i pixel trasparenti e quelli quasi bianchi/neri,
 * che nei loghi sono contorni e sfondo e non colori di maglia.
 *
 * @returns {Promise<{primary:string, secondary:string, number:string}|null>}
 */
export function extractLogoColors(logoSrc) {
    return new Promise((resolve) => {
        if (!logoSrc) return resolve(null);

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onerror = () => resolve(null);
        img.onload = () => {
            try {
                const size = 64;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, size, size);
                const { data } = ctx.getImageData(0, 0, size, size);

                const buckets = new Map();
                for (let i = 0; i < data.length; i += 4) {
                    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
                    if (a < 200) continue;

                    const lum = luminance(r, g, b);
                    if (lum > 0.93 || lum < 0.06) continue;

                    const key = `${r >> 4},${g >> 4},${b >> 4}`;
                    const acc = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
                    acc.n++; acc.r += r; acc.g += g; acc.b += b;
                    buckets.set(key, acc);
                }

                const ranked = [...buckets.values()]
                    .sort((a, b) => b.n - a.n)
                    .map(c => ({ hex: toHex(c.r / c.n, c.g / c.n, c.b / c.n), lum: luminance(c.r / c.n, c.g / c.n, c.b / c.n) }));

                if (!ranked.length) return resolve(null);

                const primary = ranked[0];
                const secondary = ranked.find(c => Math.abs(c.lum - primary.lum) > 0.2) || ranked[1] || primary;

                resolve({
                    primary: primary.hex,
                    secondary: secondary.hex,
                    // Il numero deve staccare dal corpo maglia, non intonarsi.
                    number: primary.lum > 0.55 ? '#111111' : '#ffffff',
                });
            } catch (err) {
                // Logo servito senza CORS: il canvas è "tainted" e getImageData
                // lancia. Nessun colore ricavabile, si resta sul preset/default.
                resolve(null);
            }
        };

        img.src = logoSrc;
    });
}

// =============================================================================
// Colore d'accento della grafica
// =============================================================================

/** Converte un hex in HSL con componenti 0..1. */
export function hexToHsl(hex) {
    const h = String(hex || '').replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    if (!Number.isFinite(n)) return { h: 0, s: 0, l: 0 };

    const r = ((n >> 16) & 255) / 255;
    const g = ((n >> 8) & 255) / 255;
    const b = (n & 255) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const l = (max + min) / 2;

    if (delta === 0) return { h: 0, s: 0, l };

    const s = delta / (1 - Math.abs(2 * l - 1));
    let hue;
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;

    return { h: ((hue * 60) + 360) % 360, s, l };
}

/** Ricostruisce un hex partendo da HSL (h in gradi, s/l in 0..1). */
export function hslToHex({ h, s, l }) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    const [r1, g1, b1] =
        h < 60 ? [c, x, 0] :
        h < 120 ? [x, c, 0] :
        h < 180 ? [0, c, x] :
        h < 240 ? [0, x, c] :
        h < 300 ? [x, 0, c] : [c, 0, x];

    return toHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
}

/** Stessa tinta e saturazione dell'accento, con una luminosità imposta. */
export const atLightness = (hex, l) => hslToHex({ ...hexToHsl(hex), l });

/**
 * Colore d'accento da usare per lo sfondo della grafica quando è dedicata a una
 * squadra sola.
 *
 * Il colore sociale principale non sempre funziona come accento: un nero o un
 * bianco darebbero uno sfondo piatto, senza il degradé colorato del template.
 * Si prende quindi il primo dei due colori maglia con luminosità media; se sono
 * entrambi estremi (le bianconere) si vira il principale verso il grigio.
 */
export function accentFromKit(kit) {
    const candidates = [kit.primary, kit.secondary].map(c => ({ c, l: hexToHsl(c).l }));

    const usable = candidates.find(x => x.l >= 0.12 && x.l <= 0.86);
    if (usable) return usable.c;

    const base = candidates[0];
    return atLightness(base.c, 0.28);
}

// Colori tipici delle maglie da portiere, tutti ben leggibili sullo sfondo scuro.
const GK_PALETTE = ['#2fbd77', '#f59e0b', '#7c3aed', '#0ea5e9', '#e11d48', '#1f2937'];

const hexToRgb = (hex) => {
    const h = String(hex || '').replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [0, 0, 0];
};

const colorDistance = (a, b) => {
    const [r1, g1, b1] = hexToRgb(a);
    const [r2, g2, b2] = hexToRgb(b);
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
};

/**
 * Maglia del portiere che stacca da quella dei compagni: come in campo, deve
 * essere distinguibile a colpo d'occhio. Si sceglie dalla palette il colore più
 * lontano da entrambi i colori del kit di movimento.
 */
export function pickGkKit(kit) {
    let best = GK_PALETTE[0];
    let bestScore = -1;

    for (const candidate of GK_PALETTE) {
        const score = Math.min(colorDistance(candidate, kit.primary), colorDistance(candidate, kit.secondary));
        if (score > bestScore) {
            bestScore = score;
            best = candidate;
        }
    }

    const [r, g, b] = hexToRgb(best);
    return {
        primary: best,
        secondary: '#ffffff',
        pattern: 'solid',
        number: luminance(r, g, b) > 0.55 ? '#111111' : '#ffffff',
    };
}

/**
 * Kit completo per una squadra: preset curato se esiste, altrimenti colori dal
 * logo, altrimenti il default neutro.
 */
export async function resolveKit(teamName, logoSrc) {
    const preset = findKitPreset(teamName);
    if (preset) return preset;

    const fromLogo = await extractLogoColors(logoSrc);
    if (fromLogo) {
        return {
            primary: fromLogo.primary,
            secondary: fromLogo.secondary,
            pattern: 'solid',
            number: fromLogo.number,
        };
    }

    return { ...DEFAULT_KIT };
}
