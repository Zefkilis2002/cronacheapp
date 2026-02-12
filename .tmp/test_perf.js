const t0 = Date.now();
const { getRecentMatches } = require('../execution/scrape_flashscore');
getRecentMatches({ country: 'grecia', league: 'super-league', daysBack: 7 })
    .then(m => console.log('Done: ' + m.length + ' matches in ' + (Date.now() - t0) + 'ms'))
    .catch(e => console.error('Error:', e.message));
