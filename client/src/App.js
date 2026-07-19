import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar/NavBar";
import FullTimeEditor from "./FullTimeEditor/FullTimeEditor";
import NewsEditor from "./NewsEditor/NewsEditor"; // Assicurati che il nome dell'import corrisponda al file
import BioCreator from "./BioCreator/BioCreator";
import Classifica from "./Classifica/Classifica";
import LineUp from "./LineUp/LineUp";
import { startServerKeepAlive } from "./utils/serverWarmup";
import "./App.css";

function App() {
  // Sveglia il backend (Render) all'avvio e tienilo caldo: evita il cold
  // start di 30-60s alla prima ricerca loghi / import Flashscore
  useEffect(() => {
    startServerKeepAlive();
  }, []);

  return (
    <div className="App">
      <NavBar />
      <div className="content-container">
        <Routes>
          <Route path="/" element={<FullTimeEditor />} />
          <Route path="/news" element={<NewsEditor />} />
          {/* Route aggiuntiva esplicita */}
          <Route path="/fulltime" element={<FullTimeEditor />} />
          <Route path="/bio-creator" element={<BioCreator />} />
          <Route path="/classifica" element={<Classifica />} />
          <Route path="/lineup" element={<LineUp />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;