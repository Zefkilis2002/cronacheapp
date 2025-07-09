// TabellinoControls.js
import React, { useState } from 'react';
import axios from 'axios';
import './TabellinoControls.css';

function TabellinoControls({ 
  stageRef, // Riferimento allo stage (canvas) per il download dell'immagine
  borderRef,
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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [carouselImages, setCarouselImages] = useState([]);
  const [showCarouselSelector, setShowCarouselSelector] = useState(false);
  const [selectedCarouselIndex, setSelectedCarouselIndex] = useState(0);
  // Funzione per gestire il caricamento del file (immagine da device)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUserImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const downloadImage = () => {
    const stage = stageRef.current;
    if (!stage) {
      alert('Stage non disponibile.');
      return;
    }
  
    try {
      // Hide border during export
      if (borderRef?.current) {
        borderRef.current.visible(false);
      }
  
      // Store current state
      const currentScale = stage.scale();
      const currentSize = {
        width: stage.width(),
        height: stage.height()
      };
  
      // Reset to original dimensions for export
      stage.scale({ x: 1, y: 1 });
      stage.size({
        width: 1440,
        height: 1800
      });
      stage.batchDraw();
  
      // Export at original size
      const uri = stage.toDataURL({
        x: 0,
        y: 0,
        width: 1440,
        height: 1800,
        pixelRatio: 1,
        mimeType: 'image/jpeg',
        quality: 0.8
      });
  
      // Restore original state
      stage.scale(currentScale);
      stage.size(currentSize);
      if (borderRef?.current) {
        borderRef.current.visible(true);
      }
      stage.batchDraw();
  
      // Download
      const link = document.createElement('a');
      link.download = 'full_time_result.jpg';
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error during image download:', error);
      alert('Errore durante il download dell\'immagine.');
    }
  };
  
  
  
  

  // Funzione migliorata per estrarre l'URL del post Instagram
  const getInstagramUrl = (instaLink) => {
    if (!instaLink || typeof instaLink !== 'string') {
      return null;
    }
  
    try {
      const trimmedLink = instaLink.trim();
      
      // Caso 1: Solo codice del post (es. "ABC123")
      if (!trimmedLink.includes('/') && !trimmedLink.includes('.')) {
        return `https://www.instagram.com/p/${trimmedLink}/`;
      }
      
      // Caso 2: URL completo o parziale con "/p/"
      if (trimmedLink.includes('/p/')) {
        const match = trimmedLink.match(/\/p\/([^/]+)/);  // Remove unnecessary escapes
        if (match && match[1]) {
          return `https://www.instagram.com/p/${match[1]}/`;
        }
      }
      
      // Caso 3: Tentativi alternativi
      const possibleCode = trimmedLink.split('/').pop().split('?')[0];
      if (possibleCode && possibleCode.length > 5) { // Codici Instagram sono solitamente lunghi
        return `https://www.instagram.com/p/${possibleCode}/`;
      }
      
      console.log("Nessun codice post valido trovato");
      return null;
    } catch (error) {
      console.error("Errore nell'analisi dell'URL Instagram:", error);
      return null;
    }
  };

  // Funzione migliorata per verificare la connessione al server
  const checkServerConnection = async () => {
    setErrorMessage('');
    try {
      console.log("Tentativo di connessione al server...");
      const response = await axios.get('http://localhost:5000/api/health-check', {
        timeout: 5000
      });
      console.log("Risposta health-check:", response.data);
      return true;
    } catch (error) {
      console.error("Errore di connessione al server:", error);
      if (error.code === 'ECONNREFUSED') {
        const errorMsg = "Impossibile connettersi al server proxy. Il server non è attivo sulla porta 5000. Prova ad avviarlo manualmente con 'npm run server'.";
        setErrorMessage(errorMsg);
        alert(errorMsg);
      } else {
        const errorMsg = `Impossibile connettersi al server proxy. Errore: ${error.message}`;
        setErrorMessage(errorMsg);
        alert(errorMsg);
      }
      return false;
    }
  };

  // Funzione per gestire la selezione di un'immagine dal carosello
  const selectCarouselImage = (imageUrl) => {
    setInstagramImage(imageUrl);
    setShowCarouselSelector(false);
  };

  // Funzione migliorata per caricare l'immagine da Instagram
  const fetchInstagramPost = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setCarouselImages([]);
    setShowCarouselSelector(false);
    
    if (!(await checkServerConnection())) {
      setIsLoading(false);
      return;
    }

    try {
      const instagramUrl = getInstagramUrl(instagramLink);
      console.log("Instagram URL:", instagramUrl);
  
      if (!instagramUrl) {
        const errorMsg = "Link Instagram non valido.\nFormati accettati:\n- URL completo (es: https://www.instagram.com/p/ABC123)\n- Solo codice (es: ABC123)";
        setErrorMessage(errorMsg);
        alert(errorMsg);
        setIsLoading(false);
        return;
      }
  
      // Richiesta al server proxy con timeout aumentato
      const serverUrl = 'http://localhost:5000/api/instagram-image';
      console.log("Chiamata al server:", serverUrl);
      
      const response = await axios.get(serverUrl, {
        params: { 
          url: encodeURIComponent(instagramUrl),
          getCarouselImages: true  // Parametro per richiedere tutte le immagini del carosello
        },
        timeout: 30000  // Timeout aumentato a 30 secondi
      });
      
      console.log("Risposta API completa:", JSON.stringify(response.data, null, 2));
  
      // Gestione delle immagini del carosello
      if (response.data && response.data.carouselImages && response.data.carouselImages.length > 1) {
        // Abbiamo più immagini nel carosello
        setCarouselImages(response.data.carouselImages);
        setShowCarouselSelector(true);
        
        // Mostra l'anteprima della prima immagine
        setInstagramImage(response.data.carouselImages[0]);
        console.log("Trovate immagini multiple in un carosello:", response.data.carouselImages.length);
        
        // Notifica all'utente che ci sono più immagini disponibili
        alert(`Questo post contiene ${response.data.carouselImages.length} immagini. Puoi selezionare quella che preferisci dal selettore qui sotto.`);
      }
      // Gestione per immagine singola
      else if (response.data && response.data.imageUrl) {
        setInstagramImage(response.data.imageUrl);
        console.log("Immagine singola caricata:", response.data.imageUrl);
      } 
      else if (response.data && response.data.result && response.data.result.length > 0) {
        // Supporta anche il formato originale della risposta
        setInstagramImage(response.data.result[0].url);
        console.log("Immagine caricata da formato risposta precedente:", response.data.result[0].url);
      } 
      else {
        const errorMsg = "Nessuna immagine trovata nel post Instagram";
        setErrorMessage(errorMsg);
        alert(errorMsg);
        setInstagramImage(null);
      }
    } catch (error) {
      // Log più dettagliato per diagnosticare il problema
      console.error("Errore dettagliato:", error);
      let errorMsg = `Errore nel caricamento: ${error.message}`;
      
      if (error.response) {
        console.error("Dati risposta:", error.response.data);
        console.error("Status:", error.response.status);
        
        // Messaggi di errore più specifici in base al codice di stato
        if (error.response.status === 404) {
          errorMsg = "Immagine non trovata su Instagram. Verifica che il link sia corretto e che l'immagine sia pubblica.";
        } else if (error.response.status === 403) {
          errorMsg = "Instagram ha bloccato la richiesta. Prova a utilizzare l'opzione 'Carica immagine da file' invece.";
        } else if (error.response.status >= 500) {
          errorMsg = "Errore del server Instagram. Riprova più tardi o utilizza l'opzione 'Carica immagine da file'.";
        }
      } else if (error.request) {
        console.error("Nessuna risposta ricevuta. Richiesta:", error.request);
        errorMsg = "Nessuna risposta dal server. Verifica la connessione internet e che il server proxy sia attivo.";
      } else {
        console.error("Errore di configurazione:", error.message);
        errorMsg = `Errore di configurazione: ${error.message}`;
      }
      
      setErrorMessage(errorMsg);
      alert(errorMsg);
      setInstagramImage(null);
    } finally {
      setIsLoading(false);
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
        <option value="worldcup.png">World Cup</option>
        <option value="youthleague.png">Youth League</option>
        <option value="superleague2.png">Superleague 2</option>
        <option value="friendly.png">Friendly</option>
      </select>

      {/* 2) Importazione immagine da Instagram */}
      <h3>Carica sfondo:</h3>
      <input className='instagramInput'
        type="text"
        placeholder="Enter Instagram Post Link"
        value={instagramLink}
        onChange={(e) => setInstagramLink(e.target.value)}
        disabled={isLoading}
      />

      {/* 3) Pulsanti per caricare immagine da Instagram o da dispositivo */}
      <div className="upload-button">
        <button 
          className="instagramButton" 
          onClick={fetchInstagramPost}
          disabled={isLoading}
        >
          {isLoading ? 'Caricamento...' : 'Load Instagram Post'}
        </button>
        
        <button 
          className="customFileUpload" 
          onClick={() => document.getElementById('fileUpload').click()}
          disabled={isLoading}
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

      {/* Messaggio di errore */}
      {errorMessage && (
        <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>
          {errorMessage}
        </div>
      )}

      {/* Selettore immagini carosello */}
      {showCarouselSelector && carouselImages.length > 0 && (
        <div className="carousel-selector">
          <h4>Seleziona un'immagine dal carosello:</h4>
          <div className="carousel-images">
            {carouselImages.map((imageUrl, index) => (
              <div 
                key={`carousel-${index}`} 
                onClick={() => {
                  setSelectedCarouselIndex(index);
                  selectCarouselImage(imageUrl);
                }}
                className={`carousel-image-item ${index === selectedCarouselIndex ? 'selected' : ''}`}
              >
                <img 
                  src={imageUrl} 
                  alt={`Carosello immagine ${index + 1}`}
                /> 
                <div style={{ textAlign: 'center', marginTop: '2px', fontSize: '12px', color: '#b4ff00' }}>
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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