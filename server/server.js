const express = require('express');
require('dotenv').config(); // Carica le variabili d'ambiente da .env
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const OpenAI = require('openai'); // Importa SDK OpenAI
const NodeCache = require('node-cache'); // Importa node-cache
const { getRecentMatches, getMatchDetails, getStandings } = require('./execution/scrape_flashscore');

const app = express();
const cache = new NodeCache({ stdTTL: 300, maxKeys: 10000, useClones: false }); // Ottimizzazione RAM

const ALLOWED_DOMAINS = ['instagram.com', 'cdninstagram.com', 'flashscore.com', 'flashscore.it', 'thesportsdb.com'];

function validateRequestUrl(urlString) {
  try {
    const parsedUrl = new URL(urlString);
    const hostname = parsedUrl.hostname;
    const isAllowed = ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
    if (!isAllowed) {
      return { valid: false, status: 403, message: 'Dominio non autorizzato' };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, status: 400, message: 'URL malformato' };
  }
}

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));// ... (rest of the file remains unchanged until the endpoint)



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

    return currentPixels > bestPixels ? current : best;
  });
}

function extractOriginalImageUrl(mediaNode) {
  if (mediaNode.original_image_url) return mediaNode.original_image_url;

  const imageCandidates = [];
  if (mediaNode.display_resources && mediaNode.display_resources.length > 0) {
    imageCandidates.push(...mediaNode.display_resources);
  }
  if (mediaNode.image_versions2 && mediaNode.image_versions2.candidates) {
    imageCandidates.push(...mediaNode.image_versions2.candidates);
  }
  if (mediaNode.display_url) {
    imageCandidates.push({ src: mediaNode.display_url, config_width: 1080, config_height: 1080 });
  }

  const bestImage = selectHighestQualityImage(imageCandidates);
  return bestImage ? (bestImage.src || bestImage.url) : null;
}

app.get('/api/instagram-image', async (req, res) => {
  if (!req.query.url) return res.status(400).json({ status: false, message: 'URL mancante' });
  const url = decodeURIComponent(req.query.url);
  const getCarouselImages = req.query.getCarouselImages === 'true';

  const validation = validateRequestUrl(url);
  if (!validation.valid) {
    return res.status(validation.status).json({ status: false, message: validation.message });
  }

  try {
    console.log(`Recupero contenuto da: ${url}`);

    // Genera un User-Agent random per evitare blocchi
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
    ];
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    const response = await axios.get(url, {
      headers: {
        'User-Agent': randomUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      },
      timeout: 25000,
      maxRedirects: 5
    });

    const html = response.data;
    const $ = cheerio.load(html);
    let carouselImages = [];
    let mainImageUrl = null;

    // Strategia 1: Cerca JSON-LD (spesso contiene l'immagine principale ad alta ris)
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const json = JSON.parse($(el).html());
        if (json['@type'] === 'ImageObject' && json.contentUrl) {
          // Aggiungi solo se non è un thumbnail
          if (!json.contentUrl.includes('150x150')) {
            carouselImages.push(json.contentUrl);
          }
        }
        if (Array.isArray(json)) {
          json.forEach(item => {
            if (item['@type'] === 'ImageObject' && item.contentUrl) carouselImages.push(item.contentUrl);
          });
        }
      } catch (e) { }
    });

    // Strategia 2: Regex per _sharedData e additionalData
    const scriptTags = $('script').map((i, el) => $(el).html()).get();

    for (const scriptContent of scriptTags) {
      if (!scriptContent) continue;

      // Pattern vari per trovare il JSON
      const patterns = [
        /window\._sharedData\s*=\s*({.+?});/,
        /window\.__additionalDataLoaded\s*\(\s*['"][^'"]+['"],\s*({.+?})\s*\);/,
        /require\("TimeSliceImpl"\).guard\(\(function\(\){(var .+=({.+?});)/ // Pattern complesso per GraphQL
      ];

      for (const pattern of patterns) {
        const match = scriptContent.match(pattern);
        if (match && match[1]) {
          try {
            // Tentativo di pulizia per casi complessi o parse diretto
            let jsonString = match[1];
            if (jsonString.startsWith('var')) {
              const jsonMatch = jsonString.match(/=\s*({.+?});/);
              if (jsonMatch) jsonString = jsonMatch[1];
            }

            // Puliamo eventuali trailing functions se presenti in additionalData
            if (jsonString.endsWith(');')) jsonString = jsonString.slice(0, -2);

            const data = JSON.parse(jsonString);

            // Naviga la struttura dati (molto variabile)
            const post = data.entry_data?.PostPage?.[0]?.graphql?.shortcode_media ||
              data.graphql?.shortcode_media ||
              data.items?.[0] ||
              data;

            if (post) {
              // Estrazione Carosello
              if (getCarouselImages && (post.edge_sidecar_to_children || post.carousel_media)) {
                const edges = post.edge_sidecar_to_children?.edges || post.carousel_media;
                if (Array.isArray(edges)) {
                  edges.forEach(edge => {
                    const node = edge.node || edge;
                    if (!node.is_video) {
                      const img = extractOriginalImageUrl(node);
                      if (img) carouselImages.push(img);
                    }
                  });
                }
              }

              // Estrazione Immagine Singola (se non abbiamo trovato carosello o se è post singolo)
              if (carouselImages.length === 0) {
                const img = extractOriginalImageUrl(post);
                if (img) carouselImages.push(img);
              }
            }
          } catch (e) {
            // console.log('Json parse error', e.message);
          }
        }
      }
    }

    // Strategia 3: Open Graph tags (Fallback affidabile per immagine singola HD)
    if (carouselImages.length === 0) {
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage) carouselImages.push(ogImage);
    }

    // Pulizia duplicati e null
    carouselImages = [...new Set(carouselImages)].filter(Boolean);

    if (carouselImages.length > 0) {
      mainImageUrl = carouselImages[0];

      res.json({
        status: true,
        imageUrl: mainImageUrl,
        carouselImages: carouselImages,
        isCarousel: carouselImages.length > 1,
        imageCount: carouselImages.length,
        quality: 'high'
      });
    } else {
      res.status(404).json({ status: false, message: 'Nessuna immagine trovata' });
    }

  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({ status: false, message: 'Errore server', error: error.message });
  }
});

