import React, { useState } from 'react';
import config from '../../../config';
import './FlashscoreImport.css';

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

// Mapping nome squadra Flashscore → logo locale
// Chiave: nome in minuscolo come appare su flashscore.it
const LOGO_MAP = {
    'aek': '/loghi/aek.png',
    'aek athens': '/loghi/aek.png',
    'ael larissa': '/loghi/ael.png',
    'aris': '/loghi/aris.png',
    'asteras t.': '/loghi/asteras.png',
    'asteras tripolis': '/loghi/asteras.png',
    'atromitos': '/loghi/atromitos.png',
    'giannina': '/loghi/giannina.png',
    'pas giannina': '/loghi/giannina.png',
    'iraklis': '/loghi/iraklis.png',
    'kalamata': '/loghi/kalamata.png',
    'kallithea': '/loghi/kallithea.png',
    'kifisia': '/loghi/kifisia.png',
    'lamia': '/loghi/lamia.png',
    'levadiakos': '/loghi/levadiakos.png',
    'ofi crete': '/loghi/ofi.png',
    'ofi': '/loghi/ofi.png',
    'olympiakos': '/loghi/olympiakos.png',
    'olympiacos': '/loghi/olympiakos.png',
    'panathinaikos': '/loghi/panathinaikos.png',
    'panetolikos': '/loghi/panetolikos.png',
    'panionios': '/loghi/panionios.png',
    'panserraikos': '/loghi/panseraikos.png',
    'panserraikos2': '/loghi/panseraikos.png',
    'paok': '/loghi/paok.png',
    'volos': '/loghi/volos.png',
    'volos nfc': '/loghi/volos.png',
    'grecia': '/loghi/grecia.png',
};

/**
 * Cerca il logo locale per una squadra. Ritorna il percorso se trovato, null altrimenti.
 */
function findLocalLogo(teamName) {
    if (!teamName) return null;
    const lower = teamName.toLowerCase().trim();

    // Cerca corrispondenza esatta
    if (LOGO_MAP[lower]) return LOGO_MAP[lower];

    // Cerca corrispondenza parziale
    for (const [key, value] of Object.entries(LOGO_MAP)) {
        if (lower.includes(key) || key.includes(lower)) return value;
    }

    return null;
}

const FlashscoreImport = ({ onMatchSelect }) => {
    const [selectedComp, setSelectedComp] = useState(0);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState('');
    const [selectedMatchId, setSelectedMatchId] = useState(null);

    const searchMatches = async () => {
        const comp = COMPETITIONS[selectedComp];
        setLoading(true);
        setError('');
        setMatches([]);
        setSelectedMatchId(null);

        try {
            const response = await fetch(
                `${config.API_BASE_URL}/api/get-matches?country=${comp.country}&league=${comp.league}&daysBack=7`
            );
            const data = await response.json();

            if (data.status && data.matches && data.matches.length > 0) {
                setMatches(data.matches);
            } else {
                setError(data.message || 'Nessuna partita trovata negli ultimi 7 giorni.');
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

        // Poi cerca i marcatori in background
        try {
            if (match.matchUrl) {
                const detailsResponse = await fetch(
                    `${config.API_BASE_URL}/api/get-match-details?matchUrl=${encodeURIComponent(match.matchUrl)}`
                );
                const detailsData = await detailsResponse.json();

                if (detailsData.status) {
                    // Aggiorna con i marcatori
                    const updatedData = {
                        ...matchData,
                        homeScorers: (detailsData.homeGoals || []).map(g => g.formatted),
                        awayScorers: (detailsData.awayGoals || []).map(g => g.formatted),
                    };
                    if (onMatchSelect) {
                        onMatchSelect(updatedData);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching match details:', err);
            // Non mostrare errore - i dati base sono già stati applicati
        } finally {
            setLoadingDetails(false);
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
                    <p>Ricerca in corso... Lo scraping potrebbe richiedere 10-15 secondi.</p>
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
