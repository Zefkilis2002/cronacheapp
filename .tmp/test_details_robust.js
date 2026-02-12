const { getMatchDetails } = require('../execution/scrape_flashscore');

(async () => {
    try {
        console.log('Testing Match Details...');
        const url = 'https://www.flashscore.it/partita/calcio/olympiakos-hnzvnHPS/panathinaikos-SENMmweG/?mid=YNL1MhCT';
        const start = Date.now();
        const details = await getMatchDetails(url);
        console.log(`Details fetched in ${Date.now() - start}ms`);
        console.log('Home Goals:', details.homeGoals);
        console.log('Away Goals:', details.awayGoals);
    } catch (e) {
        console.error('Error:', e);
    }
})();
