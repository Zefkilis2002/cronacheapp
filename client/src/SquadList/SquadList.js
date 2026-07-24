import React, { useState } from 'react';
import * as htmlToImage from 'html-to-image';
import SquadPoster from './SquadPoster';
import { saveImage } from '../utils/saveImage';
import { usePosterScale } from '../utils/usePosterScale';
import './SquadList.css';

// Dimensioni fisse di design del poster: il rendering è sempre a questa
// risoluzione e viene solo riscalato via transform, così mobile e desktop
// mostrano esattamente la stessa immagine
const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1440;

// Logo di default in alto a destra (logo del sito, bianco)
const DEFAULT_BRAND_LOGO = '/logosito/Logo_CE_bianco.svg';

const SECTION_DEFS = [
    { key: 'gk', controlLabel: 'Portieri', defaultTitle: 'GOALKEEPERS' },
    { key: 'def', controlLabel: 'Difensori', defaultTitle: 'DEFENDERS' },
    { key: 'mid', controlLabel: 'Centrocampisti', defaultTitle: 'MIDFIELDERS' },
    { key: 'att', controlLabel: 'Attaccanti', defaultTitle: 'ATTACKERS' }
];

const MAX_PLAYERS_PER_SECTION = 12;

// Rosa di esempio (la grafica di riferimento) così l'anteprima è subito piena
const DEFAULT_SQUAD = {
    gk: [
        { name: 'BENJAMIN ASARE', stars: 1 },
        { name: 'LAWRENCE ATI-ZIGI', stars: 2 },
        { name: 'JOSEPH ANANG', stars: 1 }
    ],
    def: [
        { name: 'RAHMAN BABA', stars: 2 },
        { name: 'DERRICK LUCKASSEN', stars: 2 },
        { name: 'GIDEON MENSAH', stars: 2 },
        { name: 'MARVIN SENAYA', stars: 2 },
        { name: 'ALIDU SEIDU', stars: 2 },
        { name: 'ABDUL MUMIN', stars: 2 },
        { name: 'JEROME OPOKU', stars: 2 },
        { name: 'JONAS ADJETEY', stars: 2 },
        { name: 'PEPRAH OPPONG', stars: 2 }
    ],
    mid: [
        { name: 'THOMAS PARTEY', stars: 3 },
        { name: 'KWASI SIBO', stars: 2 },
        { name: 'AUGUSTINE BOAKYE', stars: 2 },
        { name: 'CALEB YIRENKYI', stars: 2 },
        { name: 'ELISHA OWUSU', stars: 2 }
    ],
    att: [
        { name: 'KAMALDEEN SULEMANA', stars: 3 },
        { name: 'ABDUL FATAWU', stars: 3 },
        { name: 'CHRISTOPHER BAAH', stars: 2 },
        { name: 'ERNEST NUAMAH', stars: 2 },
        { name: 'ANTOINE SEMENYO', stars: 4 },
        { name: 'THOMAS ASANTE', stars: 3 },
        { name: 'PRINCE ADU', stars: 2 },
        { name: 'INAKI WILLIAMS', stars: 3 },
        { name: 'JORDAN AYEW', stars: 2 }
    ]
};

let playerIdCounter = 0;
const makePlayer = (data = {}) => ({
    id: `sq-${++playerIdCounter}`,
    name: data.name || '',
    stars: data.stars || 2,
    logo: data.logo || null
});

// --- Import da JSON ---------------------------------------------------------
// I reparti nel JSON possono essere indicati con nomi diversi (chiavi corte,
// inglesi o italiane): li normalizziamo tutti verso gk/def/mid/att
const SECTION_ALIASES = {
    gk: ['gk', 'gks', 'goalkeepers', 'goalkeeper', 'portieri', 'portiere', 'p'],
    def: ['def', 'defenders', 'defender', 'defence', 'defense', 'difensori', 'difensore', 'd'],
    mid: ['mid', 'mids', 'midfield', 'midfielders', 'midfielder', 'centrocampisti', 'centrocampista', 'c'],
    att: ['att', 'atts', 'attackers', 'attacker', 'forwards', 'forward', 'strikers', 'striker', 'attaccanti', 'attaccante', 'a']
};

