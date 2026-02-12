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

// Opzioni di lancio Puppeteer (compatibile con Docker/Render)
const getLaunchOptions = () => ({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,720'
    ]
});

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

    let browser;
    try {
        browser = await puppeteer.launch(getLaunchOptions());

        const page = await browser.newPage();

        // Imposta user-agent e viewport per sembrare un browser reale
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        await page.setViewport({ width: 1280, height: 720 });

        // Naviga alla pagina risultati
        console.log(`[Flashscore] Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Log pagina raggiunta
        const pageTitle = await page.title();
        const pageUrl = page.url();
        console.log(`[Flashscore] Page loaded: "${pageTitle}" at ${pageUrl}`);

        // Chiudi cookie banner se presente
        try {
            await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 3000 });
            await page.click('#onetrust-accept-btn-handler');
            console.log('[Flashscore] Cookie banner dismissed');
            await sleep(1000);
        } catch (e) {
            console.log('[Flashscore] No cookie banner found, continuing...');
        }

        // Aspetta per il rendering completo della SPA
        await sleep(3000);

        // Debug: cerca tutti i possibili selettori per le partite
        const selectorDebug = await page.evaluate(() => {
            const selectors = {
                'event__match': document.querySelectorAll('.event__match').length,
                'event__match--static': document.querySelectorAll('.event__match--static').length,
                'event__match--twoLine': document.querySelectorAll('.event__match--twoLine').length,
                'sportName': document.querySelectorAll('.sportName').length,
                'leagues--static': document.querySelectorAll('.leagues--static').length,
                'event__participant': document.querySelectorAll('.event__participant').length,
                'event__participant--home': document.querySelectorAll('.event__participant--home').length,
                '[class*=event]': document.querySelectorAll('[class*="event"]').length,
                '[class*=match]': document.querySelectorAll('[class*="match"]').length,
                '[class*=participant]': document.querySelectorAll('[class*="participant"]').length,
                '[class*=score]': document.querySelectorAll('[class*="score"]').length,
            };
            // Anche: cattura classi top-level per debug
            const bodyClasses = Array.from(document.body.querySelectorAll('div[class]'))
                .slice(0, 30)
                .map(el => el.className.split(' ').slice(0, 3).join(' '));
            return { selectors, bodyClasses };
        });
        console.log('[Flashscore] Selector debug:', JSON.stringify(selectorDebug.selectors));
        console.log('[Flashscore] Top div classes:', selectorDebug.bodyClasses.slice(0, 15));

        // Prova vari selettori per trovare le partite
        const MATCH_SELECTORS = [
            '.event__match',
            '.event__match--static',
            '.event__match--twoLine',
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
            // Dump più info per debug
            const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
            console.error('[Flashscore] No match elements found! Page text preview:', bodyText);
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

        await browser.close();
        browser = null;

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
        if (browser) await browser.close();
        throw error;
    }
}

/**
 * Scrape goalscorer details from a Flashscore match detail page.
 * 
 * @param {string} matchUrl - URL della pagina dettaglio partita (flashscore.it)
 * @returns {Promise<Object>} { homeGoals: [{player, minute}], awayGoals: [{player, minute}] }
 */
async function getMatchDetails(matchUrl) {
    let browser;
    try {
        browser = await puppeteer.launch(getLaunchOptions());

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 720 });

        console.log(`[Flashscore] Fetching match details: ${matchUrl}`);
        await page.goto(matchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Chiudi cookie banner
        try {
            await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 3000 });
            await page.click('#onetrust-accept-btn-handler');
            await sleep(1000);
        } catch (e) { /* nessun banner */ }

        // Aspetta rendering
        await sleep(3000);

        // Estrai i gol
        const goals = await page.evaluate(() => {
            const homeGoals = [];
            const awayGoals = [];

            const incidents = document.querySelectorAll('.smv__incident');
            let prevHomeScore = 0;
            let prevAwayScore = 0;

            incidents.forEach(el => {
                // Verifica che sia un gol (icona pallone)
                const goalIcon = el.querySelector('[data-testid="wcl-icon-incidents-goal-soccer"]');
                if (!goalIcon) return;

                // Estrai minuto
                const timeBox = el.querySelector('.smv__timeBox');
                const minute = timeBox ? timeBox.textContent.trim() : '';

                // Estrai punteggio corrente dall'evento
                const scoreTexts = el.querySelectorAll('[class*="incidentHomeScore"], [class*="incidentAwayScore"]');
                let curHomeScore = prevHomeScore;
                let curAwayScore = prevAwayScore;

                // Il punteggio è nel formato "X - Y" dentro l'incident
                const fullText = el.textContent;
                const scoreMatch = fullText.match(/(\d+)\s*-\s*(\d+)/);
                if (scoreMatch) {
                    curHomeScore = parseInt(scoreMatch[1]);
                    curAwayScore = parseInt(scoreMatch[2]);
                }

                // Determina quale squadra ha segnato confrontando i punteggi
                const isHomeGoal = curHomeScore > prevHomeScore;

                // Estrai nome giocatore
                let playerName = '';
                // Prova smv__playerName
                const nameEl = el.querySelector('[class*="playerName"]');
                if (nameEl) {
                    playerName = nameEl.textContent.trim();
                } else {
                    // Fallback: cerca testo che sembra un nome
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

                // Formatta: COGNOME minuto'
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

        await browser.close();
        browser = null;

        console.log(`[Flashscore] Goals found - Home: ${goals.homeGoals.length}, Away: ${goals.awayGoals.length}`);
        return goals;

    } catch (error) {
        if (browser) await browser.close();
        console.error('[Flashscore] Match details error:', error.message);
        return { homeGoals: [], awayGoals: [] };
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
