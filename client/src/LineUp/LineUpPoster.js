import React from 'react';
import './LineUpPoster.css';

/**
 * LineUpPoster — Score90 "Ghana Possible Lineup" Premium Poster.
 *
 * Props:
 *   players        — Array of { id, name, image, role, x, y, scale, offsetX, offsetY }
 *   teamName       — String, es. "GHANA"
 *   subtitle       — String, es. "POSSIBLE LINEUP"
 *   primaryColor   — Hex, team primary (not strictly used if using green grass, but could tint)
 *   secondaryColor — Hex, team secondary
 *   teamBadgeSrc   — String|null, URL of team badge (used for player flags & deco right)
 *   decoLeftSrc    — String|null, URL of left decoration (trophy)
 *   globalScale    — Number, global multiplier for player photo size
 */
const LineUpPoster = ({
    players,
    teamName,
    subtitle,
    primaryColor = '#2d6a3f',
    secondaryColor = '#fcd116',
    teamBadgeSrc,
    decoLeftSrc,
    globalScale = 1
}) => {

    // Helper to convert hex to rgba
    const hexToRgba = (hex, opacity) => {
        if (!hex || typeof hex !== 'string') return `rgba(255, 255, 255, ${opacity})`;
        let c = hex.replace('#', '');
        if (c.length === 3) {
            c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        }
        const r = parseInt(c.substring(0, 2), 16) || 0;
        const g = parseInt(c.substring(2, 4), 16) || 0;
        const b = parseInt(c.substring(4, 6), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    // Compute player photo size based on globalScale
    const basePhotoSize = 130;
    const photoSize = Math.round(basePhotoSize * globalScale);

    return (
        <div id="exportContainer" className="poster">
            {/* Flat Background Overlay */}
            <div className="poster-bg-gradient" />

            {/* Ambient Light Glows - Half and Half Split */}
            <div 
                className="poster-glow-split" 
                style={{
                    background: `linear-gradient(to top right, 
                        ${hexToRgba(primaryColor, 0.75)} 0%, 
                        ${hexToRgba(primaryColor, 0.35)} 40%, 
                        ${hexToRgba(secondaryColor, 0.35)} 60%, 
                        ${hexToRgba(secondaryColor, 0.75)} 100%)`
                }}
            />

            {/* 3D Perspective Container for Field and Players */}
            <div className="poster-perspective-wrap">
                <div className="poster-3d-pitch">
                    {/* The new CSS-based Pitch */}
                    <div className="poster-pitch-container">
                        <div className="pitch-lines">
                            {/* Halfway */}
                            <div className="pitch-halfway"></div>
                            <div className="pitch-center-circle">
                                <div className="pitch-center-spot"></div>
                            </div>

                            {/* Top Area */}
                            <div className="pitch-box-top">
                                <div className="pitch-six-yard"></div>
                                <div className="pitch-penalty-spot"></div>
                            </div>
                            <div className="pitch-box-top-arc"></div>

                            {/* Bottom Area */}
                            <div className="pitch-box-bottom">
                                <div className="pitch-six-yard"></div>
                                <div className="pitch-penalty-spot"></div>
                            </div>
                            <div className="pitch-box-bottom-arc"></div>

                            {/* Corners */}
                            <div className="pitch-corner top-left"></div>
                            <div className="pitch-corner top-right"></div>
                            <div className="pitch-corner bottom-left"></div>
                            <div className="pitch-corner bottom-right"></div>
                        </div>
                        {/* Noise texture confined to the pitch area */}
                        <div className="poster-bg-noise" />
                    </div>

                    {/* Players are now inside the 3D space */}
                    <div className="poster-players">
                        {players.map((player) => {
                            const displayName = player.name || player.role;

                            return (
                                <div
                                    key={player.id}
                                    className="poster-player"
                                    style={{
                                        left: `${player.x}%`,
                                        bottom: `${100 - player.y}%`,
                                        zIndex: 100 - Math.round(player.y)
                                    }}
                                >
                                    {/* Spotlight effect behind the player */}
                                    <div className="poster-player-spotlight" />

                                    <div
                                        className="poster-player-photo-wrap"
                                        style={{
                                            width: `${photoSize}px`,
                                            height: `${photoSize}px`,
                                            transform: `
                                                translateX(${(player.offsetX || 0)}px)
                                                translateY(${(player.offsetY || 0)}px)
                                                scale(${player.scale || 1})
                                            `,
                                            transformOrigin: 'bottom center'
                                        }}
                                    >
                                        {player.image ? (
                                            <img
                                                src={player.image}
                                                className="poster-player-photo"
                                                alt={displayName}
                                                draggable={false}
                                            />
                                        ) : (
                                            <div className="poster-player-photo-placeholder">
                                                <i className="fa-solid fa-user" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="poster-player-name-container">
                                        <div className="poster-player-name">
                                            {displayName}
                                        </div>
                                        {/* Player flag badge next to the name */}
                                        {teamBadgeSrc && (
                                            <img src={teamBadgeSrc} className="poster-player-flag" alt="" draggable={false} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Left decoration (trophy) */}
            {decoLeftSrc && (
                <div className="poster-deco-left">
                    <img src={decoLeftSrc} alt="" draggable={false} />
                </div>
            )}

            {/* Right decoration (team badge, large & faded) */}
            {teamBadgeSrc && (
                <div className="poster-deco-right">
                    <img src={teamBadgeSrc} alt="" draggable={false} />
                </div>
            )}

            {/* Header */}
            <div className="poster-header">

                {/* Optional flags row - hardcoded 4 placeholders or use the teamBadgeSrc if we want to fake it */}


                <h1 className="poster-team-name">{teamName || 'SQUADRA'}</h1>
                <div className="poster-subtitle">{subtitle || 'POSSIBLE LINEUP'}</div>
            </div>



            {/* Footer branding */}

        </div>
    );
};

export default LineUpPoster;
