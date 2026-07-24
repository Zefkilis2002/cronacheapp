import React, { useState } from 'react';
import * as htmlToImage from 'html-to-image';
import SpotlightPoster from './SpotlightPoster';
import { saveImage } from '../utils/saveImage';
import { usePosterScale } from '../utils/usePosterScale';
import './Spotlight.css';

// Dimensioni fisse di design del poster: il rendering è sempre a questa
// risoluzione e viene solo riscalato via transform, così mobile e desktop
// mostrano esattamente la stessa immagine
const POSTER_WIDTH = 1440;
const POSTER_HEIGHT = 1800;

// Logo di default in alto a sinistra (logo del sito, bianco)
const DEFAULT_BRAND_LOGO = '/logosito/Logo_CE_bianco.svg';

const ROLE_DEFS = [
    { key: 'manager', label: 'Manager', roleLabel: 'MANAGER' },
    { key: 'starPlayer', label: 'Star Player', roleLabel: 'STAR PLAYER' },
    { key: 'oneToWatch', label: 'One To Watch', roleLabel: 'ONE TO WATCH' }
];

const PRESETS = [
    { name: 'Mondiale', background: '#0b1e42', accent: '#ffce33', arrow: '#39ff14', pillText: '#0b1e42' },
    { name: 'Olympiacos', background: '#7a0c18', accent: '#ffffff', arrow: '#ffffff', pillText: '#7a0c18' },
    { name: 'Panathinaikos', background: '#063d1f', accent: '#ffffff', arrow: '#7cff5c', pillText: '#063d1f' },
    { name: 'AEK', background: '#0a0a0a', accent: '#ffd400', arrow: '#ffd400', pillText: '#0a0a0a' },
    { name: 'PAOK', background: '#0a0a0a', accent: '#ffffff', arrow: '#cfcfcf', pillText: '#0a0a0a' }
];

const makeRole = () => ({ surname: '', firstName: '', photo: null, badge: null });

