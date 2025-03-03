import React, { useState } from "react";
import axios from "axios";
import MatchSelector from "../MatchSelector/MatchSelector";  // ✅ IMPORTA MatchSelector

const FullTimePostGenerator = () => {
  const [matchId, setMatchId] = useState(null);
  const [postContent, setPostContent] = useState("");

  const generatePost = async () => {
    if (!matchId) {
      alert("Seleziona una partita prima di generare il post!");
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/api/match/${matchId}`);
      const matchDetails = response.data;

      if (!matchDetails) {
        setPostContent("Nessun evento disponibile per questa partita.");
        return;
      }

      const homeTeam = matchDetails.strHomeTeam;
      const awayTeam = matchDetails.strAwayTeam;
      const homeScore = matchDetails.intHomeScore;
      const awayScore = matchDetails.intAwayScore;
      const stadium = matchDetails.strVenue;
      const date = matchDetails.dateEvent;
      const homeBadge = matchDetails.strHomeTeamBadge;
      const awayBadge = matchDetails.strAwayTeamBadge;

      let postText = `
🏆 Full-Time Result 🏆
📅 ${date}
🏟️ ${stadium}

⚽ ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}

🔵 Loghi delle squadre:
🏠 Casa: ${homeBadge}
🛫 Trasferta: ${awayBadge}
`;

      setPostContent(postText);
    } catch (error) {
      console.error("Errore nel recupero degli eventi:", error);
      setPostContent("Errore nel recupero degli eventi.");
    }
  };

  return (
    <div>
      <h2>Genera Post Full-Time</h2>
      <MatchSelector onSelectMatch={setMatchId} />  {/* ✅ ORA FUNZIONA */}
      <button onClick={generatePost}>Completa Campi</button>
      <textarea value={postContent} readOnly />
    </div>
  );
};

export default FullTimePostGenerator;
