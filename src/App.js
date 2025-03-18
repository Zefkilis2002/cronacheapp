import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar/NavBar";
import FullTimeEditor from "./FullTimeEditor/FullTimeEditor";
import NewsEditor from "./NewsEditor/NewsEditor"; // Assicurati che il nome dell'import corrisponda al file
import BioCreator from "./BioCreator/BioCreator";
import "./App.css"; 

function App() {
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
        </Routes>
      </div>
    </div>
  );
}

export default App;