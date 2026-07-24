import React, { useState } from 'react';
import * as htmlToImage from 'html-to-image';
import LeagueHistoryPoster, { POSTER_WIDTH, POSTER_HEIGHT } from './LeagueHistoryPoster';
import { saveImage } from '../utils/saveImage';
import { usePosterScale } from '../utils/usePosterScale';
import './LeagueHistory.css';

// Logo di default in basso a destra (logo del sito, bianco)
const DEFAULT_BRAND_LOGO = '/logosito/Logo_CE_bianco.svg';

const MAX_ROWS = 12;

// Palette pronte: lo stile originale + principali club greci
const PRESETS = [
    {
        name: 'Blu (originale)',
        backgroundColor: '#0b56b8', tintColor: '#0b56b8', glowColor: '#e8a92b',
        titleBgColor: '#0a3f9e', titleBorderFrom: '#f7d774', titleBorderTo: '#b8801a',
        panelColor: '#1668d8', panelBorderColor: '#5fa4ee', railColor: '#1f7ae0'
    },
    {
        name: 'Olympiacos',
        backgroundColor: '#a80d24', tintColor: '#b00d24', glowColor: '#ff9d3d',
        titleBgColor: '#7d0819', titleBorderFrom: '#f7d774', titleBorderTo: '#b8801a',
        panelColor: '#d4213c', panelBorderColor: '#ff9aa8', railColor: '#ff4d68'
    },
    {
        name: 'Panathinaikos',
        backgroundColor: '#005633', tintColor: '#00693e', glowColor: '#a8e063',
        titleBgColor: '#024428', titleBorderFrom: '#f7d774', titleBorderTo: '#b8801a',
        panelColor: '#0a8551', panelBorderColor: '#7fe0ac', railColor: '#23c97f'
    },
    {
        name: 'AEK',
        backgroundColor: '#101010', tintColor: '#141414', glowColor: '#f6c700',
        titleBgColor: '#000000', titleBorderFrom: '#ffe680', titleBorderTo: '#c69200',
        panelColor: '#2e2e2e', panelBorderColor: '#f6c700', railColor: '#f6c700'
    },
    {
        name: 'PAOK',
        backgroundColor: '#0d0d0d', tintColor: '#101010', glowColor: '#7fa3d6',
        titleBgColor: '#000000', titleBorderFrom: '#ffffff', titleBorderTo: '#8b96a3',
        panelColor: '#2a2a2a', panelBorderColor: '#cfd6de', railColor: '#cfd6de'
    },
    {
        name: 'Grecia',
        backgroundColor: '#0a4f95', tintColor: '#0d5eaf', glowColor: '#8fc4ff',
        titleBgColor: '#073a70', titleBorderFrom: '#ffffff', titleBorderTo: '#9db8d6',
        panelColor: '#1470c9', panelBorderColor: '#9fcbf5', railColor: '#3d92e0'
    }
];

// Tipi di risultato: riempiono etichetta, colore e icona con un clic
const RESULT_TYPES = [
    { key: 'champion', name: 'Campione', label: 'CAMPIONE', color: '#e0a800', icon: 'trophy', highlight: true },
    { key: 'second', name: '2° posto', label: 'SECONDO POSTO', color: '#adb8c2', icon: 'medal', highlight: false },
    { key: 'third', name: '3° posto', label: 'TERZO POSTO', color: '#c07a3e', icon: 'medal', highlight: false },
    { key: 'ucl', name: 'Champions', label: 'CHAMPIONS LEAGUE', color: '#3f8ae0', icon: 'star', highlight: false },
    { key: 'qualified', name: 'Qualificato', label: 'QUALIFICATO', color: '#22c55e', icon: 'check', highlight: false },
    { key: 'notqualified', name: 'Non qualif.', label: 'NON QUALIFICATO', color: '#e02020', icon: 'cross', highlight: false },
    { key: 'relegated', name: 'Retrocesso', label: 'RETROCESSO', color: '#8b1a1a', icon: 'down', highlight: false },
    { key: 'promoted', name: 'Promosso', label: 'PROMOSSO', color: '#16a34a', icon: 'up', highlight: false }
];

const ICON_OPTIONS = [
    { label: 'Nessuna', value: 'none' },
    { label: 'Trofeo', value: 'trophy' },
    { label: 'Medaglia', value: 'medal' },
    { label: 'Spunta', value: 'check' },
    { label: 'Croce', value: 'cross' },
    { label: 'Stella', value: 'star' },
    { label: 'Freccia giù', value: 'down' },
    { label: 'Freccia su', value: 'up' }
];

