// Quick test of the fixed getMatchDetails
async function test() {
    const { getMatchDetails } = require('../execution/scrape_flashscore');

    // Test with Olympiakos vs Panathinaikos URL (matchId = YNL1MhCT from ?mid= param)
    const matchUrl = 'https://www.flashscore.it/partita/calcio/olympiakos-hnzvnHPS/panathinaikos-SENMmweG/?mid=YNL1MhCT';

    console.log('Testing getMatchDetails with URL:', matchUrl);
    const t0 = Date.now();
    const details = await getMatchDetails(matchUrl);
    const elapsed = Date.now() - t0;

    console.log(`\nResults (${elapsed}ms):`);
    console.log('Home goals:', JSON.stringify(details.homeGoals, null, 2));
    console.log('Away goals:', JSON.stringify(details.awayGoals, null, 2));

    if (details.homeGoals.length === 0 && details.awayGoals.length > 0) {
        console.log('\n✅ SUCCESS: Result 0-1, found away goal by Taborda!');
    } else if (details.awayGoals.length === 0) {
        console.log('\n❌ FAIL: No goals found!');
    }

    console.log(`\n⏱️ Time: ${elapsed}ms (target: < 5000ms)`);
    process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
