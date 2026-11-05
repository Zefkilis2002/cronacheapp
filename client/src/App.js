import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar/NavBar";
import { startServerKeepAlive } from "./utils/serverWarmup";
import "./App.css";

const FullTimeEditor = lazy(() => import('./FullTimeEditor/FullTimeEditor'));
const NewsEditor = lazy(() => import('./NewsEditor/NewsEditor'));
const BioCreator = lazy(() => import('./BioCreator/BioCreator'));
const Classifica = lazy(() => import('./Classifica/Classifica'));
const LineUp = lazy(() => import('./LineUp/LineUp'));
const LineUpV2 = lazy(() => import('./LineUpV2/LineUpV2'));
const StartingXI = lazy(() => import('./StartingXI/StartingXI'));
const SquadList = lazy(() => import('./SquadList/SquadList'));
const KeyPlayers = lazy(() => import('./KeyPlayers/KeyPlayers'));
const PlayerStats = lazy(() => import('./PlayerStats/PlayerStats'));
const LeagueHistory = lazy(() => import('./LeagueHistory/LeagueHistory'));

function App() {
  // Sveglia il backend (Render) all'avvio e tienilo caldo: evita il cold
  // start di 30-60s alla prima ricerca loghi / import Flashscore
  useEffect(() => {
    return startServerKeepAlive();
  }, []);

  return (
    <div className="App">
      <NavBar />
      <div className="content-container">
        <Suspense fallback={<p role="status">Caricamento editor…</p>}>
        <Routes>
          <Route path="/" element={<FullTimeEditor />} />
          <Route path="/news" element={<NewsEditor />} />
          {/* Route aggiuntiva esplicita */}
          <Route path="/fulltime" element={<FullTimeEditor />} />
          <Route path="/bio-creator" element={<BioCreator />} />
          <Route path="/classifica" element={<Classifica />} />
          <Route path="/lineup" element={<LineUp />} />
          <Route path="/lineup-v2" element={<LineUpV2 />} />
          <Route path="/starting-xi" element={<StartingXI />} />
          <Route path="/squad" element={<SquadList />} />
          <Route path="/keyplayers" element={<KeyPlayers />} />
          <Route path="/player-stats" element={<PlayerStats />} />
          <Route path="/campionati" element={<LeagueHistory />} />
        </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default App;
