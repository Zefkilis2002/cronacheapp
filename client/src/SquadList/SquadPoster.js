import React from 'react';
import './SquadPoster.css';

/**
 * SquadPoster — grafica "World Cup Squad" stile Score90.
 *
 * Renderizzato sempre a 1080x1440 (dimensione di design): l'anteprima viene
 * riscalata via transform dal wrapper in SquadList.js, quindi mobile e
 * desktop mostrano esattamente la stessa immagine.
 *
 * Props:
 *   title          — Titolo nel badge in alto (es. "WORLD CUP 2026 SQUAD")
 *   brandLogoSrc   — Logo in alto a destra (di default il logo del sito)
 *   tournamentLogoSrc / teamBadgeSrc / ballSrc — immagini opzionali
 *   sections       — { gk: [...], def: [...], mid: [...], att: [...] },
 *                    ogni giocatore { id, name, stars, logo }
 *   sectionTitles  — { gk: 'GOALKEEPERS', ... }
 *   showLegend     — bool
 *   primaryColor   — verde principale dello sfondo
 *   darkColor      — verde scuro (cornice, badge titolo)
 *   accentColor    — giallo (chip sezioni, bordo titolo, brand)
 */

// Stella SVG inline: si esporta perfettamente con html-to-image
// (le icone webfont invece possono sparire nell'export)
const Star = ({ size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
    >
        <path
            d="M12 1.7l3.15 6.45 7.05.95-5.15 4.95 1.3 7.05L12 17.7l-6.35 3.4 1.3-7.05L1.8 9.1l7.05-.95z"
            fill="#ffd21f"
            stroke="#b8912a"
            strokeWidth="1.3"
            strokeLinejoin="round"
        />
    </svg>
);

const Stars = ({ count, size }) => (
    <div className="sqp-stars">
        {Array.from({ length: Math.max(0, count) }).map((_, i) => (
            <Star key={i} size={size} />
        ))}
    </div>
);

// "THOMAS PARTEY" -> nome normale + cognome (ultima parola) in nero pesante
const splitName = (name) => {
    const clean = (name || '').trim();
    if (!clean) return { first: '', last: '' };
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return { first: '', last: parts[0] };
    return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
};

// Budget verticale di una colonna (px di design) e costi fissi usati per
// calcolare l'altezza riga: se i giocatori sono tanti, le righe si stringono
const COL_BUDGET = 1215;
const HEADER_COST = 64;   // chip sezione + margine
const SECTION_GAP = 22;   // spazio tra una sezione e la successiva
const MAX_ROW_GAP = 13;
const MAX_SLOT = 76;      // altezza riga + gap, massima
// Minimo sufficiente a far stare 12 giocatori per reparto in entrambe le
// colonne senza che la legenda in fondo sbordi dal poster
const MIN_SLOT = 30;

// Con righe fitte il gap fisso mangerebbe troppa altezza: si stringe con loro
const rowGapFor = (slot) => Math.round(Math.min(MAX_ROW_GAP, slot * 0.18));

const computeSlot = (sectionList, reservedBottom) => {
    const rows = sectionList.reduce((acc, s) => acc + s.players.length, 0);
    const headers = sectionList.filter(s => s.players.length > 0).length;
    if (rows === 0) return MAX_SLOT;
    const avail = COL_BUDGET
        - reservedBottom
        - headers * HEADER_COST
        - Math.max(0, headers - 1) * SECTION_GAP;
    return Math.max(MIN_SLOT, Math.min(MAX_SLOT, avail / rows));
};

const LEGEND_LABELS = [
    { stars: 5, label: 'WORLD-CLASS' },
    { stars: 4, label: 'EXCELLENT' },
    { stars: 3, label: 'GOOD' },
    { stars: 2, label: 'AVERAGE' },
    { stars: 1, label: 'POOR' }
];

const SquadPoster = ({
    title,
    brandLogoSrc,
    tournamentLogoSrc,
    teamBadgeSrc,
    ballSrc,
    sections,
    sectionTitles,
    showLegend = true,
    primaryColor = '#1e9e44',
    darkColor = '#0b5a24',
    accentColor = '#f7c600'
}) => {

    const leftSections = [
        { key: 'gk', title: sectionTitles.gk, players: sections.gk },
        { key: 'def', title: sectionTitles.def, players: sections.def }
    ];
    const rightSections = [
        { key: 'mid', title: sectionTitles.mid, players: sections.mid },
        { key: 'att', title: sectionTitles.att, players: sections.att }
    ];

    const leftReserved = (showLegend || ballSrc) ? 235 : 0;
    // Stessa altezza riga in entrambe le colonne (come nella grafica originale)
    const slot = Math.min(
        computeSlot(leftSections, leftReserved),
        computeSlot(rightSections, 0)
    );

    // Font del titolo adattivo: i titoli lunghi si stringono per non far
    // sbordare l'header quando ci sono anche loghi e brand
    const titleFont = Math.max(
        20,
        Math.min(34, Math.round(580 / Math.max(1, (title || 'SQUAD').length)))
    );

    const renderSection = (section, slot) => {
        if (section.players.length === 0) return null;
        const rowGap = rowGapFor(slot);
        const rowH = Math.round(slot - rowGap);
        const fontSize = Math.min(27, Math.round(rowH * 0.46));
        const starSize = Math.min(26, Math.round(rowH * 0.44));

        return (
            <div className="sqp-section" key={section.key} style={{ marginBottom: SECTION_GAP }}>
                <div
                    className="sqp-section-title"
                    style={{ backgroundColor: accentColor, color: darkColor }}
                >
                    {section.title}
                </div>
                {section.players.map((player, idx) => {
                    const { first, last } = splitName(player.name);
                    return (
                        <div
                            key={player.id}
                            className="sqp-row"
                            style={{
                                height: rowH,
                                marginBottom: idx === section.players.length - 1 ? 0 : rowGap,
                                paddingRight: player.logo ? rowH + 14 : 20
                            }}
                        >
                            <div className="sqp-name" style={{ fontSize }}>
                                {first && <span className="fn">{first} </span>}
                                <span className="ln">{last || '—'}</span>
                            </div>
                            <Stars count={player.stars} size={starSize} />
                            {player.logo && (
                                <div className="sqp-row-logo">
                                    <img src={player.logo} alt="" draggable={false} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div id="squadExportContainer" className="sqp-poster" style={{ backgroundColor: darkColor }}>
            <div className="sqp-frame" style={{ backgroundColor: primaryColor }}>
                <div className="sqp-frame-light" />
            </div>

            <div className="sqp-content">
                {/* Header */}
                <div className="sqp-header">
                    {tournamentLogoSrc && (
                        <div className="sqp-tournament">
                            <img src={tournamentLogoSrc} alt="" draggable={false} />
                        </div>
                    )}
                    {teamBadgeSrc && (
                        <div className="sqp-flag">
                            <img src={teamBadgeSrc} alt="" draggable={false} />
                        </div>
                    )}
                    <div
                        className="sqp-title"
                        style={{
                            backgroundColor: darkColor,
                            borderColor: accentColor,
                            color: accentColor
                        }}
                    >
                        {title || 'SQUAD'}
                    </div>
                    {brandLogoSrc && (
                        <div className="sqp-brand">
                            <img src={brandLogoSrc} alt="" draggable={false} />
                        </div>
                    )}
                </div>

                {/* Colonne reparti */}
                <div className="sqp-columns">
                    <div className="sqp-col">
                        {leftSections.map(s => renderSection(s, slot))}

                        {(showLegend || ballSrc) && (
                            <div className="sqp-bottom">
                                {showLegend && (
                                    <div className="sqp-legend">
                                        {LEGEND_LABELS.map(item => (
                                            <div className="sqp-legend-row" key={item.stars}>
                                                <Stars count={item.stars} size={19} />
                                                <span>: {item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {ballSrc && (
                                    <div className="sqp-ball">
                                        <img src={ballSrc} alt="" draggable={false} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="sqp-col">
                        {rightSections.map(s => renderSection(s, slot))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SquadPoster;