app.get('/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) return res.status(400).send('URL missing');

    const validation = validateRequestUrl(imageUrl);
    if (!validation.valid) {
      return res.status(validation.status).json({ status: false, message: validation.message });
    }

    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/*,*/*',
        'Referer': 'https://www.instagram.com/'
      }
    });

    res.set('Content-Type', response.headers['content-type']);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=31536000, immutable'); // Salva immagine nel browser per 1 anno
    response.data.pipe(res);
  } catch (error) {
    res.status(500).send('Proxy Error');
  }
});

// --- NUOVO ENDPOINT DI SCRAPING (Proxy per evitare CORS/Blocchi) ---
app.get('/api/scrape', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ status: false, message: 'URL missing' });

  const validation = validateRequestUrl(targetUrl);
  if (!validation.valid) {
    return res.status(validation.status).json({ status: false, message: validation.message });
  }

  console.log(`[SCRAPE] Request for: ${targetUrl}`);

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  ];
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

  try {
    // Tentativo 1: Richiesta Diretta (più veloce)
    console.log(`[SCRAPE] Trying direct fetch...`);
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': randomUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 8000 // ridotto timeout
    });

    console.log(`[SCRAPE] Direct fetch success: ${response.status}`);
    return res.json({ status: true, content: response.data });

  } catch (directError) {
    console.warn(`[SCRAPE] Direct fetch failed: ${directError.message}. Trying fallback...`);

    // Tentativo 2: Fallback via AllOrigins (se IP bannato)
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      const fallbackResponse = await axios.get(proxyUrl, { timeout: 10000 });

      if (fallbackResponse.data && fallbackResponse.data.contents) {
        console.log(`[SCRAPE] Fallback success`);
        return res.json({ status: true, content: fallbackResponse.data.contents });
      }
    } catch (fallbackError) {
      console.error(`[SCRAPE] Fallback failed: ${fallbackError.message}`);
    }

    res.status(500).json({ status: false, message: "Errore scraping (tutti i metodi falliti)", error: directError.message });
  }
});

