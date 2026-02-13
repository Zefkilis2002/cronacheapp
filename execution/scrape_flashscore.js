/**
 * scrape_flashscore.js
 * 
 * Modulo Node.js che usa Puppeteer per estrarre risultati recenti da Flashscore.
 * 
 * Uso come modulo:
 *   const { getRecentMatches } = require('./scrape_flashscore');
 *   const matches = await getRecentMatches({ country: 'greece', league: 'super-league', daysBack: 7 });
 * 
 * Uso da CLI (per test):
 *   node execution/scrape_flashscore.js --country=greece --league=super-league --daysBack=7
 */

// Supporta sia puppeteer (locale) che puppeteer-core (Docker/Render)
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    puppeteer = require('puppeteer-core');
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// HTTP client per API diretta
const axios = require('axios');

// --- BROWSER POOL: riutilizza il browser tra le richieste ---
let _browser = null;
let _browserLastUsed = 0;
const BROWSER_TTL = 120000; // Chiudi dopo 2 min di inattività

async function getBrowser() {
    // Se il browser esiste ed è ancora connesso, riutilizzalo
    if (_browser && _browser.connected) {
        _browserLastUsed = Date.now();
        return _browser;
    }
    // Lancia un nuovo browser
    _browser = await puppeteer.launch({
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-sync',
            '--no-first-run',
            '--single-process',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--window-size=1280,720'
        ]
    });
    _browserLastUsed = Date.now();

    // Auto-chiudi dopo inattività
    const checkInterval = setInterval(() => {
        if (_browser && Date.now() - _browserLastUsed > BROWSER_TTL) {
            _browser.close().catch(() => { });
            _browser = null;
            clearInterval(checkInterval);
            console.log('[Flashscore] Browser chiuso per inattività');
        }
    }, 30000);

    return _browser;
}

// Risorse da bloccare (velocizza il caricamento ~60%)
const BLOCKED_RESOURCES = new Set(['image', 'stylesheet', 'font', 'media', 'other']);
const BLOCKED_DOMAINS = ['googlesyndication', 'doubleclick', 'google-analytics', 'facebook', 'onetrust'];

async function createFastPage(browser) {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });

    // Blocca risorse pesanti
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (BLOCKED_RESOURCES.has(req.resourceType()) ||
            BLOCKED_DOMAINS.some(d => req.url().includes(d))) {
            req.abort();
        } else {
            req.continue();
        }
    });

    return page;
}

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
        // Se la data è nel futuro, è dell'anno scorso (es. "22.12." in febbraio = dicembre anno precedente)
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
 * Scrape recent match results from Flashscore.
 * 
 * @param {Object} options
 * @param {string} options.country - Country slug (es. "greece", "italy", "england")
 * @param {string} options.league - League slug (es. "super-league", "serie-a", "premier-league")
 * @param {number} [options.daysBack=7] - Quanti giorni indietro cercare
 * @returns {Promise<Array>} Array di match con { date, homeTeam, awayTeam, homeScore, awayScore, matchUrl }
 */
