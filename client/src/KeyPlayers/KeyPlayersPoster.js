import React from 'react';
import FitText from '../utils/FitText';
import './KeyPlayersPoster.css';

/**
 * KeyPlayersPoster — grafica a tre fasce (Manager / Star Player / One To Watch)
 * ispirata al layout Score90.
 *
 * Renderizzato sempre a 1440x1800 (dimensione di design): l'anteprima viene
 * riscalata via transform dal wrapper in KeyPlayers.js, quindi mobile e
 * desktop mostrano esattamente la stessa immagine.
 *
 * Props:
 *   sections        — array di 3 oggetti (vedi makeSection in KeyPlayers.js)
 *   brandLogoSrc    — logo in alto (di default il logo del sito)
 *   brandPosition   — 'left' | 'right'
 *   defaultCrestSrc — stemma usato dalle fasce che non ne hanno uno proprio
 *   pillColor / pillTextColor — barra colorata del ruolo
 *   nameColor       — colore di cognome e nome
 *   shapeColor      — grande cerchio decorativo dietro al testo
 *   separatorColor / separatorSize — linee tra le fasce
 *   fontFamily      — font di cognome e barra ruolo
 *   subFontFamily   — font del nome di battesimo
 */

export const POSTER_WIDTH = 1440;
export const POSTER_HEIGHT = 1800;

// Le fasce si stringono quanto serve per far entrare i separatori
// mantenendo il totale esattamente a POSTER_HEIGHT
const bandHeightFor = (separatorSize) => (POSTER_HEIGHT - separatorSize * 2) / 3;

// Diametro del cerchio decorativo dietro al blocco di testo
const SHAPE_SIZE = 840;

// Quanto il blocco di testo può invadere la metà occupata dalla foto: nella
// grafica originale il nome sfiora il bordo della foto
const TEXT_OVERLAP = 60;
const TEXT_PADDING = 44;

// Corpi base: il testo che non ci sta viene rimpicciolito da FitText
const LAST_FONT = 120;
const FIRST_FONT = 52;
const PILL_FONT = 38;

// --- Icone accento: SVG inline, si esportano sempre (le icone webfont
// invece possono sparire con html-to-image) ---

const ICON_PATHS = {
    star: 'M12 1.7l3.15 6.45 7.05.95-5.15 4.95 1.3 7.05L12 17.7l-6.35 3.4 1.3-7.05L1.8 9.1l7.05-.95z',
    arrow: 'M12 2.6l9.6 17.6a1 1 0 01-.88 1.48H3.28a1 1 0 01-.88-1.48z',
    bolt: 'M13.6 1.8L4.2 13.6h5.4l-1.2 8.6 9.4-11.8h-5.4z',
    fire: 'M12 1.5c2.9 3.9 1 5.2 3 8 1-1 1.2-2.2 1.2-3.4 2.1 2.2 3.3 5.3 3.3 7.6a7.5 7.5 0 11-15 0c0-4.3 3.3-8 7.5-12.2z',
    shield: 'M12 1.8l8.2 3v6.3c0 5-3.4 9.3-8.2 10.9-4.8-1.6-8.2-5.9-8.2-10.9V4.8z'
};

const AccentIcon = ({ shape, color, size }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.35))' }}
    >
        <path
            d={ICON_PATHS[shape] || ICON_PATHS.star}
            fill={color}
            stroke="rgba(0,0,0,0.28)"
            strokeWidth="0.9"
            strokeLinejoin="round"
        />
    </svg>
);

// Posizione (% della metà occupata dalla foto) e dimensione di ogni icona,
// per tipo di accento. Ricalca la disposizione della grafica originale.
const ACCENT_LAYOUTS = {
    none: [],
    star: [{ x: 68, y: 30, size: 120 }],
    stars: [{ x: 70, y: 26, size: 112 }, { x: 44, y: 15, size: 74 }],
    arrows: [{ x: 22, y: 73, size: 104 }, { x: 76, y: 67, size: 84 }],
    bolt: [{ x: 70, y: 30, size: 118 }],
    fire: [{ x: 70, y: 32, size: 116 }],
    shield: [{ x: 70, y: 30, size: 118 }]
};

const ACCENT_SHAPES = {
    star: 'star',
    stars: 'star',
    arrows: 'arrow',
    bolt: 'bolt',
    fire: 'fire',
    shield: 'shield'
};

