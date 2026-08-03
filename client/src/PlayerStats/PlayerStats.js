import React, { useState, useRef, useLayoutEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import PlayerStatsPoster from './PlayerStatsPoster';
import { saveImage } from '../utils/saveImage';
import '../fonts.css';
import './PlayerStats.css';

const POSTER_WIDTH = 1440;
const POSTER_HEIGHT = 1800;

const DEFAULT_BRAND_LOGO = '/logosito/Logo_CE_bianco.svg';

const PlayerStats = () => {
    const [photo, setPhoto] = useState(null);
    const [photoPosX, setPhotoPosX] = useState(50);
    const [photoPosY, setPhotoPosY] = useState(18);
    const [photoZoom, setPhotoZoom] = useState(1);

    const [brandLogoSrc, setBrandLogoSrc] = useState(DEFAULT_BRAND_LOGO);

    const [name, setName] = useState('CHRISTOS TZOLIS');
    const [stats, setStats] = useState([
        { value: '35', label: 'PARTITE' },
        { value: '16', label: 'GOL' },
        { value: '22', label: 'ASSIST' }
    ]);

    const [numberColor, setNumberColor] = useState('#090695');
    const [boxColor, setBoxColor] = useState('#ffffff');
    const [fadeStrength, setFadeStrength] = useState(0.9);
    const [exporting, setExporting] = useState(false);

    // Scala il poster (1440x1800) perché entri interamente nell'area di
    // anteprima, adattandosi sia in larghezza che in altezza.
    const previewAreaRef = useRef(null);
    const [posterScale, setPosterScale] = useState(0.3);

    useLayoutEffect(() => {
        const el = previewAreaRef.current;
        if (!el) return;
        const compute = () => {
            const styles = window.getComputedStyle(el);
            const w = el.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
            const h = el.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
            if (!(w > 0) || !(h > 0)) return;
            const s = Math.min(w / POSTER_WIDTH, h / POSTER_HEIGHT);
            setPosterScale(Math.min(1, Math.max(0.05, s)));
        };
        compute();
        const ro = new ResizeObserver(compute);
        ro.observe(el);
        window.addEventListener('resize', compute);
        window.addEventListener('orientationchange', compute);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', compute);
            window.removeEventListener('orientationchange', compute);
        };
    }, []);

    const handleImageUpload = (onLoaded) => (e) => {
        const input = e.target;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (evt) => onLoaded(evt.target.result);
            reader.readAsDataURL(input.files[0]);
            input.value = '';
        }
    };

    const updateStat = (i, patch) => {
        setStats(prev => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
    };

    const exportImage = async () => {
        const container = document.getElementById('playerStatsExportContainer');
        if (!container) return;
        setExporting(true);
        try {
            await document.fonts.ready;
            const options = {
                quality: 1.0,
                pixelRatio: 1, // export esatto alla risoluzione di design: 1440x1800
                width: container.offsetWidth,
                height: container.offsetHeight,
                backgroundColor: '#0a0a0a',
                cacheBust: true,
                style: { margin: '0', borderRadius: '0' }
            };
            // html-to-image spesso "salta" immagini/font alla prima passata:
            // passate di riscaldamento, teniamo l'ultima
            await htmlToImage.toJpeg(container, options);
            await htmlToImage.toJpeg(container, options);
            const dataUrl = await htmlToImage.toJpeg(container, options);

            const safeName = (name || 'player-stats').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            await saveImage(dataUrl, `player_stats_${safeName}.jpg`);
        } catch (err) {
            console.error('Errore esportazione con html-to-image', err);
            alert('Errore durante l\'esportazione dell\'immagine.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="psedit-wrapper">
            {/* Sidebar controlli */}
            <aside className="psedit-sidebar">
                <div className="psedit-header">
                    <span className="psedit-title">PLAYER STATS CREATOR</span>
                    <button className="psedit-download" onClick={exportImage} disabled={exporting}>
                        {exporting ? '...' : '⬇ Download'}
                    </button>
                </div>

                <div className="psedit-scroll">
                    {/* Foto */}
                    <div className="psedit-section">
                        <h2>Foto giocatore</h2>
                        <div className="psedit-field">
                            <div className="psedit-upload-row">
                                <label htmlFor="psPhotoUpload" className="file-upload-label">
                                    🖼 {photo ? 'Cambia foto' : 'Carica foto'}
                                </label>
                                <input type="file" id="psPhotoUpload" accept="image/*" onChange={handleImageUpload(setPhoto)} />
                                {photo && (
                                    <>
                                        <img src={photo} alt="" className="psedit-thumb" />
                                        <button className="psedit-btn-mini" onClick={() => setPhoto(null)}>Rimuovi</button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="psedit-field">
                            <label className="psedit-label">Posizione orizzontale: {photoPosX}%</label>
                            <input className="psedit-slider" type="range" min="0" max="100" value={photoPosX}
                                onChange={(e) => setPhotoPosX(Number(e.target.value))} />
                        </div>
                        <div className="psedit-field">
                            <label className="psedit-label">Posizione verticale: {photoPosY}%</label>
                            <input className="psedit-slider" type="range" min="0" max="100" value={photoPosY}
                                onChange={(e) => setPhotoPosY(Number(e.target.value))} />
                        </div>
                        <div className="psedit-field">
                            <label className="psedit-label">Zoom: {photoZoom.toFixed(2)}×</label>
                            <input className="psedit-slider" type="range" min="1" max="2.5" step="0.01" value={photoZoom}
                                onChange={(e) => setPhotoZoom(Number(e.target.value))} />
                        </div>
                    </div>

                    {/* Nome */}
                    <div className="psedit-section">
                        <h2>Nome</h2>
                        <div className="psedit-field">
                            <input
                                className="psedit-input"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value.toUpperCase())}
                                placeholder="NOME GIOCATORE"
                            />
                        </div>
                    </div>

                    {/* Statistiche */}
                    <div className="psedit-section">
                        <h2>Statistiche</h2>
                        {stats.map((s, i) => (
                            <div className="psedit-field" key={i}>
                                <label className="psedit-label">Riquadro {i + 1}</label>
                                <div className="psedit-row">
                                    <input
                                        className="psedit-input"
                                        type="text"
                                        value={s.value}
                                        onChange={(e) => updateStat(i, { value: e.target.value })}
                                        placeholder="Valore"
                                    />
                                    <input
                                        className="psedit-input"
                                        type="text"
                                        value={s.label}
                                        onChange={(e) => updateStat(i, { label: e.target.value.toUpperCase() })}
                                        placeholder="Etichetta"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Stile */}
                    <div className="psedit-section">
                        <h2>Stile</h2>
                        <div className="psedit-field">
                            <label className="psedit-label">Logo (in alto a destra)</label>
                            <div className="psedit-upload-row">
                                <label htmlFor="psLogoUpload" className="file-upload-label">
                                    🖼 {brandLogoSrc ? 'Cambia' : 'Carica'}
                                </label>
                                <input type="file" id="psLogoUpload" accept="image/*" onChange={handleImageUpload(setBrandLogoSrc)} />
                                {brandLogoSrc && <img src={brandLogoSrc} alt="" className="psedit-thumb" />}
                                {brandLogoSrc !== DEFAULT_BRAND_LOGO ? (
                                    <button className="psedit-btn-mini" onClick={() => setBrandLogoSrc(DEFAULT_BRAND_LOGO)}>Default</button>
                                ) : (
                                    <button className="psedit-btn-mini" onClick={() => setBrandLogoSrc(null)}>Rimuovi</button>
                                )}
                            </div>
                        </div>
                        <div className="psedit-field">
                            <label className="psedit-label">Colori</label>
                            <div className="psedit-colors">
                                <div className="psedit-color">
                                    <input type="color" value={numberColor} onChange={(e) => setNumberColor(e.target.value)} />
                                    <span>Numeri</span>
                                </div>
                                <div className="psedit-color">
                                    <input type="color" value={boxColor} onChange={(e) => setBoxColor(e.target.value)} />
                                    <span>Riquadri</span>
                                </div>
                            </div>
                        </div>
                        <div className="psedit-field">
                            <label className="psedit-label">Intensità sfumatura: {Math.round(fadeStrength * 100)}%</label>
                            <input className="psedit-slider" type="range" min="0" max="1" step="0.05" value={fadeStrength}
                                onChange={(e) => setFadeStrength(Number(e.target.value))} />
                        </div>
                    </div>
                </div>
            </aside>

            {/* Anteprima */}
            <main className="psedit-main">
                <div ref={previewAreaRef} className="psedit-preview">
                    <div style={{ width: POSTER_WIDTH * posterScale, height: POSTER_HEIGHT * posterScale }}>
                        <div style={{ width: POSTER_WIDTH, height: POSTER_HEIGHT, transform: `scale(${posterScale})`, transformOrigin: 'top left' }}>
                            <PlayerStatsPoster
                                photo={photo}
                                photoPosX={photoPosX}
                                photoPosY={photoPosY}
                                photoZoom={photoZoom}
                                brandLogoSrc={brandLogoSrc}
                                name={name}
                                stats={stats}
                                numberColor={numberColor}
                                boxColor={boxColor}
                                fadeStrength={fadeStrength}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PlayerStats;
