import React, { useState } from 'react';
import * as htmlToImage from 'html-to-image';
import KeyPlayersPoster, { POSTER_WIDTH, POSTER_HEIGHT } from './KeyPlayersPoster';
import { saveImage } from '../utils/saveImage';
import { usePosterScale } from '../utils/usePosterScale';
import './KeyPlayers.css';

// Logo di default in alto a sinistra (logo del sito, bianco)
const DEFAULT_BRAND_LOGO = '/logosito/Logo_CE_bianco.svg';

// Palette pronte: Mondiale + principali club greci
const PRESETS = [
    {
        name: 'Mondiale',
        bands: ['#0a58c8', '#0a4fb4', '#0a58c8'],
        shape: '#1a6ade',
        pill: '#dda600',
        pillText: '#ffffff',
        nameColor: '#ffffff',
        separator: '#ffffff',
        accents: ['#ffd21f', '#ffd21f', '#2fe36b']
    },
    {
        name: 'Grecia',
        bands: ['#0d5eaf', '#0a5099', '#0d5eaf'],
        shape: '#1a74cc',
        pill: '#ffffff',
        pillText: '#0d5eaf',
        nameColor: '#ffffff',
        separator: '#ffffff',
        accents: ['#ffd21f', '#ffd21f', '#2fe36b']
    },
    {
        name: 'Olympiacos',
        bands: ['#c8102e', '#a80d26', '#c8102e'],
        shape: '#e0203f',
        pill: '#ffffff',
        pillText: '#c8102e',
        nameColor: '#ffffff',
        separator: '#ffffff',
        accents: ['#ffd21f', '#ffd21f', '#ffffff']
    },
    {
        name: 'Panathinaikos',
        bands: ['#00693e', '#005433', '#00693e'],
        shape: '#04814d',
        pill: '#ffffff',
        pillText: '#00693e',
        nameColor: '#ffffff',
        separator: '#ffffff',
        accents: ['#ffd21f', '#ffd21f', '#8ef0b4']
    },
    {
        name: 'AEK',
        bands: ['#141414', '#000000', '#141414'],
        shape: '#262626',
        pill: '#f6c700',
        pillText: '#141414',
        nameColor: '#ffffff',
        separator: '#f6c700',
        accents: ['#f6c700', '#f6c700', '#f6c700']
    },
    {
        name: 'PAOK',
        bands: ['#101010', '#1b1b1b', '#101010'],
        shape: '#2b2b2b',
        pill: '#ffffff',
        pillText: '#101010',
        nameColor: '#ffffff',
        separator: '#ffffff',
        accents: ['#ffffff', '#ffffff', '#2fe36b']
    }
];

// L'ordine conta: il primo è il default. Allotrope-Bold è quello con le
// proporzioni più vicine alla grafica di riferimento (~0.64 em per carattere;
// Benzin-ExtraBold sta a 0.95 e Kenyan Coffee a 0.42)
const FONT_OPTIONS = [
    { label: 'Allotrope Bold', value: "'Allotrope-Bold', Impact, sans-serif" },
    { label: 'Benzin ExtraBold', value: "'Benzin-ExtraBold', 'Bebas Neue', Impact, sans-serif" },
    { label: 'Benzin Bold', value: "'Benzin-Bold', 'Bebas Neue', Impact, sans-serif" },
    { label: 'Kuunari Black Condensed', value: "'Kuunari-Black-Condensed', Impact, sans-serif" },
    { label: 'Kenyan Coffee Bold', value: "'Kenyan Coffee Bold', Impact, sans-serif" },
    { label: 'BB Torsos Pro Ultra', value: "'BBTorsosPro-Ultra', Impact, sans-serif" },
    { label: 'Skate Sans', value: "'SkateSans-Regular', sans-serif" },
    { label: 'Poppins', value: "'Poppins', sans-serif" }
];

const SUB_FONT_OPTIONS = [
    { label: 'Poppins', value: "'Poppins', sans-serif" },
    { label: 'Allotrope Bold', value: "'Allotrope-Bold', sans-serif" },
    { label: 'Benzin Medium', value: "'Benzin-Medium', 'Poppins', sans-serif" },
    { label: 'Benzin Regular', value: "'Benzin-Regular', 'Poppins', sans-serif" },
    { label: 'Benzin Semibold', value: "'Benzin-Semibold', 'Poppins', sans-serif" },
    { label: 'Kenyan Coffee Regular', value: "'Kenyan Coffee Regular', sans-serif" },
    { label: 'Skate Sans', value: "'SkateSans-Regular', sans-serif" }
];

