// Try results-specific endpoints
const axios = require('axios');

async function tryResultsEndpoints() {
    const headers = {
        'x-fsign': 'SW9D1eZo',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.flashscore.it/',
    };

    // From the simbirsky parser, df prefix means "detail feed"
    // sui = summary/incidents, li = lineups, st = stats
    // For results, the web page loads from /risultati/ which triggers XHR calls
    // The results page likely uses a tournament-specific feed

    // Tournament IDs from URL: /calcio/grecia/super-league/ 
    // We need to find the tournament ID for Greek Super League
    // The ZEE field in the feed data likely contains tournament IDs

    // From the match URLs, we see tournament IDs embedded
    // Let me try df_re (results) endpoint patterns
    // Also try the "tournament results" endpoint format

    const endpoints = [
        // Results feed formats to try
        'df_re_1_Gbmwj1T8',    // Random tournament ID from feed
        'f_2_-1_3_it_1',       // Results feed (2 instead of 1?)  
        'f_1_-1_4_it_1',       // Past results?
        'f_1_-1_5_it_1',
        'f_1_-1_6_it_1',
        // Try tournament-specific results
        'df_tor_1',
        // Scheduled/finished endpoint patterns  
        'df_sch_1',
    ];

    for (const ep of endpoints) {
        const url = `https://local-it.flashscore.ninja/46/x/feed/${ep}`;
        console.log(`Trying: ${ep}`);
        try {
            const t0 = Date.now();
            const r = await axios.get(url, { headers, timeout: 8000, responseType: 'text' });
            console.log(`  OK: ${r.data.length} bytes in ${Date.now() - t0}ms`);
            if (r.data.length > 50) {
                // Show first 200 chars
                console.log(`  Preview: ${r.data.substring(0, 200)}`);
            }
        } catch (e) {
            console.log(`  FAIL: ${e.response?.status || e.message}`);
        }
    }

    process.exit(0);
}

tryResultsEndpoints().catch(e => { console.error(e); process.exit(1); });
