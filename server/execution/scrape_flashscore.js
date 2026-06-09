/**
 * scrape_flashscore.js
 * 
 * Modulo Node.js ad alte prestazioni per estrarre risultati e classifiche da Flashscore.
 * 
 * Architettura:
 *   1. BROWSER SINGLETON — Un'unica istanza Chromium "warm" per tutta la vita del server.
 *      Mutex via Promise per evitare launch concorrenti. Auto-healing su crash.
 *   2. API INTERCEPTION — Bypass completo del DOM: intercetta i payload JSON interni
 *      di Flashscore via page.on('response'), chiude la pagina immediatamente.
 *   3. MEMORY TUNING — Flag V8 aggressivi per ambienti cloud a bassa RAM (Render 512MB).
 * 
 * Uso come modulo:
 *   const { getRecentMatches, getMatchDetails, getStandings } = require('./scrape_flashscore');
 *   const matches = await getRecentMatches({ country: 'greece', league: 'super-league', daysBack: 7 });
 *   const standings = await getStandings({ country: 'greece', league: 'super-league' });
 * 
 * Uso da CLI (per test):
 *   node execution/scrape_flashscore.js --mode=matches --country=greece --league=super-league --daysBack=7
 *   node execution/scrape_flashscore.js --mode=standings --country=greece --league=super-league
 */

// Supporta sia puppeteer (locale) che puppeteer-core (Docker/Render)
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    puppeteer = require('puppeteer-core');
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// HTTP client per API diretta (match details)
const axios = require('axios');

// =============================================================================
// SEZIONE 1: BROWSER SINGLETON CON AUTO-HEALING
// =============================================================================

let _browser = null;
let _browserLaunching = null; // Promise mutex: impedisce launch concorrenti
const BROWSER_MAX_PAGES = 5;  // Max pagine simultanee (protezione memoria)

/**
 * Flag di avvio ottimizzati per Chromium su cloud a bassa RAM.
 * --js-flags limita l'heap V8 di Chromium stesso (non di Node.js).
 * --single-process riduce il footprint a ~100MB invece di ~300MB.
 */
const BROWSER_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--single-process',
    '--js-flags=--max-old-space-size=256 --max-semi-space-size=2',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--no-first-run',
    '--disable-features=TranslateUI,BlinkGenPropertyTrees',
    '--disable-ipc-flooding-protection',
    '--disable-blink-features=AutomationControlled',
    '--window-size=1280,720',
    '--disable-component-update',
    '--disable-domain-reliability',
    '--disable-print-preview',
    '--disable-speech-api',
    '--no-default-browser-check',
    '--mute-audio',
    '--hide-scrollbars',
];

/**
 * Lancia il browser con retry automatico.
 * @private
 */
async function _launchBrowser() {
    console.log('[Flashscore] Launching browser singleton...');
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: BROWSER_ARGS,
    });

    // Auto-healing: se Chromium crasha, ripulisci il riferimento
    browser.on('disconnected', () => {
        console.warn('[Flashscore] ⚠️ Browser disconnected! Will relaunch on next request.');
        _browser = null;
        _browserLaunching = null;
    });

    console.log('[Flashscore] Browser singleton launched ✅');
    return browser;
}

/**
 * Ottieni il browser singleton. Se non esiste, lo lancia.
 * Se un altro chiamante sta già lanciando il browser, attende la stessa Promise (mutex).
 * @returns {Promise<Browser>}
 */
async function getBrowser() {
    // Se il browser esiste ed è connesso, restituiscilo
    if (_browser && _browser.connected) {
        return _browser;
    }

    // Se qualcuno sta già lanciando, attendi la stessa Promise (mutex)
    if (_browserLaunching) {
        await _browserLaunching;
        if (_browser && _browser.connected) return _browser;
    }

    // Nessuno sta lanciando → lancia con mutex
    _browserLaunching = _launchBrowser();
    try {
        _browser = await _browserLaunching;
    } catch (err) {
        _browserLaunching = null;
        throw err;
    }
    _browserLaunching = null;
    return _browser;
}

/**
 * Acquisisci una nuova pagina dal browser singleton.
 * Controlla la concorrenza: se ci sono troppe pagine aperte, attende.
 * @returns {Promise<Page>}
 */
