import React from 'react';
import { hexToHsl, hslToHex as hslToHexLocal, atLightness } from './kitPresets';

// =============================================================================
// Metriche delle quattro varianti
// =============================================================================
//
// Le quattro grafiche sono la combinazione di due formati e due impaginazioni:
//   1440x1800 / 1080x1920  ×  due squadre (campo diviso) / una squadra (campo intero)
// Ogni variante ha misure proprie prese dai template originali, quindi qui c'è
// una tabella per combinazione invece di un'unica scala parametrica: i template
// non sono l'uno lo zoom dell'altro (cambiano spaziature, tagli e proporzioni).

export const FORMATS = [
    { id: '1440x1800', label: '1440 × 1800 (4:5)', width: 1440, height: 1800 },
    { id: '1080x1920', label: '1080 × 1920 (9:16)', width: 1080, height: 1920 },
];

export const MODES = [
    { id: 'double', label: 'Entrambe le squadre' },
    { id: 'single', label: 'Una sola squadra' },
];

const LAYOUTS = {
    '1440x1800:double': {
        width: 1440, height: 1800,
        bgSize: '1200px 900px at 50% -60px',
        title: { top: 40, size: 190, letterSpacing: -6, glow: 70 },
        card: { top: 255, width: 480, height: 150, radius: 24, pad: 20, badge: 80, badgeFont: 34, badgePad: 14, teamFont: 13, teamLs: 1, vsFont: 34, gap: 8 },
        pitch: { top: 420, left: 60, width: 1320, height: 900, radius: 16, padding: '56px 20px' },
        rowGap: 44,
        player: { width: 112, jerseyW: 108, jerseyH: 120, numSize: 44, nameSize: 24, gap: 10, bodyRadius: '16px 16px 10px 10px', sleeveRadius: 14, collarH: 9, collarMt: 8 },
        bench: { top: 1350, left: 60, width: 1320, size: 22, lineHeight: 1.85, pad: 30 },
        brand: { bottom: 55, size: 150 },
    },
    '1440x1800:single': {
        width: 1440, height: 1800,
        bgSize: '1200px 900px at 50% -60px',
        title: { top: 40, size: 190, letterSpacing: -6, glow: 70 },
        card: { top: 255, width: 480, height: 150, radius: 24, pad: 20, badge: 80, badgeFont: 34, badgePad: 14, teamFont: 13, teamLs: 1, vsFont: 34, gap: 8 },
        pitch: { top: 430, left: 20, width: 1400, height: 980, radius: 16, padding: '40px 40px' },
        halfPitch: { halfway: 230, circle: 230, boxW: 520, boxH: 210, smallW: 240, smallH: 80, arcW: 160, arcH: 80 },
        rowGap: 120,
        player: { width: 190, jerseyW: 168, jerseyH: 180, numSize: 66, nameSize: 48, gap: 8, bodyRadius: '18px 18px 12px 12px', sleeveRadius: 16, collarH: 11, collarMt: 10 },
        bench: { top: 1450, left: 20, width: 1400, size: 28, lineHeight: 1.9, pad: 0 },
        brand: { bottom: 55, size: 150 },
    },
    '1080x1920:double': {
        width: 1080, height: 1920,
        bgSize: '900px 700px at 50% -40px',
        title: { top: 180, size: 140, letterSpacing: -4, glow: 50 },
        card: { top: 350, width: 360, height: 115, radius: 18, pad: 16, badge: 60, badgeFont: 24, badgePad: 10, teamFont: 11, teamLs: 0.6, vsFont: 26, gap: 6 },
        pitch: { top: 525, left: 40, width: 1000, height: 865, radius: 14, padding: '44px 16px' },
        rowGap: 14,
        player: { width: 112, jerseyW: 105, jerseyH: 116, numSize: 34, nameSize: 19, gap: 7, bodyRadius: '14px 14px 9px 9px', sleeveRadius: 12, collarH: 7, collarMt: 7 },
        bench: { top: 1450, left: 40, width: 1000, size: 19, lineHeight: 1.7, pad: 15 },
        brand: { top: 1610, size: 130 },
    },
    '1080x1920:single': {
        width: 1080, height: 1920,
        bgSize: '900px 700px at 50% -40px',
        title: { top: 180, size: 140, letterSpacing: -4, glow: 50 },
        card: { top: 350, width: 360, height: 115, radius: 18, pad: 16, badge: 60, badgeFont: 24, badgePad: 10, teamFont: 11, teamLs: 0.6, vsFont: 26, gap: 6 },
        pitch: { top: 490, left: 15, width: 1050, height: 900, radius: 14, padding: '36px 20px' },
        halfPitch: { halfway: 200, circle: 190, boxW: 420, boxH: 170, smallW: 190, smallH: 64, arcW: 130, arcH: 64 },
        rowGap: 50,
        player: { width: 170, jerseyW: 150, jerseyH: 164, numSize: 58, nameSize: 44, gap: 6, bodyRadius: '17px 17px 11px 11px', sleeveRadius: 15, collarH: 10, collarMt: 9 },
        bench: { top: 1440, left: 15, width: 1050, size: 24, lineHeight: 1.7, pad: 0 },
        brand: { top: 1610, size: 130 },
    },
};

