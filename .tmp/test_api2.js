const axios = require('axios');

async function testWithCorrectId() {
    const headers = {
        'x-fsign': 'SW9D1eZo',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.flashscore.it/',
        'Accept': '*/*',
        'Accept-Language': 'it-IT,it;q=0.9',
    };

    // Match ID reale: YNL1MhCT (Olympiakos vs Panathinaikos)
    const matchId = 'YNL1MhCT';

    const bases = [
        'https://local-it.flashscore.ninja/46/x/feed',
        'https://local-global.flashscore.ninja/46/x/feed',
        'https://d.flashscore.com/x/feed',
    ];

    for (const base of bases) {
        const url = `${base}/df_sui_1_${matchId}`;
        console.log(`\nTrying: ${url}`);
        try {
            const t0 = Date.now();
            const r = await axios.get(url, { headers, timeout: 10000, responseType: 'text' });
            console.log(`  Status: ${r.status}, Length: ${r.data.length}, Time: ${Date.now() - t0}ms`);
            if (r.data.length > 50) {
                // Show first 500 chars
                console.log(`  Data preview (first 500 chars):`);
                console.log(r.data.substring(0, 500));
                console.log(`\n  === Looking for key patterns ===`);

                // Check for key patterns
                const hasIA = r.data.includes('\xF7' + '1') || r.data.includes('IA\xF7');
                console.log(`  Contains IA key: ${hasIA}`);
                console.log(`  Contains IB key: ${r.data.includes('IB\xF7')}`);
                console.log(`  Contains ICT key: ${r.data.includes('ICT\xF7')}`);
                console.log(`  Contains ~III: ${r.data.includes('~III')}`);
                console.log(`  Contains INX: ${r.data.includes('INX')}`);

                // Try parsing with the parser
                console.log('\n  === Trying parser ===');
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

                console.log(`  Total sections parsed: ${sections.length}`);
                // Show first 3 sections
                for (let i = 0; i < Math.min(3, sections.length); i++) {
                    console.log(`\n  Section ${i}:`, JSON.stringify(sections[i]));
                }

                // Find incident sections
                const incidents = sections.filter(s => Object.keys(s).some(k => k.startsWith('~III')));
                console.log(`\n  Incident sections: ${incidents.length}`);
                for (const inc of incidents) {
                    console.log(`  Incident:`, JSON.stringify(inc));
                }

                break; // Stop after first successful response
            }
        } catch (e) {
            console.log(`  Failed: ${e.message}`);
        }
    }
    process.exit(0);
}

testWithCorrectId();
