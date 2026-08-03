import React, { useRef, useState, useLayoutEffect } from 'react';
import './PlayerStatsPoster.css';

/**
 * PlayerStatsPoster — card statistiche giocatore (foto a tutto campo + nome +
 * riquadri statistiche), formato 1440x1800.
 *
 * Renderizzato sempre a 1440x1800 (dimensione di design): l'anteprima viene
 * riscalata via transform dal wrapper in PlayerStats.js.
 */

const NAME_MAX_WIDTH = 1280;   // larghezza del nome nella reference
const NAME_MAX_FONT = 150;
const NAME_MIN_FONT = 60;

const PersonIcon = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="34" r="20" fill="rgba(255,255,255,0.9)" />
        <path d="M12 96c2-26 20-40 38-40s36 14 38 40z" fill="rgba(255,255,255,0.9)" />
    </svg>
);

const PlayerStatsPoster = ({
    photo,
    photoPosX = 50,
    photoPosY = 18,
    photoZoom = 1,
    brandLogoSrc,
    name = '',
    stats = [],
    numberColor = '#090695',
    boxColor = '#ffffff',
    fadeStrength = 0.9
}) => {
    // Auto-fit del nome: sempre su UNA riga, riempie la larghezza disponibile
    // senza superare una dimensione massima (misura la larghezza reale).
    const nameRef = useRef(null);
    const [nameFont, setNameFont] = useState(NAME_MAX_FONT);

    useLayoutEffect(() => {
        const el = nameRef.current;
        if (!el || !name) return;
        let cancelled = false;
        const fit = () => {
            if (cancelled || !nameRef.current) return;
            nameRef.current.style.fontSize = `${NAME_MAX_FONT}px`;
            const w = nameRef.current.scrollWidth;
            const fs = w > NAME_MAX_WIDTH
                ? Math.max(NAME_MIN_FONT, Math.floor(NAME_MAX_FONT * NAME_MAX_WIDTH / w))
                : NAME_MAX_FONT;
            setNameFont(fs);
        };
        fit();
        // Rimisura dopo il caricamento dei font (la prima misura può avvenire
        // col font di fallback, più stretto, e non ridurre correttamente).
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(fit);
        }
        return () => { cancelled = true; };
    }, [name]);

    return (
        <div id="playerStatsExportContainer" className="ps-poster">
            <div className="ps-photo-wrap">
                {photo ? (
                    <img
                        src={photo}
                        alt={name}
                        className="ps-photo"
                        draggable={false}
                        style={{
                            objectPosition: `${photoPosX}% ${photoPosY}%`,
                            transform: `scale(${photoZoom})`,
                            transformOrigin: `${photoPosX}% ${photoPosY}%`
                        }}
                    />
                ) : (
                    <div className="ps-photo-placeholder"><PersonIcon /></div>
                )}
            </div>

            <div
                className="ps-bottom-fade"
                style={{
                    background: `linear-gradient(to bottom,
                        transparent 40%,
                        rgba(0,0,0,${fadeStrength * 0.6}) 68%,
                        rgba(0,0,0,${fadeStrength}) 100%)`
                }}
            />

            {brandLogoSrc && (
                <div className="ps-brand">
                    <img src={brandLogoSrc} alt="" draggable={false} />
                </div>
            )}

            <div className="ps-content">
                {name && (
                    <div className="ps-name" ref={nameRef} style={{ fontSize: `${nameFont}px` }}>
                        {name}
                    </div>
                )}

                <div className="ps-stats">
                    {stats.map((s, i) => (
                        <div className="ps-stat" key={i}>
                            <div className="ps-stat-box" style={{ background: boxColor, color: numberColor }}>
                                <span>{s.value}</span>
                            </div>
                            <div className="ps-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PlayerStatsPoster;
