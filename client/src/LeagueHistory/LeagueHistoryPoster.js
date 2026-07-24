import React from 'react';
import FitText from '../utils/FitText';
import './LeagueHistoryPoster.css';

/**
 * LeagueHistoryPoster — timeline verticale dei risultati in campionato,
 * nello stile della grafica "Scotland World Cup".
 *
 * Renderizzato sempre a 1440x1800 (dimensione di design): l'anteprima viene
 * riscalata via transform dal wrapper in LeagueHistory.js, quindi mobile e
 * desktop mostrano esattamente la stessa immagine.
 */

export const POSTER_WIDTH = 1440;
export const POSTER_HEIGHT = 1800;

// Geometria della colonna destra (px di design)
const RIGHT_LEFT = 636;
const RIGHT_RIGHT = 40;
const RIGHT_TOP = 100;
const RIGHT_BOTTOM = 100;   // margine in fondo al pannello
const RIGHT_WIDTH = POSTER_WIDTH - RIGHT_LEFT - RIGHT_RIGHT;

const TITLE_HEIGHT = 92;
const TITLE_BORDER = 6;
const TITLE_GAP = 26;

// Lo stemma sporge sopra la targhetta e ne invade il bordo sinistro:
// questa è la quota di stemma che finisce SOPRA la targhetta
const TITLE_LOGO_OVERLAP = 0.42;

// Rientro fisso del testo quando c'è lo stemma, così il titolo si centra
// nello spazio libero. È COSTANTE: dimensione e posizione dello stemma non
// devono spostare la scritta (lo stemma si muove sopra, in modo indipendente)
const TITLE_TEXT_INSET = Math.round(160 * TITLE_LOGO_OVERLAP);

const PANEL_PAD_Y = 26;
const PANEL_PAD_X = 26;

// --- Icone esito: SVG inline, si esportano sempre (le icone webfont
// invece possono sparire con html-to-image) ---
const ICON_PATHS = {
    trophy: 'M6 3h12v6.5A6 6 0 0113 15.4V18h4v3H7v-3h4v-2.6A6 6 0 016 9.5zM3.5 4H6v4.6A2.8 2.8 0 013.5 6zM18 4h2.5v2A2.8 2.8 0 0118 8.6z',
    medal: 'M7.6 1.8L10 7H6.6L4.2 1.8zM16.4 1.8h3.4L17.4 7H14zM12 7.6a7 7 0 100 14 7 7 0 000-14z',
    check: 'M20.6 5.9l-2.2-2.2-8.5 8.5-4-4L3.7 10.4l6.2 6.2z',
    cross: 'M18.7 6.7l-1.9-1.9L12 9.6 7.2 4.8 5.3 6.7 10.1 11.5l-4.8 4.8 1.9 1.9 4.8-4.8 4.8 4.8 1.9-1.9-4.8-4.8z',
    star: 'M12 1.7l3.15 6.45 7.05.95-5.15 4.95 1.3 7.05L12 17.7l-6.35 3.4 1.3-7.05L1.8 9.1l7.05-.95z',
    down: 'M12 21.4L2.4 3.8a1 1 0 01.88-1.48h17.44a1 1 0 01.88 1.48z',
    up: 'M12 2.6l9.6 17.6a1 1 0 01-.88 1.48H3.28a1 1 0 01-.88-1.48z'
};

const Icon = ({ shape, color, size, shadow = true }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', filter: shadow ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))' : 'none' }}
    >
        <path d={ICON_PATHS[shape] || ICON_PATHS.star} fill={color} />
    </svg>
);

// Frecce decorative accanto al protagonista, come nella grafica originale
const PLAYER_ACCENTS = [
    { x: 14, y: 26, size: 52 },
    { x: 78, y: 24, size: 52 }
];

