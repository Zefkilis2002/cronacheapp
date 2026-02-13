// Intercept Flashscore network requests to find the results API endpoint
const puppeteer = require('puppeteer');

async function interceptFlashscoreResults() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const apiCalls = [];

    // Intercept all XHR/Fetch requests
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('flashscore') && !url.includes('.png') && !url.includes('.css') && !url.includes('.js') && !url.includes('google') && !url.includes('ads')) {
            const status = response.status();
            const contentType = response.headers()['content-type'] || '';
            if (!contentType.includes('html') && !contentType.includes('image')) {
                try {
                    const body = await response.text().catch(() => '');
                    apiCalls.push({
                        url: url.substring(0, 120),
                        status,
                        contentType,
                        bodyLength: body.length,
                        bodyPreview: body.substring(0, 150)
                    });
                } catch (e) { }
            }
        }
    });

    console.log('Navigating to Flashscore results page...');
    const t0 = Date.now();
    await page.goto('https://www.flashscore.it/calcio/grecia/super-league/risultati/', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });
    console.log(`Page loaded in ${Date.now() - t0}ms`);

    // Wait a bit for any deferred requests
    await new Promise(r => setTimeout(r, 2000));

    console.log(`\n=== API calls intercepted: ${apiCalls.length} ===\n`);
    for (const call of apiCalls) {
        if (call.bodyLength > 50) {
            console.log(`  ${call.url}`);
            console.log(`    Status: ${call.status}, Type: ${call.contentType}, Body: ${call.bodyLength} bytes`);
            console.log(`    Preview: ${call.bodyPreview}`);
            console.log();
        }
    }

    await browser.close();
    process.exit(0);
}

interceptFlashscoreResults().catch(e => { console.error(e); process.exit(1); });
