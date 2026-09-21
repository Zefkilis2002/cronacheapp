import React from 'react';
import { hexToHsl, hslToHex } from '../StartingXI/kitPresets';
import { buildPositions } from './formations';
import { FRAME_W, FRAME_H } from './PhotoCropper';

// Dimensioni di design della grafica (le stesse del template originale).
export const POSTER_W = 1440;
export const POSTER_H = 1800;

const FONT = "Archivo, 'Poppins', sans-serif";

// =============================================================================
// Colori
// =============================================================================

/**
 * Le quattro fermate dello sfondo sono la STESSA tinta del colore squadra a
 * luminosità decrescenti: cambiando colore la grafica resta coerente invece di
 * ritrovarsi un degradé di due tinte diverse. I rapporti sono quelli misurati
 * sul template (verde #17784a → #0d5433 → #06301d → #021a10).
 */
export function backgroundOf(base) {
    const { h, s, l } = hexToHsl(base);
    // Un colore molto scuro non lascerebbe spazio alla rampa: si parte comunque
    // da una luminosità minima utile.
    const l0 = Math.max(l, 0.16);
    const stop = (ratio) => hslToHex({ h, s, l: l0 * ratio });
    return `radial-gradient(120% 90% at 50% 30%, ${stop(1)} 0%, ${stop(0.68)} 42%, ${stop(0.39)} 78%, ${stop(0.2)} 100%)`;
}

/** Colore della freccetta sotto lo stemma: la tinta squadra schiarita. */
export function arrowOf(base) {
    const { h, s } = hexToHsl(base);
    return hslToHex({ h, s: Math.max(s, 0.35), l: 0.36 });
}

// =============================================================================
// Testo
// =============================================================================

/**
 * Corpo del cognome: i nomi lunghi rimpiccioliscono da soli, altrimenti
 * sborderebbero dalla targhetta (nel template "KYRIAKOPOULOS" sta a 32px e
 * "VAN DRONGELEN" a 30px contro i 39px di "TETTEH").
 */
function nameSize(name) {
    const n = (name || '').length;
    if (n <= 9) return 39;
    if (n <= 11) return 35;
    if (n <= 13) return 32;
    if (n <= 16) return 30;
    return 26;
}

/** Stesso principio per il titolo con il nome della squadra. */
function teamNameSize(name) {
    const n = (name || '').length;
    if (n <= 13) return 76;
    if (n <= 16) return 64;
    if (n <= 20) return 54;
    return 44;
}

// =============================================================================
// Blocchetti riutilizzabili
// =============================================================================

/**
 * Riquadro pieno dello stemma dentro il suo PNG, in coordinate 0..1.
 *
 * I loghi non sono disegnati tutti uguali: alcuni riempiono il quadrato del
 * file, altri hanno margini trasparenti attorno. Sapere dove sta davvero il
 * disegno permette di dimensionarlo e centrarlo per quello che si vede, non
 * per il rettangolo del file.
 *
 * Restituisce null se l'immagine non è misurabile (canvas "tainted" per un
 * logo servito senza CORS): in quel caso si ricade sul comportamento base.
 */
const shapeCache = new Map();

export function measureLogoShape(src) {
    if (!src) return Promise.resolve(null);
    if (shapeCache.has(src)) return Promise.resolve(shapeCache.get(src));

    return new Promise((resolve) => {
        const done = (value) => { shapeCache.set(src, value); resolve(value); };
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onerror = () => done(null);
        img.onload = () => {
            try {
                // L'immagine viene deformata in un quadrato di misura fissa: le
                // coordinate normalizzate non cambiano e la misura costa sempre
                // uguale, anche coi PNG da 3000px.
                const size = 96;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, size, size);
                const { data } = ctx.getImageData(0, 0, size, size);

                let minX = size, minY = size, maxX = -1, maxY = -1;
                for (let py = 0; py < size; py++) {
                    for (let px = 0; px < size; px++) {
                        if (data[(py * size + px) * 4 + 3] > 16) {
                            if (px < minX) minX = px;
                            if (px > maxX) maxX = px;
                            if (py < minY) minY = py;
                            if (py > maxY) maxY = py;
                        }
                    }
                }
                if (maxX < 0) return done(null);

                done({
                    naturalW: img.naturalWidth || size,
                    naturalH: img.naturalHeight || size,
                    x: minX / size,
                    y: minY / size,
                    w: (maxX - minX + 1) / size,
                    h: (maxY - minY + 1) / size,
                });
            } catch (err) {
                // Logo servito senza header CORS: niente misura, comportamento base.
                done(null);
            }
        };
        img.src = src;
    });
}

