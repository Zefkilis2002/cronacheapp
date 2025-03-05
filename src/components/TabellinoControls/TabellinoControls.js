// TabellinoControls.js
import React from 'react';
import axios from 'axios';
import './TabellinoControls.css';


function TabellinoControls({ 
  stageRef, // Riferimento allo stage (canvas) per il download dell'immagine
  selectedTabellino, // Tabellino selezionato 
  setSelectedTabellino, // Funzione per impostare il tabellino selezionato
  instagramLink, // Link Instagram
  setInstagramLink, // Funzione per impostare il link Instagram
  setInstagramImage, // Funzione per impostare l'immagine da Instagram
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


  // Se l'utente inserisce un link completo o solo il codice, restituisce l'URL completo
  const getInstagramUrl = (instaLink) => {
    if (!instaLink) return null;
    
    try {
      // Se il link contiene "/p/", assumiamo che sia un URL completo.
      if (instaLink.includes('/p/')) {
        // Se manca il protocollo, lo aggiungiamo.
        if (!instaLink.startsWith('http')) {
          return 'https://' + instaLink;
        }
        return instaLink;
      } else {
        // Se l'utente incolla solo il codice, costruiamo l'URL
        const directCode = instaLink.trim();
        if (directCode.length >= 6 && !directCode.includes('/')) {
          return `https://www.instagram.com/p/${directCode}/`;
        }
      }
      return null;
    } catch (error) {
      console.error("Errore nell'analisi dell'URL Instagram:", error);
      return null;
    }
  };
  
  const fetchInstagramPost = async () => {
    try {
      const instagramUrl = getInstagramUrl(instagramLink);
      console.log("Instagram URL:", instagramUrl);
  
      if (!instagramUrl) {
        alert("Link Instagram non valido.\nFormati accettati:\n- URL completo (es: https://www.instagram.com/p/ABC123)\n- Solo codice (es: ABC123)");
        return;
      }
  
      const options = {
        method: 'GET',
        url: 'https://instagram-post-reels-stories-downloader-api.p.rapidapi.com/instagram/',
        params: { url: instagramUrl },
        headers: {
          'x-rapidapi-key': '0492423a86msh6a8d77856db490ep134881jsn7586b721b29f',
          'x-rapidapi-host': 'instagram-post-reels-stories-downloader-api.p.rapidapi.com'
        }
      };
  
      const response = await axios.request(options);
      
      if (!response.data?.result?.[0]?.url) {
        throw new Error("URL dell'immagine non trovato nella risposta");
      }
  
      const imageUrl = response.data.result[0].url;
      console.log("URL immagine trovato:", imageUrl);
  
      // Salva direttamente l'URL invece di convertirlo in base64
      setInstagramImage(imageUrl);
  
    } catch (error) {
      console.error("Errore:", error);
      alert(`Errore nel caricamento: ${error.message}`);
      setInstagramImage(null);
    }
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
      <button className="instagramButton" onClick={fetchInstagramPost}>
        Load Instagram Post
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
