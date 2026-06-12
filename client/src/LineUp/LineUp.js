import React, { useState } from 'react';
import * as htmlToImage from 'html-to-image';
import LineUpPoster from './LineUpPoster';
import './LineUp.css';

const formationsData = {
    // --- MODULI A 4 DIFENSORI ---
    // Spaziatura garantita: minimo ~20 unità tra giocatori sulla stessa colonna x

    '4-3-3': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'TS', x: 22, y: 78 }, { role: 'DC', x: 40, y: 78 }, { role: 'DC', x: 60, y: 78 }, { role: 'TD', x: 78, y: 78 },
        { role: 'CC', x: 28, y: 52 }, { role: 'CC', x: 50, y: 52 }, { role: 'CC', x: 72, y: 52 },
        { role: 'AS', x: 22, y: 28 }, { role: 'ATT', x: 50, y: 25 }, { role: 'AD', x: 78, y: 28 }
    ],

    '4-4-2': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'TS', x: 22, y: 78 }, { role: 'DC', x: 40, y: 78 }, { role: 'DC', x: 60, y: 78 }, { role: 'TD', x: 78, y: 78 },
        { role: 'ES', x: 22, y: 50 }, { role: 'CC', x: 40, y: 50 }, { role: 'CC', x: 60, y: 50 }, { role: 'ED', x: 78, y: 50 },
        { role: 'ATT', x: 40, y: 22 }, { role: 'ATT', x: 60, y: 22 }
    ],

    '4-4-2-rombo': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'TS', x: 22, y: 78 }, { role: 'DC', x: 40, y: 78 }, { role: 'DC', x: 60, y: 78 }, { role: 'TD', x: 78, y: 78 },
        { role: 'MED', x: 50, y: 64 },
        { role: 'CCS', x: 28, y: 50 }, { role: 'CCD', x: 72, y: 50 },
        { role: 'TRQ', x: 50, y: 36 },
        { role: 'ATT', x: 40, y: 18 }, { role: 'ATT', x: 60, y: 18 }
    ],

    '4-2-3-1': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'TS', x: 22, y: 78 }, { role: 'DC', x: 40, y: 78 }, { role: 'DC', x: 60, y: 78 }, { role: 'TD', x: 78, y: 78 },
        { role: 'MED', x: 40, y: 58 }, { role: 'MED', x: 60, y: 58 },
        { role: 'ES', x: 22, y: 40 }, { role: 'TRQ', x: 50, y: 38 }, { role: 'ED', x: 78, y: 40 },
        { role: 'ATT', x: 50, y: 18 }
    ],

    '4-3-1-2': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'TS', x: 22, y: 78 }, { role: 'DC', x: 40, y: 78 }, { role: 'DC', x: 60, y: 78 }, { role: 'TD', x: 78, y: 78 },
        { role: 'CCS', x: 28, y: 56 }, { role: 'MED', x: 50, y: 58 }, { role: 'CCD', x: 72, y: 56 },
        { role: 'TRQ', x: 50, y: 38 },
        { role: 'ATT', x: 40, y: 18 }, { role: 'ATT', x: 60, y: 18 }
    ],

    '4-3-2-1': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'TS', x: 22, y: 78 }, { role: 'DC', x: 40, y: 78 }, { role: 'DC', x: 60, y: 78 }, { role: 'TD', x: 78, y: 78 },
        { role: 'CCS', x: 28, y: 54 }, { role: 'MED', x: 50, y: 54 }, { role: 'CCD', x: 72, y: 54 },
        { role: 'TRQS', x: 38, y: 34 }, { role: 'TRQD', x: 62, y: 34 },
        { role: 'ATT', x: 50, y: 16 }
    ],

    '4-1-4-1': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'TS', x: 22, y: 78 }, { role: 'DC', x: 40, y: 78 }, { role: 'DC', x: 60, y: 78 }, { role: 'TD', x: 78, y: 78 },
        { role: 'MED', x: 50, y: 64 },
        { role: 'ES', x: 22, y: 44 }, { role: 'CC', x: 40, y: 44 }, { role: 'CC', x: 60, y: 44 }, { role: 'ED', x: 78, y: 44 },
        { role: 'ATT', x: 50, y: 22 }
    ],

    '4-5-1': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'TS', x: 22, y: 78 }, { role: 'DC', x: 40, y: 78 }, { role: 'DC', x: 60, y: 78 }, { role: 'TD', x: 78, y: 78 },
        { role: 'ES', x: 22, y: 50 }, { role: 'CCS', x: 36, y: 50 }, { role: 'CC', x: 50, y: 50 }, { role: 'CCD', x: 64, y: 50 }, { role: 'ED', x: 78, y: 50 },
        { role: 'ATT', x: 50, y: 22 }
    ],

    '4-2-4': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'TS', x: 22, y: 78 }, { role: 'DC', x: 40, y: 78 }, { role: 'DC', x: 60, y: 78 }, { role: 'TD', x: 78, y: 78 },
        { role: 'MED', x: 40, y: 52 }, { role: 'MED', x: 60, y: 52 },
        { role: 'AS', x: 22, y: 24 }, { role: 'ATT', x: 40, y: 22 }, { role: 'ATT', x: 60, y: 22 }, { role: 'AD', x: 78, y: 24 }
    ],

    '4-1-3-2': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'TS', x: 22, y: 78 }, { role: 'DC', x: 40, y: 78 }, { role: 'DC', x: 60, y: 78 }, { role: 'TD', x: 78, y: 78 },
        { role: 'MED', x: 50, y: 62 },
        { role: 'ES', x: 22, y: 42 }, { role: 'TRQ', x: 50, y: 40 }, { role: 'ED', x: 78, y: 42 },
        { role: 'ATT', x: 40, y: 20 }, { role: 'ATT', x: 60, y: 20 }
    ],

    // --- MODULI A 3 DIFENSORI ---

    '3-5-2': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'DCS', x: 28, y: 78 }, { role: 'DC', x: 50, y: 78 }, { role: 'DCD', x: 72, y: 78 },
        { role: 'ES', x: 18, y: 50 }, { role: 'CCS', x: 35, y: 50 }, { role: 'REG', x: 50, y: 52 }, { role: 'CCD', x: 65, y: 50 }, { role: 'ED', x: 82, y: 50 },
        { role: 'ATT', x: 40, y: 22 }, { role: 'ATT', x: 60, y: 22 }
    ],

    '3-4-3': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'DCS', x: 28, y: 78 }, { role: 'DC', x: 50, y: 78 }, { role: 'DCD', x: 72, y: 78 },
        { role: 'ES', x: 22, y: 50 }, { role: 'CC', x: 40, y: 50 }, { role: 'CC', x: 60, y: 50 }, { role: 'ED', x: 78, y: 50 },
        { role: 'AS', x: 22, y: 24 }, { role: 'ATT', x: 50, y: 22 }, { role: 'AD', x: 78, y: 24 }
    ],

    '3-4-2-1': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'DCS', x: 28, y: 78 }, { role: 'DC', x: 50, y: 78 }, { role: 'DCD', x: 72, y: 78 },
        { role: 'ES', x: 22, y: 52 }, { role: 'CC', x: 40, y: 52 }, { role: 'CC', x: 60, y: 52 }, { role: 'ED', x: 78, y: 52 },
        { role: 'TRQS', x: 38, y: 32 }, { role: 'TRQD', x: 62, y: 32 },
        { role: 'ATT', x: 50, y: 16 }
    ],

    '3-4-1-2': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'DCS', x: 28, y: 78 }, { role: 'DC', x: 50, y: 78 }, { role: 'DCD', x: 72, y: 78 },
        { role: 'ES', x: 22, y: 52 }, { role: 'CC', x: 40, y: 52 }, { role: 'CC', x: 60, y: 52 }, { role: 'ED', x: 78, y: 52 },
        { role: 'TRQ', x: 50, y: 34 },
        { role: 'ATT', x: 40, y: 18 }, { role: 'ATT', x: 60, y: 18 }
    ],

    '3-5-1-1': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'DCS', x: 28, y: 78 }, { role: 'DC', x: 50, y: 78 }, { role: 'DCD', x: 72, y: 78 },
        { role: 'ES', x: 18, y: 54 }, { role: 'CCS', x: 35, y: 54 }, { role: 'REG', x: 50, y: 56 }, { role: 'CCD', x: 65, y: 54 }, { role: 'ED', x: 82, y: 54 },
        { role: 'TRQ', x: 50, y: 34 },
        { role: 'ATT', x: 50, y: 14 }
    ],

    // --- MODULI A 5 DIFENSORI ---

    '5-3-2': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'ASA', x: 18, y: 72 }, { role: 'DCS', x: 34, y: 78 }, { role: 'DC', x: 50, y: 78 }, { role: 'DCD', x: 66, y: 78 }, { role: 'ADA', x: 82, y: 72 },
        { role: 'CCS', x: 28, y: 50 }, { role: 'MED', x: 50, y: 52 }, { role: 'CCD', x: 72, y: 50 },
        { role: 'ATT', x: 40, y: 22 }, { role: 'ATT', x: 60, y: 22 }
    ],

    '5-4-1': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'ASA', x: 18, y: 72 }, { role: 'DCS', x: 34, y: 78 }, { role: 'DC', x: 50, y: 78 }, { role: 'DCD', x: 66, y: 78 }, { role: 'ADA', x: 82, y: 72 },
        { role: 'ES', x: 22, y: 48 }, { role: 'CC', x: 40, y: 48 }, { role: 'CC', x: 60, y: 48 }, { role: 'ED', x: 78, y: 48 },
        { role: 'ATT', x: 50, y: 22 }
    ],

    '5-2-3': [
        { role: 'POR', x: 50, y: 96 },
        { role: 'ASA', x: 18, y: 72 }, { role: 'DCS', x: 34, y: 78 }, { role: 'DC', x: 50, y: 78 }, { role: 'DCD', x: 66, y: 78 }, { role: 'ADA', x: 82, y: 72 },
        { role: 'CC', x: 40, y: 50 }, { role: 'CC', x: 60, y: 50 },
        { role: 'AS', x: 22, y: 24 }, { role: 'ATT', x: 50, y: 22 }, { role: 'AD', x: 78, y: 24 }
    ]
};

