// Test all formatting changes
async function testFormatting() {
    delete require.cache[require.resolve('../execution/scrape_flashscore')];
    const { getMatchDetails } = require('../execution/scrape_flashscore');

    // Wait for browser pre-warm
    await new Promise(r => setTimeout(r, 2000));

    const testCases = [
        { id: '46CXGWZj', label: 'OFI Crete 3-2 Levadiakos (multi-gol, normal goals)' },
        { id: '6PeHOrgc', label: 'Panserraikos 0-4 AEK (include rigore, doppietta Varga)' },
        { id: 'hnRc4gjo', label: 'Asteras T. 2-0 Volos (doppietta Bartolo con rigore)' },
        { id: 'G2iZBphf', label: 'AEK 1-1 Olympiakos (rigore Taremi)' },
        { id: 'YNL1MhCT', label: 'Olympiakos 0-1 Panathinaikos (1 solo gol)' },
    ];

    for (const tc of testCases) {
        console.log(`\n=== ${tc.label} ===`);
        const t0 = Date.now();
        const result = await getMatchDetails(null, tc.id);
        console.log(`  Time: ${Date.now() - t0}ms`);
        console.log(`  Home scorers:`, result.homeGoals);
        console.log(`  Away scorers:`, result.awayGoals);
    }

    process.exit(0);
}
testFormatting().catch(e => { console.error(e); process.exit(1); });
