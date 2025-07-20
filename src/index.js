import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import './fonts.css';

// Previeni solo il doppio tap per lo zoom, mantieni tutto il resto
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault(); // Previeni doppio tap zoom
  }
  lastTouchEnd = now;
}, { passive: false });

// Previeni zoom da pinch gesture
document.addEventListener('gesturestart', function(event) {
  event.preventDefault();
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);