async function acquirePage() {
    const browser = await getBrowser();

    // Concurrency guard: attendi se troppe pagine aperte
    let attempts = 0;
    while (attempts < 30) {
        const pages = await browser.pages();
        // pages[0] è sempre "about:blank" (pagina iniziale del browser)
        if (pages.length - 1 < BROWSER_MAX_PAGES) break;
        console.warn(`[Flashscore] Too many pages open (${pages.length - 1}/${BROWSER_MAX_PAGES}), waiting...`);
        await sleep(1000);
        attempts++;
    }

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });

    // Blocca TUTTO tranne HTML, Script e chiamate API (Strict Mode)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const rType = req.resourceType();
        const url = req.url();

        const allowedTypes = ['document', 'script', 'xhr', 'fetch'];
        if (!allowedTypes.includes(rType)) {
            req.abort();
            return;
        }

        // Block ad/tracking domains
        const BLOCKED_DOMAINS = [
            'googlesyndication', 'doubleclick', 'google-analytics', 'googletagmanager',
            'facebook', 'onetrust', 'cookielaw', 'adsafeprotected', 'amazon-adsystem',
            'criteo', 'outbrain', 'taboola', 'chartbeat', 'newrelic', 'sentry',
            'hotjar', 'clarity.ms', 'segment.', 'analytics.'
        ];
        if (BLOCKED_DOMAINS.some(d => url.includes(d))) {
            req.abort();
            return;
        }

        req.continue();
    });

    return page;
}

/**
 * Pre-lancia il browser all'avvio del server per evitare cold start.
 */
function prewarmBrowser() {
    getBrowser()
        .then(() => console.log('[Flashscore] Browser pre-warmed ✅'))
        .catch(err => console.warn('[Flashscore] Browser pre-warm failed:', err.message));
}

// Avvia il pre-warming al caricamento del modulo
prewarmBrowser();

// =============================================================================
// SEZIONE 2: COMPETITION REGISTRY
// =============================================================================

/**
 * Registry centralizzato di tutte le competizioni supportate.
 * Per ogni competizione, definisce gli URL di navigazione da tentare.
 * La nazionale greca ha un URL speciale (pagina team invece che torneo).
 */
const COMPETITION_URLS = {
    // --- Grecia ---
    'greece/super-league': [
        'https://www.flashscore.it/calcio/greece/super-league/risultati/',
        'https://www.flashscore.it/calcio/greece/super-league-championship-group/risultati/',
        'https://www.flashscore.it/calcio/greece/super-league-relegation-group/risultati/',
    ],
    'greece/super-league-2': [
        'https://www.flashscore.it/calcio/greece/super-league-2/risultati/',
    ],
    'greece/coppa': [
        'https://www.flashscore.it/calcio/greece/coppa/risultati/',
    ],
    'greece/national-team': [
        'https://www.flashscore.it/squadra/grecia/Gbw2oT5D/risultati/',
    ],
    // --- Competizioni Europee ---
    'europe/champions-league': [
        'https://www.flashscore.it/calcio/europe/champions-league/risultati/',
    ],
    'europe/europa-league': [
        'https://www.flashscore.it/calcio/europe/europa-league/risultati/',
    ],
    'europe/conference-league': [
        'https://www.flashscore.it/calcio/europe/conference-league/risultati/',
    ],
};

/**
 * Registry URL per classifiche.
 */
const STANDINGS_URLS = {
    'greece/super-league': 'https://www.flashscore.com/football/greece/super-league/standings/',
    'greece/super-league-2': 'https://www.flashscore.com/football/greece/super-league-2/standings/',
    'greece/coppa': null, // Le coppe non hanno classifica standard
    'europe/champions-league': 'https://www.flashscore.com/football/europe/champions-league/standings/',
    'europe/europa-league': 'https://www.flashscore.com/football/europe/europa-league/standings/',
    'europe/conference-league': 'https://www.flashscore.com/football/europe/conference-league/standings/',
    // La nazionale non ha classifica
    'greece/national-team': null,
};

/**
 * Ottieni gli URL per una competizione, con fallback generico.
 */
function getCompetitionUrls(country, league) {
    const key = `${country}/${league}`;
    if (COMPETITION_URLS[key]) return COMPETITION_URLS[key];
    // Fallback generico
    return [`https://www.flashscore.it/calcio/${country}/${league}/risultati/`];
}

function getStandingsUrl(country, league) {
    const key = `${country}/${league}`;
    if (STANDINGS_URLS[key] !== undefined) return STANDINGS_URLS[key];
    return `https://www.flashscore.com/football/${country}/${league}/standings/`;
}

// =============================================================================
// SEZIONE 3: PARSER FORMATO PROPRIETARIO FLASHSCORE
// =============================================================================

/**
 * Parsa una data Flashscore nel formato "DD.MM.YYYY" o "DD.MM. HH:MM" e la converte in Date.
 * Flashscore mostra date in vari formati a seconda di quanto è recente la partita.
 */