const clampStars = (n) => {
    const v = parseInt(n, 10);
    if (!Number.isFinite(v)) return 2;
    return Math.max(1, Math.min(5, v));
};

// Cerca dentro un oggetto la chiave che corrisponde al reparto richiesto,
// senza distinzione tra maiuscole/minuscole
const resolveSectionValue = (obj, canonicalKey) => {
    if (!obj || typeof obj !== 'object') return undefined;
    const aliases = SECTION_ALIASES[canonicalKey];
    const foundKey = Object.keys(obj).find(k => aliases.includes(k.toLowerCase().trim()));
    return foundKey !== undefined ? obj[foundKey] : undefined;
};

// Un reparto può essere una lista di stringhe ("NOME") o di oggetti
// ({ name, stars, logo }); qui lo normalizziamo in giocatori validi
const parseSectionPlayers = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, MAX_PLAYERS_PER_SECTION).map(item => {
        if (item == null) return makePlayer();
        if (typeof item === 'string') return makePlayer({ name: item.toUpperCase() });
        const name = item.name != null ? String(item.name) : '';
        return makePlayer({
            name: name.toUpperCase(),
            stars: clampStars(item.stars),
            logo: typeof item.logo === 'string' ? item.logo : null
        });
    });
};

const SquadList = () => {
    const [title, setTitle] = useState('WORLD CUP 2026 SQUAD');
    const [brandLogoSrc, setBrandLogoSrc] = useState(DEFAULT_BRAND_LOGO);
    const [primaryColor, setPrimaryColor] = useState('#1e9e44');
    const [darkColor, setDarkColor] = useState('#0b5a24');
    const [accentColor, setAccentColor] = useState('#f7c600');
    const [showLegend, setShowLegend] = useState(true);

    const [tournamentLogoSrc, setTournamentLogoSrc] = useState(null);
    const [teamBadgeSrc, setTeamBadgeSrc] = useState(null);
    const [ballSrc, setBallSrc] = useState(null);

    const [sectionTitles, setSectionTitles] = useState(() =>
        SECTION_DEFS.reduce((acc, s) => ({ ...acc, [s.key]: s.defaultTitle }), {})
    );

    const [sections, setSections] = useState(() =>
        SECTION_DEFS.reduce((acc, s) => ({
            ...acc,
            [s.key]: DEFAULT_SQUAD[s.key].map(makePlayer)
        }), {})
    );

    // Esito dell'ultimo import JSON (messaggio verde/rosso sotto il pulsante)
    const [jsonMessage, setJsonMessage] = useState(null);

    // Scala del poster: riempie la larghezza disponibile senza mai superare
    // la dimensione di design (1 = desktop)
    const [previewAreaRef, posterScale] = usePosterScale(POSTER_WIDTH);

    // --- Import / Export JSON ---
    const applySquadJson = (data) => {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            setJsonMessage({ type: 'error', text: 'JSON non valido: il file deve contenere un oggetto.' });
            return;
        }

        if (typeof data.title === 'string') setTitle(data.title.toUpperCase());
        if (typeof data.primaryColor === 'string') setPrimaryColor(data.primaryColor);
        if (typeof data.darkColor === 'string') setDarkColor(data.darkColor);
        if (typeof data.accentColor === 'string') setAccentColor(data.accentColor);
        if (typeof data.showLegend === 'boolean') setShowLegend(data.showLegend);
        if (typeof data.brandLogoSrc === 'string') setBrandLogoSrc(data.brandLogoSrc);
        if (typeof data.tournamentLogoSrc === 'string') setTournamentLogoSrc(data.tournamentLogoSrc);
        if (typeof data.teamBadgeSrc === 'string') setTeamBadgeSrc(data.teamBadgeSrc);
        if (typeof data.ballSrc === 'string') setBallSrc(data.ballSrc);

        if (data.sectionTitles && typeof data.sectionTitles === 'object') {
            setSectionTitles(prev => {
                const next = { ...prev };
                SECTION_DEFS.forEach(def => {
                    const v = resolveSectionValue(data.sectionTitles, def.key);
                    if (typeof v === 'string') next[def.key] = v.toUpperCase();
                });
                return next;
            });
        }

        let totalPlayers = 0;
        if (data.sections && typeof data.sections === 'object') {
            setSections(prev => {
                const next = { ...prev };
                SECTION_DEFS.forEach(def => {
                    const raw = resolveSectionValue(data.sections, def.key);
                    if (raw !== undefined) {
                        const players = parseSectionPlayers(raw);
                        totalPlayers += players.length;
                        next[def.key] = players;
                    } else {
                        totalPlayers += next[def.key].length;
                    }
                });
                return next;
            });
            setJsonMessage({ type: 'ok', text: `Grafica compilata dal JSON (${totalPlayers} giocatori).` });
        } else {
            setJsonMessage({ type: 'ok', text: 'Impostazioni compilate dal JSON (nessun reparto "sections" trovato).' });
        }
    };

    const handleJsonUpload = (e) => {
        const input = e.target;
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                applySquadJson(JSON.parse(evt.target.result));
            } catch (err) {
                setJsonMessage({ type: 'error', text: `File JSON non leggibile: ${err.message}` });
            }
        };
        reader.readAsText(file);
        input.value = '';
    };

    // Scarica lo stato attuale come JSON: serve da modello per l'utente
    const exportSquadJson = () => {
        const data = {
            title,
            primaryColor,
            darkColor,
            accentColor,
            showLegend,
            sectionTitles: { ...sectionTitles },
            sections: SECTION_DEFS.reduce((acc, def) => {
                acc[def.key] = sections[def.key].map(p => ({
                    name: p.name,
                    stars: p.stars,
                    ...(p.logo ? { logo: p.logo } : {})
                }));
                return acc;
            }, {})
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'squad_template.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    // --- Aggiornamento giocatori ---
    const updatePlayer = (sectionKey, index, patch) => {
        setSections(prev => ({
            ...prev,
            [sectionKey]: prev[sectionKey].map((p, i) => i === index ? { ...p, ...patch } : p)
        }));
    };

    const setSectionCount = (sectionKey, rawCount) => {
        const count = Math.max(0, Math.min(MAX_PLAYERS_PER_SECTION, parseInt(rawCount, 10) || 0));
        setSections(prev => {
            const current = prev[sectionKey];
            if (count === current.length) return prev;
            const next = current.slice(0, count);
            while (next.length < count) next.push(makePlayer());
            return { ...prev, [sectionKey]: next };
        });
    };

    const handleImageUpload = (onLoaded) => (e) => {
        const input = e.target;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (evt) => onLoaded(evt.target.result);
            reader.readAsDataURL(input.files[0]);
            input.value = '';
        }
    };

    const exportImage = async () => {
        const container = document.getElementById('squadExportContainer');
        if (!container) return;

        try {
            await document.fonts.ready;

            // offsetWidth/Height ignorano il transform scale dell'anteprima:
            // l'export è sempre alla risoluzione di design piena
            const options = {
                quality: 1.0,
                pixelRatio: 1.5,
                width: container.offsetWidth,
                height: container.offsetHeight,
                // html-to-image applica questo colore come sfondo del nodo
                // radice, sovrascrivendo quello del poster: va tenuto uguale a
                // darkColor, altrimenti il bordo esce sempre nero nell'export
                backgroundColor: darkColor,
                cacheBust: true,
                style: {
                    margin: '0',
                    borderRadius: '0'
                }
            };

            // html-to-image spesso "salta" immagini/font alla prima passata:
            // passate di riscaldamento, teniamo l'ultima
            await htmlToImage.toJpeg(container, options);
            await htmlToImage.toJpeg(container, options);
            const dataUrl = await htmlToImage.toJpeg(container, options);

            const safeName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'squad';
            await saveImage(dataUrl, `squad_${safeName}.jpg`);
        } catch (err) {
            console.error('Errore esportazione con html-to-image', err);
        }
    };

    // --- UI helpers ---
    const renderAssetUpload = (label, icon, src, setter, inputId) => (
        <div>
            <label className="block text-xs font-semibold mb-2 text-gray-300">{label}</label>
            <div className="flex items-center space-x-2">
                <label htmlFor={inputId} className="file-upload-label">
                    <i className={`fa-solid ${icon} mr-1.5`} />
                    {src ? 'Cambia' : 'Carica'}
                </label>
                <input type="file" id={inputId} accept="image/*" onChange={handleImageUpload(setter)} />
                {src && (
                    <>
                        <img src={src} alt="" style={{ height: 28, borderRadius: 4 }} />
                        <button onClick={() => setter(null)} className="text-red-400 hover:text-red-300 text-xs border border-red-900/50 bg-red-900/20 px-2 py-1 rounded">
                            <i className="fa-solid fa-trash" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    const renderStarPicker = (value, onChange) => (
        <div className="flex items-center shrink-0">
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    className={`squad-star-btn ${n <= value ? 'active' : ''}`}
                    title={`${n} stelle`}
                >
                    ★
                </button>
            ))}
        </div>
    );

    const headerBar = (compact) => (
        <>
            <h1 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 font-[Bebas Neue] tracking-wider`}>
                SQUAD CREATOR
            </h1>
            <button onClick={exportImage} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-bold shadow transition-all text-sm flex items-center">
                <i className="fa-solid fa-download mr-2" />
                Download
            </button>
        </>
    );

    return (
        <div
            className="flex flex-col md:flex-row overflow-y-auto overflow-x-hidden md:overflow-hidden text-gray-200 squad-wrapper"
            style={{
                fontFamily: "'Poppins', sans-serif",
                backgroundColor: '#111827',
                position: 'fixed',
                top: '75px',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10
            }}
        >
            {/* Header mobile: titolo + download sempre raggiungibili (sticky) */}
            <div className="md:hidden order-1 sticky top-0 z-30 p-4 border-b border-gray-800 bg-gray-950 flex justify-between items-center shrink-0">
                {headerBar(true)}
            </div>

            {/* Sidebar Controlli */}
            <aside className="w-full md:w-[450px] md:h-full bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl z-20 md:overflow-hidden shrink-0 squad-sidebar order-3 md:order-none">

                <div className="hidden md:flex p-5 border-b border-gray-800 bg-gray-950 justify-between items-center shrink-0">
                    {headerBar(false)}
                </div>

                <div className="flex-1 md:overflow-y-auto p-5 pb-20">
                    {/* Import da JSON */}
                    <div className="mb-6 bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-700">
                        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3 border-b border-gray-700 pb-2">Importa da JSON</h2>
                        <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
                            Carica un file <code className="text-emerald-400">.json</code> per compilare in automatico titolo, colori, nomi reparti e giocatori (con stelle e logo). Scarica il modello per vedere il formato corretto.
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                            <label htmlFor="squadJsonUpload" className="file-upload-label">
                                <i className="fa-solid fa-file-import mr-1.5" />
                                Importa JSON
                            </label>
                            <input type="file" id="squadJsonUpload" accept="application/json,.json" onChange={handleJsonUpload} />
                            <button
                                onClick={exportSquadJson}
                                className="text-xs font-semibold border border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-200 px-2.5 py-1.5 rounded flex items-center"
                            >
                                <i className="fa-solid fa-file-arrow-down mr-1.5" />
                                Scarica template
                            </button>
                        </div>
                        {jsonMessage && (
                            <p className={`text-[11px] mt-3 font-semibold ${jsonMessage.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                                <i className={`fa-solid ${jsonMessage.type === 'ok' ? 'fa-circle-check' : 'fa-triangle-exclamation'} mr-1.5`} />
                                {jsonMessage.text}
                            </p>
                        )}
                    </div>

                    {/* Impostazioni Grafica */}
                    <div className="mb-6 bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-700">
                        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 border-b border-gray-700 pb-2">Impostazioni Poster</h2>

                        <div className="mb-4">
                            <label className="block text-xs font-semibold mb-1 text-gray-300">Titolo Superiore</label>
                            <input
                                type="text"
                                placeholder="Es. WORLD CUP 2026 SQUAD"
                                className="w-full"
                                value={title}
                                onChange={(e) => setTitle(e.target.value.toUpperCase())}
                            />
                        </div>

                        {/* Asset uploads */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 border-t border-gray-700 pt-4">
                            {/* Logo in alto a destra: di default il logo del sito */}
                            <div>
                                <label className="block text-xs font-semibold mb-2 text-gray-300">Logo (in alto a destra)</label>
                                <div className="flex items-center space-x-2">
                                    <label htmlFor="squadBrandLogoUpload" className="file-upload-label">
                                        <i className="fa-solid fa-image mr-1.5" />
                                        {brandLogoSrc ? 'Cambia' : 'Carica'}
                                    </label>
                                    <input type="file" id="squadBrandLogoUpload" accept="image/*" onChange={handleImageUpload(setBrandLogoSrc)} />
                                    {brandLogoSrc && (
                                        <img src={brandLogoSrc} alt="" style={{ height: 28, borderRadius: 4, background: '#0b5a24', padding: 2 }} />
                                    )}
                                    {brandLogoSrc !== DEFAULT_BRAND_LOGO ? (
                                        <button onClick={() => setBrandLogoSrc(DEFAULT_BRAND_LOGO)} title="Ripristina logo di default" className="text-gray-300 hover:text-white text-xs border border-gray-600 bg-gray-700 px-2 py-1 rounded">
                                            <i className="fa-solid fa-rotate-left" />
                                        </button>
                                    ) : (
                                        <button onClick={() => setBrandLogoSrc(null)} title="Rimuovi" className="text-red-400 hover:text-red-300 text-xs border border-red-900/50 bg-red-900/20 px-2 py-1 rounded">
                                            <i className="fa-solid fa-trash" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {renderAssetUpload('Logo Torneo (sx)', 'fa-trophy', tournamentLogoSrc, setTournamentLogoSrc, 'squadTournamentUpload')}
                            {renderAssetUpload('Stemma / Bandiera', 'fa-shield-halved', teamBadgeSrc, setTeamBadgeSrc, 'squadBadgeUpload')}
                            {renderAssetUpload('Palla (in basso)', 'fa-futbol', ballSrc, setBallSrc, 'squadBallUpload')}
                            <div>
                                <label className="block text-xs font-semibold mb-2 text-gray-300">Legenda Stelle</label>
                                <label className="text-xs font-bold text-gray-400 uppercase cursor-pointer flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={showLegend}
                                        onChange={() => setShowLegend(v => !v)}
                                        className="mr-1.5 accent-emerald-500"
                                    />
                                    Mostra
                                </label>
                            </div>
                        </div>

                        {/* Colori */}
                        <div className="border-t border-gray-700 pt-4 mb-4">
                            <label className="block text-xs font-semibold mb-2 text-gray-300">Colori Poster</label>
                            <div className="flex items-center space-x-4">
                                <div className="flex flex-col items-center">
                                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                                    <span className="text-[9px] text-gray-500 mt-1">Sfondo</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <input type="color" value={darkColor} onChange={(e) => setDarkColor(e.target.value)} />
                                    <span className="text-[9px] text-gray-500 mt-1">Scuro</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                                    <span className="text-[9px] text-gray-500 mt-1">Accento</span>
                                </div>
                            </div>
                        </div>

                        {/* Reparti: nome sezione + numero giocatori */}
                        <div className="border-t border-gray-700 pt-4">
                            <label className="block text-xs font-semibold mb-2 text-gray-300">Reparti (nome sezione e numero giocatori)</label>
                            <div className="space-y-2">
                                {SECTION_DEFS.map(def => (
                                    <div key={def.key} className="flex items-center space-x-2">
                                        <span className="text-[10px] font-bold text-gray-400 w-24 shrink-0 uppercase">{def.controlLabel}</span>
                                        <input
                                            type="text"
                                            className="flex-1 min-w-0"
                                            value={sectionTitles[def.key]}
                                            onChange={(e) => setSectionTitles(prev => ({ ...prev, [def.key]: e.target.value.toUpperCase() }))}
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max={MAX_PLAYERS_PER_SECTION}
                                            className="w-16 shrink-0 text-center"
                                            value={sections[def.key].length}
                                            onChange={(e) => setSectionCount(def.key, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Liste Giocatori per reparto */}
                    {SECTION_DEFS.map(def => (
                        sections[def.key].length > 0 && (
                            <div key={def.key} className="mb-6">
                                <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3 flex justify-between items-end">
                                    <span>{def.controlLabel} ({sections[def.key].length})</span>
                                    <span className="text-[10px] text-gray-500 font-normal normal-case">{sectionTitles[def.key]}</span>
                                </h2>
                                <div className="space-y-2">
                                    {sections[def.key].map((player, index) => {
                                        const fileInputId = `squadPlayerLogo_${def.key}_${index}`;
                                        return (
                                            <div key={player.id} className="bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-700 flex flex-col space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-900 px-2 py-1 rounded w-8 text-center shrink-0 border border-gray-700">{index + 1}</span>
                                                    <input
                                                        type="text"
                                                        value={player.name}
                                                        onChange={(e) => updatePlayer(def.key, index, { name: e.target.value.toUpperCase() })}
                                                        className="flex-1 min-w-0 uppercase font-bold"
                                                        placeholder="NOME COGNOME"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between pl-10 flex-wrap gap-2">
                                                    <div className="flex items-center space-x-2">
                                                        <label htmlFor={fileInputId} className="file-upload-label">
                                                            <i className="fa-solid fa-image mr-1.5" /> {player.logo ? 'Cambia Logo' : 'Logo Club'}
                                                        </label>
                                                        <input
                                                            type="file"
                                                            id={fileInputId}
                                                            accept="image/*"
                                                            onChange={handleImageUpload((src) => updatePlayer(def.key, index, { logo: src }))}
                                                        />
                                                        {player.logo && (
                                                            <>
                                                                <img src={player.logo} alt="" style={{ height: 24, width: 24, borderRadius: 4, objectFit: 'cover' }} />
                                                                <button
                                                                    onClick={() => updatePlayer(def.key, index, { logo: null })}
                                                                    className="text-red-400 hover:text-red-300 text-xs border border-red-900/50 bg-red-900/20 px-2 py-1 rounded"
                                                                >
                                                                    <i className="fa-solid fa-trash" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                    {renderStarPicker(player.stars, (n) => updatePlayer(def.key, index, { stars: n }))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </aside>

            {/* Area Principale (Preview) */}
            <main className="md:flex-1 bg-[#050505] md:h-full md:overflow-y-auto squad-main order-2 md:order-none shrink-0 md:shrink">
                <div ref={previewAreaRef} className="min-h-full flex items-center justify-center p-2 md:p-4">
                    {/* Il poster è renderizzato sempre a 1080x1440 e riscalato via
                        transform: su mobile è identico al desktop, solo più piccolo */}
                    <div style={{ width: POSTER_WIDTH * posterScale, height: POSTER_HEIGHT * posterScale }}>
                        <div
                            style={{
                                width: POSTER_WIDTH,
                                height: POSTER_HEIGHT,
                                transform: `scale(${posterScale})`,
                                transformOrigin: 'top left'
                            }}
                        >
                            <SquadPoster
                                title={title}
                                brandLogoSrc={brandLogoSrc}
                                tournamentLogoSrc={tournamentLogoSrc}
                                teamBadgeSrc={teamBadgeSrc}
                                ballSrc={ballSrc}
                                sections={sections}
                                sectionTitles={sectionTitles}
                                showLegend={showLegend}
                                primaryColor={primaryColor}
                                darkColor={darkColor}
                                accentColor={accentColor}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SquadList;
