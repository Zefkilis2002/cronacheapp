// Parse the feed to find Greek Super League matches
const axios = require('axios');

async function parseFeed() {
    const headers = {
        'x-fsign': 'SW9D1eZo',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.flashscore.it/',
    };

    const t0 = Date.now();
    const r = await axios.get('https://local-it.flashscore.ninja/46/x/feed/f_1_-1_3_it_1', {
        headers, timeout: 15000, responseType: 'text'
    });
    console.log(`Feed fetched in ${Date.now() - t0}ms, ${r.data.length} bytes`);

    // Parse
    const parts = r.data.split('\xAC');
    let currentLeague = '';
    let currentLeagueUrl = '';
    let matchCount = 0;
    let greekMatches = [];
    let inGreekLeague = false;

    let currentMatch = {};

    for (const part of parts) {
        const sepIdx = part.indexOf('\xF7');
        if (sepIdx === -1) continue;
        const key = part.substring(0, sepIdx);
        const value = part.substring(sepIdx + 1);

        if (key === '~ZA') {
            currentLeague = value;
            inGreekLeague = false;
        }
        if (key === 'ZL') {
            currentLeagueUrl = value;
            // Check if this is Greek Super League
            if (value.includes('greece') || value.includes('grecia')) {
                console.log(`\nFound Greek league: ${currentLeague} → ${value}`);
                inGreekLeague = true;
            }
        }

        // Match entries start with ~AA
        if (key === '~AA') {
            if (currentMatch.id && inGreekLeague) {
                greekMatches.push({ ...currentMatch });
            }
            currentMatch = { id: value, league: currentLeague, leagueUrl: currentLeagueUrl };
            matchCount++;
        }

        // Match fields
        if (key === 'AE') currentMatch.homeTeam = value;
        if (key === 'AF') currentMatch.awayTeam = value;
        if (key === 'AG') currentMatch.homeScore = value;
        if (key === 'AH') currentMatch.awayScore = value;
        if (key === 'AD') currentMatch.timestamp = value;
        if (key === 'AB') currentMatch.status = value; // Match status
        if (key === 'AC') currentMatch.statusCode = value;
    }
    // Push last match if Greek
    if (currentMatch.id && inGreekLeague) {
        greekMatches.push({ ...currentMatch });
    }

    console.log(`\nTotal matches in feed: ${matchCount}`);
    console.log(`Greek matches found: ${greekMatches.length}`);

    for (const m of greekMatches) {
        const date = m.timestamp ? new Date(parseInt(m.timestamp) * 1000).toISOString() : 'N/A';
        console.log(`  ${m.homeTeam} ${m.homeScore || '?'}-${m.awayScore || '?'} ${m.awayTeam} | ID: ${m.id} | ${date}`);
    }

    process.exit(0);
}

parseFeed().catch(e => { console.error(e); process.exit(1); });