const KeyPlayersPoster = ({
    sections,
    brandLogoSrc,
    brandPosition = 'right',
    defaultCrestSrc = null,
    pillColor = '#dda600',
    pillTextColor = '#ffffff',
    nameColor = '#ffffff',
    shapeColor = '#1a6ade',
    separatorColor = '#ffffff',
    separatorSize = 5,
    fontFamily = "'Allotrope-Bold', 'Benzin-ExtraBold', Impact, sans-serif",
    subFontFamily = "'Poppins', sans-serif"
}) => {
    const bandH = bandHeightFor(separatorSize);

    return (
        <div
            id="keyPlayersExportContainer"
            className="kpp-poster"
            style={{ backgroundColor: separatorColor }}
        >
            {sections.map((section, index) => {
                const photoLeft = section.photoSide === 'left';
                const crestSrc = section.crest || defaultCrestSrc;
                const photoW = Math.round(POSTER_WIDTH * (section.photoWidth / 100));
                const photoH = bandH + section.overflow;

                // Il blocco di testo occupa la parte NON coperta dalla foto
                // (più un piccolo margine di sovrapposizione): se l'utente
                // allarga la foto, i nomi si stringono di conseguenza
                const textW = POSTER_WIDTH - photoW + TEXT_OVERLAP;
                const textInner = Math.max(160, textW - TEXT_PADDING * 2);

                const accents = ACCENT_LAYOUTS[section.accent] || [];
                const accentShape = ACCENT_SHAPES[section.accent];

                // Il cerchio decorativo sta sempre dalla parte del testo
                const shapeCenterX = photoLeft
                    ? POSTER_WIDTH - textW / 2
                    : textW / 2;

                return (
                    <div
                        key={section.id}
                        className="kpp-band"
                        style={{
                            top: index * (bandH + separatorSize),
                            height: bandH,
                            // le fasce più in basso stanno sopra: così la foto
                            // che sborda verso l'alto copre la fascia precedente
                            zIndex: 10 + index,
                            backgroundColor: section.bandColor
                        }}
                    >
                        <div className="kpp-band-bg">
                            <div
                                className="kpp-shape"
                                style={{
                                    width: SHAPE_SIZE,
                                    height: SHAPE_SIZE,
                                    left: shapeCenterX - SHAPE_SIZE / 2,
                                    top: (bandH - SHAPE_SIZE) / 2,
                                    background: shapeColor
                                }}
                            />
                            <div className="kpp-band-light" />
                        </div>

                        {/* Foto: ancorata in basso, può sbordare verso l'alto */}
                        <div
                            className="kpp-photo"
                            style={{
                                width: photoW,
                                height: photoH,
                                left: photoLeft ? 0 : undefined,
                                right: photoLeft ? undefined : 0
                            }}
                        >
                            {section.photo ? (
                                <img
                                    src={section.photo}
                                    alt=""
                                    draggable={false}
                                    style={{
                                        transform: `translate(${section.offsetX}%, ${section.offsetY}%) scale(${section.zoom})`
                                    }}
                                />
                            ) : (
                                <div className="kpp-photo-empty">
                                    <AccentIcon shape="shield" color="rgba(255,255,255,0.55)" size={64} />
                                    <span>Carica foto</span>
                                </div>
                            )}
                        </div>

                        {/* Icone accento sopra la foto */}
                        {accents.length > 0 && accentShape && (
                            <div
                                className="kpp-accents"
                                style={{
                                    width: photoW,
                                    height: photoH,
                                    left: photoLeft ? 0 : undefined,
                                    right: photoLeft ? undefined : 0
                                }}
                            >
                                {accents.map((a, i) => (
                                    <div
                                        key={i}
                                        className="kpp-accent"
                                        style={{ left: `${a.x}%`, top: `${a.y}%` }}
                                    >
                                        <AccentIcon
                                            shape={accentShape}
                                            color={section.accentColor}
                                            size={a.size}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Blocco di testo dalla parte opposta alla foto */}
                        <div
                            className="kpp-text"
                            style={{
                                width: textW,
                                padding: `0 ${TEXT_PADDING}px`,
                                left: photoLeft ? undefined : 0,
                                right: photoLeft ? 0 : undefined
                            }}
                        >
                            {crestSrc && (
                                <div className="kpp-crest">
                                    <img src={crestSrc} alt="" draggable={false} />
                                </div>
                            )}

                            {section.roleLabel && (
                                <FitText
                                    className="kpp-pill"
                                    text={section.roleLabel}
                                    maxWidth={textInner}
                                    style={{
                                        backgroundColor: pillColor,
                                        color: pillTextColor,
                                        fontFamily,
                                        fontSize: PILL_FONT,
                                        letterSpacing: 3
                                    }}
                                />
                            )}

                            <FitText
                                className="kpp-last"
                                text={section.lastName || '—'}
                                maxWidth={textInner}
                                style={{
                                    color: nameColor,
                                    fontFamily,
                                    fontSize: LAST_FONT,
                                    letterSpacing: 0
                                }}
                            />

                            {section.firstName && (
                                <FitText
                                    className="kpp-first"
                                    text={section.firstName}
                                    maxWidth={textInner}
                                    style={{
                                        color: nameColor,
                                        fontFamily: subFontFamily,
                                        fontSize: FIRST_FONT,
                                        letterSpacing: 5
                                    }}
                                />
                            )}
                        </div>
                    </div>
                );
            })}

            {brandLogoSrc && (
                <div
                    className="kpp-brand"
                    style={{
                        top: 40,
                        left: brandPosition === 'left' ? 54 : undefined,
                        right: brandPosition === 'left' ? undefined : 54
                    }}
                >
                    <img src={brandLogoSrc} alt="" draggable={false} />
                </div>
            )}
        </div>
    );
};

export default KeyPlayersPoster;
