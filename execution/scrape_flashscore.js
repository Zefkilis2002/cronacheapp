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
const BLOCKED_DOMAINS = [
    'googlesyndication', 'doubleclick', 'google-analytics', 'googletagmanager',
    'facebook', 'onetrust', 'cookielaw', 'adsafeprotected', 'amazon-adsystem',
    'criteo', 'outbrain', 'taboola', 'chartbeat', 'newrelic', 'sentry',
    'hotjar', 'clarity.ms', 'segment.', 'analytics.'
];

async function createFastPage(browser) {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });

    // Blocca risorse pesanti e script di terze parti
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const url = req.url();
        if (BLOCKED_RESOURCES.has(req.resourceType()) ||
            BLOCKED_DOMAINS.some(d => url.includes(d))) {
            req.abort();
        } else {
            req.continue();
        }
    });

    return page;
}

/**
 * Pre-lancia il browser all'avvio del server per evitare cold start.
 * Chiamato automaticamente al caricamento del modulo.
 */
function prewarmBrowser() {
    getBrowser()
        .then(() => console.log('[Flashscore] Browser pre-warmed ✅'))
        .catch(err => console.warn('[Flashscore] Browser pre-warm failed:', err.message));
}

// Avvia il pre-warming al caricamento del modulo
prewarmBrowser();

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
 * Ogni sezione inizia con un key che contiene '~' (es. ~III).
 * 
 * IMPORTANTE: dentro ogni sezione, le chiavi possono ripetersi!
 * Es. IE=3 (gol) + IF=marcatore, poi IE=8 (assist) + IF=assistman.
 * Oppure IE=5 (rigore assegnato) + IF=tiratore, poi IE=10 (rigore segnato) + IF=tiratore.
 * 
 * Per questo motivo, il parser emette una lista di coppie chiave-valore
 * per ogni sezione, preservando l'ORDINE e le RIPETIZIONI.
 */
function parseFlashscoreData(rawData) {
    const sections = [];
    let currentPairs = null; // Array di {key, value}
    let sectionId = null;

    const parts = rawData.split('\xAC'); // \u00ac
    for (const part of parts) {
        const sepIdx = part.indexOf('\xF7'); // \u00f7
        if (sepIdx === -1) continue;

        const key = part.substring(0, sepIdx);
        const value = part.substring(sepIdx + 1);

        if (key.startsWith('~')) {
            // Nuova sezione
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
 * Estrai i gol dal dato parsato di una partita Flashscore.
 * Gestisce: IE=3 (gol), IE=10 (rigore segnato).
 * Filtra i calci di rigore finali (shootout) — solo gol regolamentari + supplementari.
 * 
 * In ogni sezione ~III, i campi si ripetono per sub-evento:
 *   IE=3/IF=scorer → IE=8/IF=assister  (gol + assist)
 *   IE=5/IF=player → IE=10/IF=scorer   (rigore assegnato + rigore segnato)
 */
function extractGoalsFromSections(sections) {
    const homeGoals = [];
    const awayGoals = [];
    let inShootout = false;

    for (const section of sections) {
        // Rileva l'inizio della fase rigori (penalty shootout)
        // ~AC con valore che contiene "Пенальти" o "Penalty" o "Rigori"
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

        // Solo sezioni di incidente (~III)
        if (!section.id || !section.id.startsWith('~III')) continue;

        // Salta gol durante i calci di rigore finali
        if (inShootout) continue;

        const pairs = section.pairs;

        // Estrai IA (team) e IB (minuto) — sono sempre i primi campi della sezione
        let team = '';
        let minute = '';
        for (const p of pairs) {
            if ((p.key === 'IA' || p.key === 'IAX') && !team) team = p.value;
            if ((p.key === 'IB' || p.key === 'IBX') && !minute) minute = p.value;
        }

        // Cerca sub-eventi: ogni IE inizia un nuovo sub-evento
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

        // Cerca un sub-evento gol (IE=3) o rigore segnato (IE=10)
        let goalSub = null;
        for (const sub of subEvents) {
            if (sub.ie === '3' || sub.ie === '10') {
                goalSub = sub;
                break;
            }
        }

        if (!goalSub || !goalSub.if) continue;

        // Estrai cognome
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
 * - Raggruppa gol dello stesso giocatore in una riga
 * - Home: "27' 83' JOVIC", Away: "JOVIC 27' 83'"
 * - Rigori: "33' [R] VARGA" (home), "VARGA 33' [R]" (away)
 * 
 * @param {Array} goals - Array di {lastName, minute, isPenalty}
 * @param {string} side - 'home' o 'away'
 * @returns {Array<string>} Array di stringhe formattate
 */
function formatGoalscorers(goals, side) {
    // Raggruppa per cognome
    const grouped = {};
    for (const g of goals) {
        if (!grouped[g.lastName]) {
            grouped[g.lastName] = [];
        }
        grouped[g.lastName].push({ minute: g.minute, isPenalty: g.isPenalty });
    }

    // Mantieni l'ordine di apparizione
    const seen = [];
    for (const g of goals) {
        if (!seen.includes(g.lastName)) {
            seen.push(g.lastName);
        }
    }

    const result = [];
    for (const name of seen) {
        const entries = grouped[name];

        if (side === 'home') {
            // Home: "27' 83' JOVIC" oppure "33' [R] 87' JOVIC"
            const minuteParts = entries.map(e => e.isPenalty ? `${e.minute} [R]` : e.minute);
            result.push(`${minuteParts.join(' ')} ${name}`);
        } else {
            // Away: "JOVIC 27' 83'" oppure "JOVIC 33' [R] 87'"
            const minuteParts = entries.map(e => e.isPenalty ? `${e.minute} [R]` : e.minute);
            result.push(`${name} ${minuteParts.join(' ')}`);
        }
    }

    return result;
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
    // Progetto 1 = locale inglese/internazionale (nomi in alfabeto latino)
    // Progetto 46 = locale russo (nomi in cirillico) — NON usare!
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

    // Parsa il formato proprietario e estrai i gol
    const sections = parseFlashscoreData(rawData);
    const goals = extractGoalsFromSections(sections);

    // Formatta per il frontend (home: "27' JOVIC", away: "JOVIC 27'")
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

module.exports = { getRecentMatches, getMatchDetails, prewarmBrowser };
