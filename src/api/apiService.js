import axios from "axios";

const API_BASE_URL = "https://www.thesportsdb.com/api/v1/json/3"; // API Key di test: 3

// Funzione per ottenere l'ID della Super League Greca
const getGreekSuperLeagueId = async () => {
  try {
    const leaguesResponse = await axios.get(`${API_BASE_URL}/search_all_leagues.php?c=Greece`);
    console.log("Leghe greche disponibili:", leaguesResponse.data);
    
    // Rafforziamo il filtro includendo il controllo sulla nazione
    const superLeague = leaguesResponse.data.countries?.find(
      league => (league.strLeague.includes("Super League") || league.strLeague.includes("Superleague")) &&
                league.strCountry === "Greece"
    );
    
    if (!superLeague) {
      console.error("Super League Greca non trovata");
      return null;
    }
    
    console.log("ID della Super League Greca trovato:", superLeague.idLeague);
    return superLeague.idLeague;
  } catch (error) {
    console.error("Errore nel recupero dell'ID della Super League Greca:", error);
    return null;
  }
};

// Funzione per ottenere le partite recenti della Super League Greca
export const getGreekSuperLeagueMatches = async () => {
  try {
    const leagueId = await getGreekSuperLeagueId();
    if (!leagueId) return [];
    
    // Usa l'ID trovato per ottenere gli eventi della stagione 2024-2025
    const response = await axios.get(`${API_BASE_URL}/eventsseason.php?id=${leagueId}&s=2024-2025`);
    console.log("Risposta API Super League:", response.data);
    return response.data.events || [];
  } catch (error) {
    console.error("Errore nel recupero delle partite della Super League Greca:", error);
    return [];
  }
};

// Funzione per ottenere le partite future della Super League Greca
export const getGreekSuperLeagueFutureMatches = async () => {
  try {
    const leagueId = await getGreekSuperLeagueId();
    if (!leagueId) return [];
    
    // Richiedi gli eventi futuri con il leagueId corretto
    const response = await axios.get(`${API_BASE_URL}/eventsnext.php?id=${leagueId}`);
    console.log("Risposta API eventi futuri:", response.data);
    return response.data.events || [];
  } catch (error) {
    console.error("Errore nel recupero delle partite future della Super League Greca:", error);
    return [];
  }
};

// Funzione per ottenere i dettagli di una singola partita
export const getMatchDetails = async (matchId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/lookupevent.php?id=${matchId}`);
    return response.data.events ? response.data.events[0] : null;
  } catch (error) {
    console.error("Errore nel recupero dei dettagli della partita:", error);
    return null;
  }
};

// Funzione per ottenere tutte le squadre della Super League Greca
export const getGreekSuperLeagueTeams = async () => {
  try {
    const leagueId = await getGreekSuperLeagueId();
    if (!leagueId) return [];
    
    // Usa il leagueId dinamico per richiedere le squadre della lega
    const response = await axios.get(`${API_BASE_URL}/lookup_all_teams.php?id=${leagueId}`);
    console.log("Squadre Super League Greca:", response.data);
    return response.data.teams || [];
  } catch (error) {
    console.error("Errore nel recupero delle squadre greche:", error);
    return [];
  }
};
  
// Funzione per ottenere gli eventi per team
export const getTeamLastEvents = async (teamId) => {
  try {
    // Verifica che l'ID della squadra appartenga a una squadra greca
    const teamCheck = await axios.get(`${API_BASE_URL}/lookupteam.php?id=${teamId}`);
    const team = teamCheck.data.teams?.[0];
    
    if (!team || team.strCountry !== "Greece") {
      console.warn(`Il team ${teamId} non è una squadra greca valida`);
      return [];
    }
    
    const response = await axios.get(`${API_BASE_URL}/eventslast.php?id=${teamId}`);
    console.log(`Ultimi eventi squadra ${teamId}:`, response.data);
    return response.data.results || response.data.events || [];
  } catch (error) {
    console.error(`Errore nel recupero degli eventi della squadra ${teamId}:`, error);
    return [];
  }
};

// Funzione per ottenere le partite della stagione corrente della Super League Greca
export const getGreekSuperLeagueCurrentMatches = async () => {
  try {
    const leagueId = await getGreekSuperLeagueId();
    if (!leagueId) return [];
    
    // Nota: controlla che la stagione sia quella desiderata; se i dati sono incompleti, valuta l'uso di un altro endpoint
    const response = await axios.get(`${API_BASE_URL}/eventsseason.php?id=${leagueId}&s=2024-2025`);
    console.log("Partite stagione corrente Super League Greca:", response.data);
    
    // Ordina le partite per data (dalle più recenti)
    const matches = response.data.events || [];
    return matches.sort((a, b) => new Date(b.dateEvent) - new Date(a.dateEvent));
  } catch (error) {
    console.error("Errore nel recupero delle partite correnti:", error);
    return [];
  }
};
