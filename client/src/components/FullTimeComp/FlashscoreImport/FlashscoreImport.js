import React, { useState, useRef } from 'react';
import config from '../../../config';
import './FlashscoreImport.css';
import { findTeamLogo } from '../../../utils/LogoConstants';

// Preset competizioni disponibili (flashscore.it)
// tabellino: nome file in /public/tabellini/
const COMPETITIONS = [
    { label: 'Grecia - Super League', country: 'grecia', league: 'super-league', tabellino: 'superleague.png' },
    { label: 'Grecia - Super League 2', country: 'grecia', league: 'super-league-2', tabellino: 'superleague2.png' },
    { label: 'Grecia - Coppa', country: 'grecia', league: 'coppa', tabellino: 'greekcup.png' },
    { label: 'Champions League', country: 'europa', league: 'champions-league', tabellino: 'championsleague.png' },
    { label: 'Europa League', country: 'europa', league: 'europa-league', tabellino: 'europaleague.png' },
    { label: 'Conference League', country: 'europa', league: 'conference-league', tabellino: 'conferenceleague.png' },
];

/**
 * Cerca il logo locale per una squadra usando la utility centralizzata.
 */
function findLocalLogo(teamName) {
    return findTeamLogo(teamName);
}

/**
 * Ripulisce il nome squadra dal suffisso nazione delle coppe europee
 * (es. "Paks (Hun)" → "Paks") per migliorare la ricerca web del logo.
 */
function cleanTeamName(teamName) {
    return (teamName || '').replace(/\s*\([A-Za-z]{2,3}\)\s*$/, '').trim();
}

/**
 * Risolve il logo di una squadra non presente nella lista locale cercandolo
 * sul web (stesso endpoint di "Cerca Web"). Ritorna un URL già pronto per
 * il canvas (loghi esterni passano dal proxy-image) oppure null.
 */
async function resolveWebLogo(teamName, signal) {
    const query = cleanTeamName(teamName);
    if (query.length < 2) return null;
    try {
        const res = await fetch(
            `${config.API_BASE_URL}/api/search-logos?q=${encodeURIComponent(query)}`,
            { signal }
        );
        if (!res.ok) return null;
        const data = await res.json();
        const first = data && data.results && data.results[0];
        const url = first && (first.logoUrl || first.logo_url);
        if (!url) return null;
        // I loghi esterni (TheSportsDB) vanno serviti tramite proxy per CORS
        const isExternal = /^https?:\/\//.test(url);
        return isExternal
            ? `${config.API_BASE_URL}/proxy-image?url=${encodeURIComponent(url)}`
            : url;
    } catch (err) {
        return null; // abort o errore: nessun logo web
    }
}

