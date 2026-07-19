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

        // Cerca loghi locali
        const homeLogo = findLocalLogo(match.homeTeam);
        const awayLogo = findLocalLogo(match.awayTeam);

        // Prepara dati base (senza marcatori, arriveranno dopo)
        const matchData = {
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            homeScore: parseInt(match.homeScore) || 0,
            awayScore: parseInt(match.awayScore) || 0,
            tabellino: comp.tabellino,
            homeLogo: homeLogo,
            awayLogo: awayLogo,
            homeScorers: [],
            awayScorers: [],
        };

        // Notifica subito con i dati base (risultato, loghi, tabellino)
        if (onMatchSelect) {
            onMatchSelect(matchData);
        }

        // Poi cerca i marcatori in background (con timeout)
        // Annulla l'eventuale richiesta precedente ancora in volo
        if (detailsRequestRef.current.controller) {
            detailsRequestRef.current.controller.abort();
        }
        const controller = new AbortController();
        detailsRequestRef.current = { controller };

        try {
            if (match.matchUrl || match.matchId) {
                // 35s: poco sopra il timeout server (30s), era 45s
                const timeoutId = setTimeout(() => controller.abort(), 35000);

                const params = new URLSearchParams();
                if (match.matchUrl) params.set('matchUrl', match.matchUrl);
                if (match.matchId) params.set('matchId', match.matchId);

                const detailsResponse = await fetch(
                    `${config.API_BASE_URL}/api/get-match-details?${params.toString()}`,
                    { signal: controller.signal }
                );
                clearTimeout(timeoutId);
                const detailsData = await detailsResponse.json();

                // Applica solo se questa è ancora la richiesta corrente
                if (detailsData.status && detailsRequestRef.current.controller === controller) {
                    const updatedData = {
                        ...matchData,
                        homeScorers: detailsData.homeGoals || [],
                        awayScorers: detailsData.awayGoals || [],
                    };
                    if (onMatchSelect) {
                        onMatchSelect(updatedData);
                    }
                }
            }
        } catch (err) {
            // Richiesta superata da un click più recente: ignora in silenzio
            if (detailsRequestRef.current.controller !== controller) return;
            console.error('Error fetching match details:', err);
            setError('⚠️ Marcatori non disponibili. Inseriscili manualmente.');
        } finally {
            if (detailsRequestRef.current.controller === controller) {
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