const Spotlight = () => {
    const [brandLogoSrc, setBrandLogoSrc] = useState(DEFAULT_BRAND_LOGO);

    const [backgroundColor, setBackgroundColor] = useState(PRESETS[0].background);
    const [accentColor, setAccentColor] = useState(PRESETS[0].accent);
    const [arrowColor, setArrowColor] = useState(PRESETS[0].arrow);
    const [pillTextColor, setPillTextColor] = useState(PRESETS[0].pillText);
    const [activePreset, setActivePreset] = useState(PRESETS[0].name);

    const [roles, setRoles] = useState({
        manager: { ...makeRole(), surname: 'CLARKE', firstName: 'STEVE' },
        starPlayer: { ...makeRole(), surname: 'MCTOMINAY', firstName: 'SCOTT' },
        oneToWatch: { ...makeRole(), surname: 'GANNON-DOAK', firstName: 'BEN' }
    });

    // Scala del poster: riempie la larghezza disponibile senza mai superare
    // la dimensione di design (1 = desktop)
    const [previewAreaRef, posterScale] = usePosterScale(POSTER_WIDTH);

    const applyPreset = (preset) => {
        setActivePreset(preset.name);
        setBackgroundColor(preset.background);
        setAccentColor(preset.accent);
        setArrowColor(preset.arrow);
        setPillTextColor(preset.pillText);
    };

    const updateRole = (key, patch) => {
        setRoles(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
        setActivePreset(null);
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
        const container = document.getElementById('spotlightExportContainer');
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
                backgroundColor: backgroundColor,
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

            const safeName = (roles.starPlayer.surname || 'spotlight').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            await saveImage(dataUrl, `spotlight_${safeName}.jpg`);
        } catch (err) {
            console.error('Errore esportazione con html-to-image', err);
        }
    };

    const headerBar = (compact) => (
        <>
            <h1 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 font-[Bebas Neue] tracking-wider`}>
                SPOTLIGHT CREATOR
            </h1>
            <button onClick={exportImage} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-bold shadow transition-all text-sm flex items-center">
                <i className="fa-solid fa-download mr-2" />
                Download
            </button>
        </>
    );

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

    return (
        <div
            className="flex flex-col md:flex-row overflow-y-auto overflow-x-hidden md:overflow-hidden text-gray-200 spotlight-wrapper"
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
            <aside className="w-full md:w-[450px] md:h-full bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl z-20 md:overflow-hidden shrink-0 spotlight-sidebar order-3 md:order-none">

                <div className="hidden md:flex p-5 border-b border-gray-800 bg-gray-950 justify-between items-center shrink-0">
                    {headerBar(false)}
                </div>

                <div className="flex-1 md:overflow-y-auto p-5 pb-20">
                    {/* Impostazioni Grafica */}
                    <div className="mb-6 bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-700">
                        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 border-b border-gray-700 pb-2">Impostazioni Poster</h2>

                        {/* Logo */}
                        <div className="mb-4">
                            <label className="block text-xs font-semibold mb-2 text-gray-300">Logo (in alto a sinistra)</label>
                            <div className="flex items-center space-x-2">
                                <label htmlFor="spotlightBrandLogoUpload" className="file-upload-label">
                                    <i className="fa-solid fa-image mr-1.5" />
                                    {brandLogoSrc ? 'Cambia' : 'Carica'}
                                </label>
                                <input type="file" id="spotlightBrandLogoUpload" accept="image/*" onChange={handleImageUpload(setBrandLogoSrc)} />
                                {brandLogoSrc && (
                                    <img src={brandLogoSrc} alt="" style={{ height: 28, borderRadius: 4, background: backgroundColor, padding: 2 }} />
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

                        {/* Preset colore */}
                        <div className="border-t border-gray-700 pt-4 mb-4">
                            <label className="block text-xs font-semibold mb-2 text-gray-300">Preset Palette</label>
                            <div className="flex flex-wrap gap-2">
                                {PRESETS.map(preset => (
                                    <button
                                        key={preset.name}
                                        onClick={() => applyPreset(preset)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5 ${activePreset === preset.name
                                            ? 'bg-emerald-600 text-white border-emerald-500'
                                            : 'bg-gray-900 text-gray-300 border-gray-600 hover:bg-gray-800'
                                            }`}
                                    >
                                        <span
                                            className="inline-block w-2.5 h-2.5 rounded-full border border-white/30"
                                            style={{ backgroundColor: preset.background }}
                                        />
                                        {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Colori custom */}
                        <div className="border-t border-gray-700 pt-4 mb-2">
                            <label className="block text-xs font-semibold mb-2 text-gray-300">Colori Personalizzati</label>
                            <div className="flex items-center flex-wrap gap-4">
                                <div className="flex flex-col items-center">
                                    <input type="color" value={backgroundColor} onChange={(e) => { setBackgroundColor(e.target.value); setActivePreset(null); }} />
                                    <span className="text-[9px] text-gray-500 mt-1">Sfondo</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <input type="color" value={accentColor} onChange={(e) => { setAccentColor(e.target.value); setActivePreset(null); }} />
                                    <span className="text-[9px] text-gray-500 mt-1">Accento</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <input type="color" value={arrowColor} onChange={(e) => { setArrowColor(e.target.value); setActivePreset(null); }} />
                                    <span className="text-[9px] text-gray-500 mt-1">Frecce/Stella</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <input type="color" value={pillTextColor} onChange={(e) => { setPillTextColor(e.target.value); setActivePreset(null); }} />
                                    <span className="text-[9px] text-gray-500 mt-1">Testo Badge</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fasce: Manager / Star Player / One To Watch */}
                    {ROLE_DEFS.map(def => {
                        const role = roles[def.key];
                        const photoInputId = `spotlightPhoto_${def.key}`;
                        const badgeInputId = `spotlightBadge_${def.key}`;
                        return (
                            <div key={def.key} className="mb-6 bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-700">
                                <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3 border-b border-gray-700 pb-2">{def.label}</h2>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-xs font-semibold mb-1 text-gray-300">Cognome</label>
                                        <input
                                            type="text"
                                            className="w-full"
                                            value={role.surname}
                                            onChange={(e) => updateRole(def.key, { surname: e.target.value.toUpperCase() })}
                                            placeholder="COGNOME"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1 text-gray-300">Nome</label>
                                        <input
                                            type="text"
                                            className="w-full"
                                            value={role.firstName}
                                            onChange={(e) => updateRole(def.key, { firstName: e.target.value.toUpperCase() })}
                                            placeholder="NOME"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {renderAssetUpload('Foto', 'fa-image', role.photo, (src) => updateRole(def.key, { photo: src }), photoInputId)}
                                    {renderAssetUpload('Stemma/Logo', 'fa-shield-halved', role.badge, (src) => updateRole(def.key, { badge: src }), badgeInputId)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* Area Principale (Preview) */}
            <main className="md:flex-1 bg-[#050505] md:h-full md:overflow-y-auto spotlight-main order-2 md:order-none shrink-0 md:shrink">
                <div ref={previewAreaRef} className="min-h-full flex items-center justify-center p-2 md:p-4">
                    {/* Il poster è renderizzato sempre a 1440x1800 e riscalato via
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
                            <SpotlightPoster
                                brandLogoSrc={brandLogoSrc}
                                backgroundColor={backgroundColor}
                                accentColor={accentColor}
                                arrowColor={arrowColor}
                                pillTextColor={pillTextColor}
                                manager={roles.manager}
                                starPlayer={roles.starPlayer}
                                oneToWatch={roles.oneToWatch}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Spotlight;
