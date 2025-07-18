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

// Funzione per selezionare l'immagine con la qualità più alta
function selectHighestQualityImage(images) {
  if (!images || images.length === 0) return null;
  
  return images.reduce((best, current) => {
    const currentWidth = current.config_width || current.width || 0;
    const currentHeight = current.config_height || current.height || 0;
    const currentPixels = currentWidth * currentHeight;
    
    const bestWidth = best.config_width || best.width || 0;
    const bestHeight = best.config_height || best.height || 0;
    const bestPixels = bestWidth * bestHeight;
    
    // Preferisci l'immagine con più pixel totali
    return currentPixels > bestPixels ? current : best;
  });
}

// Funzione per estrarre l'URL dell'immagine originale
function extractOriginalImageUrl(mediaNode) {
  // Verifica se è disponibile un URL originale esplicito
  if (mediaNode.original_image_url) {
    return mediaNode.original_image_url;
  }

  const imageCandidates = [];

  // Priorità 1: display_resources (qualità massima)
  if (mediaNode.display_resources && mediaNode.display_resources.length > 0) {
    imageCandidates.push(...mediaNode.display_resources);
  }

  // Priorità 2: image_versions2 candidates
  if (mediaNode.image_versions2 && mediaNode.image_versions2.candidates) {
    imageCandidates.push(...mediaNode.image_versions2.candidates);
  }

  // Priorità 3: display_url (fallback)
  if (mediaNode.display_url) {
    imageCandidates.push({
      src: mediaNode.display_url,
      config_width: 1080,
      config_height: 1080
    });
  }

  // Seleziona l’immagine con la qualità più alta
  const bestImage = selectHighestQualityImage(imageCandidates);
  return bestImage ? (bestImage.src || bestImage.url) : null;
}

