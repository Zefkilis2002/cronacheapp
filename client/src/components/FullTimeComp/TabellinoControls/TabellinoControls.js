// TabellinoControls.js - Versione migliorata per immagini complete

import React, { useState, useRef } from 'react';
import config from '../../../config';
import { applyAcrSportFilterToSrc, applyUpscaleFilterToSrc } from '../../../filters/acrSport';
import axios from 'axios';
import { saveImage } from '../../../utils/saveImage';
import LogoFetcher from '../LogoFetcher/LogoFetcher';
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
  isPenaltyMatch,
  setIsPenaltyMatch,
  penaltiesScore1,
  setPenaltiesScore1,
  penaltiesScore2,
  setPenaltiesScore2,
  setUserImage,
  competitionLogo,
  setCompetitionLogo
}) {

  const [isLoading, setIsLoading] = useState(false);
  const [showCompetitionFetcher, setShowCompetitionFetcher] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [carouselImages, setCarouselImages] = useState([]);
  const [showCarouselSelector, setShowCarouselSelector] = useState(false);
  const [selectedCarouselIndex, setSelectedCarouselIndex] = useState(0);
  const [imageQualityInfo, setImageQualityInfo] = useState(null);
  // Stato filtro RAW
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);
  const originalUserImageRef = useRef(null);
  const originalInstagramImageRef = useRef(null);
  const filteredUrlRef = useRef(null);
  const currentSourceRef = useRef(null); // 'instagram' | 'user'

  // Funzione migliorata per gestire l'upload dell'immagine
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageUrl = ev.target.result;
      // Memorizza l’originale e la sorgente
      originalUserImageRef.current = imageUrl;
      currentSourceRef.current = 'user';
      setFilterApplied(false);
      if (filteredUrlRef.current) { try { URL.revokeObjectURL(filteredUrlRef.current); } catch (_) { } filteredUrlRef.current = null; }

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

      // Download (gestisce anche iOS Safari/Chrome via Web Share API)
      saveImage(uri, `tabellino_${Date.now()}.jpg`);

    } catch (error) {
      console.error('Errore durante il download:', error);
      alert('Errore durante il download dell\'immagine.');
    }
  };

  // Normalizza qualsiasi forma di link Instagram in un target per il server.
  // Supporta /p/, /reel/, /reels/, /tv/, i link /share/ (redirect risolto lato
  // server) e lo shortcode "nudo".
  const getInstagramUrl = (instaLink) => {
    if (!instaLink || typeof instaLink !== 'string') return null;

    const link = instaLink.trim();
    if (!link) return null;

    // Shortcode nudo (es. C6G2rzmuBoH)
    if (!link.includes('/') && !link.includes('.')) {
      return `https://www.instagram.com/p/${link}/`;
    }

    const absolute = link.startsWith('http') ? link : `https://${link}`;

    // Link condivisi dall'app: il redirect lo segue il server
    if (/instagram\.com\/share\//i.test(absolute)) return absolute;

    const match = absolute.match(/instagram\.com\/(?:[^/?#]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
    if (match) return `https://www.instagram.com/p/${match[1]}/`;

    return null;
  };

  // Le immagini del CDN Instagram passano sempre dal proxy del server
  // (hotlink protection + CORS sul canvas).
  const toProxyUrl = (url) => `${config.API_BASE_URL}/proxy-image?url=${encodeURIComponent(url)}`;

  const checkServerConnection = async () => {
    setErrorMessage('');
    try {
      // Verifica reale della connessione
      await axios.get(`${config.API_BASE_URL}/api/health-check`);
      return true;
    } catch (error) {
      console.error("Errore di connessione:", error);
      // Nessuna risposta HTTP (Network Error / timeout): il server non risponde
      // affatto, non è un problema del post Instagram.
      const errorMsg = !error.response
        ? `Server non raggiungibile (${config.API_BASE_URL}). Avvialo con 'npm run dev:server' o attendi qualche secondo se è appena stato risvegliato.`
        : `Errore server: ${error.message}`;
      setErrorMessage(errorMsg);
      return false;
    }
  };

  // Carica una singola slide (scelta dall'utente o unica del post)
  const selectCarouselImage = async (slide) => {
    const imageUrl = typeof slide === 'string' ? slide : slide?.url;
    if (!imageUrl) return;

    try {
      // Misura l'immagine passando dal proxy (il CDN Instagram blocca l'hotlink)
      const imageInfo = await getImageInfo(toProxyUrl(imageUrl));
      if (imageInfo.error) {
        throw new Error('Immagine non accessibile');
      }

      // Memorizza l'originale e la sorgente
      originalInstagramImageRef.current = imageUrl;
      currentSourceRef.current = 'instagram';
      setFilterApplied(false);
      if (filteredUrlRef.current) { try { URL.revokeObjectURL(filteredUrlRef.current); } catch (_) { } filteredUrlRef.current = null; }

      setImageQualityInfo({
        width: imageInfo.width,
        height: imageInfo.height,
        source: 'instagram',
        aspectRatio: imageInfo.aspectRatio,
        quality: 'original',
        isCarousel: typeof slide === 'object' && slide.totalSlides > 1,
        totalImages: typeof slide === 'object' ? slide.totalSlides : undefined,
        slide: typeof slide === 'object' ? slide.slide : undefined
      });

      // Pulisci l'immagine utente precedente per evitare sovrapposizioni
      setUserImage(null);
      setInstagramImage(imageUrl);
      setShowCarouselSelector(false);
      setErrorMessage('');

    } catch (error) {
      console.error("Errore nel caricamento dell'immagine:", error);
      setErrorMessage("Errore nel caricamento della slide selezionata. Prova con un'altra.");
    }
  };

  // Recupera il post Instagram: se è un carosello mostra il selettore delle
  // slide e attende la scelta dell'utente, altrimenti carica subito l'immagine.
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

      const response = await axios.get(`${config.API_BASE_URL}/api/instagram-image`, {
        params: {
          url: instagramUrl,
          getCarouselImages: true,
          quality: 'original',
        },
        timeout: 60000
      });

      if (!response.data || !response.data.status) {
        throw new Error(response.data?.message || 'Risposta server non valida');
      }

      const { items, carouselImages: legacyCarousel } = response.data;

      // `items` è il contratto nuovo; `carouselImages` resta come fallback
      const slides = (Array.isArray(items) && items.length > 0)
        ? items
        : (legacyCarousel || []).map((url, index) => ({
          index,
          slide: index + 1,
          url,
          thumbnailUrl: url,
          isVideo: false
        }));

      if (slides.length === 0) {
        throw new Error("Nessuna immagine trovata nel post");
      }

      const withTotal = slides.map(item => ({ ...item, totalSlides: slides.length }));

      if (withTotal.length > 1) {
        // Carosello: nessun caricamento automatico, decide l'utente
        setCarouselImages(withTotal);
        setShowCarouselSelector(true);
        setSelectedCarouselIndex(-1);
        setInstagramImage(null);
        setUserImage(null);
      } else {
        setSelectedCarouselIndex(0);
        await selectCarouselImage(withTotal[0]);
      }

    } catch (error) {
      console.error("Errore dettagliato:", error);
      let errorMsg = `Errore: ${error.message}`;
      if (error.response) {
        switch (error.response.status) {
          case 400: errorMsg = "Link Instagram non valido."; break;
          case 404: errorMsg = error.response.data?.message || "Post non trovato."; break;
          case 403: errorMsg = "Post privato o protetto."; break;
          case 429: errorMsg = "Troppi tentativi. Riprova tra qualche minuto."; break;
          case 500: errorMsg = "Errore del server."; break;
          default: errorMsg = `Errore sconosciuto: ${error.response.status}`; break;
        }
      }
      setErrorMessage(errorMsg);
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


  // Applica filtro RAW allo sfondo attivo (instagram > upload)
  const applyRawFilter = async () => {
    const srcType = currentSourceRef.current;
    let srcUrl = null;
    if (srcType === 'instagram' && originalInstagramImageRef.current) {
      // usa lo stesso proxy del Canvas per garantire CORS
      srcUrl = `${config.API_BASE_URL}/proxy-image?url=${encodeURIComponent(originalInstagramImageRef.current)}`;
    } else if (srcType === 'user' && originalUserImageRef.current) {
      srcUrl = originalUserImageRef.current;
    } else {
      alert('Nessuna immagine da filtrare.');
      return;
    }
    setIsFiltering(true);
    try {
      const { url } = await applyAcrSportFilterToSrc(srcUrl);
      // libera eventuale blob precedente
      if (filteredUrlRef.current) { try { URL.revokeObjectURL(filteredUrlRef.current); } catch (_) { } }
      filteredUrlRef.current = url;
      // Per Instagram sposta il risultato su userImage e svuota instagramImage (il Canvas usa il proxy su instagramImage)
      if (srcType === 'instagram') {
        setInstagramImage(null);
        setUserImage(url);
      } else {
        setUserImage(url);
      }
      setFilterApplied(true);
    } catch (err) {
      console.error('Errore filtro RAW:', err);
      alert('Errore durante l’applicazione del filtro RAW: ' + (err.message || err));
    } finally {
      setIsFiltering(false);
    }
  };

  // Applica filtro HD Upscale
  const applyUpscale = async () => {
    const srcType = currentSourceRef.current;
    let srcUrl = null;
    if (srcType === 'instagram' && originalInstagramImageRef.current) {
      srcUrl = `${config.API_BASE_URL}/proxy-image?url=${encodeURIComponent(originalInstagramImageRef.current)}`;
    } else if (srcType === 'user' && originalUserImageRef.current) {
      srcUrl = originalUserImageRef.current;
    } else {
      alert('Nessuna immagine da migliorare.');
      return;
    }
    setIsFiltering(true);
    try {
      const { url } = await applyUpscaleFilterToSrc(srcUrl);
      if (filteredUrlRef.current) { try { URL.revokeObjectURL(filteredUrlRef.current); } catch (_) { } }
      filteredUrlRef.current = url;

      if (srcType === 'instagram') {
        setInstagramImage(null);
        setUserImage(url);
      } else {
        setUserImage(url);
      }
      setFilterApplied(true);
    } catch (err) {
      console.error('Errore Upscale:', err);
      alert('Errore durante il miglioramento HD.');
    } finally {
      setIsFiltering(false);
    }
  };

  // Rimuovi filtro e ripristina la sorgente originale
  const removeRawFilter = () => {
    // Revoca tutti i blob URL filtrati per evitare memory leak
    if (filteredUrlRef.current) {
      try { URL.revokeObjectURL(filteredUrlRef.current); } catch (_) { }
      filteredUrlRef.current = null;
    }
    setFilterApplied(false);
    const srcType = currentSourceRef.current;
    if (srcType === 'instagram' && originalInstagramImageRef.current) {
      setUserImage(null);
      setInstagramImage(originalInstagramImageRef.current);
    } else if (srcType === 'user' && originalUserImageRef.current) {
      setUserImage(originalUserImageRef.current);
    }
    // Non azzerare currentSourceRef — mantieni il tracciamento della sorgente
  };


  return (
    <div className="controls-top">

      {/* Selettore tabellino */}
      <h3><label htmlFor="tabellinoSelect">Scegli Tabellino:</label></h3>
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
        <option value="worldcup2014.png">World Cup 2014</option>
        <option value="euro2004.png">Euro 2004</option>
        <option value="general.png">Generale (logo competizione)</option>
      </select>

      {/* Logo competizione: disponibile solo per il tabellino "Generale".
          Il logo scelto si posiziona automaticamente al centro del tabellino. */}
      {selectedTabellino === 'general.png' && (
        <div className="competition-logo-section">
          <h3><label>Logo Competizione:</label></h3>
          <div className="competition-logo-actions">
            <button
              className="upload-logo"
              style={{ backgroundColor: '#007bff' }}
              onClick={() => setShowCompetitionFetcher(true)}
            >
              Cerca Web
            </button>
            <button
              className="upload-logo"
              onClick={() => document.getElementById('competitionLogoUpload').click()}
            >
              Carica Logo
            </button>
            {competitionLogo && (
              <button
                className="upload-logo"
                style={{ backgroundColor: '#c0392b' }}
                onClick={() => setCompetitionLogo(null)}
              >
                Rimuovi
              </button>
            )}
            <input
              type="file"
              id="competitionLogoUpload"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => setCompetitionLogo(ev.target.result);
                reader.readAsDataURL(file);
              }}
              style={{ display: 'none' }}
            />
          </div>
          {showCompetitionFetcher && (
            <LogoFetcher
              searchMode="competition"
              onLogoSelect={setCompetitionLogo}
              onClose={() => setShowCompetitionFetcher(false)}
            />
          )}
        </div>
      )}

      {/* Caricamento immagine */}
      <h3>Carica sfondo:</h3>

      <div className="instagram-container">
        <input
          className='instagramInput'
          type="text"
          placeholder="Enter Instagram Post Link"
          value={instagramLink}
          onChange={(e) => setInstagramLink(e.target.value)}
          disabled={isLoading}
        />
        <button
          className="load-btn-circle"
          onClick={fetchInstagramPost}
          disabled={isLoading}
          title="Carica post Instagram"
        >
          {isLoading ? '...' : (
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              stroke="#000"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          )}
        </button>
      </div>

      {/* Pulsanti azioni */}
      <div className="action-buttons-row">
        <button
          className="customFileUpload"
          onClick={() => document.getElementById('fileUpload').click()}
          disabled={isLoading}
        >
          File
        </button>

        <input
          id="fileUpload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />


        {/* Nuovi pulsanti filtro */}
        {/* Toggle Button Filtro */}
        <button
          className={filterApplied ? "customFileUpload" : "instagramButton"}
          onClick={filterApplied ? removeRawFilter : applyRawFilter}
          disabled={isLoading || isFiltering || (!originalUserImageRef.current && !originalInstagramImageRef.current)}
          title={filterApplied ? "Rimuovi il filtro e ripristina l'immagine originale" : "Applica il filtro Camera Raw allo sfondo corrente"}
        >
          {isFiltering ? '...' : (filterApplied ? '❌ Filtro' : 'Filtro')}
        </button>

        <button
          className="instagramButton"
          onClick={applyUpscale}
          disabled={isLoading || isFiltering || (!originalUserImageRef.current && !originalInstagramImageRef.current)}
          title="Raddoppia la risoluzione e applica nitidezza"
          style={{ borderColor: '#00ccff', color: '#00ccff' }}
        >
          {isFiltering ? '...' : 'Upscale'}
        </button>
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
          <h4>Post a carosello: {carouselImages.length} slide — quale vuoi caricare?</h4>
          <div className="carousel-images">
            {carouselImages.map((item, index) => (
              <div
                key={`carousel-${item.index ?? index}`}
                onClick={() => {
                  setSelectedCarouselIndex(index);
                  selectCarouselImage(item);
                }}
                className={`carousel-image-item ${index === selectedCarouselIndex ? 'selected' : ''}`}
                title={item.isVideo ? `Slide ${item.slide} (video: verrà usata la copertina)` : `Slide ${item.slide}`}
              >
                <img
                  src={toProxyUrl(item.thumbnailUrl || item.url)}
                  alt={`Slide ${item.slide}`}
                  style={{
                    width: '100px',
                    height: '100px',
                    objectFit: 'cover',
                    border: index === selectedCarouselIndex ? '3px solid #b4ff00' : '1px solid #ccc'
                  }}
                />
                <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '12px', color: '#b4ff00' }}>
                  {item.slide}{item.isVideo ? ' 🎬' : ''}
                </div>
              </div>
            ))}
          </div>
          <button
            className="customFileUpload"
            style={{ marginTop: '10px' }}
            onClick={() => setShowCarouselSelector(false)}
          >
            Annulla
          </button>
        </div>
      )}

      {/* Controlli risultato */}
      <div className="result-inputs">
        <div className="scores-row">
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
        </div>

        <div style={{ width: '100%', marginTop: '0.8rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(180, 255, 0, 0.2)', boxSizing: 'border-box' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', flexWrap: 'wrap' }}>
            <input
              type="checkbox"
              checked={isPenaltyMatch}
              onChange={(e) => setIsPenaltyMatch && setIsPenaltyMatch(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#b4ff00', cursor: 'pointer' }}
            />
            Partita terminata ai rigori?
          </label>
          {isPenaltyMatch && (
            <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.8rem', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 0 }}>
                <label htmlFor="penalty1Input" style={{ fontSize: '0.8rem', color: '#b4ff00' }}>Rigori Sq. 1:</label>
                <input
                  id="penalty1Input"
                  type="number"
                  value={penaltiesScore1}
                  onChange={(e) => setPenaltiesScore1 && setPenaltiesScore1(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #444', background: '#111', color: '#fff', fontSize: '0.95rem', fontWeight: 'bold', boxSizing: 'border-box', textAlign: 'center' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 0 }}>
                <label htmlFor="penalty2Input" style={{ fontSize: '0.8rem', color: '#b4ff00' }}>Rigori Sq. 2:</label>
                <input
                  id="penalty2Input"
                  type="number"
                  value={penaltiesScore2}
                  onChange={(e) => setPenaltiesScore2 && setPenaltiesScore2(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #444', background: '#111', color: '#fff', fontSize: '0.95rem', fontWeight: 'bold', boxSizing: 'border-box', textAlign: 'center' }}
                />
              </div>
            </div>
          )}
        </div>

        <button className="download-button" onClick={downloadImage}>
          Download
        </button>
      </div>
    </div>
  );
}

export default TabellinoControls;