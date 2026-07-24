import React from 'react';
import './SpotlightPoster.css';

/**
 * SpotlightPoster — grafica "Manager / Star Player / One To Watch" a 3 fasce,
 * stile Score90 ispirato alla grafica nazionale Scozia.
 *
 * Renderizzato sempre a 1440x1800 (dimensione di design): l'anteprima viene
 * riscalata via transform dal wrapper in Spotlight.js, quindi mobile e
 * desktop mostrano esattamente la stessa immagine.
 *
 * Props:
 *   brandLogoSrc   — logo in alto a sinistra
 *   backgroundColor, accentColor, arrowColor, pillTextColor — palette
 *   manager, starPlayer, oneToWatch — { surname, firstName, photo, badge }
 */

const hexToRgba = (hex, opacity) => {
    if (!hex || typeof hex !== 'string') return `rgba(10, 20, 50, ${opacity})`;
    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const r = parseInt(c.substring(0, 2), 16) || 0;
    const g = parseInt(c.substring(2, 4), 16) || 0;
    const b = parseInt(c.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const ShieldIcon = () => (
    <svg viewBox="0 0 24 24" width="46%" height="46%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2l8 3.2v6c0 5-3.4 8.7-8 10.8-4.6-2.1-8-5.8-8-10.8v-6L12 2z"
            fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
    </svg>
);

const PersonIcon = () => (
    <svg viewBox="0 0 100 100" width="50%" height="80%" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto' }}>
        <circle cx="50" cy="34" r="20" fill="rgba(255,255,255,0.18)" />
        <path d="M12 96c2-26 20-40 38-40s36 14 38 40z" fill="rgba(255,255,255,0.18)" />
    </svg>
);

const StarIcon = ({ size = 20, color = '#0b1e42' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        <path d="M12 1.7l3.15 6.45 7.05.95-5.15 4.95 1.3 7.05L12 17.7l-6.35 3.4 1.3-7.05L1.8 9.1l7.05-.95z" fill={color} />
    </svg>
);

const WhistleIcon = ({ size = 20, color = '#0b1e42' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        <circle cx="9" cy="15" r="6" fill="none" stroke={color} strokeWidth="2" />
        <path d="M9 9V5h9a3 3 0 013 3v1a3 3 0 01-3 3h-3" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const ArrowUpIcon = ({ size = 20, color = '#0b1e42' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        <path d="M12 20V5M5 11l7-7 7 7" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ROLE_ICONS = {
    manager: WhistleIcon,
    star: StarIcon,
    watch: ArrowUpIcon
};

// Vignettatura che fonde la foto (cutout) con lo sfondo colorato scelto
// dall'utente: senza questa il ritaglio resterebbe "staccato" dallo sfondo
const PhotoBlock = ({ image, bgColor, alt }) => (
    <div className="spot-photo-wrap">
        {image ? (
            <img src={image} alt={alt} className="spot-photo" draggable={false} />
        ) : (
            <PersonIcon />
        )}
        <div
            className="spot-photo-fade"
            style={{
                background: `radial-gradient(120% 95% at 50% 42%, transparent 45%, ${hexToRgba(bgColor, 0.55)} 78%, ${hexToRgba(bgColor, 1)} 100%)`
            }}
        />
        <div
            className="spot-photo-fade-bottom"
            style={{ background: `linear-gradient(to bottom, transparent 65%, ${hexToRgba(bgColor, 1)} 100%)` }}
        />
    </div>
);

const Band = ({
    reverse,
    roleKey,
    roleLabel,
    surname,
    firstName,
    photo,
    badge,
    backgroundColor,
    accentColor,
    pillTextColor,
    arrowColor
}) => {
    const RoleIcon = ROLE_ICONS[roleKey];

    return (
        <div className="spot-band" style={{ flexDirection: reverse ? 'row-reverse' : 'row' }}>
            <div className="spot-band-photo">
                <PhotoBlock image={photo} bgColor={backgroundColor} alt={surname} />

                {roleKey === 'star' && (
                    <div
                        className="spot-star-badge"
                        style={{
                            background: accentColor,
                            borderColor: hexToRgba('#ffffff', 0.85),
                            [reverse ? 'right' : 'left']: '14%'
                        }}
                    >
                        <StarIcon size={38} color={pillTextColor} />
                    </div>
                )}

                {roleKey === 'watch' && (
                    <div className="spot-arrows" style={{ [reverse ? 'right' : 'left']: '12%' }}>
                        <div
                            className="spot-arrow spot-arrow-back"
                            style={{ borderBottomColor: hexToRgba(arrowColor, 0.55), filter: `drop-shadow(0 0 14px ${hexToRgba(arrowColor, 0.6)})` }}
                        />
                        <div
                            className="spot-arrow spot-arrow-front"
                            style={{ borderBottomColor: arrowColor, filter: `drop-shadow(0 0 16px ${hexToRgba(arrowColor, 0.85)})` }}
                        />
                    </div>
                )}
            </div>

            <div className="spot-band-text">
                <div className="spot-badge-circle" style={{ borderColor: accentColor }}>
                    {badge ? <img src={badge} alt="" draggable={false} /> : <ShieldIcon />}
                </div>

                <div className="spot-pill" style={{ backgroundColor: accentColor, color: pillTextColor }}>
                    {RoleIcon && <RoleIcon size={26} color={pillTextColor} />}
                    <span>{roleLabel}</span>
                </div>

                <div className="spot-surname">{surname || '—'}</div>
                <div className="spot-firstname">{firstName || ''}</div>
            </div>
        </div>
    );
};

const SpotlightPoster = ({
    brandLogoSrc,
    backgroundColor = '#0b1e42',
    accentColor = '#ffce33',
    arrowColor = '#39ff14',
    pillTextColor = '#0b1e42',
    manager,
    starPlayer,
    oneToWatch
}) => {
    return (
        <div id="spotlightExportContainer" className="spot-poster" style={{ backgroundColor }}>
            <div className="spot-bg-texture" />
            <div className="spot-deco-circle" style={{ width: 420, height: 420, top: -140, right: -100 }} />
            <div className="spot-deco-circle" style={{ width: 300, height: 300, top: 560, left: -120 }} />
            <div className="spot-deco-circle" style={{ width: 360, height: 360, top: 1200, right: -140 }} />
            <div className="spot-deco-circle" style={{ width: 260, height: 260, top: 1520, left: -80 }} />

            {brandLogoSrc && (
                <div className="spot-brand">
                    <img src={brandLogoSrc} alt="" draggable={false} />
                </div>
            )}

            <div className="spot-bands">
                <Band
                    reverse={false}
                    roleKey="manager"
                    roleLabel="MANAGER"
                    surname={manager.surname}
                    firstName={manager.firstName}
                    photo={manager.photo}
                    badge={manager.badge}
                    backgroundColor={backgroundColor}
                    accentColor={accentColor}
                    pillTextColor={pillTextColor}
                    arrowColor={arrowColor}
                />
                <Band
                    reverse={true}
                    roleKey="star"
                    roleLabel="STAR PLAYER"
                    surname={starPlayer.surname}
                    firstName={starPlayer.firstName}
                    photo={starPlayer.photo}
                    badge={starPlayer.badge}
                    backgroundColor={backgroundColor}
                    accentColor={accentColor}
                    pillTextColor={pillTextColor}
                    arrowColor={arrowColor}
                />
                <Band
                    reverse={false}
                    roleKey="watch"
                    roleLabel="ONE TO WATCH"
                    surname={oneToWatch.surname}
                    firstName={oneToWatch.firstName}
                    photo={oneToWatch.photo}
                    badge={oneToWatch.badge}
                    backgroundColor={backgroundColor}
                    accentColor={accentColor}
                    pillTextColor={pillTextColor}
                    arrowColor={arrowColor}
                />
            </div>
        </div>
    );
};

export default SpotlightPoster;
