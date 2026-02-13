// Test the feed API for match listings
const axios = require('axios');

async function testFeedAPI() {
    const headers = {
        'x-fsign': 'SW9D1eZo',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.flashscore.it/',
    };

    // Try feed endpoints from the simbirsky parser: f_1_-1_3_<locale>_1
    // The format seems to be: f_{sport}_{category}_{page}_{locale}_{sort}
    const endpoints = [
        // Italian feed
        'f_1_-1_3_it_1',
        'f_1_-1_3_it-it_1',
        // Country-specific  
        'f_1_22_3_it_1',    // 22 might be Greece
        // Try direct results endpoint
        'f_1_-1_1_it_1',
        'f_1_-1_2_it_1',
        // Try with different sport/category
        'f_1_1_3_it_1',
    ];

    for (const ep of endpoints) {
        const url = `https://local-it.flashscore.ninja/46/x/feed/${ep}`;
        console.log(`\nTrying: ${ep}`);
        try {
            const t0 = Date.now();
            const r = await axios.get(url, { headers, timeout: 8000, responseType: 'text' });
            console.log(`  Status: ${r.status}, Length: ${r.data.length}, Time: ${Date.now() - t0}ms`);
            if (r.data.length > 100) {
                console.log(`  Preview: ${r.data.substring(0, 300)}`);
            }
        } catch (e) {
            console.log(`  Failed: ${e.response?.status || e.message}`);
        }
    }

    // Also try a results page endpoint
    // Flashscore results for Greece Super League might be at a specific tournament ID
    console.log('\n=== Trying results/standings endpoints ===');
    const resultsEndpoints = [
        'df_re_1_lmnSBt3P',  // Just guessing tournament ID format
        'f_1_-1_3_it_1',
    ];

    for (const ep of resultsEndpoints) {
        const url = `https://local-it.flashscore.ninja/46/x/feed/${ep}`;
        try {
            const t0 = Date.now();
            const r = await axios.get(url, { headers, timeout: 8000, responseType: 'text' });
            console.log(`  ${ep}: ${r.data.length} bytes in ${Date.now() - t0}ms`);
        } catch (e) {
            console.log(`  ${ep}: ${e.response?.status || e.message}`);
        }
    }

    process.exit(0);
}

testFeedAPI().catch(e => { console.error(e); process.exit(1); });