/** Misura dello stemma, ricalcolata solo quando cambia il logo. */
export function useLogoShape(src) {
    const [shape, setShape] = React.useState(null);

    React.useEffect(() => {
        let alive = true;
        setShape(null);
        measureLogoShape(src).then(s => { if (alive) setShape(s); });
        return () => { alive = false; };
    }, [src]);

    return shape;
}

// Misure dello stemma appeso alla targhetta, prese dal template.
const CREST = { size: 66, overhang: 18 };

export const CREST_STYLES = [
    { id: 'template', label: 'Sovrapposto (stemmi tondi)' },
    { id: 'inline', label: 'Appoggiato (stemmi a scudo)' },
];

/**
 * Stemma agganciato alla targhetta del cognome.
 *
 * 'template' è il taglio originale: quadrato da 66px appeso al bordo destro,
 * che sborda di 18px. Con un emblema circolare il cerchio e la barra si
 * compenetrano bene ed è esattamente il risultato voluto.
 *
 * 'inline' serve agli stemmi con angoli vivi — scudi, losanghe, rettangoli —
 * che con quel taglio scavalcano la barra sopra e sotto correndole parallela e
 * sembrano un adesivo incollato storto. Qui la SAGOMA (non il quadrato del
 * file) viene portata all'altezza della targhetta e centrata sulla sua
 * mezzeria: lo stemma si appoggia in fondo alla barra invece di attraversarla,
 * sbordando a destra quanto un cerchio.
 */
const PlateCrest = ({ logo, shape, crestStyle }) => {
    // Senza misura (logo esterno senza CORS) resta il taglio del template.
    if (crestStyle !== 'inline' || !shape) {
        return (
            <img
                src={logo}
                alt=""
                draggable={false}
                style={{
                    position: 'absolute',
                    right: -CREST.overhang,
                    width: CREST.size,
                    height: CREST.size,
                    objectFit: 'contain',
                }}
            />
        );
    }

    const { naturalW, naturalH, x, y, w, h } = shape;

    // Altezza della sagoma: poco meno della targhetta, così ci sta dentro
    // invece di scavalcarla sopra e sotto.
    const visH = 52;
    const visW = visH * ((w * naturalW) / (h * naturalH));

    // Scala dell'immagine intera perché la sola sagoma misuri visH.
    const k = visH / (h * naturalH);
    const imgW = naturalW * k;
    const imgH = naturalH * k;

    return (
        <span style={{
            position: 'absolute',
            // Sborda a destra come un cerchio: stessa aria oltre il bordo.
            right: -CREST.overhang,
            top: '50%',
            transform: 'translateY(-50%)',
            width: visW,
            height: visH,
            overflow: 'hidden',
            display: 'block',
        }}>
            <img
                src={logo}
                alt=""
                draggable={false}
                style={{
                    position: 'absolute',
                    left: -x * imgW,
                    top: -y * imgH,
                    width: imgW,
                    height: imgH,
                    maxWidth: 'none',
                }}
            />
        </span>
    );
};

const NewBadge = ({ color, size, radius, padding }) => (
    <div style={{
        background: color,
        borderRadius: radius,
        padding,
        display: 'flex',
        alignItems: 'center',
        color: '#141414',
        fontSize: size,
        fontWeight: 900,
        letterSpacing: 1,
        boxShadow: 'inset -1px 0 0 rgba(0,0,0,0.2)',
    }}>NEW</div>
);

