import React, { useState, useRef, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import StartingXIPoster, { FORMATS, MODES, getLayout, parseFormationLines, normalizeOutfieldOrder } from './StartingXIPoster';
import { KIT_PATTERNS, DEFAULT_KIT, DEFAULT_GK_KIT, resolveKit, pickGkKit, accentFromKit } from './kitPresets';
import { saveImage } from '../utils/saveImage';
import { usePosterScale } from '../utils/usePosterScale';
import { findTeamLogo } from '../utils/LogoConstants';
import config from '../config';
import './StartingXI.css';

// Competizioni da cui la modalità automatica può pescare una partita.
// Gli slug sono quelli del registry lato server (COMPETITION_URLS).
const COMPETITIONS = [
    { label: 'Champions League', country: 'europa', league: 'champions-league' },
    { label: 'Europa League', country: 'europa', league: 'europa-league' },
    { label: 'Conference League', country: 'europa', league: 'conference-league' },
    { label: 'Super League (Grecia)', country: 'grecia', league: 'super-league' },
    { label: 'Nazionale Greca (tutti i tornei)', country: 'grecia', league: 'national-team' },
];

const FORMATIONS = [
    '4-3-3', '4-4-2', '4-2-3-1', '4-3-1-2', '4-3-2-1', '4-1-4-1', '4-5-1', '4-2-4',
    '3-5-2', '3-4-3', '3-4-2-1', '3-4-1-2', '3-5-1-1', '3-1-4-2',
    '5-3-2', '5-4-1', '5-2-3',
];

const emptyPlayers = () => Array.from({ length: 11 }, () => ({ num: '', name: '' }));

const makeTeam = (name) => ({
    name,
    logo: null,
    formation: '4-3-3',
    players: emptyPlayers(),
    bench: [],
    kit: { ...DEFAULT_KIT },
    gkKit: { ...DEFAULT_GK_KIT },
});

/** Toglie il suffisso nazione delle coppe europee: "Olympiakos (GRE)" → "OLYMPIAKOS". */
const cleanTeamName = (name) => (name || '').replace(/\s*\([A-Za-z]{2,3}\)\s*$/, '').trim().toUpperCase();

/**
 * Logo utilizzabile nel canvas: prima quello locale (istantaneo e senza CORS),
 * altrimenti quello Flashscore servito dal proxy, che aggiunge gli header CORS
 * necessari sia all'export sia all'estrazione dei colori dal logo.
 */
const resolveLogo = (teamName, flashscoreLogo) => {
    const local = findTeamLogo(cleanTeamName(teamName).toLowerCase());
    if (local) return local;
    if (flashscoreLogo) {
        return `${config.API_BASE_URL}/proxy-image?url=${encodeURIComponent(flashscoreLogo)}`;
    }
    return null;
};

const StartingXI = () => {
    // --- Impostazioni grafica ---
    const [format, setFormat] = useState('1440x1800');
    const [mode, setMode] = useState('double');
    const [focus, setFocus] = useState('home');
    const [title, setTitle] = useState('Starting XI');
    const [accent, setAccent] = useState('#c8303f');
    // Con la grafica a una squadra lo sfondo prende da solo il colore di quella
    // squadra; scegliendo un colore a mano l'automatismo si disattiva.
    const [accentAuto, setAccentAuto] = useState(true);
    const [brandLogo, setBrandLogo] = useState('/loghi/Logo CE bianco.png');

    // --- Squadre ---
    const [home, setHome] = useState(() => makeTeam('SQUADRA CASA'));
    const [away, setAway] = useState(() => makeTeam('SQUADRA OSPITE'));

    // --- Modalità automatica ---
    const [selectedComp, setSelectedComp] = useState(0);
    const [matches, setMatches] = useState([]);
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [importing, setImporting] = useState(false);
    const [autoError, setAutoError] = useState('');
    const [autoNote, setAutoNote] = useState('');

    const [exporting, setExporting] = useState(false);
    const [openPanel, setOpenPanel] = useState('auto');

    const layout = getLayout(format, mode);
    const [previewAreaRef, posterScale] = usePosterScale(layout.width);

    const focusedTeam = focus === 'home' ? home : away;
    // Con due squadre in campo non esiste "il colore della squadra": resta
    // l'accento scelto a mano (o il rosso del template).
    const effectiveAccent = (accentAuto && mode === 'single')
        ? accentFromKit(focusedTeam.kit)
        : accent;

    const importRequestRef = useRef({ controller: null });

    const setTeam = (side) => (side === 'home' ? setHome : setAway);

    // -------------------------------------------------------------------------
    // Modalità automatica
    // -------------------------------------------------------------------------

    const searchMatches = async () => {
        const comp = COMPETITIONS[selectedComp];
        setLoadingMatches(true);
        setAutoError('');
        setAutoNote('');
        setMatches([]);
        setSelectedMatchId(null);

        try {
            const res = await fetch(
                `${config.API_BASE_URL}/api/get-lineup-matches?country=${comp.country}&league=${comp.league}`
            );
            const data = await res.json();
            if (data.status && data.matches && data.matches.length) {
                setMatches(data.matches);
            } else {
                setAutoError(data.message || 'Nessuna partita trovata in questo periodo.');
            }
        } catch (err) {
            setAutoError('Impossibile contattare il server. Riprova tra qualche secondo.');
        } finally {
            setLoadingMatches(false);
        }
    };

    /**
     * Riempie una squadra della grafica con i dati ufficiali di Flashscore:
     * nome, logo, modulo, titolari con numero, panchina e colori maglia.
     */
    const applyLineup = useCallback(async (side, data) => {
        const src = data[side];
        const formation = (src.formation || '').replace(/^1-/, '') || '4-3-3';

        const imported = src.starters.slice(0, 11)
            .map(p => ({ num: p.number || '', name: (p.name || '').toUpperCase() }));

        // starters[0] è il portiere; gli altri vanno rimessi da sinistra a destra
        const players = emptyPlayers();
        const ordered = [imported[0], ...normalizeOutfieldOrder(formation, imported.slice(1))];
        ordered.forEach((p, i) => { if (p) players[i] = p; });

        const logo = resolveLogo(src.name, src.logo);
        const kit = await resolveKit(src.name, logo);
        const gkKit = pickGkKit(kit);

        setTeam(side)({
            name: cleanTeamName(src.name),
            logo,
            formation,
            players,
            bench: src.bench.map(p => (p.name || '').toUpperCase()),
            kit,
            gkKit,
        });
    }, []);

    /**
     * `sideToImport` è null nella versione a due squadre (si importano
     * entrambe) e vale 'home'/'away' quando la grafica ne mostra una sola:
     * in quel caso l'utente sceglie da quale squadra ricavare i dati.
     */
    const importMatch = async (match, sideToImport) => {
        setSelectedMatchId(match.matchId);
        setImporting(true);
        setAutoError('');
        setAutoNote('');

        if (importRequestRef.current.controller) importRequestRef.current.controller.abort();
        const controller = new AbortController();
        importRequestRef.current = { controller };
        const isCurrent = () => importRequestRef.current.controller === controller;

        try {
            const res = await fetch(
                `${config.API_BASE_URL}/api/get-lineups?matchId=${encodeURIComponent(match.matchId)}`,
                { signal: controller.signal }
            );
            const data = await res.json();
            if (!isCurrent()) return;

            if (!data.status) {
                setAutoError(data.message || 'Errore nel recupero delle formazioni.');
                return;
            }
            if (!data.available) {
                setAutoError(
                    data.message ||
                    'Formazioni non ancora pubblicate: Flashscore le rilascia circa un\'ora prima del calcio d\'inizio.'
                );
                return;
            }

            if (sideToImport) {
                await applyLineup(sideToImport, data);
                // La grafica a una squadra mostra comunque entrambi gli stemmi
                // nella card in alto: l'altra squadra serve solo per nome e logo.
                const other = sideToImport === 'home' ? 'away' : 'home';
                const otherSrc = data[other];
                setTeam(other)(prev => ({
                    ...prev,
                    name: cleanTeamName(otherSrc.name),
                    logo: resolveLogo(otherSrc.name, otherSrc.logo),
                }));
                setFocus(sideToImport);
            } else {
                await applyLineup('home', data);
                await applyLineup('away', data);
            }

            const missing = ['home', 'away'].filter(s => data[s].starters.length < 11);
            setAutoNote(
                missing.length
                    ? 'Formazioni importate, ma una delle due è incompleta su Flashscore: controlla i titolari.'
                    : 'Formazioni ufficiali importate. Colori e stile maglia sono modificabili qui sotto.'
            );
        } catch (err) {
            if (err.name !== 'AbortError') setAutoError('Errore di rete durante l\'importazione.');
        } finally {
            if (isCurrent()) setImporting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Modifiche manuali
    // -------------------------------------------------------------------------

    const updateTeam = (side, patch) => {
        setTeam(side)(prev => ({ ...prev, ...patch }));
    };

    const updateKit = (side, which, patch) => {
        setTeam(side)(prev => ({ ...prev, [which]: { ...prev[which], ...patch } }));
    };

    const updatePlayer = (side, index, patch) => {
        setTeam(side)(prev => {
            const players = prev.players.map((p, i) => (i === index ? { ...p, ...patch } : p));
            return { ...prev, players };
        });
    };

    const handleLogoUpload = (side) => (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => updateTeam(side, { logo: evt.target.result });
        reader.readAsDataURL(file);
    };

    const handleBrandLogoUpload = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => setBrandLogo(evt.target.result);
        reader.readAsDataURL(file);
    };

    // -------------------------------------------------------------------------
    // Export
    // -------------------------------------------------------------------------

    const exportImage = async () => {
        const node = document.getElementById('startingXiExport');
        if (!node) return;

        setExporting(true);
        try {
            await document.fonts.ready;
            const options = {
                quality: 1.0,
                pixelRatio: 1,
                width: layout.width,
                height: layout.height,
                backgroundColor: '#050505',
                cacheBust: true,
                // Obbligatorio: la cache interna di html-to-image tronca la query
                // string, quindi i loghi serviti dal proxy (/proxy-image?url=...)
                // finirebbero tutti sulla stessa chiave e la grafica mostrerebbe
                // due volte lo stemma della prima squadra scaricata.
                includeQueryParams: true,
            };
            // html-to-image salta spesso immagini e font alla prima passata:
            // si scaldano un paio di render e si tiene l'ultimo.
            await htmlToImage.toJpeg(node, options);
            await htmlToImage.toJpeg(node, options);
            const dataUrl = await htmlToImage.toJpeg(node, options);

            const focusedName = mode === 'single' ? (focus === 'home' ? home.name : away.name) : `${home.name}_${away.name}`;
            const safe = focusedName.replace(/[^a-z0-9]+/gi, '_').toLowerCase() || 'starting_xi';
            await saveImage(dataUrl, `starting_xi_${safe}.jpg`);
        } catch (err) {
            console.error('Errore esportazione Starting XI', err);
        } finally {
            setExporting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    const panel = (id, label, body) => (
        <div className="sxi-panel">
            <button
                type="button"
                className={`sxi-panel-head ${openPanel === id ? 'open' : ''}`}
                onClick={() => setOpenPanel(openPanel === id ? null : id)}
            >
                <span>{label}</span>
                <span className="sxi-caret">{openPanel === id ? '−' : '+'}</span>
            </button>
            {openPanel === id && <div className="sxi-panel-body">{body}</div>}
        </div>
    );

    return (
        <div className="sxi-wrapper">
            {/* Barra azioni (sticky su mobile) */}
            <div className="sxi-topbar">
                <h1>STARTING XI</h1>
                <button onClick={exportImage} disabled={exporting} className="sxi-download">
                    <i className="fa-solid fa-download" /> {exporting ? 'Genero…' : 'Download'}
                </button>
            </div>

            <aside className="sxi-sidebar">
                {/* --- Formato e impaginazione --- */}
                {panel('layout', 'Formato e impaginazione', (
                    <>
                        <label className="sxi-label">Dimensioni canvas</label>
                        <div className="sxi-chips">
                            {FORMATS.map(f => (
                                <button
                                    key={f.id}
                                    type="button"
                                    className={`sxi-chip ${format === f.id ? 'active' : ''}`}
                                    onClick={() => setFormat(f.id)}
                                >{f.label}</button>
                            ))}
                        </div>

                        <label className="sxi-label">Grafica</label>
                        <div className="sxi-chips">
                            {MODES.map(m => (
                                <button
                                    key={m.id}
                                    type="button"
                                    className={`sxi-chip ${mode === m.id ? 'active' : ''}`}
                                    onClick={() => setMode(m.id)}
                                >{m.label}</button>
                            ))}
                        </div>

                        {mode === 'single' && (
                            <>
                                <label className="sxi-label">Squadra da mostrare in campo</label>
                                <div className="sxi-chips">
                                    <button type="button" className={`sxi-chip ${focus === 'home' ? 'active' : ''}`} onClick={() => setFocus('home')}>
                                        {home.name || 'Casa'}
                                    </button>
                                    <button type="button" className={`sxi-chip ${focus === 'away' ? 'active' : ''}`} onClick={() => setFocus('away')}>
                                        {away.name || 'Ospite'}
                                    </button>
                                </div>
                            </>
                        )}

                        <div className="sxi-grid2">
                            <div>
                                <label className="sxi-label">Titolo</label>
                                <input className="sxi-input" value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div>
                                <label className="sxi-label">Colore sfondo</label>
                                <input
                                    type="color"
                                    className="sxi-color"
                                    value={effectiveAccent}
                                    onChange={e => { setAccent(e.target.value); setAccentAuto(false); }}
                                />
                            </div>
                        </div>

                        {mode === 'single' && (
                            <label className="sxi-check">
                                <input
                                    type="checkbox"
                                    checked={accentAuto}
                                    onChange={e => setAccentAuto(e.target.checked)}
                                />
                                <span>Sfondo con i colori della squadra in campo</span>
                            </label>
                        )}

                        <label className="sxi-label">Logo testata</label>
                        <div className="sxi-row">
                            <input type="file" accept="image/*" onChange={handleBrandLogoUpload} className="sxi-file" />
                            <button type="button" className="sxi-mini" onClick={() => setBrandLogo('/loghi/Logo CE bianco.png')}>Default</button>
                            <button type="button" className="sxi-mini" onClick={() => setBrandLogo(null)}>Nessuno</button>
                        </div>
                    </>
                ))}

                {/* --- Modalità automatica --- */}
                {panel('auto', 'Modalità facile — formazioni ufficiali', (
                    <>
                        <p className="sxi-hint">
                            Sceglie una partita e compila da sola squadre, loghi, modulo, titolari con
                            numero, panchina e colori maglia.
                        </p>

                        <label className="sxi-label">Competizione</label>
                        <select
                            className="sxi-input"
                            value={selectedComp}
                            onChange={e => setSelectedComp(parseInt(e.target.value, 10))}
                        >
                            {COMPETITIONS.map((c, i) => <option key={c.label} value={i}>{c.label}</option>)}
                        </select>

                        <button type="button" className="sxi-primary" onClick={searchMatches} disabled={loadingMatches}>
                            {loadingMatches ? 'Cerco partite…' : 'Cerca partite'}
                        </button>

                        {autoError && <div className="sxi-alert error">{autoError}</div>}
                        {autoNote && <div className="sxi-alert ok">{autoNote}</div>}

                        {mode === 'single' && matches.length > 0 && (
                            <p className="sxi-hint">
                                La grafica mostra una sola squadra: scegli quale delle due importare.
                            </p>
                        )}

                        <div className="sxi-matches">
                            {matches.map(m => (
                                <div key={m.matchId} className={`sxi-match ${selectedMatchId === m.matchId ? 'active' : ''}`}>
                                    <div className="sxi-match-date">
                                        {m.date}{m.isUpcoming ? ' · da giocare' : ` · ${m.homeScore}-${m.awayScore}`}
                                    </div>
                                    <div className="sxi-match-teams">{m.homeTeam} — {m.awayTeam}</div>
                                    {mode === 'single' ? (
                                        <div className="sxi-row">
                                            <button type="button" className="sxi-mini" disabled={importing} onClick={() => importMatch(m, 'home')}>
                                                {cleanTeamName(m.homeTeam)}
                                            </button>
                                            <button type="button" className="sxi-mini" disabled={importing} onClick={() => importMatch(m, 'away')}>
                                                {cleanTeamName(m.awayTeam)}
                                            </button>
                                        </div>
                                    ) : (
                                        <button type="button" className="sxi-mini wide" disabled={importing} onClick={() => importMatch(m, null)}>
                                            {importing && selectedMatchId === m.matchId ? 'Importo…' : 'Importa formazioni'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                ))}

                {/* --- Editor manuale --- */}
                {panel('home', `Squadra casa — ${home.name}`, (
                    <TeamEditor
                        side="home" team={home}
                        onTeam={updateTeam} onKit={updateKit} onPlayer={updatePlayer}
                        onLogoUpload={handleLogoUpload('home')}
                    />
                ))}
                {panel('away', `Squadra ospite — ${away.name}`, (
                    <TeamEditor
                        side="away" team={away}
                        onTeam={updateTeam} onKit={updateKit} onPlayer={updatePlayer}
                        onLogoUpload={handleLogoUpload('away')}
                    />
                ))}
            </aside>

            {/* Anteprima */}
            <main className="sxi-preview" ref={previewAreaRef}>
                <div
                    className="sxi-stage"
                    style={{
                        width: layout.width * posterScale,
                        height: layout.height * posterScale,
                    }}
                >
                    <div style={{ transform: `scale(${posterScale})`, transformOrigin: 'top left' }}>
                        <StartingXIPoster
                            format={format}
                            mode={mode}
                            focus={focus}
                            title={title}
                            accent={effectiveAccent}
                            brandLogo={brandLogo}
                            home={home}
                            away={away}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

// =============================================================================
// Editor di una squadra
// =============================================================================

const KitEditor = ({ label, kit, onChange }) => (
    <div className="sxi-kit">
        <div className="sxi-kit-title">{label}</div>
        <div className="sxi-row">
            <label className="sxi-swatch">
                <span>Principale</span>
                <input type="color" value={kit.primary} onChange={e => onChange({ primary: e.target.value })} />
            </label>
            <label className="sxi-swatch">
                <span>Secondario</span>
                <input type="color" value={kit.secondary} onChange={e => onChange({ secondary: e.target.value })} />
            </label>
            <label className="sxi-swatch">
                <span>Numero</span>
                <input type="color" value={kit.number} onChange={e => onChange({ number: e.target.value })} />
            </label>
        </div>
        <select className="sxi-input" value={kit.pattern} onChange={e => onChange({ pattern: e.target.value })}>
            {KIT_PATTERNS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
    </div>
);

const TeamEditor = ({ side, team, onTeam, onKit, onPlayer, onLogoUpload }) => {
    // Le etichette dei ruoli seguono il modulo scelto, così il compilatore
    // manuale sa in che ordine stanno i giocatori nella grafica.
    const lines = parseFormationLines(team.formation);
    const roleLabels = ['PORTIERE'];
    const bands = ['DIFESA', 'CENTROCAMPO', 'TREQUARTI', 'ATTACCO'];
    lines.forEach((count, i) => {
        const band = i === lines.length - 1 ? 'ATTACCO' : bands[Math.min(i, bands.length - 1)];
        for (let k = 0; k < count; k++) roleLabels.push(`${band} ${k + 1}`);
    });

    const formationOptions = FORMATIONS.includes(team.formation)
        ? FORMATIONS
        : [team.formation, ...FORMATIONS];

    return (
        <>
            <div className="sxi-grid2">
                <div>
                    <label className="sxi-label">Nome squadra</label>
                    <input
                        className="sxi-input"
                        value={team.name}
                        onChange={e => onTeam(side, { name: e.target.value.toUpperCase() })}
                    />
                </div>
                <div>
                    <label className="sxi-label">Modulo</label>
                    <select
                        className="sxi-input"
                        value={team.formation}
                        onChange={e => onTeam(side, { formation: e.target.value })}
                    >
                        {formationOptions.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
            </div>

            <label className="sxi-label">Logo</label>
            <div className="sxi-row">
                <input type="file" accept="image/*" onChange={onLogoUpload} className="sxi-file" />
                <button type="button" className="sxi-mini" onClick={() => onTeam(side, { logo: null })}>Rimuovi</button>
            </div>

            <KitEditor label="Maglia titolari" kit={team.kit} onChange={patch => onKit(side, 'kit', patch)} />
            <KitEditor label="Maglia portiere" kit={team.gkKit} onChange={patch => onKit(side, 'gkKit', patch)} />

            <label className="sxi-label">Titolari</label>
            <p className="sxi-hint">Dentro ogni reparto l'ordine è quello del campo, da sinistra a destra.</p>
            <div className="sxi-players">
                {team.players.map((p, i) => (
                    <div key={i} className="sxi-player">
                        <span className="sxi-role">{roleLabels[i] || `GIOCATORE ${i + 1}`}</span>
                        <input
                            className="sxi-num"
                            value={p.num}
                            placeholder="N°"
                            onChange={e => onPlayer(side, i, { num: e.target.value })}
                        />
                        <input
                            className="sxi-input"
                            value={p.name}
                            placeholder="COGNOME"
                            onChange={e => onPlayer(side, i, { name: e.target.value.toUpperCase() })}
                        />
                    </div>
                ))}
            </div>

            <label className="sxi-label">Panchina (un nome per riga)</label>
            <textarea
                className="sxi-input sxi-textarea"
                rows={5}
                value={team.bench.join('\n')}
                onChange={e => onTeam(side, {
                    bench: e.target.value.split('\n').map(s => s.trim().toUpperCase()).filter(Boolean),
                })}
            />
        </>
    );
};

export default StartingXI;
