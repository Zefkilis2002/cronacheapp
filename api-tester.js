// api-tester.js
import axios from "axios";

const API_BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";

// Funzione per testare diversi endpoint per la Super League greca
async function testAPIs() {
  console.log("Inizializzazione test API...");
  
  try {
    // Test 1: Informazioni sulla lega
    console.log("\n--- Test 1: Informazioni sulla lega ---");
    const leagueInfo = await axios.get(`${API_BASE_URL}/lookup_all_leagues.php?c=Greece`);
    console.log("Leghe in Grecia:", leagueInfo.data);
    
    // Qui potresti trovare l'ID corretto della Super League greca
    const greekLeagues = leagueInfo.data.leagues || [];
    greekLeagues.forEach(league => {
      console.log(`- ${league.strLeague} (ID: ${league.idLeague})`);
    });
    
    // Test 2: Eventi recenti (metodo alternativo)
    console.log("\n--- Test 2: Eventi recenti (metodo alternativo) ---");
    const recentEvents = await axios.get(`${API_BASE_URL}/eventspastleague.php?id=4336`);
    console.log("Eventi recenti (pastleague):", recentEvents.data);
    
    // Test 3: Eventi dell'ultima settimana
    console.log("\n--- Test 3: Eventi dell'ultima settimana ---");
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const formattedDate = oneWeekAgo.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    const eventsLastWeek = await axios.get(`${API_BASE_URL}/eventsday.php?d=${formattedDate}`);
    console.log(`Eventi del ${formattedDate}:`, eventsLastWeek.data);
    
    // Test 4: Cerca squadre greche e usa i loro ID
    console.log("\n--- Test 4: Squadre greche ---");
    const greekTeams = await axios.get(`${API_BASE_URL}/search_all_teams.php?l=Greek%20Super%20League`);
    console.log("Squadre greche:", greekTeams.data);
    
    if (greekTeams.data.teams && greekTeams.data.teams.length > 0) {
      const sampleTeam = greekTeams.data.teams[0];
      console.log(`\n--- Test 5: Eventi recenti per ${sampleTeam.strTeam} (ID: ${sampleTeam.idTeam}) ---`);
      
      const teamEvents = await axios.get(`${API_BASE_URL}/eventslast.php?id=${sampleTeam.idTeam}`);
      console.log(`Eventi recenti per ${sampleTeam.strTeam}:`, teamEvents.data);
    }
    
  } catch (error) {
    console.error("Errore durante i test API:", error.message);
    if (error.response) {
      console.error("Dettagli errore:", error.response.data);
    }
  }
}

// Esegui i test
testAPIs().then(() => console.log("Test completati."));