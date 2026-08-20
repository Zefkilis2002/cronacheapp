// =============================================================================
// INSTAGRAM MEDIA EXTRACTOR
// =============================================================================
// Instagram non espone più né `window._sharedData` né i tag Open Graph sulle
// pagine dei post: una GET "normale" su /p/<code>/ restituisce la SPA di login.
// L'unico percorso pubblico ancora affidabile è la pagina di EMBED
// (https://www.instagram.com/p/<code>/embed/captioned/), che contiene nel
// markup iniziale un blob JSON (`contextJSON`) con l'intero `shortcode_media`,
// inclusi i figli del carosello (`edge_sidecar_to_children`).
//
// Percorso primario: HTTP diretto sulla pagina di embed (veloce, ~300KB).
// Fallback: stessa pagina renderizzata con Puppeteer (per gli IP/UA che
// ricevono comunque il muro di login).
// =============================================================================

const axios = require('axios');

const UA_POOL = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
];

/**
 * Header "da browser" completi: senza sec-fetch-* e Accept corretti Instagram
 * risponde con la SPA di login invece che con la pagina di embed.
 */
function embedHeaders(userAgent) {
    return {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
    };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// -----------------------------------------------------------------------------
// PARSING URL / SHORTCODE
// -----------------------------------------------------------------------------

/**
 * Estrae lo shortcode da qualsiasi forma di link Instagram:
 *   - https://www.instagram.com/p/<code>/?igsh=...
 *   - https://www.instagram.com/reel/<code>/  (anche /reels/ e /tv/)
 *   - https://www.instagram.com/<user>/p/<code>/
 *   - <code> "nudo"
 * I link /share/... vanno prima risolti con resolveShareUrl().
 * @returns {string|null}
 */
function extractShortcode(input) {
    if (!input || typeof input !== 'string') return null;
    const raw = input.trim();
    if (!raw) return null;

    // Shortcode nudo (nessun separatore di URL)
    if (/^[A-Za-z0-9_-]{5,}$/.test(raw) && !raw.includes('.')) return raw;

    const match = raw.match(/instagram\.com\/(?:[^/?#]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
    if (match) return match[1];

    // Ultimo tentativo: ultimo segmento significativo del path
    try {
        const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        const segments = parsed.pathname.split('/').filter(Boolean);
        const last = segments[segments.length - 1];
        if (last && /^[A-Za-z0-9_-]{5,}$/.test(last)) return last;
    } catch (_) { /* url malformato */ }

    return null;
}

/** True se il link è del tipo instagram.com/share/... (richiede redirect). */
function isShareLink(input) {
    return typeof input === 'string' && /instagram\.com\/share\//i.test(input);
}

/**
 * Segue i redirect di un link /share/ per ottenere l'URL canonico del post.
 * @returns {Promise<string|null>} URL finale, o null se non risolvibile
 */
async function resolveShareUrl(url) {
    try {
        const response = await axios.get(url, {
            headers: embedHeaders(UA_POOL[0]),
            timeout: 15000,
            maxRedirects: 5,
            validateStatus: () => true,
        });
        return response.request?.res?.responseUrl || response.request?.responseURL || null;
    } catch (error) {
        console.warn('[Instagram] Redirect /share/ non risolto:', error.message);
        return null;
    }
}

// -----------------------------------------------------------------------------
// PARSING DELLA PAGINA DI EMBED
// -----------------------------------------------------------------------------

/**
 * Estrae il valore di una stringa JSON annidata (es. "contextJSON":"{\"...\"}")
 * scandendo fino all'apice di chiusura non-escaped.
 * @returns {string|null} la stringa decodificata
 */
function extractEmbeddedJsonString(html, key) {
    const marker = `"${key}":"`;
    const start = html.indexOf(marker);
    if (start < 0) return null;

    let i = start + marker.length;
    let buffer = '';
    while (i < html.length) {
        const char = html[i];
        if (char === '\\') { buffer += char + html[i + 1]; i += 2; continue; }
        if (char === '"') break;
        buffer += char;
        i++;
    }

    try {
        return JSON.parse(`"${buffer}"`);
    } catch (error) {
        return null;
    }
}

/** Sceglie la risorsa con più pixel tra i candidati di un nodo media. */
function pickBestResource(node) {
    const candidates = [];

    if (Array.isArray(node.display_resources)) candidates.push(...node.display_resources);
    if (Array.isArray(node.image_versions2?.candidates)) candidates.push(...node.image_versions2.candidates);
    if (node.display_url) candidates.push({ src: node.display_url, config_width: 1080, config_height: 1080 });
    if (node.thumbnail_src) candidates.push({ src: node.thumbnail_src, config_width: 640, config_height: 640 });

    const best = candidates.reduce((acc, current) => {
        const url = current.src || current.url;
        if (!url) return acc;
        const width = current.config_width || current.width || 0;
        const height = current.config_height || current.height || 0;
        const pixels = width * height;
        if (!acc || pixels > acc.pixels) return { url, width, height, pixels };
        return acc;
    }, null);

    if (!best) return null;
    return { url: best.url, width: best.width || null, height: best.height || null };
}

/** Miniatura leggera per il selettore del carosello (fallback: immagine piena). */
function pickThumbnail(node, fallbackUrl) {
    const resources = (node.display_resources || []).filter(r => r.src || r.url);
    // La più piccola tra quelle ≥ 320px (le liste arrivano in ordine decrescente)
    const small = resources
        .filter(r => (r.config_width || 0) >= 320)
        .sort((a, b) => (a.config_width || 0) - (b.config_width || 0))[0] || resources[0];
    return (small && (small.src || small.url)) || node.thumbnail_src || fallbackUrl;
}

/**
 * Normalizza `shortcode_media` in una lista di slide.
 * @returns {{items: Array, isCarousel: boolean}}
 */
function normalizeMedia(media) {
    const children = media?.edge_sidecar_to_children?.edges;
    const nodes = Array.isArray(children) && children.length > 0
        ? children.map(edge => edge.node || edge)
        : [media];

    const items = nodes.map((node, index) => {
        const best = pickBestResource(node);
        if (!best || !best.url) return null;
        return {
            index,
            slide: index + 1,
            url: best.url,
            thumbnailUrl: pickThumbnail(node, best.url),
            width: best.width,
            height: best.height,
            isVideo: Boolean(node.is_video),
        };
    }).filter(Boolean);

    return { items, isCarousel: items.length > 1 };
}

/** Fallback grezzo: <img class="EmbeddedMediaImage" src="..."> nella pagina di embed. */
function extractFromEmbedMarkup(html) {
    const items = [];
    const regex = /class="[^"]*EmbeddedMediaImage[^"]*"[^>]*src="([^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const url = match[1].replace(/&amp;/g, '&');
        items.push({
            index: items.length,
            slide: items.length + 1,
            url,
            thumbnailUrl: url,
            width: null,
            height: null,
            isVideo: false,
        });
    }
    return items;
}

// -----------------------------------------------------------------------------
// FETCH
// -----------------------------------------------------------------------------

function embedUrl(shortcode) {
    return `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
}

/** Scarica la pagina di embed via HTTP, ruotando gli UA su fallimento. */
async function fetchEmbedHtml(shortcode, attempts = 3) {
    let lastError = null;

    for (let attempt = 0; attempt < attempts; attempt++) {
        const userAgent = UA_POOL[attempt % UA_POOL.length];
        try {
            const response = await axios.get(embedUrl(shortcode), {
                headers: embedHeaders(userAgent),
                timeout: 20000,
                maxRedirects: 5,
                validateStatus: () => true,
            });

            const html = typeof response.data === 'string' ? response.data : '';
            if (response.status === 404) {
                const error = new Error('Post non trovato');
                error.statusCode = 404;
                throw error;
            }
            if (html.includes('contextJSON') || html.includes('EmbeddedMediaImage')) {
                return html;
            }
            lastError = new Error(`Risposta senza dati del post (status ${response.status})`);
        } catch (error) {
            if (error.statusCode === 404) throw error;
            lastError = error;
        }
        await sleep(400 * (attempt + 1));
    }

    throw lastError || new Error('Pagina di embed non recuperabile');
}

/** Fallback: pagina di embed renderizzata con Puppeteer (browser singleton). */
async function fetchEmbedHtmlWithBrowser(shortcode) {
    let acquirePage;
    try {
        ({ acquirePage } = require('./scrape_flashscore'));
    } catch (error) {
        throw new Error('Browser non disponibile');
    }
    if (typeof acquirePage !== 'function') throw new Error('Browser non disponibile');

    const page = await acquirePage();
    try {
        await page.goto(embedUrl(shortcode), { waitUntil: 'domcontentloaded', timeout: 40000 });
        return await page.content();
    } finally {
        try { await page.close(); } catch (_) { /* ignora */ }
    }
}

/** Estrae le slide da un HTML di embed (JSON strutturato, poi markup). */
function parseEmbedHtml(html) {
    const contextJson = extractEmbeddedJsonString(html, 'contextJSON');
    if (contextJson) {
        try {
            const context = JSON.parse(contextJson);
            const media = context.gql_data?.shortcode_media
                || context.gql_data?.xdt_shortcode_media
                || context.shortcode_media;
            if (media) {
                const normalized = normalizeMedia(media);
                if (normalized.items.length > 0) return normalized;
            }
        } catch (error) {
            console.warn('[Instagram] contextJSON non parsabile:', error.message);
        }
    }

    const items = extractFromEmbedMarkup(html);
    return { items, isCarousel: items.length > 1 };
}

/**
 * Punto d'ingresso: dato un link (o shortcode) restituisce le slide del post.
 * @param {string} input link Instagram o shortcode
 * @returns {Promise<{shortcode: string, items: Array, isCarousel: boolean, source: string}>}
 */
async function getPostMedia(input) {
    let target = input;

    if (isShareLink(target)) {
        const resolved = await resolveShareUrl(target);
        if (resolved) target = resolved;
    }

    const shortcode = extractShortcode(target);
    if (!shortcode) {
        const error = new Error('Link Instagram non valido');
        error.statusCode = 400;
        throw error;
    }

    let httpError = null;
    try {
        const html = await fetchEmbedHtml(shortcode);
        const parsed = parseEmbedHtml(html);
        if (parsed.items.length > 0) {
            return { shortcode, ...parsed, source: 'embed-http' };
        }
        httpError = new Error('Nessuna immagine trovata nel post');
    } catch (error) {
        if (error.statusCode === 404) throw error;
        httpError = error;
    }

    console.warn(`[Instagram] HTTP fallito per ${shortcode} (${httpError.message}), provo col browser...`);
    try {
        const html = await fetchEmbedHtmlWithBrowser(shortcode);
        const parsed = parseEmbedHtml(html);
        if (parsed.items.length > 0) {
            return { shortcode, ...parsed, source: 'embed-browser' };
        }
    } catch (error) {
        console.warn('[Instagram] Fallback browser fallito:', error.message);
    }

    const error = new Error('Nessuna immagine trovata: il post potrebbe essere privato, rimosso o solo video');
    error.statusCode = 404;
    throw error;
}

module.exports = {
    getPostMedia,
    extractShortcode,
    isShareLink,
    resolveShareUrl,
    parseEmbedHtml,
    normalizeMedia,
    extractEmbeddedJsonString,
};