export const getLayout = (format, mode) => LAYOUTS[`${format}:${mode}`] || LAYOUTS['1440x1800:double'];

// =============================================================================
// Helper di composizione
// =============================================================================

/**
 * Righe della grafica a partire dal modulo.
 * Flashscore scrive i moduli col portiere in testa ("1-4-2-3-1"); qui il
 * portiere è sempre a parte, in fondo al campo, e le altre linee vanno
 * stampate dall'attacco alla difesa (l'attacco è in alto nella grafica).
 */
export function parseFormationLines(formation) {
    const parts = String(formation || '')
        .split(/[-\s]+/)
        .map(n => parseInt(n, 10))
        .filter(n => Number.isFinite(n) && n > 0);

    if (!parts.length) return [4, 3, 3];

    // Scarta il portiere se il modulo lo include ("1-4-4-2" → "4-4-2")
    const lines = (parts[0] === 1 && parts.length > 3) ? parts.slice(1) : parts;

    const total = lines.reduce((a, b) => a + b, 0);
    return total === 10 ? lines : [4, 3, 3];
}

/**
 * Divide i 10 giocatori di movimento nelle righe del modulo e le restituisce
 * dall'alto (attacco) al basso (difesa). L'ordine dentro ogni reparto è già
 * quello del campo da sinistra a destra (vedi normalizeOutfieldOrder).
 */
export function buildRows(formation, outfield) {
    const lines = parseFormationLines(formation);
    const rows = [];
    let i = 0;
    for (const count of lines) {
        rows.push(outfield.slice(i, i + count));
        i += count;
    }
    return rows.reverse();
}

/**
 * Flashscore numera i giocatori di ogni reparto da DESTRA verso sinistra (in
 * una difesa a 4: terzino destro, centrale, centrale, terzino sinistro), mentre
 * la grafica riempie le righe da sinistra. Senza questo ribaltamento terzini e
 * ali finiscono sul lato sbagliato del campo.
 */
export function normalizeOutfieldOrder(formation, outfield) {
    const lines = parseFormationLines(formation);
    const out = [];
    let i = 0;
    for (const count of lines) {
        out.push(...outfield.slice(i, i + count).reverse());
        i += count;
    }
    return out;
}

/** Spezza la panchina in `count` righe bilanciate per il blocco testuale. */
export function chunkBench(names, count = 3) {
    const clean = names.filter(Boolean);
    if (!clean.length) return [];
    const perLine = Math.ceil(clean.length / count);
    const out = [];
    for (let i = 0; i < clean.length; i += perLine) {
        out.push(clean.slice(i, i + perLine));
    }
    return out;
}

/** Iniziale usata come stemma quando la squadra non ha un logo caricato. */
const initialOf = (name) => (name || '?').trim().charAt(0).toUpperCase();

/**
 * Sfondo e titolo sono due rampe della STESSA tinta dell'accento: cambiando
 * accento (per esempio col colore della squadra) la grafica resta coerente
 * invece di ritrovarsi un titolo rosso su un fondo giallo.
 *
 * Le luminosità sono quelle misurate sul template originale; sono assolute e
 * non relative all'accento, così anche un accento già scuro produce comunque un
 * degradé che si spegne verso il nero e non uno che schiarisce.
 */
