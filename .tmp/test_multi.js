// Test multiple matches with the Flashscore API
const axios = require('axios');

async function testMultipleMatches() {
    const { getRecentMatches, getMatchDetails } = require('../execution/scrape_flashscore');

    console.log('=== Fetching recent matches ===');
    const t0 = Date.now();
    const matches = await getRecentMatches({ country: 'grecia', league: 'super-league', daysBack: 14 });
    console.log(`Found ${matches.length} matches in ${Date.now() - t0}ms\n`);

    // Show all matches
    matches.forEach((m, i) => {
        console.log(`  ${i}: ${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam} | ID: ${m.matchId} | URL: ${m.matchUrl ? m.matchUrl.substring(0, 80) : 'N/A'}...`);
    });

    // Test match details for first 5 non-0-0 matches
    const matchesToTest = matches.filter(m =>
        (parseInt(m.homeScore) + parseInt(m.awayScore)) > 0
    ).slice(0, 5);

    console.log(`\n=== Testing ${matchesToTest.length} matches for goalscorers ===\n`);

    for (const match of matchesToTest) {
        console.log(`--- ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} ---`);
        console.log(`  matchId: ${match.matchId}`);
        console.log(`  matchUrl: ${match.matchUrl}`);

        const t1 = Date.now();
        try {
            const details = await getMatchDetails(match.matchUrl, match.matchId);
            console.log(`  Time: ${Date.now() - t1}ms`);
            console.log(`  Home goals (${details.homeGoals.length}):`, details.homeGoals.map(g => g.formatted).join(', ') || 'none');
            console.log(`  Away goals (${details.awayGoals.length}):`, details.awayGoals.map(g => g.formatted).join(', ') || 'none');
        } catch (e) {
            console.log(`  ERROR: ${e.message}`);
        }
        console.log('');
    }

    process.exit(0);
}

testMultipleMatches().catch(e => { console.error(e); process.exit(1); });
