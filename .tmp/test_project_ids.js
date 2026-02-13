// Test various project IDs to find one with complete data AND Latin names
const axios = require('axios');

async function testProjectIds() {
    const matchId = '46CXGWZj'; // OFI Crete 3-2 Levadiakos
    const headers = {
        'x-fsign': 'SW9D1eZo',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.flashscore.it/',
        'Accept-Language': 'it-IT,it;q=0.9',
    };

    // Test project IDs from 1 to 50
    const projectIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50];

    console.log(`Testing match ${matchId} across ${projectIds.length} project IDs...\n`);

    for (const pid of projectIds) {
        const url = `https://local-it.flashscore.ninja/${pid}/x/feed/df_sui_1_${matchId}`;
        try {
            const r = await axios.get(url, { headers, timeout: 5000, responseType: 'text' });
            if (r.data.length > 100) {
                // Extract first few IF names
                const parts = r.data.split('\xAC');
                const names = [];
                for (const part of parts) {
                    const sep = part.indexOf('\xF7');
                    if (sep === -1) continue;
                    const key = part.substring(0, sep);
                    const val = part.substring(sep + 1);
                    if (key === 'IF' && names.length < 5) names.push(val);
                }
                const hasCyrillic = names.some(n => /[а-яА-ЯёЁ]/.test(n));
                const label = hasCyrillic ? '❌ CYRILLIC' : '✅ LATIN';
                console.log(`  PID ${pid}: ${r.data.length} bytes ${label} → ${names.join(', ')}`);
            }
        } catch (e) {
            // skip
        }
    }

    process.exit(0);
}

testProjectIds().catch(e => { console.error(e); process.exit(1); });
