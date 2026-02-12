// Supporta sia puppeteer (locale) che puppeteer-core (Docker/Render)
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    puppeteer = require('puppeteer-core');
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Opzioni di lancio Puppeteer (ottimizzate per Render 512MB RAM)
const getLaunchOptions = () => ({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Fondamentale per Docker
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--no-first-run',
        '--single-process', // Riduce memoria
        '--window-size=1280,720'
    ]
});

// Risorse da bloccare (versione conservativa per stabilità)
// Blocchiamo solo immagini, font e stylesheet pesanti
const BLOCKED_RESOURCES = new Set(['image', 'stylesheet', 'font', 'media']);
const BLOCKED_DOMAINS = ['googlesyndication', 'doubleclick', 'google-analytics', 'facebook', 'onetrust'];

async function setupPage(page) {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });

    // Blocca risorse pesanti per velocizzare
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (BLOCKED_RESOURCES.has(req.resourceType()) ||
            BLOCKED_DOMAINS.some(d => req.url().includes(d))) {
            req.abort();
        } else {
            req.continue();
        }
    });
}

/**
 * Parsa una data Flashscore nel formato "DD.MM.YYYY" o "DD.MM. HH:MM" e la converte in Date.
 */
function parseFlashscoreDate(dateStr) {
    if (!dateStr) return null;
    const cleaned = dateStr.trim();

    // Formato "DD.MM.YYYY HH:MM"
    const fullMatch = cleaned.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
    if (fullMatch) {
        const [, day, month, year, hour, min] = fullMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
    }

    // Formato "DD.MM. HH:MM" (senza anno)
    const shortMatch = cleaned.match(/^(\d{2})\.(\d{2})\.\s*(\d{2}):(\d{2})$/);
    if (shortMatch) {
        const [, day, month, hour, min] = shortMatch;
        let year = new Date().getFullYear();
        const date = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
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
 */
async function getRecentMatches({ country, league, daysBack = 7 }) {
    const url = `https://www.flashscore.it/calcio/${country}/${league}/risultati/`;

    let browser;
    try {
        browser = await puppeteer.launch(getLaunchOptions());
        const page = await browser.newPage();
        await setupPage(page);

        console.log(`[Flashscore] Navigating to: ${url}`);
        const t0 = Date.now();
        // Usa domcontentloaded + timeout lungo per sicurezza
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Aspetta i selettori (con catch per non crashare subito)
        try {
            await page.waitForSelector('.event__match, [class*="event__match"]', { timeout: 15000 });
        } catch (e) {
            console.log('[Flashscore] Warning: Initial wait timed out, continuing anyway...');
        }

        console.log(`[Flashscore] Page ready in ${Date.now() - t0}ms`);
        await sleep(2000); // Pausa di sicurezza

        // Logica selezione match (identica a prima)
        const MATCH_SELECTORS = ['.event__match', '.event__match--static', '.event__match--twoLine', '[class*="event__match"]'];
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
            throw new Error(`Nessuna partita trovata nella pagina ${country}/${league}.`);
        }

        // Estrai dati
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
                    const awayTeam = awayEl ? awayTeam ? awayEl.textContent.trim() : '' : '';

                    const homeScoreEl = el.querySelector('.event__score--home') || el.querySelector('[class*="score--home"]');
                    const awayScoreEl = el.querySelector('.event__score--away') || el.querySelector('[class*="score--away"]');
                    const homeScore = homeScoreEl ? homeScoreEl.textContent.trim() : '';
                    const awayScore = awayScoreEl ? awayScoreEl.textContent.trim() : '';

                    const linkEl = el.querySelector('a');
                    const matchUrl = linkEl ? linkEl.href : '';
                    const matchId = el.id ? el.id.replace('g_1_', '') : '';

                    if (homeTeam && awayTeam) {
                        matches.push({ dateStr, homeTeam, awayTeam, homeScore, awayScore, matchUrl, matchId });
                    }
                } catch (e) { }
            });
            return matches;
        }, matchSelector);

        await browser.close();

        // Filtra date
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
            .filter(match => !match.parsedDate || match.parsedDate >= cutoffDate)
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
 */
async function getMatchDetails(matchUrl) {
    let browser;
    try {
        browser = await puppeteer.launch(getLaunchOptions());
        const page = await browser.newPage();
        await setupPage(page);

        console.log(`[Flashscore] Fetching match details: ${matchUrl}`);
        const t0 = Date.now();

        // Timeout molto lungo per sicurezza su Render
        await page.goto(matchUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });

        // Aspetta specificamente gli incidenti (gol/cartellini)
        try {
            await page.waitForSelector('.smv__incident, [class*="incident"]', { timeout: 20000 });
        } catch (e) {
            console.log('[Flashscore] Warning: No incidents found (maybe 0-0 or loading error)');
        }

        console.log(`[Flashscore] Details page ready in ${Date.now() - t0}ms`);
        await sleep(2000); // Pausa di sicurezza per il rendering React completo

        // Estrai i gol
        const goals = await page.evaluate(() => {
            const homeGoals = [];
            const awayGoals = [];

            const incidents = document.querySelectorAll('.smv__incident');
            let prevHomeScore = 0;
            let prevAwayScore = 0;

            incidents.forEach(el => {
                // Verifica gol
                const goalIcon = el.querySelector('[data-testid="wcl-icon-incidents-goal-soccer"]');
                if (!goalIcon) return;

                const timeBox = el.querySelector('.smv__timeBox');
                const minute = timeBox ? timeBox.textContent.trim() : '';

                const fullText = el.textContent;
                const scoreMatch = fullText.match(/(\d+)\s*-\s*(\d+)/);

                let curHomeScore = prevHomeScore;
                let curAwayScore = prevAwayScore;
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

                const goal = { player: playerName, minute, formatted };
                if (isHomeGoal) homeGoals.push(goal);
                else awayGoals.push(goal);

                prevHomeScore = curHomeScore;
                prevAwayScore = curAwayScore;
            });

            return { homeGoals, awayGoals };
        });

        await browser.close();
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
