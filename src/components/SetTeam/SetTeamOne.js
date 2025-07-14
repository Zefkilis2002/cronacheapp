// SetTeamOne.js
import React from 'react';
import './SetTeam.css';

// Se il padre non passa l'array di loghi, puoi definirlo come default:
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
  '/loghi/grecia.png',
  '/loghi/ael.png',
  '/loghi/giannina.png',
  '/loghi/kalamata.png',
  '/loghi/kifisia.png',
  '/loghi/panionios.png',
  '/loghi/iraklis.png'
];

const SetTeamOne = ({
  logos = defaultLogos,
  selectedLogo1,
  setSelectedLogo1,
  setUploadedLogo1,
  scorersTeam1,
  setScorersTeam1
}) => {

  // Funzione per gestire il caricamento del logo da PC
  const handleLogoUpload1 = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedLogo1(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Funzione per aggiornare il testo dei marcatori
  const handleScorerChange = (index, value) => {
    const newScorers = [...scorersTeam1];
    newScorers[index] = value;
    setScorersTeam1(newScorers);
  };

  return (
    <div className="logo-section">
      <h3 className='logo-text'>Logo Squadra 1</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select
          value={selectedLogo1}
          onChange={(e) => setSelectedLogo1(e.target.value)}
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
          id="logoUpload1"
          accept="image/*"
          onChange={handleLogoUpload1}
          style={{ display: 'none' }}
        />
      </div>
      <div className="scorer-section">
        <h4 className='text-marcatori'>Marcatori Squadra 1</h4>
        {scorersTeam1.map((scorer, index) => (
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

export default SetTeamOne;
