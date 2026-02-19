// SetTeamTwo.js
import React, { useState } from 'react';
import './SetTeam.css';
import LogoFetcher from '../LogoFetcher/LogoFetcher';

import { ALL_LOGOS } from '../../../utils/LogoConstants';

// Definizione di un array di loghi di default, nel caso il componente padre non li passi
const defaultLogos = ALL_LOGOS;

const SetTeamTwo = ({
  logos = defaultLogos,
  selectedLogo2,
  setSelectedLogo2,
  uploadedLogo2,
  setUploadedLogo2,
  scorersTeam2,
  setScorersTeam2
}) => {
  const [showFetcher, setShowFetcher] = useState(false);

  // Funzione per gestire l'upload del logo da PC
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedLogo2(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Funzione per aggiornare i marcatori della Squadra 2
  const handleScorerChange = (index, value) => {
    const newScorers = [...scorersTeam2];
    newScorers[index] = value;
    setScorersTeam2(newScorers);
  };

  return (
    <div className="logo-section">
      <h3 className='logo-text'>Logo Squadra 2</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select
          value={selectedLogo2}
          onChange={(e) => setSelectedLogo2(e.target.value)}
        >
          {logos.map((logo, index) => (
            <option key={index} value={logo}>
              {logo.split('/').pop().replace('.png', '')}
            </option>
          ))}
        </select>
        <button className="upload-logo" onClick={() => document.getElementById('logoUpload2').click()}>
          Carica Logo
        </button>
        <button className="upload-logo" style={{ backgroundColor: '#007bff' }} onClick={() => setShowFetcher(true)}>
          Cerca Web
        </button>
        <input
          type="file"
          id="logoUpload2"
          accept="image/*"
          onChange={handleLogoUpload}
          style={{ display: 'none' }}
        />
      </div>
      {showFetcher && (
        <LogoFetcher
          onLogoSelect={setUploadedLogo2}
          onClose={() => setShowFetcher(false)}
        />
      )}
      <div className="scorer-section">
        <h4 className='text-marcatori'>Marcatori Squadra 2</h4>
        {scorersTeam2.map((scorer, index) => (
          <input
            className="scorer-input"
            key={index}
            type="text"
            placeholder={`Marcatore ${index + 1}`}
            value={scorer}
            onChange={(e) => handleScorerChange(index, e.target.value)}
          />
        ))}
      </div>
    </div>
  );
};

export default SetTeamTwo;