const ACCENT_OPTIONS = [
    { label: 'Nessuno', value: 'none' },
    { label: 'Stella', value: 'star' },
    { label: 'Due stelle', value: 'stars' },
    { label: 'Frecce', value: 'arrows' },
    { label: 'Fulmine', value: 'bolt' },
    { label: 'Fiamma', value: 'fire' },
    { label: 'Scudo', value: 'shield' }
];

// Le tre fasce di default ricalcano la grafica di riferimento
const DEFAULT_SECTIONS = [
    { roleLabel: 'MANAGER', firstName: 'STEVE', lastName: 'CLARKE', photoSide: 'left', accent: 'none' },
    { roleLabel: 'STAR PLAYER', firstName: 'SCOTT', lastName: 'MCTOMINAY', photoSide: 'right', accent: 'star' },
    { roleLabel: 'ONE TO WATCH', firstName: 'BEN', lastName: 'GANNON-DOAK', photoSide: 'left', accent: 'arrows' }
];

const makeSection = (data, index) => ({
    id: `kp-${index}`,
    roleLabel: data.roleLabel,
    firstName: data.firstName,
    lastName: data.lastName,
    photo: null,
    crest: null,
    photoSide: data.photoSide,
    photoWidth: 55,   // % della larghezza del poster
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    overflow: 55,     // px di sbordo verso la fascia superiore
    accent: data.accent,
    accentColor: PRESETS[0].accents[index],
    bandColor: PRESETS[0].bands[index]
});

