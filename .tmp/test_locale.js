// Test different API locales to get Latin alphabet names
const axios = require('axios');

async function testLocales() {
    const matchId = '46CXGWZj'; // OFI Crete 3-2 Levadiakos

    // Different API bases with different locales
    const configs = [
        { name: 'local-it (current)', url: 'https://local-it.flashscore.ninja/46/x/feed' },
        { name: 'local-global', url: 'https://local-global.flashscore.ninja/46/x/feed' },
        { name: 'd.flashscore.com', url: 'https://d.flashscore.com/x/feed' },
        { name: 'local-en.flashscore', url: 'https://local-en.flashscore.ninja/46/x/feed' },
        { name: 'local-it (proj 2)', url: 'https://local-it.flashscore.ninja/2/x/feed' },
        { name: 'local-it (proj 1)', url: 'https://local-it.flashscore.ninja/1/x/feed' },
        { name: 'local-it (proj 17)', url: 'https://local-it.flashscore.ninja/17/x/feed' },
        { name: 'local-ru (russian)', url: 'https://local-ru.flashscore.ninja/46/x/feed' },
    ];

    for (const cfg of configs) {
        const apiUrl = `${cfg.url}/df_sui_1_${matchId}`;
        console.log(`\n${cfg.name}: ${apiUrl}`);

        try {
            const r = await axios.get(apiUrl, {
                headers: {
                    'x-fsign': 'SW9D1eZo',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://www.flashscore.it/',
                    'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
                },
                timeout: 8000,
                responseType: 'text',
            });

            // Extract all IF (player name) fields
            const parts = r.data.split('\xAC');
            const names = [];
            for (const part of parts) {
                const sep = part.indexOf('\xF7');
                if (sep === -1) continue;
                const key = part.substring(0, sep);
                const val = part.substring(sep + 1);
                if (key === 'IF') names.push(val);
            }
            console.log(`  Names: ${names.join(' | ')}`);
        } catch (e) {
            console.log(`  FAIL: ${e.response?.status || e.message}`);
        }
    }

    process.exit(0);
}

testLocales().catch(e => { console.error(e); process.exit(1); });
