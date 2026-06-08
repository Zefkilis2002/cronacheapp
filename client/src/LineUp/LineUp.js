import React, { useState } from 'react';
import * as htmlToImage from 'html-to-image';
import './LineUp.css';

const formationsData = {
    '4-3-3': [
        { role: 'POR', x: 50, y: 98 },
        { role: 'TS', x: 18, y: 83 }, { role: 'DC', x: 38, y: 83 }, { role: 'DC', x: 62, y: 83 }, { role: 'TD', x: 82, y: 83 },
        { role: 'CC', x: 28, y: 63 }, { role: 'MED', x: 50, y: 66 }, { role: 'CC', x: 72, y: 63 },
        { role: 'AS', x: 22, y: 45 }, { role: 'ATT', x: 50, y: 42 }, { role: 'AD', x: 78, y: 45 }
    ],
    '4-4-2': [
        { role: 'POR', x: 50, y: 98 },
        { role: 'TS', x: 18, y: 83 }, { role: 'DC', x: 38, y: 83 }, { role: 'DC', x: 62, y: 83 }, { role: 'TD', x: 82, y: 83 },
        { role: 'ES', x: 18, y: 63 }, { role: 'CC', x: 38, y: 63 }, { role: 'CC', x: 62, y: 63 }, { role: 'ED', x: 82, y: 63 },
        { role: 'ATT', x: 38, y: 42 }, { role: 'ATT', x: 62, y: 42 }
    ],
    '4-4-2-rombo': [
        { role: 'POR', x: 50, y: 98 },
        { role: 'TS', x: 18, y: 83 }, { role: 'DC', x: 38, y: 83 }, { role: 'DC', x: 62, y: 83 }, { role: 'TD', x: 82, y: 83 },
        { role: 'MED', x: 50, y: 70 },
        { role: 'CCS', x: 30, y: 60 }, { role: 'CCD', x: 70, y: 60 },
        { role: 'TRQ', x: 50, y: 50 },
        { role: 'ATT', x: 38, y: 40 }, { role: 'ATT', x: 62, y: 40 }
    ],
    '4-2-3-1': [
        { role: 'POR', x: 50, y: 98 },
        { role: 'TS', x: 18, y: 83 }, { role: 'DC', x: 38, y: 83 }, { role: 'DC', x: 62, y: 83 }, { role: 'TD', x: 82, y: 83 },
        { role: 'MED', x: 38, y: 71 }, { role: 'MED', x: 62, y: 71 },
        { role: 'ES', x: 20, y: 55 }, { role: 'TRQ', x: 50, y: 57 }, { role: 'ED', x: 80, y: 55 },
        { role: 'ATT', x: 50, y: 40 }
    ],
    '4-3-1-2': [
        { role: 'POR', x: 50, y: 98 },
        { role: 'TS', x: 18, y: 83 }, { role: 'DC', x: 38, y: 83 }, { role: 'DC', x: 62, y: 83 }, { role: 'TD', x: 82, y: 83 },
        { role: 'CCS', x: 28, y: 63 }, { role: 'MED', x: 50, y: 66 }, { role: 'CCD', x: 72, y: 63 },
        { role: 'TRQ', x: 50, y: 52 },
        { role: 'ATT', x: 38, y: 40 }, { role: 'ATT', x: 62, y: 40 }
    ],
    '4-3-2-1': [
        { role: 'POR', x: 50, y: 98 },
        { role: 'TS', x: 18, y: 83 }, { role: 'DC', x: 38, y: 83 }, { role: 'DC', x: 62, y: 83 }, { role: 'TD', x: 82, y: 83 },
        { role: 'CCS', x: 28, y: 65 }, { role: 'MED', x: 50, y: 67 }, { role: 'CCD', x: 72, y: 65 },
        { role: 'TRQS', x: 38, y: 52 }, { role: 'TRQD', x: 62, y: 52 },
        { role: 'ATT', x: 50, y: 40 }
    ],
    '3-5-2': [
        { role: 'POR', x: 50, y: 98 },
        { role: 'DCS', x: 25, y: 85 }, { role: 'DC', x: 50, y: 87 }, { role: 'DCD', x: 75, y: 85 },
        { role: 'ES', x: 15, y: 63 }, { role: 'CCS', x: 34, y: 65 }, { role: 'REG', x: 50, y: 68 }, { role: 'CCD', x: 66, y: 65 }, { role: 'ED', x: 85, y: 63 },
        { role: 'ATT', x: 38, y: 42 }, { role: 'ATT', x: 62, y: 42 }
    ],
    '3-4-3': [
        { role: 'POR', x: 50, y: 98 },
        { role: 'DCS', x: 25, y: 85 }, { role: 'DC', x: 50, y: 87 }, { role: 'DCD', x: 75, y: 85 },
        { role: 'ES', x: 18, y: 66 }, { role: 'CC', x: 38, y: 64 }, { role: 'CC', x: 62, y: 64 }, { role: 'ED', x: 82, y: 66 },
        { role: 'AS', x: 25, y: 45 }, { role: 'ATT', x: 50, y: 42 }, { role: 'AD', x: 75, y: 45 }
    ],
    '5-3-2': [
        { role: 'POR', x: 50, y: 98 },
        { role: 'ASA', x: 15, y: 78 }, { role: 'DCS', x: 32, y: 85 }, { role: 'DC', x: 50, y: 87 }, { role: 'DCD', x: 68, y: 85 }, { role: 'ADA', x: 85, y: 78 },
        { role: 'CCS', x: 30, y: 63 }, { role: 'MED', x: 50, y: 65 }, { role: 'CCD', x: 70, y: 63 },
        { role: 'ATT', x: 38, y: 42 }, { role: 'ATT', x: 62, y: 42 }
    ]
};

