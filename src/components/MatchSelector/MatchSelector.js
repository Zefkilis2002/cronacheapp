import React, { useEffect, useState } from "react";
import axios from "axios";

const MatchSelector = ({ onSelectMatch }) => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("matches"); // "matches" o "teams"
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teamMatches, setTeamMatches] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMatches(selectedTeam);
    }
  }, [selectedTeam]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Recupera le partite
      const matchesResponse = await axios.get("http://localhost:5000/api/matches");
      console.log("Risposta partite:", matchesResponse.data);
      
      // Recupera le squadre
      const teamsResponse = await axios.get("http://localhost:5000/api/teams");
      console.log("Risposta squadre:", teamsResponse.data);
      
      setMatches(Array.isArray(matchesResponse.data) ? matchesResponse.data : []);
      setTeams(Array.isArray(teamsResponse.data) ? teamsResponse.data : []);
      setLoading(false);
    } catch (error) {
      console.error("Errore durante il recupero dei dati:", error);
      setError("Impossibile caricare i dati: " + (error.message || "Errore sconosciuto"));
      setLoading(false);
    }
  };

  const fetchTeamMatches = async (teamId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/team/${teamId}/events`);
      console.log(`Partite della squadra ${teamId}:`, response.data);
      setTeamMatches(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(`Errore nel recupero delle partite della squadra ${teamId}:`, error);
      setTeamMatches([]);
    }
  };

  const handleTeamChange = (e) => {
    setSelectedTeam(e.target.value);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "matches" ? "teams" : "matches");
  };

  if (loading) return <p>Caricamento dati...</p>;
  if (error) return (
    <div>
      <p>{error}</p>
      <button onClick={fetchData}>Riprova</button>
    </div>
  );

  // Se non ci sono né partite né squadre
  if (matches.length === 0 && teams.length === 0) {
    return (
      <div className="error-container" style={{padding: '20px', backgroundColor: '#f8d7da', borderRadius: '5px', color: '#721c24'}}>
        <h3>Nessun dato trovato</h3>
        <p>Non è stato possibile trovare partite o squadre della Super League greca. Questo potrebbe essere dovuto a:</p>
        <ul>
          <li>Limitazioni dell'API gratuita di TheSportsDB</li>
          <li>Nessuna partita disponibile nel periodo corrente</li>
          <li>Problemi di connessione all'API</li>
        </ul>
        <p>Verifica direttamente l'API:</p>
        <div>
          <a href="https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=4336" target="_blank" rel="noopener noreferrer">
            Test API partite recenti
          </a>
        </div>
        <div>
          <a href="https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4336" target="_blank" rel="noopener noreferrer">
            Test API partite future
          </a>
        </div>
        <div>
          <a href="https://www.thesportsdb.com/api/v1/json/3/lookup_all_teams.php?id=4336" target="_blank" rel="noopener noreferrer">
            Test API squadre
          </a>
        </div>
        <button onClick={fetchData} style={{marginTop: '15px', padding: '8px 12px'}}>Riprova</button>
      </div>
    );
  }

  return (
    <div className="match-selector-container">
      <div className="view-toggle" style={{marginBottom: '15px'}}>
        <button 
          onClick={toggleViewMode}
          style={{padding: '8px 12px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px'}}
        >
          {viewMode === "matches" ? "Visualizza per Squadre" : "Visualizza per Partite"}
        </button>
      </div>

      {viewMode === "matches" && matches.length > 0 ? (
        <div className="matches-view">
          <h3>Seleziona una partita:</h3>
          <select 
            onChange={(e) => onSelectMatch(e.target.value)}
            style={{padding: '8px', width: '100%', maxWidth: '500px'}}
          >
            <option value="">-- Seleziona --</option>
            {matches.map((match) => (
              <option key={match.idEvent} value={match.idEvent}>
                {match.strHomeTeam} vs {match.strAwayTeam} ({match.dateEvent})
              </option>
            ))}
          </select>
        </div>
      ) : viewMode === "teams" && teams.length > 0 ? (
        <div className="teams-view">
          <h3>Seleziona una squadra:</h3>
          <select 
            onChange={handleTeamChange}
            style={{padding: '8px', width: '100%', maxWidth: '500px'}}
          >
            <option value="">-- Seleziona --</option>
            {teams.map((team) => (
              <option key={team.idTeam} value={team.idTeam}>
                {team.strTeam}
              </option>
            ))}
          </select>

          {selectedTeam && teamMatches.length > 0 ? (
            <div className="team-matches" style={{marginTop: '20px'}}>
              <h4>Partite della squadra selezionata:</h4>
              <select 
                onChange={(e) => onSelectMatch(e.target.value)}
                style={{padding: '8px', width: '100%', maxWidth: '500px'}}
              >
                <option value="">-- Seleziona --</option>
                {teamMatches.map((match) => (
                  <option key={match.idEvent} value={match.idEvent}>
                    {match.strHomeTeam} vs {match.strAwayTeam} ({match.dateEvent})
                  </option>
                ))}
              </select>
            </div>
          ) : selectedTeam ? (
            <p>Nessuna partita trovata per questa squadra.</p>
          ) : null}
        </div>
      ) : (
        <p>Nessun dato disponibile per la visualizzazione selezionata.</p>
      )}
      
      <button 
        onClick={fetchData} 
        style={{marginTop: '15px', padding: '8px 12px', backgroundColor: '#e7f3ff', border: '1px solid #b6d4fe', borderRadius: '4px'}}
      >
        Aggiorna dati
      </button>
    </div>
  );
};

export default MatchSelector;