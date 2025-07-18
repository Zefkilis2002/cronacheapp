// TabellinoControls.js - Versione migliorata per immagini complete
import React, { useState } from 'react';
import axios from 'axios';
import './TabellinoControls.css';

function TabellinoControls({
  stageRef,
  borderRef,
  selectedTabellino,
  setSelectedTabellino,
  instagramLink,
  setInstagramLink,
  setInstagramImage,
  score1,
  setScore1,
  score2,
  setScore2,
  setUserImage
}) {

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [carouselImages, setCarouselImages] = useState([]);
  const [showCarouselSelector, setShowCarouselSelector] = useState(false);
  const [selectedCarouselIndex, setSelectedCarouselIndex] = useState(0);
  const [imageQualityInfo, setImageQualityInfo] = useState(null);

  // Funzione migliorata per gestire l'upload dell'immagine
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageUrl = ev.target.result;
      
      // Verifica le dimensioni dell'immagine caricata
      const img = new Image();
      img.onload = () => {
        console.log(`Immagine caricata: ${img.width}x${img.height}`);
        setImageQualityInfo({
          width: img.width,
          height: img.height,
          source: 'upload',
          aspectRatio: (img.width / img.height).toFixed(2)
        });
      };
      img.src = imageUrl;
      
      setUserImage(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  // Funzione migliorata per il download che preserva l'aspect ratio
  const downloadImage = () => {
    const stage = stageRef.current;
    if (!stage) {
      alert('Stage non disponibile.');
      return;
    }

    try {
      // Nascondi il bordo
      if (borderRef?.current) {
        borderRef.current.visible(false);
      }

      // Salva lo stato corrente
      const currentScale = stage.scale();
      const currentSize = {
        width: stage.width(),
        height: stage.height()
      };

      // Imposta dimensioni per export ad alta qualità
      const exportWidth = 1440;
      const exportHeight = 1800;
      
      stage.scale({ x: 1, y: 1 });
      stage.size({
        width: exportWidth,
        height: exportHeight
      });
      stage.batchDraw();

      // Genera immagine ad alta qualità
      const uri = stage.toDataURL({
        x: 0,
        y: 0,
        width: exportWidth,
        height: exportHeight,
        pixelRatio: 2, // Aumentato per migliore qualità
        mimeType: 'image/jpeg',
        quality: 0.95 // Qualità massima
      });

      // Ripristina lo stato
      stage.scale(currentScale);
      stage.size(currentSize);
      if (borderRef?.current) {
        borderRef.current.visible(true);
      }
      stage.batchDraw();

      // Download
      const link = document.createElement('a');
      link.download = `tabellino_${Date.now()}.jpg`;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Errore durante il download:', error);
      alert('Errore durante il download dell\'immagine.');
    }
  };

  const getInstagramUrl = (instaLink) => {
    if (!instaLink || typeof instaLink !== 'string') {
      return null;
    }

    try {
      const trimmedLink = instaLink.trim();

      if (!trimmedLink.includes('/') && !trimmedLink.includes('.')) {
        return `https://www.instagram.com/p/${trimmedLink}/`;
      }

      if (trimmedLink.includes('/p/')) {
        const match = trimmedLink.match(/\/p\/([^/]+)/);
        if (match && match[1]) {
          return `https://www.instagram.com/p/${match[1]}/`;
        }
      }

      const possibleCode = trimmedLink.split('/').pop().split('?')[0];
      if (possibleCode && possibleCode.length > 5) {
        return `https://www.instagram.com/p/${possibleCode}/`;
      }

      return null;
    } catch (error) {
      console.error("Errore nell'analisi dell'URL:", error);
      return null;
    }
  };

  const checkServerConnection = async () => {
    setErrorMessage('');
    try {
      return true;
    } catch (error) {
      console.error("Errore di connessione:", error);
      const errorMsg = error.code === 'ECONNREFUSED' 
        ? "Server non attivo. Avvia il server con 'npm run server'."
        : `Errore server: ${error.message}`;
      setErrorMessage(errorMsg);
      alert(errorMsg);
      return false;
    }
  };

  // Funzione migliorata per selezionare immagini dal carosello
  const selectCarouselImage = async (imageUrl) => {
    console.log("Selezione immagine dal carosello:", imageUrl.substring(0, 100) + '...');
    
    try {
      // Precarica l'immagine per verificarne le dimensioni
      const imageInfo = await getImageInfo(imageUrl);
      
      if (imageInfo.error) {
        throw new Error('Immagine non accessibile');
      }
      
      console.log(`Immagine selezionata: ${imageInfo.width}x${imageInfo.height}`);
      
      setImageQualityInfo({
        width: imageInfo.width,
        height: imageInfo.height,
        source: 'instagram',
        aspectRatio: imageInfo.aspectRatio,
        url: imageUrl
      });
      
      setInstagramImage(imageUrl);
      setShowCarouselSelector(false);
      
    } catch (error) {
      console.error("Errore nel caricamento dell'immagine:", error);
      alert("Errore nel caricamento dell'immagine. Prova con un'altra.");
    }
  };

  // Funzione migliorata per recuperare post Instagram
  const fetchInstagramPost = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setCarouselImages([]);
    setShowCarouselSelector(false);
    setImageQualityInfo(null);
  
    if (!(await checkServerConnection())) {
      setIsLoading(false);
      return;
    }
  
    try {
      const instagramUrl = getInstagramUrl(instagramLink);
      if (!instagramUrl) {
        throw new Error("Link Instagram non valido");
      }
  
      console.log("Recupero immagine da:", instagramUrl);
  
      const response = await axios.get('http://localhost:5000/api/instagram-image', {
        params: {
          url: encodeURIComponent(instagramUrl),
          getCarouselImages: true,
          quality: 'original',
        },
        timeout: 60000
      });
  
      if (!response.data || !response.data.status) {
        throw new Error('Risposta server non valida');
      }
  
      const { imageUrl, carouselImages: carousel, imageCount, quality } = response.data;
  
      if (carousel && carousel.length > 1) {
        setCarouselImages(carousel);
        setShowCarouselSelector(true);
  
        const firstImageInfo = await getImageInfo(carousel[0]);
  
        setImageQualityInfo({
          width: firstImageInfo.width,
          height: firstImageInfo.height,
          source: 'instagram',
          aspectRatio: firstImageInfo.aspectRatio,
          quality: quality,
          isCarousel: true,
          totalImages: imageCount
        });
  
        setInstagramImage(carousel[0]);
        alert(`Carosello con ${imageCount} immagini caricato in qualità ${quality}. Dimensioni: ${firstImageInfo.width}x${firstImageInfo.height}`);
      } else if (imageUrl) {
        const imageInfo = await getImageInfo(imageUrl);
  
        setImageQualityInfo({
          width: imageInfo.width,
          height: imageInfo.height,
          source: 'instagram',
          aspectRatio: imageInfo.aspectRatio,
          quality: quality,
          isCarousel: false
        });
  
        setInstagramImage(imageUrl);
        alert(`Immagine caricata in qualità ${quality}. Dimensioni: ${imageInfo.width}x${imageInfo.height}`);
      } else {
        throw new Error("Nessuna immagine trovata nel post");
      }
  
    } catch (error) {
      console.error("Errore dettagliato:", error);
      let errorMsg = `Errore: ${error.message}`;
      if (error.response) {
        switch (error.response.status) {
          case 404: errorMsg = "Post non trovato."; break;
          case 403: errorMsg = "Post privato o protetto."; break;
          case 429: errorMsg = "Troppi tentativi."; break;
          case 500: errorMsg = "Errore del server."; break;
          default: errorMsg = `Errore sconosciuto: ${error.response.status}`; break;
        }
      }
      setErrorMessage(errorMsg);
      alert(errorMsg);
      setInstagramImage(null);
      setImageQualityInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Removed preloadImages function

  // Funzione per ottenere informazioni dettagliate sull'immagine
  const getImageInfo = (imageUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: (img.width / img.height).toFixed(2),
          resolution: img.width * img.height,
          url: imageUrl,
          error: false
        });
      };
      
      img.onerror = () => {
        resolve({
          width: 0,
          height: 0,
          aspectRatio: 0,
          resolution: 0,
          url: imageUrl,
          error: true
        });
      };
      
      img.src = imageUrl;
    });
  };

  return (
    <div className="controls-top">
      
      {/* Selettore tabellino */}
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

      {/* Caricamento immagine */}
      <h3>Carica sfondo:</h3>
      <input 
        className='instagramInput'
        type="text"
        placeholder="Enter Instagram Post Link"
        value={instagramLink}
        onChange={(e) => setInstagramLink(e.target.value)}
        disabled={isLoading}
      />

      {/* Pulsanti caricamento */}
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
        
        <input
          id="fileUpload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Informazioni qualità immagine */}
      {imageQualityInfo && (
        <div className="image-quality-info" style={{ 
          background: 'rgba(180, 255, 0, 0.1)', 
          padding: '10px', 
          borderRadius: '5px',
          margin: '10px 0',
          fontSize: '12px',
          color: '#b4ff00'
        }}>
          <div><strong>Dimensioni:</strong> {imageQualityInfo.width}x{imageQualityInfo.height}</div>
          <div><strong>Aspect Ratio:</strong> {imageQualityInfo.aspectRatio}</div>
          <div><strong>Sorgente:</strong> {imageQualityInfo.source}</div>
          {imageQualityInfo.quality && (
            <div><strong>Qualità:</strong> {imageQualityInfo.quality}</div>
          )}
          {imageQualityInfo.isCarousel && (
            <div><strong>Carosello:</strong> {imageQualityInfo.totalImages} immagini</div>
          )}
        </div>
      )}

      {/* Messaggio di errore */}
      {errorMessage && (
        <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>
          {errorMessage}
        </div>
      )}

      {/* Selettore carosello */}
      {showCarouselSelector && carouselImages.length > 0 && (
        <div className="carousel-selector">
          <h4>Seleziona immagine dal carosello:</h4>
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
                  alt={`Immagine ${index + 1}`}
                  style={{ 
                    width: '100px', 
                    height: '100px', 
                    objectFit: 'cover',
                    border: index === selectedCarouselIndex ? '3px solid #b4ff00' : '1px solid #ccc'
                  }}
                />
                <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '12px', color: '#b4ff00' }}>
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controlli risultato */}
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

        <button className="download-button" onClick={downloadImage}>
          Download HD
        </button>
      </div>
    </div>
  );
}

export default TabellinoControls;