const LeagueHistoryPoster = ({
    title,
    rows,
    defaultBadgeSrc = null,
    titleLogoSrc = null,
    showTitleLogo = true,
    titleLogoSize = 160,
    titleLogoX = 0,
    titleLogoY = 0,
    badgeCircle = false,
    playerSrc = null,
    playerWidth = 46,
    playerHeight = 92,
    playerOffsetX = 0,
    playerZoom = 1,
    showPlayerAccents = true,
    playerAccentColor = '#2fe36b',
    backgroundSrc = null,
    backgroundColor = '#0b56b8',
    backgroundBlur = 18,
    tintColor = '#0b56b8',
    tintOpacity = 0.55,
    glowColor = '#e8a92b',
    glowOpacity = 0.45,
    titleBgColor = '#0a3f9e',
    titleTextColor = '#ffffff',
    titleBorderFrom = '#f7d774',
    titleBorderTo = '#b8801a',
    panelColor = '#1668d8',
    panelOpacity = 0.42,
    panelBorderColor = '#5fa4ee',
    railColor = '#1f7ae0',
    brandLogoSrc = null,
    fontFamily = "'Allotrope-Bold', Impact, sans-serif",
    titleFontFamily = "'Allotrope-Bold', Impact, sans-serif"
}) => {
    // Se non è stato caricato uno stemma dedicato alla targhetta si usa
    // quello del club, così basta caricarne uno solo
    const titleLogo = showTitleLogo ? (titleLogoSrc || defaultBadgeSrc) : null;

    // Quanto lo stemma entra dentro la targhetta (compreso lo spostamento X)
    const logoInside = Math.round(titleLogoSize * TITLE_LOGO_OVERLAP);
    // Il testo si centra nello spazio LIBERO a destra dello stemma, non in
    // tutta la targhetta: così non appare spostato a sinistra sotto lo stemma.
    // Rientro FISSO: i tre slider dello stemma non spostano la scritta
    const titlePadLeft = titleLogo ? TITLE_TEXT_INSET : 0;

    // Sporge verso l'alto, ma senza mai arrivare a toccare il pannello
    const maxLogoBottom = TITLE_HEIGHT + TITLE_GAP - 8;
    const logoTop = Math.min(
        -(titleLogoSize - TITLE_HEIGHT) * 0.75 - 4,
        maxLogoBottom - titleLogoSize
    );

    const rightHeight = POSTER_HEIGHT - RIGHT_TOP - RIGHT_BOTTOM;
    const panelHeight = rightHeight - TITLE_HEIGHT - TITLE_GAP;

    // Altezza riga ricavata dallo spazio disponibile: aggiungendo stagioni
    // le righe si stringono invece di sbordare dal pannello
    const count = Math.max(1, rows.length);
    const rowH = (panelHeight - PANEL_PAD_Y * 2) / count;

    // Tutte le misure della riga scalano con la sua altezza
    const logoSize = Math.min(118, Math.round(rowH * 0.62));
    const compSize = Math.min(110, Math.round(rowH * 0.58));   // logo competizione a destra dell'anno
    const badgeSize = Math.min(132, Math.round(rowH * 0.70));
    const yearFont = Math.min(104, Math.round(rowH * 0.56));
    const resultFont = Math.min(32, Math.round(rowH * 0.175));
    const iconSize = Math.round(logoSize * 0.52);
    const railW = Math.min(12, Math.round(rowH * 0.06));

    const innerW = RIGHT_WIDTH - PANEL_PAD_X * 2;
    // Larghezza base a disposizione di anno e pill, tolti rail, logo sx,
    // stemma e gap. Se una riga ha anche il logo competizione a destra, la
    // sua larghezza utile viene ridotta di conseguenza (calcolo per riga)
    const mainWBase = innerW - railW - logoSize - badgeSize - 66;

    const playerW = Math.round(POSTER_WIDTH * (playerWidth / 100));
    const playerH = Math.round(POSTER_HEIGHT * (playerHeight / 100));

    return (
        <div
            id="leagueHistoryExportContainer"
            className="lhp-poster"
            style={{ backgroundColor }}
        >
            {/* Sfondo */}
            <div className="lhp-bg">
                {backgroundSrc && (
                    <img
                        src={backgroundSrc}
                        alt=""
                        draggable={false}
                        style={{ filter: `blur(${backgroundBlur}px)` }}
                    />
                )}
                <div className="lhp-bg-tint" style={{ backgroundColor: tintColor, opacity: tintOpacity }} />
                <div
                    className="lhp-bg-glow"
                    style={{
                        background: `radial-gradient(58% 46% at 24% 34%, ${glowColor} 0%, rgba(0,0,0,0) 70%)`,
                        opacity: glowOpacity
                    }}
                />
                <div
                    className="lhp-bg-vignette"
                    style={{
                        background:
                            'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.45) 100%)'
                    }}
                />
            </div>

            {/* Protagonista */}
            <div
                className="lhp-player"
                style={{
                    width: playerW,
                    height: playerH,
                    transform: `translateX(${playerOffsetX}px) scale(${playerZoom})`,
                    transformOrigin: 'bottom center'
                }}
            >
                {playerSrc ? (
                    <img src={playerSrc} alt="" draggable={false} />
                ) : (
                    <div className="lhp-player-empty">
                        <Icon shape="star" color="rgba(255,255,255,0.55)" size={64} />
                        <span>Carica foto</span>
                    </div>
                )}

                {showPlayerAccents && PLAYER_ACCENTS.map((a, i) => (
                    <div
                        key={i}
                        className="lhp-accent"
                        style={{ left: `${a.x}%`, top: `${a.y}%` }}
                    >
                        <Icon shape="up" color={playerAccentColor} size={a.size} />
                    </div>
                ))}
            </div>

            {/* Colonna destra: titolo + pannello */}
            <div
                className="lhp-right"
                style={{
                    left: RIGHT_LEFT,
                    top: RIGHT_TOP,
                    width: RIGHT_WIDTH,
                    height: rightHeight
                }}
            >
                <div
                    className="lhp-title-row"
                    style={{
                        height: TITLE_HEIGHT,
                        marginBottom: TITLE_GAP,
                        width: RIGHT_WIDTH
                    }}
                >
                    <div
                        className="lhp-title-frame"
                        style={{
                            padding: TITLE_BORDER,
                            background: `linear-gradient(180deg, ${titleBorderFrom} 0%, ${titleBorderTo} 100%)`
                        }}
                    >
                        <div
                            className="lhp-title-inner"
                            style={{ backgroundColor: titleBgColor, paddingLeft: titlePadLeft }}
                        >
                            <FitText
                                className="lhp-title-text"
                                text={title || 'TITOLO'}
                                maxWidth={RIGHT_WIDTH - TITLE_BORDER * 2 - 56 - titlePadLeft}
                                // il maiuscolo sta in alto nella riga: lo spingo
                                // giù di ~0.085em per centrarlo otticamente
                                nudgeY={Math.round(46 * 0.085)}
                                style={{
                                    color: titleTextColor,
                                    fontFamily: titleFontFamily,
                                    fontSize: 46,
                                    letterSpacing: 2
                                }}
                            />
                        </div>
                    </div>

                    {/* Sopra la targhetta: sporge in alto e ne invade il bordo sinistro */}
                    {titleLogo && (
                        <div
                            className="lhp-title-logo"
                            style={{
                                width: titleLogoSize,
                                height: titleLogoSize,
                                left: logoInside - titleLogoSize,
                                top: logoTop,
                                transform: `translate(${titleLogoX}px, ${titleLogoY}px)`
                            }}
                        >
                            <img src={titleLogo} alt="" draggable={false} />
                        </div>
                    )}
                </div>

                <div
                    className="lhp-panel"
                    style={{
                        padding: `${PANEL_PAD_Y}px ${PANEL_PAD_X}px`,
                        backgroundColor: hexToRgba(panelColor, panelOpacity),
                        border: `3px solid ${panelBorderColor}`
                    }}
                >
                    {rows.map((row) => {
                        const badgeSrc = row.badge || defaultBadgeSrc;
                        // il logo competizione a destra dell'anno ruba spazio all'anno
                        const mainW = row.compLogo ? mainWBase - compSize - 22 : mainWBase;
                        return (
                            <div key={row.id} className="lhp-row" style={{ height: rowH }}>
                                <div
                                    className="lhp-rail"
                                    style={{
                                        width: railW,
                                        height: Math.round(rowH * 0.74),
                                        backgroundColor: row.highlight ? row.color : railColor,
                                        boxShadow: row.highlight
                                            ? `0 0 18px ${row.color}`
                                            : 'none'
                                    }}
                                />

                                <div
                                    className="lhp-row-logo"
                                    style={{ width: logoSize, height: logoSize, marginLeft: 22 }}
                                >
                                    {row.logo ? (
                                        <img src={row.logo} alt="" draggable={false} />
                                    ) : (
                                        <div className="lhp-row-logo-empty" />
                                    )}

                                    {row.icon !== 'none' && (
                                        <div
                                            className="lhp-row-icon"
                                            style={{
                                                width: iconSize + 16,
                                                height: iconSize + 16,
                                                backgroundColor: row.color
                                            }}
                                        >
                                            <Icon
                                                shape={row.icon}
                                                color="#ffffff"
                                                size={iconSize}
                                                shadow={false}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="lhp-row-main" style={{ marginLeft: 22, marginRight: 22 }}>
                                    <FitText
                                        className="lhp-year"
                                        text={row.year || '—'}
                                        maxWidth={mainW}
                                        style={{
                                            color: row.color,
                                            fontFamily,
                                            fontSize: yearFont,
                                            letterSpacing: 1,
                                            textShadow:
                                                '0 3px 0 rgba(0,0,0,0.30), 0 8px 16px rgba(0,0,0,0.45)'
                                        }}
                                    />
                                    {row.label && (
                                        <FitText
                                            className="lhp-result"
                                            text={row.label}
                                            maxWidth={mainW}
                                            style={{
                                                backgroundColor: row.color,
                                                color: row.labelColor || '#ffffff',
                                                fontFamily,
                                                fontSize: resultFont,
                                                letterSpacing: 1,
                                                padding: `${Math.round(resultFont * 0.42)}px ${Math.round(resultFont * 0.9)}px ${Math.round(resultFont * 0.32)}px`,
                                                // si sovrappone al fondo dell'anno, come nell'originale
                                                marginTop: -Math.round(yearFont * 0.14)
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Logo competizione a destra dell'anno */}
                                {row.compLogo && (
                                    <div
                                        className="lhp-row-comp"
                                        style={{ width: compSize, height: compSize, marginRight: 22 }}
                                    >
                                        <img src={row.compLogo} alt="" draggable={false} />
                                    </div>
                                )}

                                {badgeSrc && (
                                    <div
                                        className={`lhp-row-badge${badgeCircle ? ' circle' : ''}`}
                                        style={{ width: badgeSize, height: badgeSize }}
                                    >
                                        <img src={badgeSrc} alt="" draggable={false} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {brandLogoSrc && (
                <div className="lhp-brand" style={{ left: 46, top: 46 }}>
                    <img src={brandLogoSrc} alt="" draggable={false} />
                </div>
            )}
        </div>
    );
};

// Il pannello ha bisogno di un colore semi-trasparente ma i color picker
// danno solo hex: qui si combinano hex + opacità
function hexToRgba(hex, alpha) {
    const clean = (hex || '').replace('#', '');
    if (clean.length !== 6) return hex;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default LeagueHistoryPoster;
