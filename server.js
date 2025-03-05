const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// Configura CORS per consentire richieste da 'http://localhost:3000'
app.use(cors({
  origin: 'http://localhost:3000', // Specifica il tuo frontend
  methods: ['GET', 'POST'], // Metodi consentiti
  allowedHeaders: ['Content-Type'], // Headers consentiti
}));

app.get('/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    console.log('Tentativo di scaricare immagine da:', imageUrl); // Log per debug
    if (!imageUrl || imageUrl === 'null') {
      return res.status(400).send('URL dell\'immagine non valido');
    }
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    res.set('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
  } catch (error) {
    console.error('Errore nel proxy:', error.message);
    res.status(500).send('Errore nel caricamento dell\'immagine');
  }
});

app.listen(5000, () => console.log('Server in ascolto sulla porta 5000'));