app.get('/api/instagram-image', async (req, res) => {
  const url = decodeURIComponent(req.query.url);
  const getCarouselImages = req.query.getCarouselImages === 'true';
  
  if (!url) {
    return res.status(400).json({ status: false, message: 'URL mancante' });
  }
  
  try {
    console.log(`Recupero contenuto da: ${url}`);
    console.log(`Modalità carosello: ${getCarouselImages ? 'attiva' : 'inattiva'}`);
    
    // Headers migliorati per evitare il blocco da parte di Instagram
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'DNT': '1'
      },
      maxRedirects: 10,
      timeout: 20000
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    console.log('Contenuto HTML ricevuto, lunghezza:', html.length);
    
    let carouselImages = [];
    let mainImageUrl = null;
    
    // Cerca nei dati JSON embedded
    $('script[type="application/ld+json"], script').each((i, elem) => {
      const scriptContent = $(elem).html();
      if (!scriptContent) return;
      
      try {
        // Pattern per i dati _sharedData
        const sharedDataMatch = scriptContent.match(/window\._sharedData\s*=\s*({.+?});/);
        if (sharedDataMatch) {
          const jsonData = JSON.parse(sharedDataMatch[1]);
          console.log('Trovato _sharedData');
          
          const entryData = jsonData.entry_data;
          if (entryData && entryData.PostPage && entryData.PostPage[0]) {
            const post = entryData.PostPage[0].graphql.shortcode_media;
            
            if (post) {
              console.log('Tipo di post:', post.__typename);
              console.log('È un carosello?', post.edge_sidecar_to_children ? 'Sì' : 'No');
              
              // Gestione carosello
              if (post.edge_sidecar_to_children && getCarouselImages) {
                const edges = post.edge_sidecar_to_children.edges;
                console.log(`Trovato carosello con ${edges.length} elementi`);
                
                edges.forEach((edge, index) => {
                  if (!edge.node.is_video) {
                    const imageUrl = extractOriginalImageUrl(edge.node);
                    if (imageUrl) {
                      carouselImages.push(imageUrl);
                      console.log(`Immagine ${index + 1} del carosello: ${imageUrl.substring(0, 100)}...`);
                    }
                  }
                });
                
                if (carouselImages.length > 0) {
                  mainImageUrl = carouselImages[0];
                }
              } else {
                // Post singolo
                mainImageUrl = extractOriginalImageUrl(post);
                if (mainImageUrl) {
                  carouselImages.push(mainImageUrl);
                  console.log('Immagine singola trovata:', mainImageUrl.substring(0, 100) + '...');
                }
              }
            }
          }
        }
        
        // Pattern per additionalDataLoaded
        const additionalDataMatch = scriptContent.match(/window\.__additionalDataLoaded\s*\(\s*['"][^'"]+['"],\s*({.+?})\s*\);/);
        if (additionalDataMatch && !mainImageUrl) {
          const jsonData = JSON.parse(additionalDataMatch[1]);
          console.log('Trovato additionalDataLoaded');
          
          // Cerca nei dati aggiuntivi
          if (jsonData.items && jsonData.items.length > 0) {
            const item = jsonData.items[0];
            
            if (item.carousel_media && getCarouselImages) {
              console.log(`Carosello con ${item.carousel_media.length} elementi`);
              
              item.carousel_media.forEach((media, index) => {
                if (media.media_type === 1) { // Tipo 1 = immagine
                  const imageUrl = extractOriginalImageUrl(media);
                  if (imageUrl) {
                    carouselImages.push(imageUrl);
                    console.log(`Immagine ${index + 1} del carosello: ${imageUrl.substring(0, 100)}...`);
                  }
                }
              });
              
              if (carouselImages.length > 0) {
                mainImageUrl = carouselImages[0];
              }
            } else if (item.media_type === 1) {
              // Immagine singola
              mainImageUrl = extractOriginalImageUrl(item);
              if (mainImageUrl) {
                carouselImages.push(mainImageUrl);
                console.log('Immagine singola trovata:', mainImageUrl.substring(0, 100) + '...');
              }
            }
          }
        }
        
        // Pattern per JSON-LD
        if (scriptContent.includes('"@type":"ImageObject"') && !mainImageUrl) {
          const jsonLd = JSON.parse(scriptContent);
          if (jsonLd.image && jsonLd.image.url) {
            mainImageUrl = jsonLd.image.url;
            carouselImages.push(mainImageUrl);
            console.log('Immagine trovata in JSON-LD:', mainImageUrl.substring(0, 100) + '...');
          }
        }
        
      } catch (e) {
        // Continua con il prossimo script
        console.log('Errore durante il parsing di uno script:', e.message);
      }
    });
    
    // Fallback: cerca nei meta tag
    if (!mainImageUrl) {
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage) {
        console.log('Immagine trovata nei meta tag:', ogImage);
        mainImageUrl = ogImage;
        carouselImages.push(ogImage);
      }
    }
    
    // Ultimo tentativo: cerca immagini ad alta risoluzione nel DOM
    if (!mainImageUrl || carouselImages.length === 0) {
      const images = [];
      
      $('img').each((i, elem) => {
        const src = $(elem).attr('src');
        
        if (src && 
            (src.includes('scontent') || src.includes('instagram.com') || src.includes('fbcdn.net')) &&
            !src.includes('profile_pic') && 
            !src.includes('favicon') &&
            !src.includes('avatar') &&
            !src.includes('story')) {
          
          const width = parseInt($(elem).attr('width')) || 0;
          const height = parseInt($(elem).attr('height')) || 0;
          
          // Filtra per dimensioni minime per evitare thumbnails
          if (width >= 150 && height >= 150) {
            images.push({ 
              url: src,
              width: width,
              height: height,
              pixels: width * height
            });
          }
        }
      });
      
      // Ordina per numero di pixel (qualità)
      images.sort((a, b) => b.pixels - a.pixels);
      
      if (images.length > 0) {
        console.log(`Trovate ${images.length} immagini nel DOM. Utilizzando la migliore:`, images[0].url.substring(0, 100) + '...');
        mainImageUrl = images[0].url;
        carouselImages = images.slice(0, getCarouselImages ? 10 : 1).map(img => img.url);
      }
    }
    
    // Prepara la risposta
    if (mainImageUrl) {
      console.log('Immagine principale selezionata:', mainImageUrl.substring(0, 100) + '...');
      console.log('Numero totale di immagini nel carosello:', carouselImages.length);
      
      return res.json({
        status: true,
        imageUrl: mainImageUrl,
        carouselImages: getCarouselImages ? carouselImages : [mainImageUrl],
        isCarousel: carouselImages.length > 1,
        imageCount: carouselImages.length,
        quality: 'original'
      });
    }
    
    // Nessuna immagine trovata
    return res.status(404).json({
      status: false,
      code: 'NO_IMAGE_FOUND',
      message: 'Nessuna immagine trovata nel post Instagram',
      details: `Analizzati ${$('script').length} script, ${$('img').length} tag img`
    });
    
  } catch (error) {
    console.error('Errore nel recupero dell\'immagine:', error);
    return res.status(500).json({
      status: false,
      code: 'SERVER_ERROR',
      message: 'Recupero immagine fallito',
      error: error.message,
      attemptedUrl: url
    });
  }
});

// Proxy migliorato per le immagini con supporto per immagini originali
app.get('/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    
    if (!imageUrl) {
      return res.status(400).send('URL dell\'immagine non valido');
    }
    
    console.log('Proxy richiesto per:', imageUrl.substring(0, 100) + '...');
    
    const response = await axios.get(imageUrl, { 
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.instagram.com/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site'
      },
      maxRedirects: 5,
      timeout: 30000
    });
    
    // Imposta gli header per l'immagine
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const contentLength = response.headers['content-length'];
    
    res.set('Content-Type', contentType);
    if (contentLength) {
      res.set('Content-Length', contentLength);
    }
    
    // Header CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=86400');
    
    console.log('Immagine proxy completata. Tipo:', contentType, 'Dimensione:', contentLength);
    
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Errore nel proxy:', error.message);
    res.status(500).send('Errore nel caricamento dell\'immagine');
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server migliorato in ascolto sulla porta ${PORT}`));