const FONT_OPTIONS = [
    { label: 'Allotrope Bold', value: "'Allotrope-Bold', Impact, sans-serif" },
    { label: 'Benzin ExtraBold', value: "'Benzin-ExtraBold', 'Bebas Neue', Impact, sans-serif" },
    { label: 'Kuunari Black Condensed', value: "'Kuunari-Black-Condensed', Impact, sans-serif" },
    { label: 'Kenyan Coffee Bold', value: "'Kenyan Coffee Bold', Impact, sans-serif" },
    { label: 'BB Torsos Pro Ultra', value: "'BBTorsosPro-Ultra', Impact, sans-serif" },
    { label: 'Skate Sans', value: "'SkateSans-Regular', sans-serif" },
    { label: 'Poppins', value: "'Poppins', sans-serif" }
];

// Stagioni di esempio: valori SEGNAPOSTO, da sostituire con i dati reali
const DEFAULT_ROWS = [
    { year: '2019/20', type: 'champion' },
    { year: '2020/21', type: 'champion' },
    { year: '2021/22', type: 'champion' },
    { year: '2022/23', type: 'second' },
    { year: '2023/24', type: 'second' },
    { year: '2024/25', type: 'champion' },
    // la stagione in corso è evidenziata, come nella grafica di riferimento
    { year: '2025/26', type: 'qualified', highlight: true }
];

let rowIdCounter = 0;
const makeRow = (data = {}) => {
    const type = RESULT_TYPES.find(t => t.key === data.type) || RESULT_TYPES[0];
    return {
        id: `lh-${++rowIdCounter}`,
        year: data.year || '',
        label: type.label,
        color: type.color,
        icon: type.icon,
        highlight: data.highlight !== undefined ? data.highlight : type.highlight,
        logo: null,
        compLogo: null,
        badge: null
    };
};

