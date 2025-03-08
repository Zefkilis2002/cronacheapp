// Salva come instagram-proxy.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();

// Aggiungi questo codice a instagram-proxy.js
app.get('/api/instagram-image', async (req, res) => {
  res.status(200).json({ status: true, message: 'Server is running' });
});

// Modifica nel file instagram-proxy.js
app.use(cors({
  origin: '*', // Consente richieste da qualsiasi origine durante lo sviluppo
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Endpoint per ottenere l'URL dell'immagine da un post Instagram
app.get('/api/instagram-image', async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ status: false, message: 'URL mancante' });
  }
  
  try {
    console.log(`Recupero contenuto da: ${url}`);
    
    // Configura l'header con un User-Agent per simulare un browser
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Cerca i meta tag per le immagini
    const ogImage = $('meta[property="og:image"]').attr('content');
    
    if (ogImage) {
      return res.json({
        status: true,
        result: [{ url: ogImage }]
      });
    }
    
    // Cerca altre immagini nella pagina
    const images = [];
    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && !src.includes('profile_pic') && src.includes('instagram')) {
        images.push({ url: src });
      }
    });
    
    if (images.length > 0) {
      return res.json({
        status: true,
        result: images
      });
    }
    
    // Cerca dati JSON embedded
    const scriptTags = $('script[type="application/ld+json"]');
    let foundInJson = false;
    
    scriptTags.each((i, elem) => {
      try {
        const jsonData = JSON.parse($(elem).html());
        if (jsonData.image) {
          foundInJson = true;
          return res.json({
            status: true,
            result: [{ url: jsonData.image }]
          });
        }
      } catch (e) {
        console.error('Errore nel parsing JSON:', e);
      }
    });
    
    if (!foundInJson) {
      return res.status(404).json({
        status: false,
        message: 'Nessuna immagine trovata nella pagina'
      });
    }
    
  } catch (error) {
    console.error('Errore nel recupero dell\'immagine:', error.message);
    return res.status(500).json({
      status: false,
      message: `Errore nel recupero dell'immagine: ${error.message}`
    });
  }
});

// Endpoint per il proxy delle immagini 
app.get('/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    
    if (!imageUrl) {
      return res.status(400).send('URL dell\'immagine non valido');
    }
    
    const response = await axios.get(imageUrl, { 
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    res.set('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
  } catch (error) {
    console.error('Errore nel proxy:', error.message);
    res.status(500).send('Errore nel caricamento dell\'immagine');
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server in ascolto sulla porta ${PORT}`));