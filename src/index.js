import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import './fonts.css';

// Add this to your index.js or App.js file

// Define lastTap variable
let lastTap = 0;

// Prevent pinch zoom
document.addEventListener('gesturestart', function(e) {
  e.preventDefault();
});

document.addEventListener('gesturechange', function(e) {
  e.preventDefault();
});

document.addEventListener('gestureend', function(e) {
  e.preventDefault();
});

// Prevent double-tap zoom
document.addEventListener('touchend', function(e) {
  const now = Date.now();
  const DOUBLE_TAP_THRESHOLD = 300;
  if (now - lastTap < DOUBLE_TAP_THRESHOLD) {
    e.preventDefault();
  }
  lastTap = now;
}, { passive: false });

// Prevent pull-to-refresh
// Modify the touchmove event listener to only prevent default for multi-touch gestures
document.body.addEventListener('touchmove', function(e) {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);