function accentRamp(accent) {
    const { h, s, l } = hexToHsl(accent);
    const stop = (target, ratio) => atLightness(accent, Math.min(target, l * ratio));

    // Il titolo del template è più saturo dello sfondo: senza questa spinta un
    // accento poco carico darebbe una scritta slavata. Gli accenti acromatici
    // (le bianconere finiscono su un grigio) restano tali: alzare la saturazione
    // di un grigio inventerebbe una tinta dal nulla.
    const titleStop = (lightness, minS) =>
        hslToHexLocal({ h, s: s < 0.05 ? s : Math.max(s, minS), l: lightness });

    return {
        bg: [accent, stop(0.29, 0.6), stop(0.11, 0.22), stop(0.033, 0.07)],
        title: [titleStop(0.72, 0.85), titleStop(0.44, 0.7), titleStop(0.27, 0.7)],
    };
}

/** L'alone dietro al titolo riprende l'accento, con la stessa opacità del template. */
function glowColor(accent) {
    const bright = atLightness(accent, 0.65).replace('#', '');
    const n = parseInt(bright, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0.35)`;
}

/**
 * Sfondo del corpo maglia: motivo scelto dall'utente più una velatura di
 * luce/ombra che dà volume al tessuto (stessa resa dei template originali).
 */
function jerseyBackground(kit) {
    const c1 = kit.primary;
    const c2 = kit.secondary;
    const shade = 'linear-gradient(155deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.30) 100%)';

    let base;
    switch (kit.pattern) {
        case 'stripes':
            base = `repeating-linear-gradient(90deg, ${c1} 0 16.6%, ${c2} 16.6% 33.2%)`;
            break;
        case 'hoops':
            base = `repeating-linear-gradient(180deg, ${c1} 0 18%, ${c2} 18% 36%)`;
            break;
        case 'halves':
            base = `linear-gradient(90deg, ${c1} 0 50%, ${c2} 50% 100%)`;
            break;
        case 'sash':
            base = `linear-gradient(115deg, ${c1} 0 38%, ${c2} 38% 62%, ${c1} 62% 100%)`;
            break;
        case 'gradient':
            base = `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`;
            break;
        default:
            base = `linear-gradient(180deg, ${c1} 0%, ${c1} 100%)`;
    }
    return `${shade}, ${base}`;
}

const sleeveBackground = (kit) =>
    `linear-gradient(155deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.28) 100%), ${kit.primary}`;

// =============================================================================
// Sotto-componenti
// =============================================================================

const Jersey = ({ kit, number, m }) => {
    // Calcola un colore di contorno contrastante per i numeri su maglie a pattern
    const numColor = kit.number || '#ffffff';
    const { l: numL } = hexToHsl(numColor);
    const strokeColor = numL > 0.5 ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)';
    const strokeWidth = Math.max(2, Math.round(m.numSize / 14));

    return (
    <div style={{ position: 'relative', width: m.jerseyW, height: m.jerseyH }}>
        {/* Maniche: due rettangoli ruotati che spuntano dalle spalle */}
        <div style={{
            position: 'absolute', left: '2%', top: '20%', width: '30%', height: '34%',
            borderRadius: m.sleeveRadius, background: sleeveBackground(kit),
            transform: 'rotate(-22deg)', transformOrigin: 'top right',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        }} />
        <div style={{
            position: 'absolute', right: '2%', top: '20%', width: '30%', height: '34%',
            borderRadius: m.sleeveRadius, background: sleeveBackground(kit),
            transform: 'rotate(22deg)', transformOrigin: 'top left',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        }} />
        {/* Corpo maglia */}
        <div style={{
            position: 'absolute', left: '20%', top: '22%', width: '60%', height: '78%',
            borderRadius: m.bodyRadius, background: jerseyBackground(kit),
            boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden',
        }}>
            <div style={{
                width: '36%', height: m.collarH, marginTop: m.collarMt,
                borderRadius: '0 0 6px 6px', background: kit.number,
            }} />
            <span style={{
                margin: 'auto 0', fontWeight: 800, fontSize: m.numSize, color: kit.number,
                lineHeight: 1,
                WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
                textShadow: `0 0 6px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.6), 0 0 14px rgba(0,0,0,0.4)`,
                paintOrder: 'stroke fill',
            }}>{number}</span>
        </div>
    </div>
    );
};

/**
 * I cognomi lunghi non vengono tagliati ma rimpiccioliti: in una grafica di
 * formazioni il nome per intero conta più della dimensione uniforme.
 * La larghezza media di un glifo di Barlow Condensed 800 è ~0.47em, quindi
 * dalla larghezza utile della cella si ricava il corpo massimo che ci sta.
 */
const GLYPH_RATIO = 0.47;

const nameFontSize = (m, name) => {
    const len = Math.max(1, (name || '').length);
    const inner = m.width - 2 * Math.round(m.gap / 1.5);
    const fitting = inner / (GLYPH_RATIO * len);
    return Math.max(m.nameSize * 0.42, Math.min(m.nameSize, fitting));
};

const PlayerCell = ({ player, kit, m }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: m.gap, width: m.width }}>
        <Jersey kit={kit} number={player.num} m={m} />
        <div style={{
            fontWeight: 800, fontSize: nameFontSize(m, player.name), color: '#fff', letterSpacing: '0.3px',
            textAlign: 'center', background: 'rgba(0,0,0,0.4)', padding: `${Math.round(m.gap / 2)}px ${Math.round(m.gap / 1.5)}px`,
            borderRadius: 6, width: '100%', boxSizing: 'border-box',
            whiteSpace: 'nowrap', overflow: 'hidden',
        }}>{player.name}</div>
    </div>
);

/** Padding orizzontale del campo, letto dalla shorthand CSS del layout. */
const horizontalPadding = (padding) => {
    const parts = String(padding).split(/\s+/);
    return parseFloat(parts[1] != null ? parts[1] : parts[0]) || 0;
};

/**
 * Le righe del modulo non hanno tutte lo stesso numero di giocatori: un
 * centrocampo a 5 in mezza metà campo non ci sta con le misure nominali.
 * Qui ogni riga riceve la spaziatura più ampia che le entra e, se nemmeno la
 * minima basta, l'intera cella viene rimpicciolita quel tanto che serve.
 */
const MIN_ROW_GAP = 6;
const MIN_ROW_SPACING = 6;

/** Riscala proporzionalmente tutte le misure di una cella giocatore. */
const scaleMetrics = (m, s) => (s === 1 ? m : {
    ...m,
    width: m.width * s,
    jerseyW: m.jerseyW * s,
    jerseyH: m.jerseyH * s,
    numSize: m.numSize * s,
    nameSize: m.nameSize * s,
    gap: m.gap * s,
    sleeveRadius: m.sleeveRadius * s,
    collarH: m.collarH * s,
    collarMt: m.collarMt * s,
});

/**
 * Altezza occupata da una cella: maglia + spazio + targhetta col nome
 * (corpo del testo per l'interlinea normale, più il padding verticale).
 */
const cellHeight = (m) => m.jerseyH + m.gap + (m.nameSize * 1.25 + m.gap);

/**
 * Il campo ha altezza fissa ma il numero di righe dipende dal modulo: un
 * 3-4-2-1 ne produce quattro più il portiere, contro le tre più portiere di un
 * 4-3-3. Senza questo adattamento le righe in eccesso sbordano dal campo e
 * finiscono sopra l'elenco dei panchinari.
 */
function verticalScale(rowCount, availableHeight, layout) {
    const needed = rowCount * cellHeight(layout.player) + (rowCount - 1) * MIN_ROW_SPACING;
    return needed > availableHeight ? availableHeight / needed : 1;
}

/** Spaziatura orizzontale di una riga, con eventuale riduzione delle celle. */
function fitRow(count, available, base, maxGap) {
    if (count <= 1) return { m: base, gap: 0 };

    const needed = count * base.width + (count - 1) * MIN_ROW_GAP;
    const m = scaleMetrics(base, needed > available ? available / needed : 1);

    const slack = (available - count * m.width) / (count - 1);
    return { m, gap: Math.max(MIN_ROW_GAP, Math.min(maxGap, slack)) };
}

/** Padding verticale del campo, letto dalla shorthand CSS del layout. */
const verticalPadding = (padding) => parseFloat(String(padding).split(/\s+/)[0]) || 0;

/** Metà campo (o campo intero) con le righe del modulo e il portiere in fondo. */
const TeamField = ({ team, layout, width, style }) => {
    const outfield = team.players.slice(1);
    const rows = buildRows(team.formation, outfield);
    const gk = team.players[0];

    const availableW = width - 2 * horizontalPadding(layout.pitch.padding);
    const availableH = layout.pitch.height - 2 * verticalPadding(layout.pitch.padding);

    // Il portiere è una riga a sé: va contato nell'altezza.
    const vScale = verticalScale(rows.length + 1, availableH, layout);
    const base = scaleMetrics(layout.player, vScale);
    const maxGap = layout.rowGap * vScale;

    return (
        <div style={{
            position: 'absolute', top: 0, height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: layout.pitch.padding, boxSizing: 'border-box',
            ...style,
        }}>
            {rows.map((row, i) => {
                const { m, gap } = fitRow(row.length, availableW, base, maxGap);
                return (
                    <div key={i} style={{ display: 'flex', gap, justifyContent: 'center', alignItems: 'flex-start' }}>
                        {row.map((p, j) => <PlayerCell key={j} player={p} kit={team.kit} m={m} />)}
                    </div>
                );
            })}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PlayerCell player={gk} kit={team.gkKit} m={base} />
            </div>
        </div>
    );
};

const TeamBadge = ({ team, layout }) => {
    const c = layout.card;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: c.gap }}>
            {team.logo ? (
                <img
                    src={team.logo}
                    alt={team.name}
                    crossOrigin="anonymous"
                    style={{ width: c.badge, height: c.badge, objectFit: 'contain' }}
                />
            ) : (
                <div style={{
                    width: c.badge, height: c.badge, background: team.kit.primary,
                    clipPath: 'polygon(0% 0%,100% 0%,100% 55%,50% 100%,0% 55%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ fontWeight: 800, fontSize: c.badgeFont, color: team.kit.number, paddingBottom: c.badgePad }}>
                        {initialOf(team.name)}
                    </span>
                </div>
            )}
            <div style={{ fontSize: c.teamFont, fontWeight: 700, letterSpacing: `${c.teamLs}px`, color: '#e8e8e8' }}>
                {team.name}
            </div>
        </div>
    );
};

const BenchBlock = ({ names, layout, style }) => {
    const b = layout.bench;
    const lines = chunkBench(names);
    return (
        <div style={{
            textAlign: 'center', color: '#d3d3d3', fontWeight: 600,
            fontSize: b.size, lineHeight: b.lineHeight, letterSpacing: '0.2px',
            boxSizing: 'border-box', ...style,
        }}>
            {lines.map((line, i) => <div key={i}>{line.join(' · ')}</div>)}
        </div>
    );
};

// =============================================================================
// Poster
// =============================================================================

const StartingXIPoster = ({
    format = '1440x1800',
    mode = 'double',
    title = 'Starting XI',
    accent = '#c8303f',
    brandLogo = '/loghi/Logo CE bianco.png',
    home,
    away,
    focus = 'away',
}) => {
    const layout = getLayout(format, mode);
    const single = mode === 'single';
    const focused = focus === 'home' ? home : away;

    const line = 'rgba(255,255,255,0.15)';
    const ramp = accentRamp(accent);

    return (
        <div
            id="startingXiExport"
            style={{
                width: layout.width,
                height: layout.height,
                position: 'relative',
                overflow: 'hidden',
                background: `radial-gradient(${layout.bgSize}, ${ramp.bg[0]} 0%, ${ramp.bg[1]} 24%, ${ramp.bg[2]} 52%, ${ramp.bg[3]} 78%, #050505 100%)`,
                fontFamily: "'Barlow Condensed', sans-serif",
            }}
        >
            {/* Titolo */}
            <div style={{ position: 'absolute', top: layout.title.top, left: 0, width: layout.width, textAlign: 'center' }}>
                <div style={{
                    fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 900,
                    fontSize: layout.title.size, lineHeight: 0.9, letterSpacing: `${layout.title.letterSpacing}px`,
                    backgroundImage: `linear-gradient(180deg,${ramp.title[0]} 0%,${ramp.title[1]} 55%,${ramp.title[2]} 100%)`,
                    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                    textShadow: `0 0 ${layout.title.glow}px ${glowColor(accent)}`,
                }}>{title}</div>
            </div>

            {/* Card squadre */}
            <div style={{
                position: 'absolute', top: layout.card.top, left: '50%', transform: 'translateX(-50%)',
                width: layout.card.width, height: layout.card.height,
                background: 'rgba(10,10,10,0.55)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: layout.card.radius, boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                padding: `0 ${layout.card.pad}px`, boxSizing: 'border-box',
            }}>
                <TeamBadge team={home} layout={layout} />
                <div style={{
                    fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 900,
                    fontSize: layout.card.vsFont, color: '#fff',
                }}>v</div>
                <TeamBadge team={away} layout={layout} />
            </div>

            {/* Campo */}
            <div style={{
                position: 'absolute', top: layout.pitch.top, left: layout.pitch.left,
                width: layout.pitch.width, height: layout.pitch.height,
                border: `2px solid ${line}`, borderRadius: layout.pitch.radius,
            }}>
                {single ? <SingleFieldMarkings layout={layout} line={line} /> : <SplitFieldMarkings layout={layout} line={line} />}

                {single ? (
                    <TeamField team={focused} layout={layout} width={layout.pitch.width} style={{ left: 0, width: '100%' }} />
                ) : (
                    <>
                        <TeamField team={home} layout={layout} width={layout.pitch.width / 2} style={{ left: 0, width: '50%' }} />
                        <TeamField team={away} layout={layout} width={layout.pitch.width / 2} style={{ right: 0, width: '50%' }} />
                    </>
                )}
            </div>

            {/* Panchine */}
            {single ? (
                <BenchBlock
                    names={focused.bench}
                    layout={layout}
                    style={{ position: 'absolute', top: layout.bench.top, left: layout.bench.left, width: layout.bench.width }}
                />
            ) : (
                <div style={{ position: 'absolute', top: layout.bench.top, left: layout.bench.left, width: layout.bench.width, display: 'flex' }}>
                    <BenchBlock names={home.bench} layout={layout} style={{ width: '50%', paddingRight: layout.bench.pad }} />
                    <BenchBlock names={away.bench} layout={layout} style={{ width: '50%', paddingLeft: layout.bench.pad }} />
                </div>
            )}

            {/* Logo testata */}
            {brandLogo && (
                <div style={{
                    position: 'absolute', left: 0, width: layout.width,
                    ...(layout.brand.bottom != null ? { bottom: layout.brand.bottom } : { top: layout.brand.top }),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <img
                        src={brandLogo}
                        alt="logo"
                        crossOrigin="anonymous"
                        style={{ width: layout.brand.size, height: layout.brand.size, objectFit: 'contain' }}
                    />
                </div>
            )}
        </div>
    );
};

