const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const { getRecentMatches, getMatchDetails } = require('./execution/scrape_flashscore');

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
  const url = decodeURIComponent(req.query.url);
  const getCarouselImages = req.query.getCarouselImages === 'true';

  if (!url) return res.status(400).json({ status: false, message: 'URL mancante' });

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
    response.data.pipe(res);
  } catch (error) {
    res.status(500).send('Proxy Error');
  }
});

// --- NUOVO ENDPOINT DI SCRAPING (Proxy per evitare CORS/Blocchi) ---
app.get('/api/scrape', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ status: false, message: 'URL missing' });

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
      res.json({ status: true, matches, count: matches.length });
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
  const { matchUrl } = req.query;

  if (!matchUrl) {
    return res.status(400).json({
      status: false,
      message: 'Parametro mancante: matchUrl è obbligatorio'
    });
  }

  console.log(`[FLASHSCORE] Fetching match details: ${matchUrl}`);

  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({
        status: false,
        message: 'Timeout: il recupero dei dettagli ha impiegato troppo tempo.'
      });
    }
  }, 90000);

  try {
    const details = await getMatchDetails(matchUrl);

    clearTimeout(timeout);
    if (!res.headersSent) {
      console.log(`[FLASHSCORE] Details retrieved successfully`);
      res.json({ status: true, ...details });
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

const PORT = 5000;
app.listen(PORT, () => console.log(`Server aggiornato running on port ${PORT}`));
