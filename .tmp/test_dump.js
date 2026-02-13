// Dump raw incident data for a match that should have goals
const axios = require('axios');

async function dumpMatch(matchId, label) {
    const headers = {
        'x-fsign': 'SW9D1eZo',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.flashscore.it/',
    };

    const url = `https://local-it.flashscore.ninja/46/x/feed/df_sui_1_${matchId}`;
    console.log(`\n=== ${label} (${matchId}) ===`);

    const r = await axios.get(url, { headers, timeout: 10000, responseType: 'text' });

    // Parse
    const sections = [];
    let current = null;
    const parts = r.data.split('\xAC');
    for (const part of parts) {
        const sepIdx = part.indexOf('\xF7');
        if (sepIdx === -1) continue;
        const key = part.substring(0, sepIdx);
        const value = part.substring(sepIdx + 1);
        if (key.startsWith('~')) {
            if (current) sections.push(current);
            current = { [key]: value };
        } else if (current) {
            current[key] = value;
        }
    }
    if (current) sections.push(current);

    console.log(`Total sections: ${sections.length}`);

    // Show ALL incident sections (with ~III)
    const incidents = sections.filter(s => Object.keys(s).some(k => k.startsWith('~III')));
    console.log(`Incident sections: ${incidents.length}`);

    for (const inc of incidents) {
        const ie = inc['IE'] || inc['IEX'] || 'N/A';
        const ik = inc['IK'] || 'N/A';
        const ifName = inc['IF'] || 'N/A';
        const ia = inc['IA'] || inc['IAX'] || 'N/A';
        const ib = inc['IB'] || inc['IBX'] || 'N/A';
        console.log(`  IE=${ie} | IK=${ik} | IF=${ifName} | IA=${ia} | IB=${ib}`);
    }

    // Also show ALL non-incident sections
    const others = sections.filter(s => !Object.keys(s).some(k => k.startsWith('~III')));
    console.log(`\nOther sections: ${others.length}`);
    for (const sec of others) {
        console.log(`  `, JSON.stringify(sec).substring(0, 120));
    }
}

async function main() {
    // Match 1: Olympiakos 0-1 Panathinaikos (WORKS)
    await dumpMatch('YNL1MhCT', 'Olympiakos 0-1 Panathinaikos');

    // Match 2: OFI Crete 3-2 Levadiakos (FAILS - should find 5 goals)
    await dumpMatch('46CXGWZj', 'OFI Crete 3-2 Levadiakos');

    // Match 3: Panserraikos 0-4 AEK (FAILS - should find 4 goals)
    await dumpMatch('6PeHOrgc', 'Panserraikos 0-4 AEK');

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