async function getRecentMatches({ country, league, daysBack = 7 }) {
    const url = `https://www.flashscore.it/calcio/${country}/${league}/risultati/`;

    const browser = await getBrowser();
    let page;
    try {
        page = await createFastPage(browser);

        console.log(`[Flashscore] Navigating to: ${url}`);
        const t0 = Date.now();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Aspetta che le partite appaiano nel DOM (più veloce di networkidle2)
        await page.waitForSelector('[class*="event__match"]', { timeout: 12000 }).catch(() => { });

        console.log(`[Flashscore] Page ready in ${Date.now() - t0}ms`);

        // Breve pausa per render finale
        await sleep(300);

        // Cerca il selettore che contiene partite (ordine per probabilità)
        const MATCH_SELECTORS = [
            '.event__match',
            '[class*="event__match"]',
        ];

        let matchSelector = null;
        for (const sel of MATCH_SELECTORS) {
            const count = await page.$$eval(sel, els => els.length).catch(() => 0);
            if (count > 0) {
                matchSelector = sel;
                console.log(`[Flashscore] Using selector "${sel}" (${count} elements)`);
                break;
            }
        }

        if (!matchSelector) {
            console.error('[Flashscore] No match elements found!');
            throw new Error(`Nessuna partita trovata nella pagina ${country}/${league}. La pagina potrebbe aver cambiato struttura.`);
        }

        // Estrai i dati delle partite
        const rawMatches = await page.evaluate((selector) => {
            const matches = [];
            const matchElements = document.querySelectorAll(selector);

            matchElements.forEach(el => {
                try {
                    // Estrai data/ora
                    const timeEl = el.querySelector('.event__time') || el.querySelector('[class*="time"]');
                    const dateStr = timeEl ? timeEl.textContent.trim() : '';

                    // Estrai nomi squadre (prova vari selettori)
                    const homeEl = el.querySelector('.event__participant--home')
                        || el.querySelector('.event__homeParticipant');
                    const awayEl = el.querySelector('.event__participant--away')
                        || el.querySelector('.event__awayParticipant');
                    const homeTeam = homeEl ? homeEl.textContent.trim() : '';
                    const awayTeam = awayEl ? awayEl.textContent.trim() : '';

                    // Estrai punteggio (prova vari selettori)
                    const homeScoreEl = el.querySelector('.event__score--home')
                        || el.querySelector('[class*="score--home"]');
                    const awayScoreEl = el.querySelector('.event__score--away')
                        || el.querySelector('[class*="score--away"]');
                    const homeScore = homeScoreEl ? homeScoreEl.textContent.trim() : '';
                    const awayScore = awayScoreEl ? awayScoreEl.textContent.trim() : '';

                    // Estrai link alla partita
                    const linkEl = el.querySelector('a');
                    const matchUrl = linkEl ? linkEl.href : '';

                    // Estrai ID match
                    const matchId = el.id ? el.id.replace('g_1_', '') : '';

                    if (homeTeam && awayTeam) {
                        matches.push({
                            dateStr,
                            homeTeam,
                            awayTeam,
                            homeScore,
                            awayScore,
                            matchUrl,
                            matchId
                        });
                    }
                } catch (e) {
                    // Skip elementi malformati
                }
            });

            return matches;
        }, matchSelector);

        console.log(`[Flashscore] Raw matches extracted: ${rawMatches.length}`);
        if (rawMatches.length > 0) {
            console.log(`[Flashscore] Sample match:`, JSON.stringify(rawMatches[0]));
        }

        await page.close();
        page = null;

        // Filtra per data (ultimi N giorni)
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

        const filteredMatches = rawMatches
            .map(match => {
                const parsedDate = parseFlashscoreDate(match.dateStr);

                return {
                    date: match.dateStr,
                    parsedDate,
                    homeTeam: match.homeTeam,
                    awayTeam: match.awayTeam,
                    homeScore: match.homeScore,
                    awayScore: match.awayScore,
                    matchUrl: match.matchUrl,
                    matchId: match.matchId
                };
            })
            .filter(match => {
                // Se non riusciamo a parsare la data, includiamo la partita comunque
                if (!match.parsedDate) return true;
                return match.parsedDate >= cutoffDate;
            })
            .sort((a, b) => {
                if (!a.parsedDate) return 1;
                if (!b.parsedDate) return -1;
                return b.parsedDate - a.parsedDate;
            })
            .map(({ parsedDate, ...rest }) => rest);

        console.log(`[Flashscore] Final: ${filteredMatches.length} matches in last ${daysBack} days`);
        return filteredMatches;

    } catch (error) {
        if (page) await page.close().catch(() => { });
        throw error;
    }
}

/**
 * Estrai matchId dall'URL Flashscore.
 * URL format IT: https://www.flashscore.it/partita/calcio/team1-xxx/team2-yyy/?mid=AbCdEfGh
 * URL format EN: https://www.flashscore.com/match/AbCdEfGh/...
 */
