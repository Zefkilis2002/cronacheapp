// Test different endpoint numbers for match data
const axios = require('axios');

async function tryEndpoints(matchId, label) {
    const headers = {
        'x-fsign': 'SW9D1eZo',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.flashscore.it/',
    };

    console.log(`\n=== ${label} (${matchId}) ===`);
    console.log('Looking for incidents endpoint format...\n');

    // Try df_sui with different numbers and other endpoint patterns
    const endpoints = [
        `df_sui_1_${matchId}`,    // summary (what we use now)
        `df_sui_2_${matchId}`,    // maybe stats?
        `df_sui_3_${matchId}`,    // maybe lineups?
        `df_sui_4_${matchId}`,
        `df_sui_5_${matchId}`,
        `df_dc_1_${matchId}`,     // different prefix
        `df_dc_2_${matchId}`,
        `df_st_1_${matchId}`,
        `df_st_2_${matchId}`,
        `df_ho_1_${matchId}`,     // head-to-head?
        `df_ho_2_${matchId}`,
        `df_li_1_${matchId}`,     // lineups?
        `df_li_2_${matchId}`,
    ];

    for (const ep of endpoints) {
        const url = `https://local-it.flashscore.ninja/46/x/feed/${ep}`;
        try {
            const r = await axios.get(url, { headers, timeout: 5000, responseType: 'text' });
            if (r.data.length > 10) {
                console.log(`  ✅ ${ep}: ${r.data.length} bytes`);
                // Check for goal-related content
                const hasGoals = r.data.includes('Гол') || r.data.includes('Goal');
                const hasIE3 = r.data.includes('IE\xF73');
                console.log(`      has "Гол": ${hasGoals}, has IE=3: ${hasIE3}`);
                if (hasGoals || hasIE3) {
                    // Show first 300 chars
                    console.log(`      preview: ${r.data.substring(0, 300)}`);
                }
            } else {
                console.log(`  ⚪ ${ep}: ${r.data.length} bytes (empty/minimal)`);
            }
        } catch (e) {
            console.log(`  ❌ ${ep}: ${e.response?.status || e.message}`);
        }
    }
}

async function main() {
    // Test with match that fails: OFI Crete 3-2 Levadiakos
    await tryEndpoints('46CXGWZj', 'OFI Crete 3-2 Levadiakos');

    // Test with match that works: Olympiakos 0-1 Panathinaikos
    await tryEndpoints('YNL1MhCT', 'Olympiakos 0-1 Panathinaikos');

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
