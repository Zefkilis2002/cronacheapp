import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar/NavBar";
import FullTimeEditor from "./FullTimeEditor/FullTimeEditor";
import News from "./NewsEditor/NewsEditor";
import "./App.css"; 

function App() {
  return (
    <div className="App">
      <NavBar />
      <Routes>
        <Route path="/" element={<FullTimeEditor />} />
        <Route path="/news" element={<News />} />
      </Routes>
    </div>
  );
}

export default App;