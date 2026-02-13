const axios = require('axios');

async function testFlashscoreAPI() {
    const headers = {
        'x-fsign': 'SW9D1eZo',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.flashscore.it/',
        'Accept': '*/*',
        'Accept-Language': 'it-IT,it;q=0.9',
    };

    const bases = [
        'https://local-it.flashscore.ninja/46/x/feed',
        'https://local-global.flashscore.ninja/46/x/feed',
        'https://d.flashscore.com/x/feed',
    ];

    // Test 1: Verifica che gli endpoint rispondano (con matchId fittizio)
    console.log('=== TEST 1: Endpoint check ===');
    for (const base of bases) {
        try {
            const url = `${base}/df_sui_1_test123`;
            console.log(`Trying: ${url}`);
            const t0 = Date.now();
            const r = await axios.get(url, { headers, timeout: 8000, responseType: 'text' });
            console.log(`  Status: ${r.status}, Length: ${r.data.length}, Time: ${Date.now() - t0}ms`);
            console.log(`  Data preview: ${r.data.substring(0, 150)}`);
        } catch (e) {
            console.log(`  Failed: ${e.message}`);
        }
    }

    // Test 2: Prova con il modulo scrape_flashscore (getRecentMatches per trovare un matchUrl reale)
    console.log('\n=== TEST 2: Full pipeline test ===');
    try {
        const { getRecentMatches, getMatchDetails } = require('../execution/scrape_flashscore');

        console.log('Fetching recent matches...');
        const t0 = Date.now();
        const matches = await getRecentMatches({ country: 'grecia', league: 'super-league', daysBack: 14 });
        console.log(`Matches found: ${matches.length} in ${Date.now() - t0}ms`);

        if (matches.length > 0) {
            const match = matches[0];
            console.log(`\nTest match: ${match.homeTeam} vs ${match.awayTeam} (${match.homeScore}-${match.awayScore})`);
            console.log(`Match URL: ${match.matchUrl}`);
            console.log(`Match ID: ${match.matchId}`);

            console.log('\nFetching match details...');
            const t1 = Date.now();
            const details = await getMatchDetails(match.matchUrl);
            console.log(`Details fetched in ${Date.now() - t1}ms`);
            console.log('Home goals:', JSON.stringify(details.homeGoals));
            console.log('Away goals:', JSON.stringify(details.awayGoals));
        }
    } catch (e) {
        console.error('Pipeline test error:', e.message);
    }

    process.exit(0);
}

testFlashscoreAPI();
