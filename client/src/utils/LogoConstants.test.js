import { findTeamLogo, TEAM_LOGOS } from './LogoConstants';
import fs from 'fs';
import path from 'path';
test.each(['PAOK (Gre)', 'PAOK FC', '  paok  '])('resolves %s to the local badge', name => {
  expect(findTeamLogo(name)).toBe(TEAM_LOGOS.PAOK);
});
test.each(['Aris (Cyp)', 'Aris Limassol', 'AEK Larnaca', 'PAEK', 'Panathinaikos Women', ''])('does not confuse %s with a catalog team', name => {
  expect(findTeamLogo(name)).toBeNull();
});
test('recognizes the current Flashscore name Iraklis 1908', () => {
  expect(findTeamLogo('Iraklis 1908')).toBe(TEAM_LOGOS.IRAKLIS);
});
test.each(Object.entries(TEAM_LOGOS))('catalog asset %s exists with the same case on Linux', (name, logo) => {
  const full = path.join(process.cwd(), 'public', logo);
  expect(fs.readdirSync(path.dirname(full))).toContain(path.basename(full));
});