function parseFlashscoreDate(dateStr) {
    if (!dateStr) return null;

    const cleaned = dateStr.trim();

    // Formato "DD.MM.YYYY HH:MM" (es. "10.02.2026 20:00")
    const fullMatch = cleaned.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
    if (fullMatch) {
        const [, day, month, year, hour, min] = fullMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
    }

    // Formato "DD.MM. HH:MM" (senza anno, es. "10.02. 20:00")
    const shortMatch = cleaned.match(/^(\d{2})\.(\d{2})\.\s*(\d{2}):(\d{2})$/);
    if (shortMatch) {
        const [, day, month, hour, min] = shortMatch;
        let year = new Date().getFullYear();
        const date = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
        // Se la data è nel futuro, è dell'anno scorso
        if (date > new Date()) {
            date.setFullYear(year - 1);
        }
        return date;
    }

    // Formato solo data "DD.MM.YYYY"
    const dateOnly = cleaned.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (dateOnly) {
        const [, day, month, year] = dateOnly;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    return null;
}

/**
 * Parsa il formato dati proprietario di Flashscore.
 * Il formato usa '\u00ac' come separatore e '\u00f7' come delimitatore chiave-valore.
 * Ogni sezione inizia con un key che contiene '~' (es. ~III).
 * 
 * IMPORTANTE: dentro ogni sezione, le chiavi possono ripetersi!
 * Per questo motivo, il parser emette una lista di coppie chiave-valore
 * per ogni sezione, preservando l'ORDINE e le RIPETIZIONI.
 */
function parseFlashscoreData(rawData) {
    const sections = [];
    let currentPairs = null;
    let sectionId = null;

    const parts = rawData.split('\xAC');
    for (const part of parts) {
        const sepIdx = part.indexOf('\xF7');
        if (sepIdx === -1) continue;

        const key = part.substring(0, sepIdx);
        const value = part.substring(sepIdx + 1);

        if (key.startsWith('~')) {
            if (currentPairs) sections.push({ id: sectionId, pairs: currentPairs });
            sectionId = key;
            currentPairs = [{ key, value }];
        } else if (currentPairs) {
            currentPairs.push({ key, value });
        }
    }
    if (currentPairs) sections.push({ id: sectionId, pairs: currentPairs });
    return sections;
}

/**
 * Estrai le partite (risultati) dal payload proprietario di Flashscore.
 * Ogni partita è delimitata da una sezione ~AA con il match ID,
 * seguita da coppie: AD (timestamp), CX (team home), AF (team away),
 * AG (score home), AH (score away), AE (status).
 */
function parseMatchesFromRawData(rawData, daysBack = 365) {
    const matches = [];
    const sections = parseFlashscoreData(rawData);

    let currentMatch = null;

    for (const section of sections) {
        for (const pair of section.pairs) {
            const { key, value } = pair;

            // ~AA = Nuovo match (value = match ID)
            if (key === '~AA') {
                if (currentMatch && currentMatch.homeTeam && currentMatch.awayTeam) {
                    matches.push(currentMatch);
                }
                currentMatch = {
                    matchId: value,
                    dateStr: '',
                    parsedDate: null,
                    homeTeam: '',
                    awayTeam: '',
                    homeScore: '',
                    awayScore: '',
                    matchUrl: '',
                };
                continue;
            }

            if (!currentMatch) continue;

            switch (key) {
                case 'AD': {
                    // Timestamp UNIX in secondi
                    const ts = parseInt(value);
                    if (!isNaN(ts)) {
                        const d = new Date(ts * 1000);
                        currentMatch.parsedDate = d;
                        const dd = String(d.getDate()).padStart(2, '0');
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const yyyy = d.getFullYear();
                        const hh = String(d.getHours()).padStart(2, '0');
                        const mi = String(d.getMinutes()).padStart(2, '0');
                        currentMatch.dateStr = `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
                    }
                    break;
                }
                case 'CX': currentMatch.homeTeam = value; break;
                case 'AF': currentMatch.awayTeam = value; break;
                case 'AG': currentMatch.homeScore = value; break;
                case 'AH': currentMatch.awayScore = value; break;
                case 'AE': {
                    // Status del match: trascuriamo partite non finite
                    // AE contiene codici come "3" (finito), "1" (non iniziato), etc.
                    currentMatch.status = value;
                    break;
                }
            }
        }
    }

    // Push last match
    if (currentMatch && currentMatch.homeTeam && currentMatch.awayTeam) {
        matches.push(currentMatch);
    }

    // Filtra per data e formatta
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    return matches
        .filter(m => {
            if (!m.parsedDate) return true;
            return m.parsedDate >= cutoffDate;
        })
        .sort((a, b) => {
            if (!a.parsedDate) return 1;
            if (!b.parsedDate) return -1;
            return b.parsedDate - a.parsedDate;
        })
        .map(m => ({
            date: m.dateStr,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            matchUrl: '',
            matchId: m.matchId,
        }));
}

// =============================================================================
// SEZIONE 4: API INTERCEPTION — getRecentMatches
// =============================================================================

/**
 * Scrape partite recenti tramite API Interception.
 * 
 * STRATEGIA:
 *   1. Apre la pagina + intercetta TUTTE le risposte HTTP
 *   2. Cattura il payload del feed proprietario Flashscore (URL: /x/feed/ o simile)
 *   3. Appena il payload è ricevuto, chiude la pagina → 0ms di rendering DOM
 *   4. Se l'interception fallisce, cade indietro sul DOM parsing (fallback robusto)
 * 
 * @param {Object} options
 * @param {string} options.country - Country slug
 * @param {string} options.league - League slug
 * @param {number} [options.daysBack=365] - Quanti giorni indietro cercare
 * @returns {Promise<Array>} Array di match
 */
async function getRecentMatches({ country, league, daysBack = 365 }) {
    const urlsToTry = getCompetitionUrls(country, league);
    let page;

    try {
        page = await acquirePage();
        let allMatches = [];

        for (const url of urlsToTry) {
            console.log(`[Flashscore] Navigating to: ${url}`);
            const t0 = Date.now();

            // --- METODO 1: API INTERCEPTION ---
            try {
                const interceptedData = await interceptApiResponse(page, url);
                if (interceptedData) {
                    const parsed = parseMatchesFromRawData(interceptedData, daysBack);
                    console.log(`[Flashscore] API Intercept success in ${Date.now() - t0}ms: ${parsed.length} matches`);
                    allMatches.push(...parsed);
                    if (allMatches.length > 0) break;
                    continue;
                }
            } catch (interceptErr) {
                console.warn(`[Flashscore] API Intercept failed for ${url}: ${interceptErr.message}`);
            }

            // --- METODO 2: FALLBACK DOM PARSING ---
            console.log(`[Flashscore] Falling back to DOM parsing for: ${url}`);
            try {
                const domMatches = await extractMatchesFromDOM(page, url, daysBack);
                allMatches.push(...domMatches);
                console.log(`[Flashscore] DOM fallback: ${domMatches.length} matches in ${Date.now() - t0}ms`);
                if (allMatches.length > 0) break;
            } catch (domErr) {
                console.warn(`[Flashscore] DOM fallback also failed for ${url}: ${domErr.message}`);
            }
        }

        if (allMatches.length === 0) {
            throw new Error(`Nessuna partita trovata per ${country}/${league}. La pagina potrebbe aver cambiato struttura.`);
        }

        console.log(`[Flashscore] Final: ${allMatches.length} matches in last ${daysBack} days`);
        return allMatches;

    } catch (error) {
        console.error('[Flashscore] Scrape Error:', error);
        throw error;
    } finally {
        if (page && !page.isClosed()) {
            await page.close().catch(() => {});
        }
    }
}

/**
 * Intercetta la risposta API interna di Flashscore.
 * Naviga sulla pagina e cattura il primo payload di dati partite.
 * 
 * @param {Page} page - Pagina Puppeteer (già configurata)
 * @param {string} url - URL da navigare
 * @returns {Promise<string|null>} Raw payload text o null se non intercettato
 */
async function interceptApiResponse(page, url) {
    return new Promise(async (resolve, reject) => {
        let resolved = false;

        // Timeout: se non riceviamo il payload in 20s, fallback al DOM
        const timer = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                resolve(null);
            }
        }, 20000);

        // Listener per intercettare le risposte API
        const onResponse = async (response) => {
            if (resolved) return;

            const resUrl = response.url();

            // Pattern 1: Feed proprietario Flashscore (formato ¬ delimitato)
            // URL tipici: local-it.flashscore.ninja/1/x/feed/f_1_..._results
            //             d.flashscore.com/x/feed/f_1_..._results
            const isFeedUrl = (resUrl.includes('/x/feed/') || resUrl.includes('/feed/')) &&
                (resUrl.includes('_results') || resUrl.includes('_fixtures') ||
                    resUrl.includes('df_to_') || resUrl.includes('df_sui_'));

            // Pattern 2: GraphQL endpoint
            const isGraphQL = resUrl.includes('graphql') && response.request().method() === 'POST';

            if (isFeedUrl || isGraphQL) {
                try {
                    const text = await response.text();
                    // Verifica che sia il payload di dati (non una risposta vuota/errore)
                    if (text && text.length > 100) {
                        console.log(`[Flashscore] ✅ Intercepted API response: ${resUrl.substring(0, 80)}... (${text.length} bytes)`);
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(timer);
                            resolve(text);
                        }
                    }
                } catch (e) {
                    // response.text() può fallire se la pagina è già chiusa
                }
            }
        };

        page.on('response', onResponse);

        try {
            // Naviga con 'commit' — il minimo necessario, non aspetta il DOM
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });

            // Attendi un po' per dare tempo alle API di rispondere
            // (il listener catturerà il payload appena arriva)
            await sleep(5000);

            // Se dopo la navigazione + attesa non è arrivato nulla, resolve null
            if (!resolved) {
                resolved = true;
                clearTimeout(timer);
                resolve(null);
            }
        } catch (navErr) {
            if (!resolved) {
                resolved = true;
                clearTimeout(timer);
                reject(navErr);
            }
        }
    });
}

/**
 * Fallback: estrai partite dal DOM (metodo originale, più lento ma robusto).
 */
async function extractMatchesFromDOM(page, url, daysBack) {
    // Se la pagina corrente non è già su questo URL, naviga
    const currentUrl = page.url();
    if (!currentUrl.includes(url.replace('https://www.flashscore.it', ''))) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    await page.waitForSelector('[class*="event__match"]', { timeout: 12000 }).catch(() => {});
    await sleep(300);

    const MATCH_SELECTORS = ['.event__match', '[class*="event__match"]'];
    let matchSelector = null;
    for (const sel of MATCH_SELECTORS) {
        const count = await page.$$eval(sel, els => els.length).catch(() => 0);
        if (count > 0) {
            matchSelector = sel;
            break;
        }
    }

    if (!matchSelector) return [];

    const rawMatches = await page.evaluate((selector) => {
        const matches = [];
        const matchElements = document.querySelectorAll(selector);

        matchElements.forEach(el => {
            try {
                const timeEl = el.querySelector('.event__time') || el.querySelector('[class*="time"]');
                const dateStr = timeEl ? timeEl.textContent.trim() : '';

                const homeEl = el.querySelector('.event__participant--home') || el.querySelector('.event__homeParticipant');
                const awayEl = el.querySelector('.event__participant--away') || el.querySelector('.event__awayParticipant');
                const homeTeam = homeEl ? homeEl.textContent.trim() : '';
                const awayTeam = awayEl ? awayEl.textContent.trim() : '';

                const homeScoreEl = el.querySelector('.event__score--home') || el.querySelector('[class*="score--home"]');
                const awayScoreEl = el.querySelector('.event__score--away') || el.querySelector('[class*="score--away"]');
                const homeScore = homeScoreEl ? homeScoreEl.textContent.trim() : '';
                const awayScore = awayScoreEl ? awayScoreEl.textContent.trim() : '';

                const matchId = el.id ? el.id.replace('g_1_', '') : '';

                if (homeTeam && awayTeam) {
                    matches.push({ dateStr, homeTeam, awayTeam, homeScore, awayScore, matchUrl: '', matchId });
                }
            } catch (e) {}
        });
        return matches;
    }, matchSelector);

    // Filtra per data
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    return rawMatches
        .map(match => {
            const parsedDate = parseFlashscoreDate(match.dateStr);
            return { ...match, date: match.dateStr, parsedDate };
        })
        .filter(match => {
            if (!match.parsedDate) return true;
            return match.parsedDate >= cutoffDate;
        })
        .sort((a, b) => {
            if (!a.parsedDate) return 1;
            if (!b.parsedDate) return -1;
            return b.parsedDate - a.parsedDate;
        })
        .map(({ parsedDate, dateStr, ...rest }) => rest);
}

// =============================================================================
// SEZIONE 5: STANDINGS (CLASSIFICA) — Puppeteer-only (richiede rendering)
// =============================================================================

/**
 * Scrape league standings (classifica).
 * Le classifiche richiedono rendering DOM perché i dati sono in una tabella
 * che viene popolata da JavaScript lato client.
 * 
 * @param {Object} options
 * @param {string} options.country - Country slug
 * @param {string} options.league - League slug
 * @returns {Promise<Array>} Array di { rank, team, p, w, d, l, gd, pts }
 */
async function getStandings({ country, league }) {
    const url = getStandingsUrl(country, league);

    if (!url) {
        console.warn(`[Flashscore Standings] No standings URL for ${country}/${league}`);
        return [];
    }

    let page;
    try {
        page = await acquirePage();

        console.log(`[Flashscore Standings] Navigating to: ${url}`);
        const t0 = Date.now();

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

        // Handle Cookies (Onetrust) - Generic handler
        try {
            const cookieBtn = await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 4000 });
            if (cookieBtn) {
                console.log('[Flashscore Standings] Clicking Cookie Consent...');
                await cookieBtn.click();
                await sleep(500);
            }
        } catch (e) { /* Ignore */ }

        // Wait for the standings table container
        console.log('[Flashscore Standings] Waiting for table...');
        await page.waitForSelector('.ui-table__row', { timeout: 15000 });
        await sleep(1000);

        console.log(`[Flashscore Standings] Rows found in ${Date.now() - t0}ms`);

        // Extract Data
        const standings = await page.evaluate(() => {
            const rows = document.querySelectorAll('.ui-table__row');
            const data = [];

            rows.forEach(row => {
                try {
                    const rankEl = row.querySelector('.tableCellRank');
                    if (!rankEl) return;
                    const rank = rankEl.textContent.trim().replace('.', '');

                    const teamEl = row.querySelector('.tableCellParticipant__name');
                    const team = teamEl ? teamEl.textContent.trim() : 'Unknown';

                    const valueCells = Array.from(row.querySelectorAll('.table__cell--value'));
                    const pointsCell = row.querySelector('.table__cell--points');

                    if (valueCells.length >= 5) {
                        const p = valueCells[0].textContent.trim();
                        const w = valueCells[1].textContent.trim();
                        const d = valueCells[2].textContent.trim();
                        const l = valueCells[3].textContent.trim();
                        const goalsRaw = valueCells[4].textContent.trim();

                        let gd = 0;
                        if (goalsRaw.includes(':')) {
                            const [gf, ga] = goalsRaw.split(':').map(n => parseInt(n));
                            gd = gf - ga;
                        }
                        const gdStr = gd > 0 ? `+${gd}` : `${gd}`;

                        const pts = pointsCell ? pointsCell.textContent.trim() : valueCells[valueCells.length - 1].textContent.trim();

                        data.push({ rank, team, p, w, d, l, gd: gdStr, pts });
                    }
                } catch (e) {
                    // Skip
                }
            });
            return data;
        });

        console.log(`[Flashscore Standings] Extracted ${standings.length} teams.`);
        return standings;

    } catch (error) {
        console.error('[Flashscore Standings] Scrape Error:', error);
        throw error;
    } finally {
        if (page && !page.isClosed()) {
            await page.close().catch(() => {});
        }
    }
}

// =============================================================================
// SEZIONE 6: MATCH DETAILS (MARCATORI) — API diretta + Puppeteer fallback
// =============================================================================

/**
 * Estrai matchId dall'URL Flashscore.
 */
function extractMatchId(matchUrl) {
    if (!matchUrl) return null;

    const midMatch = matchUrl.match(/[?&]mid=([a-zA-Z0-9]+)/);
    if (midMatch) return midMatch[1];

    const matchEn = matchUrl.match(/\/match\/([a-zA-Z0-9]{6,12})/);
    if (matchEn) return matchEn[1];

    const segments = matchUrl.split(/[/?#]/);
    for (const seg of segments) {
        if (/^[a-zA-Z0-9]{6,12}$/.test(seg)) return seg;
    }

    return null;
}

/**
 * Estrai i gol dal dato parsato di una partita Flashscore.
 * Gestisce: IE=3 (gol), IE=10 (rigore segnato).
 * Filtra i calci di rigore finali (shootout).
 */
function extractGoalsFromSections(sections) {
    const homeGoals = [];
    const awayGoals = [];
    let inShootout = false;

    for (const section of sections) {
        if (section.id === '~AC') {
            const firstPair = section.pairs[0];
            if (firstPair) {
                const val = firstPair.value.toLowerCase();
                if (val.includes('пенальти') || val.includes('penalty') || val.includes('rigori') || val.includes('pen')) {
                    inShootout = true;
                }
            }
            continue;
        }

        if (!section.id || !section.id.startsWith('~III')) continue;
        if (inShootout) continue;

        const pairs = section.pairs;
        let team = '';
        let minute = '';
        for (const p of pairs) {
            if ((p.key === 'IA' || p.key === 'IAX') && !team) team = p.value;
            if ((p.key === 'IB' || p.key === 'IBX') && !minute) minute = p.value;
        }

        const subEvents = [];
        let currentSub = null;
        for (const p of pairs) {
            if (p.key === 'IE' || p.key === 'IEX') {
                if (currentSub) subEvents.push(currentSub);
                currentSub = { ie: p.value, if: '' };
            } else if (currentSub && (p.key === 'IF')) {
                currentSub.if = p.value;
            }
        }
        if (currentSub) subEvents.push(currentSub);

        let goalSub = null;
        for (const sub of subEvents) {
            if (sub.ie === '3' || sub.ie === '10') {
                goalSub = sub;
                break;
            }
        }

        if (!goalSub || !goalSub.if) continue;

        const playerName = goalSub.if.trim();
        const nameParts = playerName.split(/\s+/);
        const lastName = nameParts[0] || playerName;
        const isPenalty = goalSub.ie === '10';

        const goalData = {
            player: playerName,
            lastName: lastName.toUpperCase(),
            minute,
            isPenalty,
        };

        if (team === '1') {
            homeGoals.push(goalData);
        } else if (team === '2') {
            awayGoals.push(goalData);
        }
    }

    return { homeGoals, awayGoals };
}

/**
 * Formatta l'array di gol per il frontend.
 * - Home: "27' 83' JOVIC", Away: "JOVIC 27' 83'"
 * - Rigori: "33' [R] VARGA" (home), "VARGA 33' [R]" (away)
 */
function formatGoalscorers(goals, side) {
    const grouped = {};
    for (const g of goals) {
        if (!grouped[g.lastName]) grouped[g.lastName] = [];
        grouped[g.lastName].push({ minute: g.minute, isPenalty: g.isPenalty });
    }

    const seen = [];
    for (const g of goals) {
        if (!seen.includes(g.lastName)) seen.push(g.lastName);
    }

    const result = [];
    for (const name of seen) {
        const entries = grouped[name];
        if (side === 'home') {
            const minuteParts = entries.map(e => e.isPenalty ? `${e.minute} [R]` : e.minute);
            result.push(`${minuteParts.join(' ')} ${name}`);
        } else {
            const minuteParts = entries.map(e => e.isPenalty ? `${e.minute} [R]` : e.minute);
            result.push(`${name} ${minuteParts.join(' ')}`);
        }
    }

    return result;
}

/**
 * Scrape goalscorer details via API HTTP diretta (VELOCE: ~1-2s).
 * Fallback a Puppeteer se l'API non risponde.
 */
async function getMatchDetails(matchUrl, matchId) {
    const resolvedId = matchId || extractMatchId(matchUrl);
    if (!resolvedId) {
        console.error('[Flashscore] Cannot extract matchId from URL:', matchUrl);
        return { homeGoals: [], awayGoals: [] };
    }
    console.log(`[Flashscore] Match ID resolved: ${resolvedId}`);

    // --- METODO 1: API HTTP diretta (veloce, ~1-2s) ---
    try {
        return await getMatchDetailsViaAPI(resolvedId);
    } catch (apiError) {
        console.warn('[Flashscore] API diretta fallita:', apiError.message, '- Provo Puppeteer...');
    }

    // --- METODO 2: Fallback Puppeteer (lento, ~15-30s) ---
    try {
        return await getMatchDetailsViaPuppeteer(matchUrl);
    } catch (puppeteerError) {
        console.error('[Flashscore] Anche Puppeteer fallito:', puppeteerError.message);
        return { homeGoals: [], awayGoals: [] };
    }
}

/**
 * Recupera marcatori tramite API HTTP diretta di Flashscore.
 */
async function getMatchDetailsViaAPI(matchId) {
    const API_BASES = [
        'https://local-it.flashscore.ninja/1/x/feed',
        'https://local-global.flashscore.ninja/2/x/feed',
        'https://d.flashscore.com/x/feed',
    ];

    const headers = {
        'x-fsign': 'SW9D1eZo',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.flashscore.it/',
        'Accept': '*/*',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
    };

    let rawData = null;
    let lastError = null;

    for (const base of API_BASES) {
        const apiUrl = `${base}/df_sui_1_${matchId}`;
        console.log(`[Flashscore API] Trying: ${apiUrl}`);
        try {
            const t0 = Date.now();
            const response = await axios.get(apiUrl, {
                headers,
                timeout: 10000,
                responseType: 'text'
            });
            console.log(`[Flashscore API] Response in ${Date.now() - t0}ms (${response.data.length} bytes)`);
            if (response.data && response.data.length > 50) {
                rawData = response.data;
                break;
            }
        } catch (err) {
            lastError = err;
            console.warn(`[Flashscore API] ${base} failed: ${err.message}`);
        }
    }

    if (!rawData) {
        throw lastError || new Error('Nessun endpoint API ha restituito dati');
    }

    const sections = parseFlashscoreData(rawData);
    const goals = extractGoalsFromSections(sections);

    const homeFormatted = formatGoalscorers(goals.homeGoals, 'home');
    const awayFormatted = formatGoalscorers(goals.awayGoals, 'away');

    console.log(`[Flashscore API] Goals found - Home: ${goals.homeGoals.length}, Away: ${goals.awayGoals.length}`);
    return {
        homeGoals: homeFormatted,
        awayGoals: awayFormatted,
    };
}

/**
 * Fallback: recupera marcatori via Puppeteer (lento ma affidabile).
 */
async function getMatchDetailsViaPuppeteer(matchUrl) {
    let page;
    try {
        page = await acquirePage();

        console.log(`[Flashscore Puppeteer] Fetching: ${matchUrl}`);
        const t0 = Date.now();
        await page.goto(matchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        await page.waitForSelector('.smv__incident, [class*="incident"]', { timeout: 8000 }).catch(() => {});
        console.log(`[Flashscore Puppeteer] Page ready in ${Date.now() - t0}ms`);
        await sleep(300);

        const goals = await page.evaluate(() => {
            const homeGoals = [];
            const awayGoals = [];
            const incidents = document.querySelectorAll('.smv__incident');
            let prevHomeScore = 0;
            let prevAwayScore = 0;

            incidents.forEach(el => {
                const goalIcon = el.querySelector('[data-testid="wcl-icon-incidents-goal-soccer"]');
                if (!goalIcon) return;

                const timeBox = el.querySelector('.smv__timeBox');
                const minute = timeBox ? timeBox.textContent.trim() : '';

                let curHomeScore = prevHomeScore;
                let curAwayScore = prevAwayScore;
                const fullText = el.textContent;
                const scoreMatch = fullText.match(/(\d+)\s*-\s*(\d+)/);
                if (scoreMatch) {
                    curHomeScore = parseInt(scoreMatch[1]);
                    curAwayScore = parseInt(scoreMatch[2]);
                }

                const isHomeGoal = curHomeScore > prevHomeScore;

                let playerName = '';
                const nameEl = el.querySelector('[class*="playerName"]');
                if (nameEl) {
                    playerName = nameEl.textContent.trim();
                } else {
                    const allText = el.textContent.replace(/\s+/g, ' ').trim();
                    const parts = allText.split(/\d+\s*-\s*\d+/);
                    for (const part of parts) {
                        const cleaned = part.replace(/\d+'/g, '').replace(/Gol/g, '').trim();
                        if (cleaned.length > 2 && !cleaned.match(/^\d/)) {
                            playerName = cleaned;
                            break;
                        }
                    }
                }

                const lastName = playerName.split(' ')[0] || playerName;
                const formatted = `${lastName.toUpperCase()} ${minute}`;

                if (isHomeGoal) {
                    homeGoals.push({ player: playerName, minute, formatted });
                } else {
                    awayGoals.push({ player: playerName, minute, formatted });
                }

                prevHomeScore = curHomeScore;
                prevAwayScore = curAwayScore;
            });

            return { homeGoals, awayGoals };
        });

        console.log(`[Flashscore Puppeteer] Goals - Home: ${goals.homeGoals.length}, Away: ${goals.awayGoals.length}`);
        return goals;

    } catch (error) {
        console.error('[Flashscore Puppeteer] Error:', error.message);
        throw error;
    } finally {
        if (page && !page.isClosed()) {
            await page.close().catch(() => {});
        }
    }
}

// =============================================================================
// SEZIONE 7: CLI
// =============================================================================

if (require.main === module) {
    const args = {};
    process.argv.slice(2).forEach(arg => {
        const [key, value] = arg.replace('--', '').split('=');
        args[key] = value;
    });

    const mode = args.mode || 'matches';
    const country = args.country || 'greece';
    const league = args.league || 'super-league';

    if (mode === 'standings') {
        console.log(`\n🏆 Fetching standings: ${country}/${league}\n`);
        getStandings({ country, league })
            .then(standings => {
                console.log(JSON.stringify(standings, null, 2));
                console.log(`\n✅ Total: ${standings.length} teams found`);
            })
            .catch(err => {
                console.error(`\n❌ Error: ${err.message}`);
                process.exit(1);
            });
    } else {
        const daysBack = parseInt(args.daysBack) || 7;
        console.log(`\n🔍 Searching matches: ${country}/${league} (last ${daysBack} days)\n`);
        getRecentMatches({ country, league, daysBack })
            .then(matches => {
                console.log(JSON.stringify(matches, null, 2));
                console.log(`\n✅ Total: ${matches.length} matches found`);
            })
            .catch(err => {
                console.error(`\n❌ Error: ${err.message}`);
                process.exit(1);
            });
    }
}

module.exports = { getRecentMatches, getMatchDetails, getStandings, prewarmBrowser };