// --- NUOVO ENDPOINT AI PER RICERCA SQUADRE ---
app.get('/api/find-team-info', async (req, res) => {
  const teamName = req.query.teamName;
  if (!teamName) return res.status(400).json({ status: false, message: 'Team name missing' });

  // Token recuperato dalle variabili d'ambiente
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  try {
    const response = await axios.post(
      "https://models.inference.ai.azure.com/chat/completions",
      {
        messages: [
          {
            role: "system",
            content: "You are a football expert assistant. Your task is to identify the football team provided by the user. You must return a valid JSON object (and nothing else) with the following fields:\n- \"country\": The country of the team in English (e.g., \"Italy\", \"Spain\").\n- \"teamName\": The official name of the team.\n- \"slug_variants\": An array of strings containing potential URL-friendly slugs for the team. PRIORITIZE short, common names.\n\nHere are REAL examples of slugs from the target site:\n- \"pisa\" (NOT pisa-sporting-club)\n- \"real-madrid\"\n- \"barcelona\"\n- \"espanyol\"\n- \"psv\" (NOT psv-eindhoven)\n- \"benfica\"\n- \"fc-porto\" (Note the prefix here)\n- \"antwerp\"\n- \"dutch-national-team\"\n\nUse these patterns to generate the variants. Include the simplest form (e.g., 'olympiacos') AND common official forms (e.g., 'olympiacos-fc') if unsure.\n\n- \"countrySlug\": A URL-friendly slug for the country.\n\nExample input: \"Olympiakos\"\nExample output: { \"country\": \"Greece\", \"teamName\": \"Olympiacos FC\", \"slug_variants\": [\"olympiakos\", \"olympiacos\", \"olympiacos-fc\", \"olympiacos-piraeus\"], \"countrySlug\": \"greece\" }"
          },
          {
            role: "user",
            content: `Identify the football team: "${teamName}"`
          }
        ],
        model: "gpt-4o",
        temperature: 0.1,
        max_tokens: 150
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GITHUB_TOKEN}`
        }
      }
    );

    const content = response.data.choices[0].message.content;

    // Tentativo di pulizia se il modello restituisce markdown code blocks
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "");
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "");
    }

    const teamData = JSON.parse(jsonStr);

    res.json({
      status: true,
      data: teamData
    });

  } catch (error) {
    console.error("AI API Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ status: false, message: "Errore durante la ricerca AI", error: error.message });
  }
});

// --- ENDPOINT FLASHSCORE: Cerca partite recenti ---
app.get('/api/get-matches', async (req, res) => {
  const { country, league, daysBack } = req.query;

  if (!country || !league) {
    return res.status(400).json({
      status: false,
      message: 'Parametri mancanti: country e league sono obbligatori'
    });
  }

  const days = parseInt(daysBack) || 7;
  const cacheKey = `matches_${country}_${league}_${days}`;

  // Verifica cache
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`[CACHE] Restituiti dati in cache per get-matches: ${cacheKey}`);
    return res.json(cachedData);
  }

  console.log(`[FLASHSCORE] Searching: ${country}/${league} (last ${days} days)`);

  // Timeout di sicurezza: 90 secondi (Render free tier ha cold start lento)
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({
        status: false,
        message: 'Timeout: lo scraping ha impiegato troppo tempo. Riprova.'
      });
    }
  }, 90000);

  try {
    const matches = await getRecentMatches({ country, league, daysBack: days });

    clearTimeout(timeout);
    if (!res.headersSent) {
      console.log(`[FLASHSCORE] Success: ${matches.length} matches found`);
      const responseData = { status: true, matches, count: matches.length };
      cache.set(cacheKey, responseData); // Salva in cache solo in caso di successo
      res.json(responseData);
    }
  } catch (error) {
    clearTimeout(timeout);
    console.error('[FLASHSCORE] Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({
        status: false,
        message: error.message || 'Errore durante lo scraping di Flashscore'
      });
    }
  }
});

// --- ENDPOINT FLASHSCORE: Dettagli partita (marcatori) ---
app.get('/api/get-match-details', async (req, res) => {
  const { matchUrl, matchId } = req.query;

  if (!matchUrl && !matchId) {
    return res.status(400).json({
      status: false,
      message: 'Parametro mancante: matchUrl o matchId è obbligatorio'
    });
  }

  const cacheKey = `match_details_${matchId || matchUrl}`;

  // Verifica cache
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`[CACHE] Restituiti dati in cache per get-match-details: ${cacheKey}`);
    return res.json(cachedData);
  }

  console.log(`[FLASHSCORE] Fetching match details: ${matchId || matchUrl}`);

  // Timeout ridotto: ora l'API HTTP risponde in <1s
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({
        status: false,
        message: 'Timeout: il recupero dei dettagli ha impiegato troppo tempo.'
      });
    }
  }, 30000);

  try {
    const details = await getMatchDetails(matchUrl, matchId);

    clearTimeout(timeout);
    if (!res.headersSent) {
      console.log(`[FLASHSCORE] Details retrieved successfully`);
      const responseData = { status: true, ...details };
      cache.set(cacheKey, responseData); // Salva in cache solo in caso di successo
      res.json(responseData);
    }
  } catch (error) {
    clearTimeout(timeout);
    console.error('[FLASHSCORE] Match details error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({
        status: false,
        message: error.message || 'Errore durante il recupero dei dettagli partita'
      });
    }
  }
});

// --- ENDPOINT FLASHSCORE: Classifica ---
app.get('/api/standings', async (req, res) => {
  const { country = 'greece', league = 'super-league' } = req.query;
  const cacheKey = `standings_${country}_${league}`;

  // Verifica cache
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`[CACHE] Restituiti dati in cache per standings: ${cacheKey}`);
    return res.json(cachedData);
  }

  console.log(`[FLASHSCORE] Fetching standings for: ${country}/${league}`);

  try {
    const data = await getStandings({ country, league });
    console.log(`[FLASHSCORE] Standings success: ${data.length} teams`);
    const responseData = { success: true, data };
    cache.set(cacheKey, responseData); // Salva in cache solo in caso di successo
    res.json(responseData);
  } catch (error) {
    console.error(`[FLASHSCORE] Standings error:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- ENDPOINT AI: Generazione Bio Instagram ---
app.post('/api/generate-bio', async (req, res) => {
  const { inputText } = req.body;

  if (!inputText) {
    return res.status(400).json({ status: false, message: 'Testo mancante' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ status: false, message: 'GITHUB_TOKEN mancante nel server. Controlla il file .env' });
  }

  try {
    // Importa dinamicamente le librerie Azure per compatibilità
    const { default: ModelClient, isUnexpected } = await import("@azure-rest/ai-inference");
    const { AzureKeyCredential } = await import("@azure/core-auth");

    const client = ModelClient(
      "https://models.github.ai/inference",
      new AzureKeyCredential(token)
    );

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          {
            role: 'system',
            content: `
Obiettivo: Generare una **bio Instagram accattivante e dinamica**, adatta ad una pagina Instagram giornalistica che parla del calcio greco, a partire da un testo iniziale, che può essere scritto in greco ma deve essere **tradotto e adattato in italiano**.

### Struttura della Bio
1. **Titolo di grande impatto**, scritto in **grassetto maiuscolo Unicode**, per un effetto visivo ottimale sui social.
2. **Testo breve e diretto**, con frasi concise, ritmo vivace e scorrevolezza.
3. **Inserimento strategico di emoji** per sottolineare emozioni, concetti chiave e aggiungere personalità.
4. **Organizzazione in sezioni**, quando utile, per presentare risultati, numeri importanti o momenti chiave.
5. **Domanda finale**, inerente al contenuto della bio, progettata per invitare il pubblico all'interazione.

### Specifiche
- Il testo iniziale può essere in greco, ma la bio deve essere **scritta esclusivamente in italiano**.
- Preferire un linguaggio semplice, **diretto e di forte impatto**, evitando periodi lunghi o complessi.

Ecco degli esempi di bio:
1. "💚⚽ 𝗜𝗢𝗔𝗡𝗡𝗜𝗗𝗜𝗦 𝗥𝗔𝗚𝗚𝗜𝗨𝗡𝗚𝗘 𝗜 𝟱𝟬 𝗚𝗢𝗟 𝗖𝗢𝗡 𝗜𝗟 𝗧𝗥𝗜𝗙𝗢𝗚𝗟𝗜𝗢, 𝗠𝗔 𝗡𝗢𝗡 𝗕𝗔𝗦𝗧𝗔!

Il Panathinaikos saluta la UEFA Conference League dopo una serata sfortunata al Franchi.

Nonostante l'uscita di scena, i biancoverdi hanno lottato fino all'ultimo, sfiorando il secondo gol in un secondo tempo dominato per intensità e carattere."

2. "🔥 𝗟𝗢𝗧𝗧𝗔 𝗦𝗖𝗨𝗗𝗘𝗧𝗧𝗢: 𝗥𝗜𝗦𝗨𝗟𝗧𝗔𝗧𝗜 𝗖𝗛𝗘 𝗖𝗔𝗠𝗕𝗜𝗔𝗡𝗢 𝗚𝗟𝗜 𝗘𝗤𝗨𝗜𝗟𝗜𝗕𝗥𝗜 𝗜𝗡 𝗚𝗥𝗘𝗖𝗜𝗔! 🇬🇷💥

🟡⚫ AEK travolgente: cinquina e -2 dall'Olympiacos!
Con una prestazione dominante, l'AEK spazza via l'avversario con un netto 5-0 nell'OPAP Arena a porte chiuse. Marcial e Ljubičić sugli scudi, regalando una vittoria che avvicina i gialloneri alla vetta, ora distante solo due punti.

🟡⚫ L'Aris frena il Panathinaikos con una difesa perfetta!
Il Panathinaikos cade sotto i colpi dell'Aris, che con una prestazione solida e organizzata mantiene il -3 dal PAOK.
❌☘️ Prima sconfitta in campionato per la squadra di Vitoria, che resta a -5 dalla vetta sprecando un'occasione d'oro per ridurre il distacco dall'Olympiacos.

💥 Asteras sorprende l'Olympiacos e lo blocca al Pireo!
I biancorossi non riescono a sfondare nonostante le tante occasioni nel finale e vedono sfumare tre punti importanti nella corsa al titolo.

⚪️⚫ PAOK straripante, travolto l'OFI!
Con una partenza lampo, il PAOK chiude la partita già nei primi 30 minuti e si impone con autorità sull'OFI.
😲 Samatta ritrova la via del gol dopo 454 giorni e firma una doppietta.
I bianconeri si portano a -3 da AEK e Panathinaikos e a -7 dall'Olympiacos, ma con una partita in più.

🔥 La corsa al titolo è apertissima: chi riuscirà a spuntarla? 🤔"

3. "🌟🇬🇷 𝑺𝑻𝑬𝑭𝑨𝑵𝑶𝑺 𝑻𝒁𝑰𝑴𝑨𝑺 𝑨𝑷𝑷𝑹𝑶𝑫𝑨 𝑰𝑵 𝑷𝑹𝑬𝑴𝑰𝑬𝑹 𝑳𝑬𝑨𝑮𝑼𝑬! 🇬🇷🌟

Nel giorno della chiusura del mercato, uno dei talenti emergenti della Grecia, Stefanos Tzimas (19), ha firmato ufficialmente con il Brighton & Hove Albion per una cifra totale di circa 25 milioni di euro.

💰 Affare d'oro per il PAOK!
L'ex club di Tzimas, il PAOK Salonicco, incasserà circa 22 milioni di euro, grazie alla precedente vendita del giocatore al Norimberga per 18 milioni di euro, più un profitto del 15% su una futura cessione, come stabilito dal contratto con il club tedesco.

🔄 Ultimi mesi in Germania, poi la Premier!
Tzimas terminerà la stagione in prestito al Norimberga, prima di approdare definitivamente in Premier League con il Brighton all'inizio della prossima stagione.

🔥 Un nuovo talento greco pronto a brillare in Inghilterra! 🔥"
          `
          },
          {
            role: 'user',
            content: `Testo di partenza: ${inputText}`
          }
        ],
        model: "gpt-4o",
        temperature: 0.75,
        max_tokens: 4096,
        top_p: 1
      }
    });

    if (isUnexpected(response)) {
      throw new Error(response.body.error.message || JSON.stringify(response.body.error));
    }

    const bio = response.body.choices[0].message.content;
    res.json({ status: true, bio });

  } catch (error) {
    console.error("AI Bio Error:", error);
    res.status(500).json({
      status: false,
      message: "Errore durante la generazione della bio",
      error: error.message
    });
  }
});