const FlashscoreImport = ({ onMatchSelect, flashscoreData, setFlashscoreData }) => {
    // Destructuring state from props
    const { matches, selectedComp, selectedMatchId } = flashscoreData;

    // Proxy setters to update parent state
    const setMatches = (newMatches) => setFlashscoreData(prev => ({ ...prev, matches: newMatches }));
    const setSelectedComp = (newComp) => setFlashscoreData(prev => ({ ...prev, selectedComp: newComp }));
    const setSelectedMatchId = (newId) => setFlashscoreData(prev => ({ ...prev, selectedMatchId: newId }));

    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState('');

    // Traccia la richiesta marcatori in corso: se l'utente clicca un'altra
    // partita, la richiesta precedente viene annullata e la sua risposta
    // scartata (altrimenti i marcatori della partita vecchia sovrascrivono
    // il tabellino di quella nuova).
    const detailsRequestRef = useRef({ controller: null });

    const searchMatches = async () => {
        const comp = COMPETITIONS[selectedComp];
        setLoading(true);
        setError('');
        setMatches([]);
        setSelectedMatchId(null);

        try {
            const response = await fetch(
                `${config.API_BASE_URL}/api/get-matches?country=${comp.country}&league=${comp.league}&daysBack=365`
            );
            const data = await response.json();

            if (data.status && data.matches && data.matches.length > 0) {
                setMatches(data.matches);
            } else {
                setError(data.message || "Nessuna partita trovata nell'ultimo anno.");
            }
        } catch (err) {
            console.error('Flashscore fetch error:', err);
            setError('Impossibile recuperare i dati. Verifica la connessione e riprova.');
        } finally {
            setLoading(false);
        }
    };

    const handleMatchClick = async (match) => {
        setSelectedMatchId(match.matchId);
        setLoadingDetails(true);
        setError('');

        const comp = COMPETITIONS[selectedComp];

        // Annulla l'eventuale richiesta precedente ancora in volo
        if (detailsRequestRef.current.controller) {
            detailsRequestRef.current.controller.abort();
        }
        const controller = new AbortController();
        detailsRequestRef.current = { controller };
        const isCurrent = () => detailsRequestRef.current.controller === controller;

        // Loghi locali (istantanei); quelli mancanti verranno cercati sul web
        const localHome = findLocalLogo(match.homeTeam);
        const localAway = findLocalLogo(match.awayTeam);

        // Stato consolidato: ogni aggiornamento invia SEMPRE l'ultima versione
        // nota di loghi e marcatori, così i due flussi asincroni (loghi web /
        // marcatori) non si sovrascrivono a vicenda.
        let curHomeLogo = localHome;
        let curAwayLogo = localAway;
        let curHomeScorers = [];
        let curAwayScorers = [];

        const pushUpdate = () => {
            if (!isCurrent() || !onMatchSelect) return;
            onMatchSelect({
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                homeScore: parseInt(match.homeScore) || 0,
                awayScore: parseInt(match.awayScore) || 0,
                tabellino: comp.tabellino,
                homeLogo: curHomeLogo,
                awayLogo: curAwayLogo,
                homeScorers: curHomeScorers,
                awayScorers: curAwayScorers,
            });
        };

        // Notifica subito con i dati base (risultato, tabellino, loghi locali)
        pushUpdate();

        // Cerca sul web i loghi non presenti nella lista locale, in parallelo
        const logosPromise = Promise.all([
            localHome ? Promise.resolve(localHome) : resolveWebLogo(match.homeTeam, controller.signal),
            localAway ? Promise.resolve(localAway) : resolveWebLogo(match.awayTeam, controller.signal),
        ]).then(([home, away]) => {
            if (!isCurrent()) return;
            if (home) curHomeLogo = home;
            if (away) curAwayLogo = away;
            pushUpdate();
        }).catch(() => { /* loghi web non disponibili: si resta con i locali */ });

        // Marcatori (con timeout), in parallelo ai loghi
        const detailsPromise = (async () => {
            if (!match.matchUrl && !match.matchId) return;
            const timeoutId = setTimeout(() => controller.abort(), 35000);
            try {
                const params = new URLSearchParams();
                if (match.matchUrl) params.set('matchUrl', match.matchUrl);
                if (match.matchId) params.set('matchId', match.matchId);

                const detailsResponse = await fetch(
                    `${config.API_BASE_URL}/api/get-match-details?${params.toString()}`,
                    { signal: controller.signal }
                );
                clearTimeout(timeoutId);
                const detailsData = await detailsResponse.json();

                if (detailsData.status && isCurrent()) {
                    curHomeScorers = detailsData.homeGoals || [];
                    curAwayScorers = detailsData.awayGoals || [];
                    pushUpdate();
                }
            } catch (err) {
                clearTimeout(timeoutId);
                if (!isCurrent()) return; // superata da un click più recente
                console.error('Error fetching match details:', err);
                setError('⚠️ Marcatori non disponibili. Inseriscili manualmente.');
            }
        })();

        try {
            await Promise.all([logosPromise, detailsPromise]);
        } finally {
            if (isCurrent()) {
                setLoadingDetails(false);
            }
        }
    };

    return (
        <div className="flashscore-import">
            <h3 className="flashscore-title">
                <span className="flashscore-icon">⚡</span> Importa da Flashscore
            </h3>

            <div className="flashscore-controls">
                <select
                    className="flashscore-select"
                    value={selectedComp}
                    onChange={(e) => setSelectedComp(parseInt(e.target.value))}
                    disabled={loading || loadingDetails}
                >
                    {COMPETITIONS.map((comp, i) => (
                        <option key={i} value={i}>{comp.label}</option>
                    ))}
                </select>

                <button
                    className="flashscore-search-btn"
                    onClick={searchMatches}
                    disabled={loading || loadingDetails}
                >
                    {loading ? (
                        <span className="flashscore-spinner"></span>
                    ) : (
                        '🔍 Cerca Partite'
                    )}
                </button>
            </div>

            {loading && (
                <div className="flashscore-loading">
                    <div className="flashscore-loading-bar"></div>
                    <p>Ricerca in corso... di solito bastano pochi secondi.</p>
                </div>
            )}

            {loadingDetails && (
                <div className="flashscore-loading">
                    <div className="flashscore-loading-bar"></div>
                    <p>⚽ Caricamento marcatori in corso...</p>
                </div>
            )}

            {error && (
                <div className="flashscore-error">
                    <span>⚠️</span> {error}
                    <p className="flashscore-error-hint">Inserisci i dati manualmente.</p>
                </div>
            )}

            {matches.length > 0 && (
                <div className="flashscore-results">
                    <p className="flashscore-results-count">
                        {matches.length} partite trovate
                    </p>
                    <div className="flashscore-match-list">
                        {matches.map((match, i) => (
                            <div
                                key={match.matchId || i}
                                className={`flashscore-match-item ${selectedMatchId === match.matchId ? 'selected' : ''}`}
                                onClick={() => handleMatchClick(match)}
                            >
                                <span className="flashscore-match-date">{match.date}</span>
                                <div className="flashscore-match-teams">
                                    <span className="flashscore-team home">{match.homeTeam}</span>
                                    <span className="flashscore-match-score">
                                        {match.homeScore} - {match.awayScore}
                                    </span>
                                    <span className="flashscore-team away">{match.awayTeam}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlashscoreImport;
