// Versione aggiornata di instagram-proxy.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/api/health-check', (req, res) => {
  res.status(200).json({ status: true, message: 'Server is running' });
});

app.get('/api/instagram-image', async (req, res) => {
  const url = decodeURIComponent(req.query.url);
  const getCarouselImages = req.query.getCarouselImages === 'true';
  
  if (!url) {
    return res.status(400).json({ status: false, message: 'URL mancante' });
  }
  
  try {
    console.log(`Recupero contenuto da: ${url}`);
    console.log(`Modalità carosello: ${getCarouselImages ? 'attiva' : 'inattiva'}`);
    
    // Configurazione avanzata di headers per simulare meglio un browser
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      maxRedirects: 10,
      timeout: 15000
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Log per debug
    console.log('Contenuto HTML ricevuto, lunghezza:', html.length);
    console.log('Cercando immagini in vari percorsi...');
    
    // Array per contenere tutte le immagini del carosello se richiesto
    let carouselImages = [];
    let mainImageUrl = null;
    
    // Cerchiamo prima nei JSON embedded che contengono i dati più completi
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html();
      if (!scriptContent) return;
      
      try {
        // Cerchiamo i pattern json comuni di Instagram
        if (scriptContent.includes('_sharedData') || 
            scriptContent.includes('additionalDataLoaded')) {
          
          // Estrai JSON dai pattern comuni
          const jsonMatch = scriptContent.match(/window\._sharedData\s*=\s*({.+?});/) || 
                            scriptContent.match(/window\.__additionalDataLoaded\s*\(\s*['"][^'"]+['"],\s*({.+?})\s*\);/);
          
          if (jsonMatch && jsonMatch[1]) {
            const jsonData = JSON.parse(jsonMatch[1]);
            console.log('Trovato JSON nei dati condivisi di Instagram');
            
            // Estrai i dati del post
            const entryData = jsonData.entry_data;
            if (entryData && entryData.PostPage && entryData.PostPage[0]) {
              const post = entryData.PostPage[0].graphql.shortcode_media;
              
              if (post) {
                if (post.display_resources && post.display_resources.length > 0) {
                  // Ordina le risorse per larghezza decrescente e prendi la più grande
                  const sortedResources = post.display_resources.sort((a, b) => b.config_width - a.config_width);
                  mainImageUrl = sortedResources[0].src;
                  console.log('Immagine ad alta risoluzione trovata:', mainImageUrl);
                  carouselImages.push(mainImageUrl);
                } else {
                  // Fallback su display_url se display_resources non è disponibile
                  mainImageUrl = post.display_url;
                  if (mainImageUrl) {
                    console.log('Immagine trovata con display_url:', mainImageUrl);
                    carouselImages.push(mainImageUrl);
                  }
                }
              }
            }

            if (post.edge_sidecar_to_children && getCarouselImages) {
              const edges = post.edge_sidecar_to_children.edges;
              console.log(`Trovato carosello con ${edges.length} immagini`);
              
              edges.forEach(edge => {
                if (edge.node.is_video === false) {
                  const resources = edge.node.display_resources;
                  if (resources && resources.length > 0) {
                    // Ordina per larghezza e prendi la più grande
                    const sortedResources = resources.sort((a, b) => b.config_width - a.config_width);
                    const imgUrl = sortedResources[0].src;
                    if (imgUrl) {
                      carouselImages.push(imgUrl);
                    }
                  } else {
                    // Fallback su display_url
                    const imgUrl = edge.node.display_url;
                    if (imgUrl) {
                      carouselImages.push(imgUrl);
                    }
                  }
                }
              });
              
              if (carouselImages.length > 0) {
                mainImageUrl = carouselImages[0];
              }
            }
            
            // Cerca anche nei percorsi di dati aggiornati di Instagram
            const mediaData = jsonData.items?.[0] || jsonData.media;
            if (mediaData && !mainImageUrl) {
              if (mediaData.carousel_media && getCarouselImages) {
                // È un carosello nel formato alternativo
                console.log(`Trovato carosello alternativo con ${mediaData.carousel_media.length} immagini`);
                
                mediaData.carousel_media.forEach(media => {
                  // Prendiamo l'immagine in qualità originale
                  const candidates = media.image_versions2?.candidates;
                  if (candidates && candidates.length > 0) {
                    // Ordina per larghezza e prendi quella con risoluzione maggiore
                    candidates.sort((a, b) => b.width - a.width);
                    carouselImages.push(candidates[0].url);
                  }
                });
                
                // Imposta l'immagine principale come la prima del carosello
                if (carouselImages.length > 0) {
                  mainImageUrl = carouselImages[0];
                }
              } else {
                // Post singolo nel formato alternativo
                const candidates = mediaData.image_versions2?.candidates;
                if (candidates && candidates.length > 0) {
                  // Ordina per larghezza e prendi quella con risoluzione maggiore
                  candidates.sort((a, b) => b.width - a.width);
                  mainImageUrl = candidates[0].url;
                  carouselImages.push(mainImageUrl);
                }
              }
              
              if (mainImageUrl) {
                console.log('Immagine trovata nei dati JSON (schema aggiornato):', mainImageUrl);
              }
            }
          }
        }
      } catch (e) {
        // Continua con il prossimo script
        console.log('Errore durante il parsing di uno script:', e.message);
      }
    });
    
    // Se non abbiamo trovato nulla nei JSON, proviamo con i meta tag
    if (!mainImageUrl) {
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage) {
        console.log('Immagine trovata nei meta tag:', ogImage);
        mainImageUrl = ogImage;
        carouselImages.push(ogImage);
      }
    }
    
    // Ultima strategia: cerca elementi <img> ad alta risoluzione
    if (!mainImageUrl || carouselImages.length === 0) {
      const images = [];
      $('img').each((i, elem) => {
        const src = $(elem).attr('src');
        const srcset = $(elem).attr('srcset');
        
        // Filtra le immagini che sembrano contenuti principali ad alta risoluzione
        if (src && 
            (src.includes('instagram.com/') || src.includes('cdninstagram.com')) && 
            src.includes('1080x') && // Alta risoluzione
            !src.includes('profile_pic') && 
            !src.includes('favicon')) {
          
          images.push({ 
            url: src,
            width: $(elem).attr('width') || 0
          });
        }
        
        // Controlla anche srcset per versioni di immagini di dimensioni maggiori
        if (srcset) {
          const srcsetUrls = srcset.split(',')
            .map(src => {
              const [url, size] = src.trim().split(' ');
              return { url, size: parseInt(size) || 0 };
            })
            .sort((a, b) => b.size - a.size); // Ordina per dimensione (dalla più grande)
          
          if (srcsetUrls.length > 0) {
            images.push({ 
              url: srcsetUrls[0].url,
              width: srcsetUrls[0].size
            });
          }
        }
      });
      
      // Ordina le immagini per dimensione
      images.sort((a, b) => b.width - a.width);
      
      if (images.length > 0) {
        console.log(`Trovate ${images.length} immagini nel DOM. Utilizzando la prima:`, images[0].url);
        mainImageUrl = images[0].url;
        carouselImages = images.map(img => img.url);
      }
    }
    
    // Prepara la risposta
    if (mainImageUrl) {
      return res.json({
        status: true,
        imageUrl: mainImageUrl,
        carouselImages: getCarouselImages ? carouselImages : [mainImageUrl],
        isCarousel: carouselImages.length > 1
      });
    }
    
    // Nessuna immagine trovata
    return res.status(404).json({
      status: false,
      code: 'NO_IMAGE_FOUND',
      message: 'Nessuna immagine trovata nel post Instagram',
      details: `Analizzati ${$('script').length} script, ${$('img').length} tag img e ${$('a').length} link`
    });
    
  } catch (error) {
    console.error('Errore nel recupero dell\'immagine:', error);
    return res.status(500).json({
      status: false,
      code: 'SERVER_ERROR',
      message: 'Recupero immagine fallito',
      error: error.message,
      stack: error.stack,
      attemptedUrl: url
    });
  }
});

app.get('/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    
    if (!imageUrl) {
      return res.status(400).send('URL dell\'immagine non valido');
    }
    
    const response = await axios.get(imageUrl, { 
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Referer': 'https://www.instagram.com/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    // Imposta tutti gli header della risposta originale per mantenere il tipo di contenuto e altre informazioni
    Object.keys(response.headers).forEach(header => {
      // Esclude gli header che potrebbero causare problemi
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(header.toLowerCase())) {
        res.set(header, response.headers[header]);
      }
    });
    
    // Assicura che il Content-Type sia impostato correttamente
    if (response.headers['content-type']) {
      res.set('Content-Type', response.headers['content-type']);
    }
    
    // Imposta header CORS per consentire l'accesso da qualsiasi origine
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache per 24 ore
    
    response.data.pipe(res);
  } catch (error) {
    console.error('Errore nel proxy:', error.message);
    res.status(500).send('Errore nel caricamento dell\'immagine');
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server in ascolto sulla porta ${PORT}`));