const LineUp = () => {
    const [teamName, setTeamName] = useState('PAOK');
    const [subtitle, setSubtitle] = useState('POSSIBLE LINEUP');
    const [groupName, setGroupName] = useState('GROUP L');
    const [formation, setFormation] = useState('4-2-3-1');
    const [primaryColor, setPrimaryColor] = useState('#2d6a3f');
    const [secondaryColor, setSecondaryColor] = useState('#fcd116');
    const [globalScale, setGlobalScale] = useState(1);

    // Team badge and decoration images
    const [teamBadgeSrc, setTeamBadgeSrc] = useState(null);
    const [decoLeftSrc, setDecoLeftSrc] = useState(null);

    // Initial state setup for players
    const [players, setPlayers] = useState(() => {
        const layout = formationsData['4-2-3-1'];
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
    const handleFormationChange = (selectedFormation) => {
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

    // Generic image upload handler for badge/deco
    const handleAssetUpload = (setter) => (e) => {
        const input = e.target;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function (evt) {
                setter(evt.target.result);
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    const exportImage = async () => {
        const container = document.getElementById('exportContainer');
        if (!container) return;

        try {
            await document.fonts.ready;

            const dataUrl = await htmlToImage.toJpeg(container, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: '#0a0a0a',
                style: {
                    margin: '0',
                    borderRadius: '0'
                }
            });

            const link = document.createElement('a');
            const safeName = teamName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'formazione';
            link.download = `lineup_${safeName}.jpg`;
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
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 font-[Bebas Neue] tracking-wider">
                        LINEUP CREATOR PRO
                    </h1>
                    <button onClick={exportImage} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-bold shadow transition-all text-sm flex items-center">
                        <i className="fa-solid fa-download mr-2" />
                        Download
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 pb-20">
                    {/* Impostazioni Grafica */}
                    <div className="mb-6 bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-700">
                        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 border-b border-gray-700 pb-2">Impostazioni Poster</h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-300">Nome Squadra</label>
                                <input
                                    type="text"
                                    placeholder="Es. GHANA"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-bold"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value.toUpperCase())}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-300">Sottotitolo</label>
                                <input
                                    type="text"
                                    placeholder="Es. POSSIBLE LINEUP"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-bold"
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value.toUpperCase())}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-300">Nome Gruppo</label>
                                <input
                                    type="text"
                                    placeholder="Es. GROUP L"
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-bold"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value.toUpperCase())}
                                />
                            </div>
                        </div>

                        {/* Controlli Inferiori: Formazioni e Panchina come da richiesta testuale */}
                        <div className="mb-4 pt-4 border-t border-gray-700">
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-xs font-semibold text-gray-300">FORMATION</label>
                                <button className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-4 py-1.5 rounded-full border border-gray-600 shadow transition-colors font-bold tracking-wider">
                                    BENCH <i className="fa-solid fa-chair ml-1"></i>
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    // Difesa a 4
                                    '4-3-3', '4-4-2', '4-4-2-rombo', '4-2-3-1', '4-3-1-2',
                                    '4-3-2-1', '4-1-4-1', '4-5-1', '4-2-4', '4-1-3-2',
                                    // Difesa a 3
                                    '3-5-2', '3-4-3', '3-4-2-1', '3-4-1-2', '3-5-1-1',
                                    // Difesa a 5
                                    '5-3-2', '5-4-1', '5-2-3'
                                ].map(fmt => (
                                    <button
                                        key={fmt}
                                        onClick={() => handleFormationChange(fmt)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors border ${formation === fmt
                                            ? 'bg-emerald-600 text-white border-emerald-500'
                                            : 'bg-gray-900 text-gray-300 border-gray-600 hover:bg-gray-800'
                                            }`}
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-300">Colori Squadra (Tintura Background)</label>
                                <div className="flex items-center space-x-3">
                                    <div className="flex flex-col items-center">
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                        />
                                        <span className="text-[9px] text-gray-500 mt-1">Primario</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <input
                                            type="color"
                                            value={secondaryColor}
                                            onChange={(e) => setSecondaryColor(e.target.value)}
                                        />
                                        <span className="text-[9px] text-gray-500 mt-1">Secondario</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Asset uploads */}
                        <div className="grid grid-cols-2 gap-4 mb-4 border-t border-gray-700 pt-4">
                            <div>
                                <label className="block text-xs font-semibold mb-2 text-gray-300">Stemma Squadra</label>
                                <div className="flex items-center space-x-2">
                                    <label htmlFor="teamBadgeUpload" className="file-upload-label">
                                        <i className="fa-solid fa-shield-halved mr-1.5" />
                                        {teamBadgeSrc ? 'Cambia' : 'Carica'}
                                    </label>
                                    <input type="file" id="teamBadgeUpload" accept="image/*" onChange={handleAssetUpload(setTeamBadgeSrc)} />
                                    {teamBadgeSrc && (
                                        <>
                                            <img src={teamBadgeSrc} alt="" style={{ height: 28, borderRadius: 4 }} />
                                            <button onClick={() => setTeamBadgeSrc(null)} className="text-red-400 hover:text-red-300 text-xs border border-red-900/50 bg-red-900/20 px-2 py-1 rounded">
                                                <i className="fa-solid fa-trash" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-2 text-gray-300">Deco Sinistra (Trofeo)</label>
                                <div className="flex items-center space-x-2">
                                    <label htmlFor="decoLeftUpload" className="file-upload-label">
                                        <i className="fa-solid fa-trophy mr-1.5" />
                                        {decoLeftSrc ? 'Cambia' : 'Carica'}
                                    </label>
                                    <input type="file" id="decoLeftUpload" accept="image/*" onChange={handleAssetUpload(setDecoLeftSrc)} />
                                    {decoLeftSrc && (
                                        <>
                                            <img src={decoLeftSrc} alt="" style={{ height: 28, borderRadius: 4 }} />
                                            <button onClick={() => setDecoLeftSrc(null)} className="text-red-400 hover:text-red-300 text-xs border border-red-900/50 bg-red-900/20 px-2 py-1 rounded">
                                                <i className="fa-solid fa-trash" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Slider Globale */}
                        <div className="mt-4 border-t border-gray-700 pt-4">
                            <label className="text-xs font-semibold mb-2 text-gray-300 flex justify-between">
                                <span>Grandezza Globale Figure</span>
                                <span className="text-emerald-400">{(globalScale * 100).toFixed(0)}%</span>
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="2.5"
                                step="0.05"
                                value={globalScale}
                                onChange={(e) => setGlobalScale(parseFloat(e.target.value))}
                                className="w-full accent-emerald-500"
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
                                            className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-white text-sm font-bold focus:border-emerald-500 outline-none uppercase"
                                            placeholder="NOME GIOCATORE"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between pl-12">
                                        <div className="flex items-center space-x-2">
                                            <label htmlFor={fileInputId} className="file-upload-label">
                                                <i className="fa-solid fa-image mr-1.5" /> {player.image ? 'Cambia Foto' : 'Carica Foto'}
                                            </label>
                                            <input type="file" id={fileInputId} accept="image/*" onChange={(e) => handleImageUpload(index, e)} />
                                            {player.image && (
                                                <button onClick={() => removeImage(index)} className="text-red-400 hover:text-red-300 text-xs ml-2 border border-red-900/50 bg-red-900/20 px-2 py-1 rounded">
                                                    <i className="fa-solid fa-trash" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {player.image && (
                                        <div className="flex flex-col space-y-2 mt-2 pl-12">
                                            {/* Slider Scala */}
                                            <div className="flex items-center space-x-3">
                                                <i className="fa-solid fa-magnifying-glass-plus text-[10px] text-gray-500" />
                                                <input
                                                    type="range"
                                                    min="0.5"
                                                    max="2.5"
                                                    step="0.05"
                                                    value={player.scale || 1}
                                                    onChange={(e) => updatePlayerScale(index, e.target.value)}
                                                    className="flex-1 accent-emerald-400 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <span className="text-[10px] font-mono text-emerald-300 w-8 text-right">
                                                    {((player.scale || 1) * 100).toFixed(0)}%
                                                </span>
                                            </div>

                                            {/* Controlli Posizione */}
                                            <div className="flex items-center space-x-2 pt-1">
                                                <span className="text-[10px] text-gray-500 font-bold w-12 uppercase tracking-wide">Posiz.</span>
                                                <div className="flex space-x-1">
                                                    <button onClick={() => movePlayerOffset(index, 'x', -1)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded px-2 py-0.5 text-xs">
                                                        <i className="fa-solid fa-chevron-left" />
                                                    </button>
                                                    <div className="flex flex-col space-y-1">
                                                        <button onClick={() => movePlayerOffset(index, 'y', -1)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded px-2 py-0.5 text-xs text-center">
                                                            <i className="fa-solid fa-chevron-up" />
                                                        </button>
                                                        <button onClick={() => movePlayerOffset(index, 'y', 1)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded px-2 py-0.5 text-xs text-center">
                                                            <i className="fa-solid fa-chevron-down" />
                                                        </button>
                                                    </div>
                                                    <button onClick={() => movePlayerOffset(index, 'x', 1)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded px-2 py-0.5 text-xs">
                                                        <i className="fa-solid fa-chevron-right" />
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
                    <LineUpPoster
                        players={players}
                        teamName={teamName}
                        subtitle={subtitle}
                        groupName={groupName}
                        primaryColor={primaryColor}
                        secondaryColor={secondaryColor}
                        teamBadgeSrc={teamBadgeSrc}
                        decoLeftSrc={decoLeftSrc}
                        globalScale={globalScale}
                    />
                </div>
            </main>
        </div>
    );
};

export default LineUp;