function extractMatchId(matchUrl) {
    if (!matchUrl) return null;

    // Prima prova: parametro ?mid= (formato flashscore.it)
    const midMatch = matchUrl.match(/[?&]mid=([a-zA-Z0-9]+)/);
    if (midMatch) return midMatch[1];

    // Seconda prova: /match/{id}/ (formato flashscore.com)
    const matchEn = matchUrl.match(/\/match\/([a-zA-Z0-9]{6,12})/);
    if (matchEn) return matchEn[1];

    // Terza prova: prendi l'ultimo segmento alfanumerico di 8 caratteri
    const segments = matchUrl.split(/[/?#]/);
    for (const seg of segments) {
        if (/^[a-zA-Z0-9]{6,12}$/.test(seg)) return seg;
    }

    return null;
}

/**
 * Parsa il formato dati proprietario di Flashscore.
 * Il formato usa '\u00ac' come separatore e '\u00f7' come delimitatore chiave-valore.
 * Ogni sezione inizia con un key che contiene '~' (es. ~III)
 */
function parseFlashscoreData(rawData) {
    const sections = [];
    let current = null;

    const parts = rawData.split('\xAC'); // \u00ac
    for (const part of parts) {
        const sepIdx = part.indexOf('\xF7'); // \u00f7
        if (sepIdx === -1) continue;

        const key = part.substring(0, sepIdx);
        const value = part.substring(sepIdx + 1);

        if (key.startsWith('~')) {
            // Nuova sezione
            if (current) sections.push(current);
            current = { [key]: value };
        } else if (current) {
            current[key] = value;
        }
    }
    if (current) sections.push(current);
    return sections;
}

/**
 * Scrape goalscorer details via API HTTP diretta (VELOCE: ~1-2s).
 * Fallback a Puppeteer se l'API non risponde.
 * 
 * @param {string} matchUrl - URL della pagina dettaglio partita (flashscore.it)
 * @param {string} [matchId] - ID partita (opzionale, estratto da URL se non fornito)
 * @returns {Promise<Object>} { homeGoals: [{player, minute, formatted}], awayGoals: [{player, minute, formatted}] }
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
    // Prova diversi endpoint regionali
    const API_BASES = [
        'https://local-it.flashscore.ninja/46/x/feed',
        'https://local-global.flashscore.ninja/46/x/feed',
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

    // Parsa il formato proprietario
    const sections = parseFlashscoreData(rawData);
    const homeGoals = [];
    const awayGoals = [];

    for (const section of sections) {
        // Le sezioni di incidente iniziano con ~III o ~IIIX
        const sectionKey = Object.keys(section).find(k => k.startsWith('~III'));
        if (!sectionKey) continue;

        const eventType = section['IE'] || section['IEX'] || '';

        // IE=3 → Gol, IE=1 → Cartellino giallo, IE=7 → Sostituzione
        if (eventType !== '3') continue;

        const team = section['IA'] || section['IAX'] || '';
        const minute = section['IB'] || section['IBX'] || '';
        // Il nome del giocatore è nel campo IF (non ICT che è vuoto)
        const playerName = section['IF'] || section['ICT'] || '';

        if (!playerName) continue;

        // Formatta: COGNOME minuto'
        // IF contiene "Cognome I." (es. "Taborda V.") — usiamo il primo token
        const nameParts = playerName.trim().split(/\s+/);
        const lastName = nameParts[0] || playerName;
        const formatted = `${lastName.toUpperCase()} ${minute}`;

        const goalData = { player: playerName.trim(), minute, formatted };

        if (team === '1') {
            homeGoals.push(goalData);
        } else if (team === '2') {
            awayGoals.push(goalData);
        }
    }

    console.log(`[Flashscore API] Goals found - Home: ${homeGoals.length}, Away: ${awayGoals.length}`);
    return { homeGoals, awayGoals };
}

/**
 * Fallback: recupera marcatori via Puppeteer (lento ma affidabile).
 */
async function getMatchDetailsViaPuppeteer(matchUrl) {
    const browser = await getBrowser();
    let page;
    try {
        page = await createFastPage(browser);

        console.log(`[Flashscore Puppeteer] Fetching: ${matchUrl}`);
        const t0 = Date.now();
        await page.goto(matchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        await page.waitForSelector('.smv__incident, [class*="incident"]', { timeout: 8000 }).catch(() => { });
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

        await page.close();
        page = null;

        console.log(`[Flashscore Puppeteer] Goals - Home: ${goals.homeGoals.length}, Away: ${goals.awayGoals.length}`);
        return goals;

    } catch (error) {
        if (page) await page.close().catch(() => { });
        throw error;
    }
}

// Se eseguito da CLI
if (require.main === module) {
    const args = {};
    process.argv.slice(2).forEach(arg => {
        const [key, value] = arg.replace('--', '').split('=');
        args[key] = value;
    });

    const country = args.country || 'grecia';
    const league = args.league || 'super-league';
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

module.exports = { getRecentMatches, getMatchDetails };
