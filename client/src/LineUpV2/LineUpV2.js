import React, { useState, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import LineUpV2Poster, { POSTER_W, POSTER_H, CREST_STYLES } from './LineUpV2Poster';
import PhotoCropper from './PhotoCropper';
import { FORMATIONS, roleLabels } from './formations';
import { extractLogoColors } from '../StartingXI/kitPresets';
import { findTeamLogo } from '../utils/LogoConstants';
import { saveImage } from '../utils/saveImage';
import { usePosterScale } from '../utils/usePosterScale';
import './LineUpV2.css';

const DEFAULT_BRAND = '/loghi/Logo CE bianco.png';

const emptyPlayer = () => ({
    name: '',
    sub: '',
    isNew: false,
    subIsNew: false,
    photo: null,
    // Ritaglio della foto in frazioni 0..1 (x/y angolo, w/h dimensione).
    // w/h = 0 significa "non ancora impostato": il cropper lo calcola al caricamento.
    cropX: 0,
    cropY: 0,
    cropW: 0,
    cropH: 0,
    photoNatW: 0, // dimensioni naturali della foto, servono al poster per non deformarla
    photoNatH: 0,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
});

const emptyPlayers = () => Array.from({ length: 11 }, emptyPlayer);

const readFile = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
});

const LineUpV2 = () => {
    // --- Testata e colori ---
    const [competition, setCompetition] = useState('SUPER LEAGUE');
    const [teamName, setTeamName] = useState('PANATHINAIKOS');
    const [teamLogo, setTeamLogo] = useState(() => findTeamLogo('panathinaikos'));
    const [brandLogo, setBrandLogo] = useState(DEFAULT_BRAND);
    const [baseColor, setBaseColor] = useState('#17784a');
    const [newColor, setNewColor] = useState('#FFC61A');
    const [watermark, setWatermark] = useState(0.85);
    const [crestStyle, setCrestStyle] = useState('template');

    // --- Campo ---
    const [formation, setFormation] = useState('4-3-3');
    const [spread, setSpread] = useState(1);
    const [playerScale, setPlayerScale] = useState(1);

    // --- Giocatori ---
    const [players, setPlayers] = useState(emptyPlayers);
    const [openPlayer, setOpenPlayer] = useState(0);

    const [openPanel, setOpenPanel] = useState('head');
    const [exporting, setExporting] = useState(false);
    const [note, setNote] = useState('');

    // maxScale < 1: l'anteprima resta identica in proporzioni ma viene
    // mostrata più piccola nella pagina
    const [previewAreaRef, posterScale] = usePosterScale(POSTER_W, { maxScale: 0.6 });
    const logoInputRef = useRef(null);

    const labels = roleLabels(formation);

    // -------------------------------------------------------------------------
    // Squadra
    // -------------------------------------------------------------------------

    /** Cerca lo stemma tra quelli inclusi nell'app partendo dal nome squadra. */
    const lookupLogo = () => {
        const found = findTeamLogo(teamName.toLowerCase());
        if (found) {
            setTeamLogo(found);
            setNote('Stemma trovato tra quelli dell\'app.');
        } else {
            setNote('Nessuno stemma corrispondente: caricalo a mano.');
        }
    };

    /**
     * Colore squadra ricavato dallo stemma: è la tinta dominante del logo, la
     * stessa logica usata dalla grafica Starting XI per le maglie.
     */
    const colorFromLogo = async () => {
        if (!teamLogo) return setNote('Serve prima uno stemma.');
        const colors = await extractLogoColors(teamLogo);
        if (colors) {
            setBaseColor(colors.primary);
            setNote('Colore di sfondo preso dallo stemma.');
        } else {
            setNote('Impossibile leggere i colori di questo stemma.');
        }
    };

    const handleTeamLogoUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) setTeamLogo(await readFile(file));
    };

    const handleBrandLogoUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) setBrandLogo(await readFile(file));
    };

    // -------------------------------------------------------------------------
    // Giocatori
    // -------------------------------------------------------------------------

    const updatePlayer = (index, patch) => {
        setPlayers(prev => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
    };

    const handlePhotoUpload = (index) => async (e) => {
        const file = e.target.files && e.target.files[0];
        // Azzera il ritaglio: il cropper lo re-imposta sulla nuova foto.
        if (file) updatePlayer(index, {
            photo: await readFile(file),
            cropX: 0, cropY: 0, cropW: 0, cropH: 0, photoNatW: 0, photoNatH: 0,
        });
    };

    const resetFraming = (index) => {
        updatePlayer(index, { cropX: 0, cropY: 0, cropW: 1, cropH: 1, offsetX: 0, offsetY: 0, scale: 1 });
    };

    // -------------------------------------------------------------------------
    // Export
    // -------------------------------------------------------------------------

    const exportImage = async () => {
        const node = document.getElementById('lineupV2Export');
        if (!node) return;

        setExporting(true);
        try {
            await document.fonts.ready;
            const options = {
                quality: 1.0,
                pixelRatio: 1,
                width: POSTER_W,
                height: POSTER_H,
                backgroundColor: '#021a10',
                cacheBust: true,
                // Obbligatorio: senza, la cache di html-to-image tronca la query
                // string e i loghi serviti dal proxy finirebbero tutti sulla
                // stessa chiave (stemma sbagliato nell'immagine esportata).
                includeQueryParams: true,
            };
            // html-to-image salta spesso immagini e font alla prima passata:
            // si scaldano un paio di render e si tiene l'ultimo.
            await htmlToImage.toJpeg(node, options);
            await htmlToImage.toJpeg(node, options);
            const dataUrl = await htmlToImage.toJpeg(node, options);

            const safe = teamName.replace(/[^a-z0-9]+/gi, '_').toLowerCase() || 'formazione';
            await saveImage(dataUrl, `lineup_v2_${safe}.jpg`);
        } catch (err) {
            console.error('Errore esportazione Lineup v2', err);
            setNote('Errore durante l\'esportazione: riprova.');
        } finally {
            setExporting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    const panel = (id, label, body) => (
        <div className="lu2-panel">
            <button
                type="button"
                className={`lu2-panel-head ${openPanel === id ? 'open' : ''}`}
                onClick={() => setOpenPanel(openPanel === id ? null : id)}
            >
                <span>{label}</span>
                <span className="lu2-caret">{openPanel === id ? '−' : '+'}</span>
            </button>
            {openPanel === id && <div className="lu2-panel-body">{body}</div>}
        </div>
    );

    return (
        <div className="lu2-wrapper">
            <div className="lu2-topbar">
                <h1>LINEUP V2</h1>
                <button onClick={exportImage} disabled={exporting} className="lu2-download">
                    <i className="fa-solid fa-download" /> {exporting ? 'Genero…' : 'Download'}
                </button>
            </div>

            <aside className="lu2-sidebar">
                {note && <div className="lu2-alert">{note}</div>}

                {/* --- Testata --- */}
                {panel('head', 'Testata e colori', (
                    <>
                        <label className="lu2-label">Competizione</label>
                        <input
                            className="lu2-input"
                            value={competition}
                            onChange={e => setCompetition(e.target.value.toUpperCase())}
                            placeholder="SUPER LEAGUE"
                        />

                        <label className="lu2-label">Nome squadra</label>
                        <div className="lu2-row">
                            <input
                                className="lu2-input"
                                value={teamName}
                                onChange={e => setTeamName(e.target.value.toUpperCase())}
                            />
                            <button type="button" className="lu2-mini" onClick={lookupLogo}>Trova stemma</button>
                        </div>

                        <label className="lu2-label">Stemma squadra</label>
                        <div className="lu2-row">
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleTeamLogoUpload}
                                className="lu2-file"
                            />
                            <button type="button" className="lu2-mini" onClick={() => setTeamLogo(null)}>Rimuovi</button>
                        </div>

                        <div className="lu2-grid2">
                            <div>
                                <label className="lu2-label">Colore squadra</label>
                                <input
                                    type="color"
                                    className="lu2-color"
                                    value={baseColor}
                                    onChange={e => setBaseColor(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="lu2-label">Colore bollino NEW</label>
                                <input
                                    type="color"
                                    className="lu2-color"
                                    value={newColor}
                                    onChange={e => setNewColor(e.target.value)}
                                />
                            </div>
                        </div>
                        <button type="button" className="lu2-mini wide" onClick={colorFromLogo}>
                            Colore dallo stemma
                        </button>

                        <label className="lu2-label">Stemma nelle targhette</label>
                        <div className="lu2-chips">
                            {CREST_STYLES.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={`lu2-chip ${crestStyle === c.id ? 'active' : ''}`}
                                    onClick={() => setCrestStyle(c.id)}
                                >{c.label}</button>
                            ))}
                        </div>

                        <label className="lu2-label">Stemmi di sfondo — opacità {Math.round(watermark * 100)}%</label>
                        <input
                            type="range" min="0" max="1" step="0.05"
                            className="lu2-range"
                            value={watermark}
                            onChange={e => setWatermark(parseFloat(e.target.value))}
                        />

                        <label className="lu2-label">Logo testata</label>
                        <div className="lu2-row">
                            <input type="file" accept="image/*" onChange={handleBrandLogoUpload} className="lu2-file" />
                            <button type="button" className="lu2-mini" onClick={() => setBrandLogo(DEFAULT_BRAND)}>Default</button>
                            <button type="button" className="lu2-mini" onClick={() => setBrandLogo(null)}>Nessuno</button>
                        </div>
                    </>
                ))}

                {/* --- Campo --- */}
                {panel('field', 'Modulo e disposizione', (
                    <>
                        <label className="lu2-label">Modulo</label>
                        <div className="lu2-chips">
                            {FORMATIONS.map(f => (
                                <button
                                    key={f}
                                    type="button"
                                    className={`lu2-chip ${formation === f ? 'active' : ''}`}
                                    onClick={() => setFormation(f)}
                                >{f}</button>
                            ))}
                        </div>

                        <label className="lu2-label">Distanza tra i reparti — {Math.round(spread * 100)}%</label>
                        <input
                            type="range" min="0.7" max="1.15" step="0.01"
                            className="lu2-range"
                            value={spread}
                            onChange={e => setSpread(parseFloat(e.target.value))}
                        />

                        <label className="lu2-label">Dimensione giocatori — {Math.round(playerScale * 100)}%</label>
                        <input
                            type="range" min="0.6" max="1.2" step="0.01"
                            className="lu2-range"
                            value={playerScale}
                            onChange={e => setPlayerScale(parseFloat(e.target.value))}
                        />

                        <p className="lu2-hint">
                            Ogni giocatore può poi essere spostato e ridimensionato da solo nel
                            pannello qui sotto.
                        </p>
                    </>
                ))}

                {/* --- Giocatori --- */}
                {panel('players', 'Giocatori', (
                    <>
                        <p className="lu2-hint">
                            Dentro ogni reparto l'ordine è quello del campo, da sinistra a destra.
                            "Alternativa" è il nome piccolo sotto la targhetta.
                        </p>
                        {players.map((p, i) => (
                            <div key={i} className={`lu2-player ${openPlayer === i ? 'open' : ''}`}>
                                <button
                                    type="button"
                                    className="lu2-player-head"
                                    onClick={() => setOpenPlayer(openPlayer === i ? -1 : i)}
                                >
                                    <span className="lu2-role">{labels[i] || `GIOCATORE ${i + 1}`}</span>
                                    <span className="lu2-player-name">{p.name || '—'}</span>
                                    <span className="lu2-caret">{openPlayer === i ? '−' : '+'}</span>
                                </button>

                                {openPlayer === i && (
                                    <div className="lu2-player-body">
                                        <label className="lu2-label">Titolare</label>
                                        <div className="lu2-row">
                                            <input
                                                className="lu2-input"
                                                value={p.name}
                                                placeholder="COGNOME"
                                                onChange={e => updatePlayer(i, { name: e.target.value.toUpperCase() })}
                                            />
                                            <label className="lu2-check">
                                                <input
                                                    type="checkbox"
                                                    checked={p.isNew}
                                                    onChange={e => updatePlayer(i, { isNew: e.target.checked })}
                                                />
                                                <span>NEW</span>
                                            </label>
                                        </div>

                                        <label className="lu2-label">Alternativa</label>
                                        <div className="lu2-row">
                                            <input
                                                className="lu2-input"
                                                value={p.sub}
                                                placeholder="COGNOME"
                                                onChange={e => updatePlayer(i, { sub: e.target.value.toUpperCase() })}
                                            />
                                            <label className="lu2-check">
                                                <input
                                                    type="checkbox"
                                                    checked={p.subIsNew}
                                                    onChange={e => updatePlayer(i, { subIsNew: e.target.checked })}
                                                />
                                                <span>NEW</span>
                                            </label>
                                        </div>

                                        <label className="lu2-label">Foto (meglio se ritagliata su fondo trasparente)</label>
                                        <div className="lu2-row">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="lu2-file"
                                                onChange={handlePhotoUpload(i)}
                                            />
                                            <button type="button" className="lu2-mini" onClick={() => updatePlayer(i, { photo: null })}>
                                                Rimuovi
                                            </button>
                                        </div>

                                        {p.photo && (
                                            <PhotoCropper
                                                src={p.photo}
                                                crop={{ x: p.cropX, y: p.cropY, w: p.cropW, h: p.cropH }}
                                                onChange={patch => updatePlayer(i, patch)}
                                            />
                                        )}

                                        <div className="lu2-grid2">
                                            <div>
                                                <label className="lu2-label">Sposta ↔ ({p.offsetX}px)</label>
                                                <input
                                                    type="range" min="-260" max="260" step="2" className="lu2-range"
                                                    value={p.offsetX}
                                                    onChange={e => updatePlayer(i, { offsetX: parseInt(e.target.value, 10) })}
                                                />
                                            </div>
                                            <div>
                                                <label className="lu2-label">Sposta ↕ ({p.offsetY}px)</label>
                                                <input
                                                    type="range" min="-260" max="260" step="2" className="lu2-range"
                                                    value={p.offsetY}
                                                    onChange={e => updatePlayer(i, { offsetY: parseInt(e.target.value, 10) })}
                                                />
                                            </div>
                                        </div>

                                        <label className="lu2-label">Dimensione — {Math.round((p.scale || 1) * 100)}%</label>
                                        <input
                                            type="range" min="0.6" max="1.4" step="0.01" className="lu2-range"
                                            value={p.scale}
                                            onChange={e => updatePlayer(i, { scale: parseFloat(e.target.value) })}
                                        />

                                        <button type="button" className="lu2-mini wide" onClick={() => resetFraming(i)}>
                                            Reimposta posizione e inquadratura
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        <button type="button" className="lu2-mini wide" onClick={() => setPlayers(emptyPlayers())}>
                            Svuota tutti i giocatori
                        </button>
                    </>
                ))}
            </aside>

            {/* Anteprima */}
            <main className="lu2-preview" ref={previewAreaRef}>
                <div
                    className="lu2-stage"
                    style={{ width: POSTER_W * posterScale, height: POSTER_H * posterScale }}
                >
                    <div style={{ transform: `scale(${posterScale})`, transformOrigin: 'top left' }}>
                        <LineUpV2Poster
                            competition={competition}
                            teamName={teamName}
                            teamLogo={teamLogo}
                            brandLogo={brandLogo}
                            baseColor={baseColor}
                            newColor={newColor}
                            crestStyle={crestStyle}
                            formation={formation}
                            players={players}
                            spread={spread}
                            playerScale={playerScale}
                            watermark={watermark}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LineUpV2;