/** Campo diviso a metà in verticale: una squadra per lato. */
const SplitFieldMarkings = ({ layout, line }) => {
    const circle = layout.width >= 1440 ? 220 : 160;
    return (
        <>
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: line }} />
            <div style={{
                position: 'absolute', left: '50%', top: '50%', width: circle, height: circle,
                margin: `${-circle / 2}px 0 0 ${-circle / 2}px`, border: `2px solid ${line}`, borderRadius: '50%',
            }} />
        </>
    );
};

/** Metà campo con area di rigore in basso: usata dalla versione a una squadra. */
const SingleFieldMarkings = ({ layout, line }) => {
    const h = layout.halfPitch;
    if (!h) return null;
    return (
        <>
            <div style={{ position: 'absolute', left: 0, right: 0, top: h.halfway, height: 2, background: line }} />
            <div style={{
                position: 'absolute', left: '50%', top: h.halfway, width: h.circle, height: h.circle,
                margin: `${-h.circle / 2}px 0 0 ${-h.circle / 2}px`, border: `2px solid ${line}`, borderRadius: '50%',
            }} />
            <div style={{
                position: 'absolute', left: '50%', top: h.halfway, width: 8, height: 8,
                margin: '-4px 0 0 -4px', background: 'rgba(255,255,255,0.35)', borderRadius: '50%',
            }} />
            <div style={{
                position: 'absolute', left: '50%', bottom: 0, width: h.boxW, height: h.boxH,
                marginLeft: -h.boxW / 2, border: `2px solid ${line}`, borderBottom: 'none',
            }} />
            <div style={{
                position: 'absolute', left: '50%', bottom: 0, width: h.smallW, height: h.smallH,
                marginLeft: -h.smallW / 2, border: `2px solid ${line}`, borderBottom: 'none',
            }} />
            <div style={{
                position: 'absolute', left: '50%', bottom: h.boxH, width: h.arcW, height: h.arcH,
                marginLeft: -h.arcW / 2, border: `2px solid ${line}`, borderBottom: 'none',
                borderRadius: `${h.arcW / 2}px ${h.arcW / 2}px 0 0`,
            }} />
        </>
    );
};

export default StartingXIPoster;
