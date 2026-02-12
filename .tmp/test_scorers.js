const { getMatchDetails } = require('./execution/scrape_flashscore');

(async () => {
    console.log('Testing Olympiakos 0-1 Panathinaikos...');
    const result = await getMatchDetails('https://www.flashscore.it/partita/calcio/olympiakos-hnzvnHPS/panathinaikos-SENMmweG/?mid=YNL1MhCT');
    console.log('\nHome goals:', JSON.stringify(result.homeGoals, null, 2));
    console.log('\nAway goals:', JSON.stringify(result.awayGoals, null, 2));
})();
