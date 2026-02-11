import PocketBase from 'pocketbase';
import puppeteer from 'puppeteer';

// CONFIGURAZIONE
const SITE_URL = 'https://football-logos.cc/all/';
const PB_URL = 'http://127.0.0.1:8090';

const pb = new PocketBase(PB_URL);

async function scrapeStealth() {
    console.log("🥷 Avvio modalità STEALTH (Invisibile)...");
    
    const browser = await puppeteer.launch({ 
        headless: false, // DEVE essere false per ingannare i controlli
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--disable-blink-features=AutomationControlled', // 1. Nasconde l'automazione
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    
    const page = await browser.newPage();

    // 2. TRUCCO FONDAMENTALE: Cancella la proprietà 'webdriver' che rivela i bot
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        // Simula plugin per sembrare un PC vero
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] }); 
        window.chrome = { runtime: {} }; 
    });

    try {
        console.log(`🌍 Navigo su ${SITE_URL}...`);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(SITE_URL, { waitUntil: 'networkidle2', timeout: 120000 });

        // DEBUG: Vediamo cosa vede il robot
        const pageTitle = await page.title();
        console.log(`👀 Titolo pagina rilevato: "${pageTitle}"`);

        console.log("⬇️ SCROLL AUTOMATICO (Pazienta 60 secondi)...");
        await autoScroll(page);
        
        console.log("✅ Analisi immagini...");

        const teams = await page.evaluate(() => {
            const results = [];
            // Selettore molto ampio: prende tutte le immagini valide
            const allImages = document.querySelectorAll('img');

            allImages.forEach(img => {
                let src = img.src || img.getAttribute('data-src');
                let name = img.alt || img.title;

                if (src && src.startsWith('http') && !src.includes('data:image')) {
                    // Cerca di pulire il nome
                    if (!name) {
                        // Ricava il nome dal file (es: /logos/juventus.png -> juventus)
                        const parts = src.split('/');
                        name = parts[parts.length - 1].split('.')[0].replace(/[-_]/g, ' ');
                    }
                    
                    // Filtra icone spazzatura
                    if (name.length > 2 && !src.includes('icon') && !name.includes('logo')) {
                         results.push({ name: name, logo_url: src });
                    }
                }
            });
            // Rimuove duplicati
            return Array.from(new Set(results.map(a => a.logo_url)))
             .map(url => results.find(a => a.logo_url === url));
        });

        console.log(`🔥 TROVATI ${teams.length} LOGHI!`);

        if (teams.length > 0) {
            console.log("💾 Salvataggio su PocketBase...");
            let savedCount = 0;
            for (const team of teams) {
                try {
                    await pb.collection('teams').create({
                        name: team.name,
                        logo_url: team.logo_url
                    });
                    savedCount++;
                    process.stdout.write(`\r✅ Salvati: ${savedCount}/${teams.length}`);
                } catch (e) {}
            }
            console.log("\n🎉 FINE!");
        } else {
            console.log("❌ Ancora 0 loghi. Il sito ha una protezione Cloudflare molto forte.");
            console.log("📸 Faccio uno screenshot di errore (error.png)...");
            await page.screenshot({ path: 'error.png' });
        }

    } catch (error) {
        console.error("❌ Errore:", error.message);
    } finally {
        await browser.close();
    }
}

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

scrapeStealth();