// --- NUOVO ENDPOINT: Ricerca Loghi (Proxy per TheSportsDB con Cache) ---
app.get('/api/search-logos', async (req, res) => {
  const query = req.query.q;
  if (!query || query.length < 2) {
    return res.json({ status: true, results: [] });
  }

  const cacheKey = `logos_${query.toLowerCase()}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`[CACHE] Restituiti loghi per: ${query}`);
    return res.json({ status: true, results: cachedData });
  }

  console.log(`[LOGOS] Ricerca in corso per: ${query}`);

  try {
    const apiUrl = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl, { timeout: 8000 });
    
    if (response.data && response.data.teams) {
      // Filtra solo le squadre di calcio e con logo
      const footballTeams = response.data.teams
        .filter(team => team.strSport === "Soccer" && team.strBadge)
        .map(team => ({
          name: team.strTeam,
          logo_url: team.strBadge,
          country: team.strCountry
        }))
        .slice(0, 5); // Limita a 5 risultati
        
      // Salva in cache per 24 ore (86400 secondi)
      cache.set(cacheKey, footballTeams, 86400); 
      
      return res.json({ status: true, results: footballTeams });
    } else {
      // Nessun risultato
      cache.set(cacheKey, [], 300); // Salva vuoto per 5 minuti
      return res.json({ status: true, results: [] });
    }
  } catch (error) {
    console.error("[LOGOS] Errore durante la ricerca:", error.message);
    return res.status(500).json({ status: false, message: "Errore durante la ricerca dei loghi", error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server aggiornato running on port ${PORT}`));
