import React, { useState, useRef, useEffect } from 'react';
import './FlashscoreImport.css';
import { findTeamLogo } from '../../../utils/LogoConstants';
import { resolveTeamLogo } from '../../../utils/logoSearch';
import { requestJson, toCanvasUrl } from '../../../utils/apiClient';

const COMPETITIONS = [
    { label: 'Grecia - Super League', country: 'grecia', league: 'super-league', tabellino: 'superleague.png' },
    { label: 'Grecia - Super League 2', country: 'grecia', league: 'super-league-2', tabellino: 'superleague2.png' },
    { label: 'Grecia - Coppa', country: 'grecia', league: 'coppa', tabellino: 'greekcup.png' },
    { label: 'Champions League', country: 'europa', league: 'champions-league', tabellino: 'championsleague.png' },
    { label: 'Europa League', country: 'europa', league: 'europa-league', tabellino: 'europaleague.png' },
    { label: 'Conference League', country: 'europa', league: 'conference-league', tabellino: 'conferenceleague.png' },
];


const FlashscoreImport = ({ onMatchSelect, flashscoreData, setFlashscoreData }) => {
    const { matches, selectedComp, selectedMatchId } = flashscoreData;
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState('');
    const detailsRequestRef = useRef(null);
    const searchRequestRef = useRef(null);

    useEffect(() => () => {
        detailsRequestRef.current?.abort();
        searchRequestRef.current?.abort();
    }, []);

    const changeCompetition = (index) => {
        detailsRequestRef.current?.abort();
        setLoadingDetails(false);
        setError('');
        setFlashscoreData(prev => ({ ...prev, selectedComp: index, matches: [], selectedMatchId: null }));
    };

    const searchMatches = async () => {
        detailsRequestRef.current?.abort();
        searchRequestRef.current?.abort();
        const controller = new AbortController();
        searchRequestRef.current = controller;
        const comp = COMPETITIONS[selectedComp];
        setLoading(true);
        setLoadingDetails(false);
        setError('');
        setFlashscoreData(prev => ({ ...prev, matches: [], selectedMatchId: null }));
        try {
            const params = new URLSearchParams({ country: comp.country, league: comp.league, daysBack: '365' });
            const data = await requestJson('/api/get-matches?' + params, { signal: controller.signal, ttl: 60000, timeout: 95000 });
            if (!data.matches?.length) throw new Error(data.message || "Nessuna partita trovata nell'ultimo anno.");
            setFlashscoreData(prev => ({ ...prev, matches: data.matches }));
        } catch (err) {
            if (!controller.signal.aborted) setError(err.message || 'Impossibile recuperare le partite. Riprova.');
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    };

    const handleMatchClick = async (match) => {
        detailsRequestRef.current?.abort();
        const controller = new AbortController();
        detailsRequestRef.current = controller;
        const isCurrent = () => detailsRequestRef.current === controller && !controller.signal.aborted;
        const comp = COMPETITIONS[selectedComp];
        setFlashscoreData(prev => ({ ...prev, selectedMatchId: match.matchId }));
        setLoadingDetails(true);
        setError('');

        // The feed already carries both badges. No extra logo search is needed.
        const homeLogo = findTeamLogo(match.homeTeam) || toCanvasUrl(match.homeLogo);
        const awayLogo = findTeamLogo(match.awayTeam) || toCanvasUrl(match.awayLogo);
        onMatchSelect({
            homeScore: Number(match.homeScore) || 0,
            awayScore: Number(match.awayScore) || 0,
            isPenaltyMatch: !!match.isPenaltyMatch,
            penaltiesScore1: Number(match.penaltiesScore1) || 0,
            penaltiesScore2: Number(match.penaltiesScore2) || 0,
            tabellino: comp.tabellino, homeLogo, awayLogo,
            homeScorers: [], awayScorers: [],
        });

        const logoTask = Promise.all([
            homeLogo || resolveTeamLogo(match.homeTeam, { signal: controller.signal }),
            awayLogo || resolveTeamLogo(match.awayTeam, { signal: controller.signal }),
        ]).then(([home, away]) => {
            if (!isCurrent()) return;
            const patch = {};
            if (!homeLogo && home) patch.homeLogo = home;
            if (!awayLogo && away) patch.awayLogo = away;
            if (Object.keys(patch).length) onMatchSelect(patch);
        });

        const detailsTask = (async () => {
            if (!match.matchId && !match.matchUrl) return;
            try {
                const params = new URLSearchParams();
                if (match.matchId) params.set('matchId', match.matchId);
                else params.set('matchUrl', match.matchUrl);
                const data = await requestJson('/api/get-match-details?' + params, { signal: controller.signal, ttl: 300000 });
                if (isCurrent()) onMatchSelect({ homeScorers: data.homeGoals || [], awayScorers: data.awayGoals || [] });
            } catch (err) {
                if (isCurrent()) setError('Marcatori non disponibili. Puoi inserirli manualmente.');
            }
        })();
        try {
            await Promise.all([logoTask, detailsTask]);
        } finally {
            if (isCurrent()) setLoadingDetails(false);
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
                    onChange={(e) => changeCompetition(Number(e.target.value))}
                    disabled={loading}
                >
                    {COMPETITIONS.map((comp, i) => (
                        <option key={i} value={i}>{comp.label}</option>
                    ))}
                </select>

                <button
                    className="flashscore-search-btn"
                    onClick={searchMatches}
                    disabled={loading}
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
                                        {match.isPenaltyMatch && (
                                            <span className="flashscore-match-pens">
                                                {' '}dcr {match.penaltiesScore1}-{match.penaltiesScore2}
                                            </span>
                                        )}
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