const LineUp = () => {
    const [teamName, setTeamName] = useState('PANATHINAIKOS');
    const [season, setSeason] = useState('2025/26');
    const [formation, setFormation] = useState('4-3-3');
    const [primaryColor, setPrimaryColor] = useState('#234F3F');
    const [globalScale, setGlobalScale] = useState(1);

    // Initial state setup for players
    const [players, setPlayers] = useState(() => {
        const layout = formationsData['4-3-3'];
        return Array.from({ length: 11 }, (_, i) => ({
            id: i,
            name: '',
            image: null,
            role: layout[i] ? layout[i].role : '',
            x: layout[i] ? layout[i].x : 0,
            y: layout[i] ? layout[i].y : 0,
            scale: 1,
            offsetX: 0,
            offsetY: 0
        }));
    });

    // Formations change handler
    const handleFormationChange = (e) => {
        const selectedFormation = e.target.value;
        setFormation(selectedFormation);
        const layout = formationsData[selectedFormation];

        setPlayers(prevPlayers => prevPlayers.map((player, index) => {
            if (layout[index]) {
                return {
                    ...player,
                    role: layout[index].role,
                    x: layout[index].x,
                    y: layout[index].y
                };
            }
            return player;
        }));
    };

    const updatePlayerName = (index, value) => {
        const newPlayers = [...players];
        newPlayers[index].name = value.toUpperCase();
        setPlayers(newPlayers);
    };

    const updatePlayerScale = (index, value) => {
        const newPlayers = [...players];
        newPlayers[index].scale = parseFloat(value);
        setPlayers(newPlayers);
    };

    const movePlayerOffset = (index, axis, delta) => {
        const newPlayers = [...players];
        if (axis === 'x') {
            newPlayers[index].offsetX = (newPlayers[index].offsetX || 0) + delta;
        } else if (axis === 'y') {
            newPlayers[index].offsetY = (newPlayers[index].offsetY || 0) + delta;
        }
        setPlayers(newPlayers);
    };

    const handleImageUpload = (index, e) => {
        const input = e.target;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function (evt) {
                const newPlayers = [...players];
                newPlayers[index].image = evt.target.result;
                setPlayers(newPlayers);
            }
            reader.readAsDataURL(input.files[0]);
        }
    };

    const removeImage = (index) => {
        const newPlayers = [...players];
        newPlayers[index].image = null;
        setPlayers(newPlayers);
    };

    const exportImage = async () => {
        const container = document.getElementById('exportContainer');
        if (!container) return;

        // html-to-image gestisce box-shadow e i gradienti in background 
        // nativamente senza trick css, producendo una resa 1:1 identica
        try {
            await document.fonts.ready;

            const dataUrl = await htmlToImage.toJpeg(container, {
                quality: 1.0,
                pixelRatio: 2, // Hi-Res
                backgroundColor: '#0f0f0f',
                style: {
                    margin: '0',
                }
            });

            const link = document.createElement('a');
            const safeName = teamName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'formazione';
            link.download = `poster_lineup_${safeName}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Errore esportazione con html-to-image", err);
        }
    };

    return (
        <div
            className="flex flex-col md:flex-row overflow-hidden text-gray-200 lineup-wrapper"
            style={{
                fontFamily: "'Poppins', sans-serif",
                backgroundColor: "#111827",
                position: "fixed",
                top: "75px",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10
            }}
        >
            {/* Sidebar Controlli */}
            <aside className="w-full md:w-[450px] h-[50vh] md:h-full bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl z-20 overflow-hidden shrink-0 lineup-sidebar">

                <div className="p-5 border-b border-gray-800 bg-gray-950 flex justify-between items-center shrink-0">
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 font-[Bebas Neue] tracking-wider">
                        LINEUP CREATOR PRO
                    </h1>
                    <button onClick={exportImage} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold shadow transition-all text-sm flex items-center">
                        Download
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 pb-20">
                    {/* Impostazioni Generali */}
                    <div className="mb-6 bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-700">
                        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 border-b border-gray-700 pb-2">Impostazioni Grafica</h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-300">Titolo (Squadra)</label>
                                <input
                                    type="text"
                                    placeholder="Es. CHELSEA"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value.toUpperCase())}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-300">Sottotitolo (Anno)</label>
                                <input
                                    type="text"
                                    placeholder="Es. 2025/26"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                                    value={season}
                                    onChange={(e) => setSeason(e.target.value.toUpperCase())}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-300">Modulo Tattico</label>
                                <select
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                                    value={formation}
                                    onChange={handleFormationChange}
                                >
                                    <option value="4-3-3">4-3-3</option>
                                    <option value="4-4-2">4-4-2</option>
                                    <option value="4-4-2-rombo">4-4-2 (Rombo)</option>
                                    <option value="4-2-3-1">4-2-3-1</option>
                                    <option value="4-3-1-2">4-3-1-2</option>
                                    <option value="4-3-2-1">4-3-2-1</option>
                                    <option value="3-5-2">3-5-2</option>
                                    <option value="3-4-3">3-4-3</option>
                                    <option value="5-3-2">5-3-2</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-300">Colore Glow & Dettagli</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                    />
                                    <span className="text-xs text-gray-400">Tinta Squadra</span>
                                </div>
                            </div>
                        </div>

                        {/* Slider Globale */}
                        <div className="mt-4 border-t border-gray-700 pt-4">
                            <label className="text-xs font-semibold mb-2 text-gray-300 flex justify-between">
                                <span>Grandezza Globale Figure</span>
                                <span className="text-indigo-400">{(globalScale * 100).toFixed(0)}%</span>
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="1.5"
                                step="0.05"
                                value={globalScale}
                                onChange={(e) => setGlobalScale(parseFloat(e.target.value))}
                                className="w-full accent-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Lista Giocatori */}
                    <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3 flex justify-between items-end">
                        <span>Giocatori</span>
                        <span className="text-[10px] text-gray-500 font-normal normal-case">Consigliate PNG trasparenti</span>
                    </h2>
                    <div className="space-y-2">
                        {players.map((player, index) => {
                            const fileInputId = `fileUpload_${index}`;
                            return (
                                <div key={player.id} className="bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-700 flex flex-col space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-900 px-2 py-1 rounded w-10 text-center shrink-0 border border-gray-700">{player.role}</span>
                                        <input
                                            type="text"
                                            value={player.name}
                                            onChange={(e) => updatePlayerName(index, e.target.value)}
                                            className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-white text-sm font-bold focus:border-indigo-500 outline-none uppercase"
                                            placeholder="NOME GIOCATORE"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between pl-12">
                                        <div className="flex items-center space-x-2">
                                            <label htmlFor={fileInputId} className="file-upload-label">
                                                <i className="fa-solid fa-image mr-1.5"></i> {player.image ? 'Cambia Foto' : 'Carica Foto'}
                                            </label>
                                            <input type="file" id={fileInputId} accept="image/*" onChange={(e) => handleImageUpload(index, e)} />
                                            {player.image && (
                                                <button onClick={() => removeImage(index)} className="text-red-400 hover:text-red-300 text-xs ml-2 border border-red-900/50 bg-red-900/20 px-2 py-1 rounded">
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {player.image && (
                                        <div className="flex flex-col space-y-2 mt-2 pl-12">
                                            {/* Slider Scala */}
                                            <div className="flex items-center space-x-3">
                                                <i className="fa-solid fa-magnifying-glass-plus text-[10px] text-gray-500"></i>
                                                <input
                                                    type="range"
                                                    min="0.5"
                                                    max="1.5"
                                                    step="0.05"
                                                    value={player.scale || 1}
                                                    onChange={(e) => updatePlayerScale(index, e.target.value)}
                                                    className="flex-1 accent-indigo-400 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <span className="text-[10px] font-mono text-indigo-300 w-8 text-right">
                                                    {((player.scale || 1) * 100).toFixed(0)}%
                                                </span>
                                            </div>

                                            {/* Controlli Posizione */}
                                            <div className="flex items-center space-x-2 pt-1">
                                                <span className="text-[10px] text-gray-500 font-bold w-12 uppercase tracking-wide">Posiz.</span>
                                                <div className="flex space-x-1">
                                                    <button onClick={() => movePlayerOffset(index, 'x', -1)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded px-2 py-0.5 text-xs">
                                                        <i className="fa-solid fa-chevron-left"></i>
                                                    </button>
                                                    <div className="flex flex-col space-y-1">
                                                        <button onClick={() => movePlayerOffset(index, 'y', -1)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded px-2 py-0.5 text-xs text-center">
                                                            <i className="fa-solid fa-chevron-up"></i>
                                                        </button>
                                                        <button onClick={() => movePlayerOffset(index, 'y', 1)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded px-2 py-0.5 text-xs text-center">
                                                            <i className="fa-solid fa-chevron-down"></i>
                                                        </button>
                                                    </div>
                                                    <button onClick={() => movePlayerOffset(index, 'x', 1)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded px-2 py-0.5 text-xs">
                                                        <i className="fa-solid fa-chevron-right"></i>
                                                    </button>
                                                </div>
                                                <div className="text-[9px] font-mono text-gray-500 ml-auto text-right">
                                                    X: {player.offsetX || 0} <br /> Y: {player.offsetY || 0}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </aside>

            {/* Area Principale (Preview) */}
            <main className="flex-1 bg-[#050505] h-[50vh] md:h-full overflow-y-auto lineup-main">
                <div className="min-h-full flex items-center justify-center p-4">
                    {/* Container da esportare (Il Poster) */}
                    <div id="exportContainer" className="export-poster rounded-xl mx-auto">

                        {/* Sfondo Colorato Alto */}
                        <div className="poster-top-glow" style={{ background: `linear-gradient(to bottom, ${primaryColor} 0%, transparent 100%)` }}></div>

                        {/* Il Campo in Prospettiva (CSS/Base64) */}
                        <div className="pitch-perspective"></div>

                        {/* Header Grafica */}
                        <div className="poster-header">
                            <div>
                                <div className="team-title">{teamName || 'SQUADRA'}</div>
                                <div className="team-subtitle">{season}</div>
                            </div>
                            <div className="fake-logo">
                                <img src="/logosito/Logo_CE_bianco.svg" alt="CronacheApp Logo" style={{ height: '55px', opacity: 0.9 }} />
                            </div>
                        </div>

                        {/* Layer Giocatori */}
                        <div className="players-layer">
                            {players.map(player => {
                                const displayName = player.name || player.role;
                                return (
                                    <div
                                        key={player.id}
                                        className="player-node"
                                        style={{
                                            left: `${player.x}%`,
                                            bottom: `${100 - player.y}%`,
                                            zIndex: Math.round(player.y)
                                        }}
                                    >
                                        <div className="player-glow" style={{ boxShadow: `0 0 35px 20px ${primaryColor}`, background: primaryColor }}></div>

                                        <div
                                            className="player-img-wrapper"
                                            style={{
                                                transform: `translateX(${(player.offsetX || 0)}px) translateY(${(player.offsetY || 0)}px) scale(${globalScale * (player.scale || 1)})`,
                                                transformOrigin: 'bottom center',
                                                transition: 'transform 0.1s ease-out'
                                            }}
                                        >
                                            {player.image ? (
                                                <img src={player.image} className="player-img" alt={displayName} />
                                            ) : (
                                                <div className="player-img-placeholder">
                                                    <i className="fa-solid fa-user"></i>
                                                </div>
                                            )}
                                            <div className="player-fade"></div>
                                        </div>

                                        <div className="player-nameplate" style={{ borderBottomColor: primaryColor }}>
                                            {displayName}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default LineUp;