/**
 * Foto del giocatore dentro allo slot 214x243. Mostra SOLO la porzione scelta
 * col ritaglio (cropX/Y/W/H, frazioni della foto) e la scala in modo UNIFORME
 * (stesso fattore su larghezza e altezza): nessuna deformazione. Se il ritaglio
 * ha proporzioni diverse dallo slot resta un margine trasparente, coerente con
 * le foto-scontorno su fondo trasparente. Lo slot mantiene sempre 214x243 così
 * la targhetta sotto non si sposta.
 */
const PhotoBox = ({ player }) => {
    const nW = player.photoNatW || 0;
    const nH = player.photoNatH || 0;
    const cw = player.cropW || 0;
    const ch = player.cropH || 0;
    const ready = nW > 0 && nH > 0 && cw > 0 && ch > 0;

    const outer = {
        width: FRAME_W,
        height: FRAME_H,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.5))',
    };

    if (!ready) {
        // Ritaglio non ancora noto: foto intera, proporzionata, senza tagli.
        return (
            <div style={outer}>
                <img
                    src={player.photo}
                    alt={player.name || ''}
                    draggable={false}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                />
            </div>
        );
    }

    const cropPxW = cw * nW;
    const cropPxH = ch * nH;
    const fit = Math.min(FRAME_W / cropPxW, FRAME_H / cropPxH);

    return (
        <div style={outer}>
            <div style={{ width: cropPxW * fit, height: cropPxH * fit, overflow: 'hidden', position: 'relative' }}>
                <img
                    src={player.photo}
                    alt={player.name || ''}
                    draggable={false}
                    style={{
                        position: 'absolute',
                        width: nW * fit,
                        height: nH * fit,
                        // Tailwind Preflight (caricato altrove) impone
                        // img { max-width: 100% }: senza questi due la foto
                        // larga viene compressa nello slot e si deforma.
                        maxWidth: 'none',
                        maxHeight: 'none',
                        left: -player.cropX * nW * fit,
                        top: -player.cropY * nH * fit,
                        display: 'block',
                    }}
                />
            </div>
        </div>
    );
};

/**
 * Un giocatore: foto ritagliata, targhetta col cognome (e stemma sporgente) e,
 * sotto, l'eventuale alternativa. I due bollini "NEW" sono indipendenti.
 */
const PlayerCard = ({ player, position, teamLogo, logoShape, crestStyle, newColor, globalScale }) => {
    const scale = (position.scale || 1) * (player.scale || 1) * globalScale;

    return (
        <div style={{
            position: 'absolute',
            left: `${position.x}%`,
            top: position.y + (player.offsetY || 0),
            transform: `translateX(calc(-50% + ${player.offsetX || 0}px)) scale(${scale})`,
            transformOrigin: 'top center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            // I giocatori più in basso stanno davanti a quelli più in alto,
            // come nel campo in prospettiva.
            zIndex: 10 + Math.round(position.y / 10),
        }}>
            {player.photo ? (
                <PhotoBox player={player} />
            ) : (
                // Segnaposto: tiene l'ingombro della foto, così l'impaginazione
                // non salta mentre si compila la formazione.
                <div style={{
                    width: FRAME_W,
                    height: FRAME_H,
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    paddingBottom: 18,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.18) 100%)',
                    border: '2px dashed rgba(255,255,255,0.22)',
                    borderRadius: 12,
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: 1,
                }}>FOTO</div>
            )}

            {/* Riga del titolare */}
            <div style={{ display: 'flex', alignItems: 'stretch', marginTop: -6, position: 'relative', zIndex: 3 }}>
                {player.isNew && (
                    <NewBadge color={newColor} size={24} radius="8px 0 0 0" padding="0 15px" />
                )}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(28,28,28,0.92)',
                    borderRadius: player.isNew ? '0 8px 0 0' : '8px 8px 0 0',
                    // Lo stemma sporge a destra: quel lato ha bisogno di più aria.
                    padding: `9px ${teamLogo ? 58 : 26}px 9px ${player.isNew ? 18 : 22}px`,
                    position: 'relative',
                }}>
                    <span style={{
                        color: '#fff',
                        fontSize: nameSize(player.name),
                        fontWeight: 800,
                        letterSpacing: 1,
                        whiteSpace: 'nowrap',
                        lineHeight: 1.1,
                    }}>{player.name || '—'}</span>
                    {teamLogo && (
                        <PlateCrest logo={teamLogo} shape={logoShape} crestStyle={crestStyle} />
                    )}
                </div>
            </div>

            {/* Riga dell'alternativa */}
            {player.sub ? (
                <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative', zIndex: 3 }}>
                    {player.subIsNew && (
                        <NewBadge color={newColor} size={18} radius="0 0 0 8px" padding="0 11px" />
                    )}
                    <div style={{
                        background: 'rgba(28,28,28,0.82)',
                        borderRadius: player.subIsNew ? '0 0 8px 0' : '0 0 8px 8px',
                        padding: '6px 24px',
                        color: '#e8e8e8',
                        fontSize: 26,
                        fontWeight: 700,
                        letterSpacing: 1,
                        whiteSpace: 'nowrap',
                        lineHeight: 1.25,
                    }}>{player.sub}</div>
                </div>
            ) : (
                // Senza alternativa la targhetta del titolare resterebbe aperta
                // in basso: una strisciolina le ridà gli angoli arrotondati.
                <div style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(28,28,28,0.92)',
                    borderRadius: '0 0 8px 8px',
                    position: 'relative',
                    zIndex: 3,
                }} />
            )}
        </div>
    );
};

