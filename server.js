import express from "express";
import cors from "cors";
import { 
  getGreekSuperLeagueMatches, 
  getGreekSuperLeagueFutureMatches,
  getMatchDetails,
  getGreekSuperLeagueTeams,
  getTeamLastEvents
} from "./src/api/apiService.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Endpoint per ottenere partite recenti della Super League Greca
app.get("/api/matches", async (req, res) => {
  try {
    console.log("Richiesta partite recenti Super League");
    const matches = await getGreekSuperLeagueMatches();
    
    if (!matches || matches.length === 0) {
      console.log("Nessuna partita recente trovata, provando con partite future...");
      const futureMatches = await getGreekSuperLeagueFutureMatches();
      
      if (!futureMatches || futureMatches.length === 0) {
        console.log("Nessuna partita futura trovata, provando ad ottenere le squadre...");
        
        // Se non ci sono partite recenti o future, prova a ottenere le squadre
        // e poi le partite recenti della prima squadra trovata
        const teams = await getGreekSuperLeagueTeams();
        
        if (teams && teams.length > 0) {
          console.log(`Trovate ${teams.length} squadre, ottenendo gli eventi per la prima squadra...`);
          const teamEvents = await getTeamLastEvents(teams[0].idTeam);
          res.json(teamEvents);
        } else {
          console.log("Nessuna squadra o partita trovata");
          res.json([]);
        }
      } else {
        res.json(futureMatches);
      }
    } else {
      res.json(matches);
    }
  } catch (error) {
    console.error("Errore nel recupero delle partite:", error);
    res.status(500).json({ 
      error: "Errore nel recupero delle partite", 
      details: error.message
    });
  }
});

// Endpoint per ottenere i dettagli di una partita specifica
app.get("/api/match/:id", async (req, res) => {
  try {
    const matchDetails = await getMatchDetails(req.params.id);
    
    if (!matchDetails) {
      return res.status(404).json({ error: "Dettagli partita non trovati" });
    }
    
    res.json(matchDetails);
  } catch (error) {
    console.error("Errore nel recupero dei dettagli della partita:", error);
    res.status(500).json({ error: "Errore nel recupero dei dettagli della partita" });
  }
});

// Endpoint per ottenere tutte le squadre della Super League Greca
app.get("/api/teams", async (req, res) => {
  try {
    const teams = await getGreekSuperLeagueTeams();
    res.json(teams);
  } catch (error) {
    console.error("Errore nel recupero delle squadre:", error);
    res.status(500).json({ error: "Errore nel recupero delle squadre" });
  }
});

// Endpoint per ottenere gli ultimi eventi di una squadra specifica
app.get("/api/team/:id/events", async (req, res) => {
  try {
    const events = await getTeamLastEvents(req.params.id);
    res.json(events);
  } catch (error) {
    console.error(`Errore nel recupero degli eventi della squadra ${req.params.id}:`, error);
    res.status(500).json({ error: `Errore nel recupero degli eventi della squadra ${req.params.id}` });
  }
});

app.listen(PORT, () => {
  console.log(`Server in esecuzione su http://localhost:${PORT}`);
});