// Investigate missing goals for specific matches
const axios = require('axios');

async function dumpAllIncidents(matchId, label) {
    const headers = {
        'x-fsign': 'SW9D1eZo',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.flashscore.it/',
    };
    const url = `https://local-it.flashscore.ninja/46/x/feed/df_sui_1_${matchId}`;
    const r = await axios.get(url, { headers, timeout: 10000, responseType: 'text' });

    console.log(`\n=== ${label} (${matchId}) — ${r.data.length} bytes ===`);

    // Parse keeping ALL occurrences for debugging
    const parts = r.data.split('\xAC');
    let sectionNum = 0;
    let inSection = false;

    for (const part of parts) {
        const sepIdx = part.indexOf('\xF7');
        if (sepIdx === -1) continue;
        const key = part.substring(0, sepIdx);
        const value = part.substring(sepIdx + 1);

        if (key.startsWith('~III')) {
            sectionNum++;
            console.log(`\n  Section ${sectionNum} [${key}=${value}]:`);
            inSection = true;
        } else if (key.startsWith('~')) {
            if (inSection) console.log(`  --- end section ---`);
            inSection = false;
            console.log(`  [${key}=${value}]`);
        } else if (inSection) {
            console.log(`    ${key}=${value}`);
        }
    }
}

async function main() {
    // Missing: Kifisia 0-1 Atromitos
    await dumpAllIncidents('C8XhOEsH', 'Kifisia 0-1 Atromitos');

    // Missing: Asteras T. 2-0 Volos (found 1/2)
    await dumpAllIncidents('hnRc4gjo', 'Asteras T. 2-0 Volos');

    // Missing 1: Panserraikos 0-4 AEK (found 3/4)  
    await dumpAllIncidents('6PeHOrgc', 'Panserraikos 0-4 AEK');

    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