const KeyPlayers = () => {
    const [sections, setSections] = useState(() => DEFAULT_SECTIONS.map(makeSection));

    const [brandLogoSrc, setBrandLogoSrc] = useState(DEFAULT_BRAND_LOGO);
    const [brandPosition, setBrandPosition] = useState('right');
    const [defaultCrestSrc, setDefaultCrestSrc] = useState(null);

    const [pillColor, setPillColor] = useState(PRESETS[0].pill);
    const [pillTextColor, setPillTextColor] = useState(PRESETS[0].pillText);
    const [nameColor, setNameColor] = useState(PRESETS[0].nameColor);
    const [shapeColor, setShapeColor] = useState(PRESETS[0].shape);
    const [separatorColor, setSeparatorColor] = useState(PRESETS[0].separator);
    const [separatorSize, setSeparatorSize] = useState(5);

    const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
    const [subFontFamily, setSubFontFamily] = useState(SUB_FONT_OPTIONS[0].value);

    // Scala del poster: riempie la larghezza disponibile senza mai superare
    // la dimensione di design (1 = desktop)
    const [previewAreaRef, posterScale] = usePosterScale(POSTER_WIDTH);

    const updateSection = (index, patch) => {
        setSections(prev => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    };

    const applyPreset = (preset) => {
        setPillColor(preset.pill);
        setPillTextColor(preset.pillText);
        setNameColor(preset.nameColor);
        setShapeColor(preset.shape);
        setSeparatorColor(preset.separator);
        setSections(prev => prev.map((s, i) => ({
            ...s,
            bandColor: preset.bands[i],
            accentColor: preset.accents[i]
        })));
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
        const container = document.getElementById('keyPlayersExportContainer');
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
                // separatorColor, altrimenti le linee tra le fasce escono nere
                backgroundColor: separatorColor,
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

            const safeName = sections
                .map(s => s.lastName)
                .filter(Boolean)
                .join('_')
                .replace(/[^a-z0-9_]/gi, '')
                .toLowerCase() || 'keyplayers';
            await saveImage(dataUrl, `keyplayers_${safeName}.jpg`);
        } catch (err) {
            console.error('Errore esportazione con html-to-image', err);
        }
    };

    // --- UI helpers ---
    const renderColor = (label, value, setter) => (
        <div className="flex flex-col items-center">
            <input type="color" value={value} onChange={(e) => setter(e.target.value)} />
            <span className="text-[9px] text-gray-500 mt-1">{label}</span>
        </div>
    );

    const renderSlider = (label, value, min, max, step, onChange, format) => (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase">{label}</label>
                <span className="text-[10px] text-gray-500">{format ? format(value) : value}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
            />
        </div>
    );

    const renderAssetUpload = (label, icon, src, setter, inputId, onReset) => (
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
                        <img src={src} alt="" style={{ height: 28, borderRadius: 4, background: '#1f2937', padding: 2 }} />
                        <button
                            onClick={() => (onReset ? onReset() : setter(null))}
                            className="text-red-400 hover:text-red-300 text-xs border border-red-900/50 bg-red-900/20 px-2 py-1 rounded"
                        >
                            <i className="fa-solid fa-trash" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    const headerBar = (compact) => (
        <>
            <h1 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500 tracking-wider`}>
                KEY PLAYERS
            </h1>
            <button onClick={exportImage} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded font-bold shadow transition-all text-sm flex items-center">
                <i className="fa-solid fa-download mr-2" />
                Download
            </button>
        </>
    );

    return (
        <div
            className="flex flex-col md:flex-row overflow-y-auto overflow-x-hidden md:overflow-hidden text-gray-200 keyplayers-wrapper"
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
            <aside className="w-full md:w-[450px] md:h-full bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl z-20 md:overflow-hidden shrink-0 keyplayers-sidebar order-3 md:order-none">

                <div className="hidden md:flex p-5 border-b border-gray-800 bg-gray-950 justify-between items-center shrink-0">
                    {headerBar(false)}
                </div>

                <div className="flex-1 md:overflow-y-auto p-5 pb-20">

                    {/* Palette */}
                    <div className="mb-6 bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-700">
                        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 border-b border-gray-700 pb-2">Palette</h2>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {PRESETS.map(preset => (
                                <button key={preset.name} className="kp-preset-btn" onClick={() => applyPreset(preset)}>
                                    <span className="kp-preset-swatch" style={{ background: preset.bands[0] }} />
                                    <span className="kp-preset-swatch" style={{ background: preset.pill }} />
                                    {preset.name}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center flex-wrap gap-4 border-t border-gray-700 pt-4">
                            {renderColor('Cerchio', shapeColor, setShapeColor)}
                            {renderColor('Barra', pillColor, setPillColor)}
                            {renderColor('Testo barra', pillTextColor, setPillTextColor)}
                            {renderColor('Nomi', nameColor, setNameColor)}
                            {renderColor('Linee', separatorColor, setSeparatorColor)}
                        </div>

                        <div className="mt-4">
                            {renderSlider('Spessore linee', separatorSize, 0, 24, 1, setSeparatorSize, v => `${v} px`)}
                        </div>
                    </div>

                    {/* Impostazioni generali */}
                    <div className="mb-6 bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-700">
                        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 border-b border-gray-700 pb-2">Loghi e tipografia</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            {renderAssetUpload(
                                'Logo brand',
                                'fa-image',
                                brandLogoSrc,
                                setBrandLogoSrc,
                                'kpBrandUpload',
                                brandLogoSrc !== DEFAULT_BRAND_LOGO ? () => setBrandLogoSrc(DEFAULT_BRAND_LOGO) : null
                            )}
                            {renderAssetUpload('Stemma / bandiera (tutte)', 'fa-shield-halved', defaultCrestSrc, setDefaultCrestSrc, 'kpCrestUpload')}
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-semibold mb-2 text-gray-300">Posizione logo brand</label>
                            <div className="flex gap-2">
                                <button
                                    className={`kp-side-btn ${brandPosition === 'left' ? 'active' : ''}`}
                                    onClick={() => setBrandPosition('left')}
                                >
                                    Alto sx
                                </button>
                                <button
                                    className={`kp-side-btn ${brandPosition === 'right' ? 'active' : ''}`}
                                    onClick={() => setBrandPosition('right')}
                                >
                                    Alto dx
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 border-t border-gray-700 pt-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-300">Font cognome / barra</label>
                                <select className="w-full" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                                    {FONT_OPTIONS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-300">Font nome</label>
                                <select className="w-full" value={subFontFamily} onChange={(e) => setSubFontFamily(e.target.value)}>
                                    {SUB_FONT_OPTIONS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Le tre fasce */}
                    {sections.map((section, index) => (
                        <div key={section.id} className="mb-6 bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-700">
                            <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 border-b border-gray-700 pb-2 flex justify-between items-end">
                                <span>Fascia {index + 1}</span>
                                <span className="text-[10px] text-gray-500 font-normal normal-case">{section.roleLabel}</span>
                            </h2>

                            <div className="mb-3">
                                <label className="block text-xs font-semibold mb-1 text-gray-300">Etichetta ruolo</label>
                                <input
                                    type="text"
                                    className="w-full"
                                    placeholder="Es. STAR PLAYER"
                                    value={section.roleLabel}
                                    onChange={(e) => updateSection(index, { roleLabel: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-gray-300">Cognome</label>
                                    <input
                                        type="text"
                                        className="w-full font-bold"
                                        placeholder="COGNOME"
                                        value={section.lastName}
                                        onChange={(e) => updateSection(index, { lastName: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-gray-300">Nome</label>
                                    <input
                                        type="text"
                                        className="w-full"
                                        placeholder="NOME"
                                        value={section.firstName}
                                        onChange={(e) => updateSection(index, { firstName: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 border-t border-gray-700 pt-3">
                                {renderAssetUpload(
                                    'Foto',
                                    'fa-user',
                                    section.photo,
                                    (src) => updateSection(index, { photo: src }),
                                    `kpPhoto_${index}`
                                )}
                                {renderAssetUpload(
                                    'Stemma (solo questa)',
                                    'fa-flag',
                                    section.crest,
                                    (src) => updateSection(index, { crest: src }),
                                    `kpSectionCrest_${index}`
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="block text-xs font-semibold mb-1 text-gray-300">Lato foto</label>
                                <div className="flex gap-2">
                                    <button
                                        className={`kp-side-btn ${section.photoSide === 'left' ? 'active' : ''}`}
                                        onClick={() => updateSection(index, { photoSide: 'left' })}
                                    >
                                        Sinistra
                                    </button>
                                    <button
                                        className={`kp-side-btn ${section.photoSide === 'right' ? 'active' : ''}`}
                                        onClick={() => updateSection(index, { photoSide: 'right' })}
                                    >
                                        Destra
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2.5 border-t border-gray-700 pt-3">
                                {renderSlider('Larghezza foto', section.photoWidth, 40, 72, 1, v => updateSection(index, { photoWidth: v }), v => `${v}%`)}
                                {renderSlider('Zoom', section.zoom, 0.6, 2.5, 0.01, v => updateSection(index, { zoom: v }), v => `${v.toFixed(2)}×`)}
                                {renderSlider('Sposta ↔', section.offsetX, -40, 40, 1, v => updateSection(index, { offsetX: v }), v => `${v}%`)}
                                {renderSlider('Sposta ↕', section.offsetY, -40, 40, 1, v => updateSection(index, { offsetY: v }), v => `${v}%`)}
                                {renderSlider('Sbordo verso l\'alto', section.overflow, 0, 160, 1, v => updateSection(index, { overflow: v }), v => `${v} px`)}
                            </div>

                            <div className="grid grid-cols-2 gap-3 items-end border-t border-gray-700 pt-3 mt-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-gray-300">Icona accento</label>
                                    <select
                                        className="w-full"
                                        value={section.accent}
                                        onChange={(e) => updateSection(index, { accent: e.target.value })}
                                    >
                                        {ACCENT_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-4">
                                    {renderColor('Accento', section.accentColor, (v) => updateSection(index, { accentColor: v }))}
                                    {renderColor('Sfondo', section.bandColor, (v) => updateSection(index, { bandColor: v }))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Area Principale (Preview) */}
            <main className="md:flex-1 bg-[#050505] md:h-full md:overflow-y-auto keyplayers-main order-2 md:order-none shrink-0 md:shrink">
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
                            <KeyPlayersPoster
                                sections={sections}
                                brandLogoSrc={brandLogoSrc}
                                brandPosition={brandPosition}
                                defaultCrestSrc={defaultCrestSrc}
                                pillColor={pillColor}
                                pillTextColor={pillTextColor}
                                nameColor={nameColor}
                                shapeColor={shapeColor}
                                separatorColor={separatorColor}
                                separatorSize={separatorSize}
                                fontFamily={fontFamily}
                                subFontFamily={subFontFamily}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default KeyPlayers;
