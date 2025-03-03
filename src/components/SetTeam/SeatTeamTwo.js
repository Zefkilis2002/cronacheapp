// SetTeamTwo.js
import React from 'react';
import './SetTeam.css';

// Definizione di un array di loghi di default, nel caso il componente padre non li passi
const defaultLogos = [
  '/loghi/panathinaikos.png',
  '/loghi/olympiakos.png',
  '/loghi/panetolikos.png',
  '/loghi/ofi.png',
  '/loghi/panseraikos.png',
  '/loghi/paok.png',
  '/loghi/lamia.png',
  '/loghi/aris.png',
  '/loghi/asteras.png',
  '/loghi/kallithea.png',
  '/loghi/aek.png',
  '/loghi/volos.png',
  '/loghi/levadiakos.png',
  '/loghi/atromitos.png',
  '/loghi/grecia.png'
];

const SetTeamTwo = ({
  logos = defaultLogos,
  selectedLogo2,
  setSelectedLogo2,
  uploadedLogo2,
  setUploadedLogo2,
  scorersTeam2,
  setScorersTeam2
}) => {
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
        <button className="upload-logo" onClick={() => document.getElementById('logoUpload1').click()}>
          Carica Logo
        </button>
        <input
          type="file"
          id="logoUpload2"
          accept="image/*"
          onChange={handleLogoUpload}
          style={{ display: 'none' }}
        />
      </div>
      <div className="scorer-section">
        <h4 className='text-marcatori'>Marcatori Squadra 2</h4>
        {scorersTeam2.map((scorer, index) => (
          <input
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