const LeagueHistory = () => {
    const [title, setTitle] = useState('OLYMPIACOS SUPER LEAGUE');
    const [rows, setRows] = useState(() => DEFAULT_ROWS.map(makeRow));

    const [defaultBadgeSrc, setDefaultBadgeSrc] = useState(null);
    const [badgeCircle, setBadgeCircle] = useState(false);
    const [titleLogoSrc, setTitleLogoSrc] = useState(null);
    const [showTitleLogo, setShowTitleLogo] = useState(true);
    const [titleLogoSize, setTitleLogoSize] = useState(160);
    const [titleLogoX, setTitleLogoX] = useState(0);
    const [titleLogoY, setTitleLogoY] = useState(0);
    const [brandLogoSrc, setBrandLogoSrc] = useState(DEFAULT_BRAND_LOGO);

    const [playerSrc, setPlayerSrc] = useState(null);
    const [playerWidth, setPlayerWidth] = useState(46);
    const [playerHeight, setPlayerHeight] = useState(92);
    const [playerOffsetX, setPlayerOffsetX] = useState(0);
    const [playerZoom, setPlayerZoom] = useState(1);
    const [showPlayerAccents, setShowPlayerAccents] = useState(true);
    const [playerAccentColor, setPlayerAccentColor] = useState('#2fe36b');

    const [backgroundSrc, setBackgroundSrc] = useState(null);
    const [backgroundBlur, setBackgroundBlur] = useState(18);
    const [tintOpacity, setTintOpacity] = useState(0.55);
    const [glowOpacity, setGlowOpacity] = useState(0.45);
    const [panelOpacity, setPanelOpacity] = useState(0.42);

    const [palette, setPalette] = useState(PRESETS[1]);

    const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
    const [titleFontFamily, setTitleFontFamily] = useState(FONT_OPTIONS[0].value);

    // Scala del poster: riempie la larghezza disponibile senza mai superare
    // la dimensione di design (1 = desktop)
    const [previewAreaRef, posterScale] = usePosterScale(POSTER_WIDTH);

    const updatePalette = (patch) => setPalette(prev => ({ ...prev, ...patch }));

    const updateRow = (index, patch) => {
        setRows(prev => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    };

    const applyResultType = (index, key) => {
        const type = RESULT_TYPES.find(t => t.key === key);
        if (!type) return;
        updateRow(index, {
            label: type.label,
            color: type.color,
            icon: type.icon,
            highlight: type.highlight
        });
    };

    const setRowCount = (rawCount) => {
        const count = Math.max(1, Math.min(MAX_ROWS, parseInt(rawCount, 10) || 1));
        setRows(prev => {
            if (count === prev.length) return prev;
            const next = prev.slice(0, count);
            while (next.length < count) next.push(makeRow({ type: 'notqualified' }));
            return next;
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
        const container = document.getElementById('leagueHistoryExportContainer');
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
                // radice, sovrascrivendo quello del poster: va tenuto uguale
                // allo sfondo, altrimenti i bordi escono neri nell'export
                backgroundColor: palette.backgroundColor,
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

            const safeName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'storico';
            await saveImage(dataUrl, `campionati_${safeName}.jpg`);
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
            <h1 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500 tracking-wider`}>
                CAMPIONATI
            </h1>
            <button onClick={exportImage} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded font-bold shadow transition-all text-sm flex items-center">
                <i className="fa-solid fa-download mr-2" />
                Download
            </button>
        </>
    );

    return (
        <div
            className="flex flex-col md:flex-row overflow-y-auto overflow-x-hidden md:overflow-hidden text-gray-200 leaguehistory-wrapper"
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
            <aside className="w-full md:w-[450px] md:h-full bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl z-20 md:overflow-hidden shrink-0 leaguehistory-sidebar order-3 md:order-none">

                <div className="hidden md:flex p-5 border-b border-gray-800 bg-gray-950 justify-between items-center shrink-0">
                    {headerBar(false)}
                </div>

                <div className="flex-1 md:overflow-y-auto p-5 pb-20">

                    {/* Titolo */}
                    <div className="mb-6 bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-700">
                        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 border-b border-gray-700 pb-2">Titolo</h2>

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Es. OLYMPIACOS SUPER LEAGUE"
                                className="w-full"
                                value={title}
                                onChange={(e) => setTitle(e.target.value.toUpperCase())}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-300">Font titolo</label>
                                <select className="w-full" value={titleFontFamily} onChange={(e) => setTitleFontFamily(e.target.value)}>
                                    {FONT_OPTIONS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-300">Font anni / esiti</label>
                                <select className="w-full" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                                    {FONT_OPTIONS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Palette */}
                    <div className="mb-6 bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-700">
                        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 border-b border-gray-700 pb-2">Palette</h2>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {PRESETS.map(preset => (
                                <button key={preset.name} className="lh-preset-btn" onClick={() => setPalette(preset)}>
                                    <span className="lh-preset-swatch" style={{ background: preset.backgroundColor }} />
                                    <span className="lh-preset-swatch" style={{ background: preset.railColor }} />
                                    {preset.name}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center flex-wrap gap-3 border-t border-gray-700 pt-4">
                            {renderColor('Sfondo', palette.backgroundColor, v => updatePalette({ backgroundColor: v }))}
                            {renderColor('Tinta', palette.tintColor, v => updatePalette({ tintColor: v }))}
                            {renderColor('Bagliore', palette.glowColor, v => updatePalette({ glowColor: v }))}
                            {renderColor('Barra tit.', palette.titleBgColor, v => updatePalette({ titleBgColor: v }))}
                            {renderColor('Bordo 1', palette.titleBorderFrom, v => updatePalette({ titleBorderFrom: v }))}
                            {renderColor('Bordo 2', palette.titleBorderTo, v => updatePalette({ titleBorderTo: v }))}
                            {renderColor('Pannello', palette.panelColor, v => updatePalette({ panelColor: v }))}
                            {renderColor('Bordo pan.', palette.panelBorderColor, v => updatePalette({ panelBorderColor: v }))}
                            {renderColor('Riga', palette.railColor, v => updatePalette({ railColor: v }))}
                        </div>

                        <div className="space-y-2.5 border-t border-gray-700 pt-4 mt-4">
                            {renderSlider('Intensità tinta', tintOpacity, 0, 1, 0.01, setTintOpacity, v => `${Math.round(v * 100)}%`)}
                            {renderSlider('Intensità bagliore', glowOpacity, 0, 1, 0.01, setGlowOpacity, v => `${Math.round(v * 100)}%`)}
                            {renderSlider('Opacità pannello', panelOpacity, 0, 1, 0.01, setPanelOpacity, v => `${Math.round(v * 100)}%`)}
                        </div>
                    </div>

                    {/* Immagini */}
                    <div className="mb-6 bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-700">
                        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 border-b border-gray-700 pb-2">Immagini</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            {renderAssetUpload('Protagonista', 'fa-user', playerSrc, setPlayerSrc, 'lhPlayerUpload')}
                            {renderAssetUpload('Sfondo (sfocato)', 'fa-image', backgroundSrc, setBackgroundSrc, 'lhBgUpload')}
                            {renderAssetUpload('Logo/Stemma destra (tutte)', 'fa-shield-halved', defaultBadgeSrc, setDefaultBadgeSrc, 'lhBadgeUpload')}
                            {renderAssetUpload('Stemma targhetta', 'fa-certificate', titleLogoSrc, setTitleLogoSrc, 'lhTitleLogoUpload')}
                            {renderAssetUpload(
                                'Logo brand',
                                'fa-star',
                                brandLogoSrc,
                                setBrandLogoSrc,
                                'lhBrandUpload',
                                brandLogoSrc !== DEFAULT_BRAND_LOGO ? () => setBrandLogoSrc(DEFAULT_BRAND_LOGO) : null
                            )}
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                            <label className="text-xs font-bold text-gray-400 uppercase cursor-pointer flex items-center">
                                <input
                                    type="checkbox"
                                    checked={badgeCircle}
                                    onChange={() => setBadgeCircle(v => !v)}
                                    className="mr-2 accent-amber-500"
                                />
                                Cerchio bianco dietro il logo a destra
                            </label>
                        </div>

                        <div className="space-y-2.5 border-t border-gray-700 pt-4 mt-4">
                            {renderSlider('Sfocatura sfondo', backgroundBlur, 0, 40, 1, setBackgroundBlur, v => `${v} px`)}
                            {renderSlider('Larghezza protagonista', playerWidth, 25, 65, 1, setPlayerWidth, v => `${v}%`)}
                            {renderSlider('Altezza protagonista', playerHeight, 50, 100, 1, setPlayerHeight, v => `${v}%`)}
                            {renderSlider('Sposta ↔', playerOffsetX, -200, 200, 1, setPlayerOffsetX, v => `${v} px`)}
                            {renderSlider('Zoom', playerZoom, 0.6, 1.6, 0.01, setPlayerZoom, v => `${v.toFixed(2)}×`)}
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-700 pt-4 mt-4">
                            <label className="text-xs font-bold text-gray-400 uppercase cursor-pointer flex items-center">
                                <input
                                    type="checkbox"
                                    checked={showPlayerAccents}
                                    onChange={() => setShowPlayerAccents(v => !v)}
                                    className="mr-2 accent-amber-500"
                                />
                                Frecce decorative
                            </label>
                            {renderColor('Colore', playerAccentColor, setPlayerAccentColor)}
                        </div>

                        <div className="border-t border-gray-700 pt-4 mt-4">
                            <label className="text-xs font-bold text-gray-400 uppercase cursor-pointer flex items-center">
                                <input
                                    type="checkbox"
                                    checked={showTitleLogo}
                                    onChange={() => setShowTitleLogo(v => !v)}
                                    className="mr-2 accent-amber-500"
                                />
                                Stemma sopra la targhetta
                            </label>
                            <p className="text-[10px] text-gray-500 mt-1.5 mb-3">
                                Se non carichi lo "stemma targhetta" viene usato lo stemma del club.
                            </p>
                            {showTitleLogo && (
                                <div className="space-y-2.5 mt-2">
                                    {renderSlider('Dimensione stemma', titleLogoSize, 100, 260, 1, setTitleLogoSize, v => `${v} px`)}
                                    {renderSlider('Posizione stemma ↔', titleLogoX, -120, 160, 1, setTitleLogoX, v => `${v} px`)}
                                    {renderSlider('Posizione stemma ↕', titleLogoY, -120, 120, 1, setTitleLogoY, v => `${v} px`)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="mb-6 bg-gray-800 p-4 rounded-xl shadow-inner border border-gray-700">
                        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4 border-b border-gray-700 pb-2 flex justify-between items-center">
                            <span>Stagioni</span>
                            <input
                                type="number"
                                min="1"
                                max={MAX_ROWS}
                                className="w-16 text-center"
                                value={rows.length}
                                onChange={(e) => setRowCount(e.target.value)}
                            />
                        </h2>

                        <div className="space-y-3">
                            {rows.map((row, index) => {
                                const activeType = RESULT_TYPES.find(
                                    t => t.label === row.label && t.color === row.color
                                );
                                return (
                                    <div key={row.id} className="lh-row-card">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-900 px-2 py-1 rounded w-8 text-center shrink-0 border border-gray-700">{index + 1}</span>
                                            <input
                                                type="text"
                                                className="flex-1 min-w-0 font-bold"
                                                placeholder="2024/25"
                                                value={row.year}
                                                onChange={(e) => updateRow(index, { year: e.target.value.toUpperCase() })}
                                            />
                                            <input
                                                type="text"
                                                className="flex-1 min-w-0"
                                                placeholder="CAMPIONE"
                                                value={row.label}
                                                onChange={(e) => updateRow(index, { label: e.target.value.toUpperCase() })}
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {RESULT_TYPES.map(t => (
                                                <button
                                                    key={t.key}
                                                    className={`lh-chip ${activeType && activeType.key === t.key ? 'active' : ''}`}
                                                    onClick={() => applyResultType(index, t.key)}
                                                >
                                                    {t.name}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center space-x-2">
                                                <label htmlFor={`lhRowLogo_${index}`} className="file-upload-label">
                                                    <i className="fa-solid fa-trophy mr-1.5" />
                                                    {row.logo ? 'Logo sx ✓' : 'Logo sx'}
                                                </label>
                                                <input
                                                    type="file"
                                                    id={`lhRowLogo_${index}`}
                                                    accept="image/*"
                                                    onChange={handleImageUpload((src) => updateRow(index, { logo: src }))}
                                                />
                                                {row.logo && (
                                                    <button
                                                        onClick={() => updateRow(index, { logo: null })}
                                                        className="text-red-400 hover:text-red-300 text-xs border border-red-900/50 bg-red-900/20 px-2 py-1 rounded"
                                                    >
                                                        <i className="fa-solid fa-trash" />
                                                    </button>
                                                )}

                                                <label htmlFor={`lhRowComp_${index}`} className="file-upload-label">
                                                    <i className="fa-solid fa-medal mr-1.5" />
                                                    {row.compLogo ? 'Logo dx ✓' : 'Logo dx'}
                                                </label>
                                                <input
                                                    type="file"
                                                    id={`lhRowComp_${index}`}
                                                    accept="image/*"
                                                    onChange={handleImageUpload((src) => updateRow(index, { compLogo: src }))}
                                                />
                                                {row.compLogo && (
                                                    <button
                                                        onClick={() => updateRow(index, { compLogo: null })}
                                                        className="text-red-400 hover:text-red-300 text-xs border border-red-900/50 bg-red-900/20 px-2 py-1 rounded"
                                                    >
                                                        <i className="fa-solid fa-trash" />
                                                    </button>
                                                )}

                                                <select
                                                    className="text-xs"
                                                    value={row.icon}
                                                    onChange={(e) => updateRow(index, { icon: e.target.value })}
                                                >
                                                    {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                </select>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase cursor-pointer flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={row.highlight}
                                                        onChange={() => updateRow(index, { highlight: !row.highlight })}
                                                        className="mr-1.5 accent-amber-500"
                                                    />
                                                    Evidenzia
                                                </label>
                                                {renderColor('Colore', row.color, (v) => updateRow(index, { color: v }))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Area Principale (Preview) */}
            <main className="md:flex-1 bg-[#050505] md:h-full md:overflow-y-auto leaguehistory-main order-2 md:order-none shrink-0 md:shrink">
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
                            <LeagueHistoryPoster
                                title={title}
                                rows={rows}
                                defaultBadgeSrc={defaultBadgeSrc}
                                titleLogoSrc={titleLogoSrc}
                                showTitleLogo={showTitleLogo}
                                titleLogoSize={titleLogoSize}
                                titleLogoX={titleLogoX}
                                titleLogoY={titleLogoY}
                                badgeCircle={badgeCircle}
                                playerSrc={playerSrc}
                                playerWidth={playerWidth}
                                playerHeight={playerHeight}
                                playerOffsetX={playerOffsetX}
                                playerZoom={playerZoom}
                                showPlayerAccents={showPlayerAccents}
                                playerAccentColor={playerAccentColor}
                                backgroundSrc={backgroundSrc}
                                backgroundBlur={backgroundBlur}
                                tintOpacity={tintOpacity}
                                glowOpacity={glowOpacity}
                                panelOpacity={panelOpacity}
                                brandLogoSrc={brandLogoSrc}
                                fontFamily={fontFamily}
                                titleFontFamily={titleFontFamily}
                                {...palette}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LeagueHistory;