// =============================================================================
// Poster
// =============================================================================

/**
 * Grafica "Lineup v2" — formazione su campo in prospettiva, con foto ritagliate
 * dei giocatori, cognome, alternativa e bollini "NEW" per i nuovi acquisti.
 *
 * Props:
 *   competition   testo del pannello in alto (es. "SUPER LEAGUE")
 *   teamName      nome della squadra sotto lo stemma
 *   teamLogo      stemma: testata, targhette e filigrane di sfondo
 *   brandLogo     logo della testata, in basso a sinistra
 *   baseColor     colore squadra da cui nasce tutto lo sfondo
 *   newColor      colore dei bollini "NEW"
 *   crestStyle    aggancio dello stemma alle targhette: 'template' o 'inline'
 *   formation     modulo, es. "4-3-3"
 *   players       11 giocatori nell'ordine portiere → difesa → attacco
 *   spread        distanza tra i reparti (1 = template)
 *   playerScale   ingrandimento globale dei giocatori
 *   watermark     opacità degli stemmi di sfondo (0 = nessuno)
 */
const LineUpV2Poster = ({
    competition = 'SUPER LEAGUE',
    teamName = '',
    teamLogo = null,
    brandLogo = null,
    baseColor = '#17784a',
    newColor = '#FFC61A',
    crestStyle = 'template',
    formation = '4-3-3',
    players = [],
    spread = 1,
    playerScale = 1,
    watermark = 0.85,
}) => {
    const positions = buildPositions(formation, spread);
    const logoShape = useLogoShape(teamLogo);
    const line = 'rgba(255,255,255,0.45)';

    return (
        <div
            id="lineupV2Export"
            style={{
                position: 'relative',
                width: POSTER_W,
                height: POSTER_H,
                overflow: 'hidden',
                fontFamily: FONT,
                background: backgroundOf(baseColor),
            }}
        >
            {/* Stemmi giganti in filigrana */}
            {teamLogo && watermark > 0 && (
                <>
                    <div style={{
                        position: 'absolute', left: -170, top: 150, width: 560, height: 560,
                        background: `url('${teamLogo}') center/contain no-repeat`,
                        opacity: watermark, filter: 'brightness(1.6)',
                    }} />
                    <div style={{
                        position: 'absolute', right: -170, top: 150, width: 560, height: 560,
                        background: `url('${teamLogo}') center/contain no-repeat`,
                        opacity: watermark, filter: 'brightness(1.6)',
                    }} />
                </>
            )}

            {/* Velatura alto/basso */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.45) 100%)',
            }} />

            {/* Campo in prospettiva */}
            <div style={{ position: 'absolute', left: 58, right: 58, top: 150, bottom: 64, perspective: 2800 }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    transformOrigin: 'bottom center',
                    transform: 'rotateX(16deg)',
                    background: 'linear-gradient(180deg, rgba(20,40,28,0.72) 0%, rgba(16,34,24,0.55) 55%, rgba(10,26,17,0.62) 100%)',
                    border: `7px solid ${line}`,
                    boxShadow: '0 40px 90px rgba(0,0,0,0.45) inset',
                }}>
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.065) 0 62px, rgba(0,0,0,0.07) 62px 124px)',
                    }} />
                    <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 7, background: line }} />
                    <div style={{ position: 'absolute', left: '50%', top: '50%', width: 420, height: 420, margin: '-210px 0 0 -210px', border: `7px solid ${line}`, borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', left: '50%', top: 0, width: 580, height: 240, marginLeft: -290, border: `7px solid ${line}`, borderTop: 0 }} />
                    <div style={{ position: 'absolute', left: '50%', bottom: 0, width: 580, height: 240, marginLeft: -290, border: `7px solid ${line}`, borderBottom: 0 }} />
                    <div style={{ position: 'absolute', left: '50%', top: 0, width: 260, height: 94, marginLeft: -130, border: `7px solid ${line}`, borderTop: 0 }} />
                    <div style={{ position: 'absolute', left: '50%', bottom: 0, width: 260, height: 94, marginLeft: -130, border: `7px solid ${line}`, borderBottom: 0 }} />
                </div>
            </div>

            {/* Testata */}
            <div style={{
                position: 'absolute', left: 0, right: 0, top: 24,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                zIndex: 5,
            }}>
                {competition && (
                    <div style={{ background: 'rgba(255,255,255,0.16)', borderRadius: 14, padding: '11px 40px' }}>
                        <div style={{ color: '#fff', fontSize: 44, fontWeight: 800, letterSpacing: 4, lineHeight: 1 }}>
                            {competition}
                        </div>
                    </div>
                )}
                {teamLogo && (
                    <div style={{
                        background: 'rgba(255,255,255,0.14)', borderRadius: 16, padding: '9px 32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <img src={teamLogo} alt="" draggable={false} style={{
                            width: 84, height: 84, objectFit: 'contain',
                            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
                        }} />
                    </div>
                )}
                <div style={{
                    width: 0, height: 0,
                    borderLeft: '11px solid transparent',
                    borderRight: '11px solid transparent',
                    borderTop: `13px solid ${arrowOf(baseColor)}`,
                    marginTop: -2,
                }} />
                <div style={{
                    color: '#fff',
                    fontSize: teamNameSize(teamName),
                    fontWeight: 900,
                    letterSpacing: 9,
                    lineHeight: 1,
                    marginTop: 2,
                    textShadow: '0 6px 22px rgba(0,0,0,0.55)',
                    whiteSpace: 'nowrap',
                }}>{teamName}</div>
            </div>

            {/* Giocatori */}
            {players.map((player, i) => (
                <PlayerCard
                    key={i}
                    player={player}
                    position={positions[i] || { x: 50, y: 900, scale: 1 }}
                    teamLogo={teamLogo}
                    logoShape={logoShape}
                    crestStyle={crestStyle}
                    newColor={newColor}
                    globalScale={playerScale}
                />
            ))}

            {/* Piede */}
            <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0, height: 100,
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.7) 100%)',
                zIndex: 55,
            }} />
            {brandLogo && (
                <img src={brandLogo} alt="" draggable={false} style={{
                    position: 'absolute', left: 32, bottom: 16, width: 118, height: 'auto',
                    objectFit: 'contain', opacity: 0.85, zIndex: 60,
                }} />
            )}
        </div>
    );
};

export default LineUpV2Poster;
