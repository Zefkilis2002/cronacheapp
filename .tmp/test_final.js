// Final comprehensive test of all fixes
async function finalTest() {
    // Force require to get fresh module
    delete require.cache[require.resolve('../execution/scrape_flashscore')];
    const { getRecentMatches, getMatchDetails } = require('../execution/scrape_flashscore');

    // Wait for browser pre-warm
    await new Promise(r => setTimeout(r, 3000));

    console.log('=== FINAL TEST: Match list + details ===\n');

    // Test 1: Match list speed
    console.log('[1] Loading match list...');
    const t0 = Date.now();
    const matches = await getRecentMatches({ country: 'grecia', league: 'super-league', daysBack: 14 });
    const listTime = Date.now() - t0;
    console.log(`    ✅ ${matches.length} matches in ${listTime}ms\n`);

    // Test 2: Goalscorers for ALL non-draw matches 
    const nonDraws = matches.filter(m => (parseInt(m.homeScore) + parseInt(m.awayScore)) > 0);
    console.log(`[2] Testing goalscorers for ${nonDraws.length} matches...\n`);

    let totalGoals = 0;
    let matchesWithGoals = 0;
    let totalTime = 0;

    for (const match of nonDraws) {
        const t1 = Date.now();
        const details = await getMatchDetails(match.matchUrl, match.matchId);
        const dt = Date.now() - t1;
        totalTime += dt;

        const goals = details.homeGoals.length + details.awayGoals.length;
        totalGoals += goals;
        if (goals > 0) matchesWithGoals++;

        const expectedGoals = parseInt(match.homeScore) + parseInt(match.awayScore);
        const status = goals === expectedGoals ? '✅' : (goals > 0 ? '⚠️' : '❌');

        console.log(`    ${status} ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} → ${goals}/${expectedGoals} goals (${dt}ms)`);

        if (details.homeGoals.length > 0) {
            console.log(`       Home: ${details.homeGoals.map(g => g.formatted).join(', ')}`);
        }
        if (details.awayGoals.length > 0) {
            console.log(`       Away: ${details.awayGoals.map(g => g.formatted).join(', ')}`);
        }
    }

    console.log(`\n=== RESULTS ===`);
    console.log(`Match list: ${listTime}ms`);
    console.log(`Goalscorers: ${matchesWithGoals}/${nonDraws.length} matches found (${totalGoals} total goals)`);
    console.log(`Avg detail time: ${Math.round(totalTime / nonDraws.length)}ms per match`);

    process.exit(0);
}

finalTest().catch(e => { console.error(e); process.exit(1); });
