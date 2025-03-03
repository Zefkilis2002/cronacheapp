// TabellinoControls.js
import React from 'react';
import axios from 'axios';
import './TabellinoControls.css';

const apiKey = '0492423a86msh6a8d77856db490ep134881jsn7586b721b29f';

function TabellinoControls({ 
  stageRef, // Riferimento allo stage (canvas) per il download dell'immagine
  selectedTabellino, // Tabellino selezionato 
  setSelectedTabellino, // Funzione per impostare il tabellino selezionato
  instagramLink, // Link Instagram
  setInstagramLink, // Funzione per impostare il link Instagram
  score1, // Risultato Squadra 1
  setScore1, // Funzione per impostare il risultato Squadra 1
  score2, // Risultato Squadra 2
  setScore2, // Funzione per impostare il risultato Squadra 2
  setUserImage // Funzione per impostare l'immagine dell'utente
}) {
  
  // Funzione per gestire il caricamento del file (immagine da device)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUserImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Funzione per estrarre il codice del post da un URL di Instagram
  const extractPostCode = (url) => {
    const match = url.match(/\/p\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  // Funzione per caricare l'immagine da Instagram
  const fetchInstagramImage = async () => {
    try {
      const postCode = extractPostCode(instagramLink);
      if (!postCode) {
        return alert('Per favore inserisci un link Instagram valido.');
      }

      const url = `https://instagram-scraper-api3.p.rapidapi.com/media_info?code_or_id_or_url=${postCode}`;
      const response = await axios.get(url, {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'instagram-scraper-api3.p.rapidapi.com',
        },
      });

      if (
        response.data &&
        response.data.data &&
        response.data.data.items[0].image_versions2
      ) {
        const imageUrl = response.data.data.items[0].image_versions2.candidates[0].url;
        console.log('Fetched image URL:', imageUrl);
        setUserImage(imageUrl);
      } else {
        alert('Il post è privato, non valido o non accessibile.');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        alert('Il post non è stato trovato o il link è invalido.');
      } else {
        alert(`Errore durante il fetch: ${error.message}`);
      }
    }
  };

  // Funzione per il download dell'immagine dal canvas (usando lo stageRef passato)
  const downloadImage = () => {
    if (!stageRef?.current) {
      alert('Stage non disponibile o non passato come prop.');
      return;
    }
    const uri = stageRef.current.toDataURL({ pixelRatio: 3 });
    const link = document.createElement('a');
    link.download = 'full_time_result.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Renderizzazione del componente
  return (
    <div className="controls-top">
      
      {/* 1) Scelta del tabellino */}
      <label htmlFor="tabellinoSelect">Scegli Tabellino:</label>
      <select
        id="tabellinoSelect"
        value={selectedTabellino}
        onChange={(e) => setSelectedTabellino(e.target.value)}
      >
        <option value="superleague.png">Superleague</option>
        <option value="nationsleague.png">Nations League</option>
        <option value="europaleague.png">Europa League</option>
        <option value="conferenceleague.png">Conference League</option>
        <option value="championsleague.png">Champions League</option>
        <option value="greekcup.png">Greek Cup</option>
      </select>

      {/* 2) Importazione immagine da Instagram */}
      <h3>Carica sfondo:</h3>
      <input className='instagramInput'
        type="text"
        placeholder="Enter Instagram Post Link"
        value={instagramLink}
        onChange={(e) => setInstagramLink(e.target.value)}
      />

      {/* 3) Pulsanti per caricare immagine da Instagram o da dispositivo */}
      <div className="upload-button">
        <button className="instagramButton" onClick={fetchInstagramImage}>
          Load Instagram Image
        </button>
        
        <button 
          className="customFileUpload" 
          onClick={() => document.getElementById('fileUpload').click()}
        >
          Scegli il file
        </button>
        {/* Input nascosto per il caricamento file */}
        <input 
          id="fileUpload" 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload} 
          style={{ display: 'none' }} 
        />
      </div>


      {/* 4) Risultato Squadra 1 e Risultato Squadra 2 */}
      <div className="result-inputs">
        <div className="result-group">
          <label htmlFor="resultTeam1">Score 1:</label>
          <input
            id="resultTeam1"
            type="number"
            value={score1}
            onChange={(e) => setScore1(Number(e.target.value))}
          />
        </div>

        <div className="result-group">
          <label htmlFor="resultTeam2">Score 2:</label>
          <input
            id="resultTeam2"
            type="number"
            value={score2}
            onChange={(e) => setScore2(Number(e.target.value))}
          />
        </div>

        {/* 5) Pulsante Download PNG */}
        <button className="download-button" onClick={downloadImage}>
          Download
        </button>
      </div>
    </div>
  );
}

export default TabellinoControls;
