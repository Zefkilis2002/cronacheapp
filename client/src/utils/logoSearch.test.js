import { resolveTeamLogo } from './logoSearch';
import { requestJson } from './apiClient';
import { TEAM_LOGOS } from './LogoConstants';
jest.mock('./apiClient', () => ({ ...jest.requireActual('./apiClient'), requestJson: jest.fn() }));

beforeEach(() => requestJson.mockReset());
test('keeps the high resolution Greek catalog without a network request', async () => {
  expect(await resolveTeamLogo('PAOK', { sourceLogo: 'https://static.flashscore.com/res/image/data/tiny.png' })).toBe(TEAM_LOGOS.PAOK);
  expect(requestJson).not.toHaveBeenCalled();
});
test('replaces a Flashscore thumbnail with original team artwork', async () => {
  requestJson.mockResolvedValue({ status: true, results: [{ name: 'Roma', logoUrl: 'https://r2.thesportsdb.com/images/media/team/badge/roma.png/medium' }] });
  const logo = await resolveTeamLogo('Roma', { sourceLogo: 'https://static.flashscore.com/res/image/data/tiny.png' });
  expect(requestJson).toHaveBeenCalledTimes(1);
  expect(decodeURIComponent(logo)).toContain('/badge/roma.png');
  expect(decodeURIComponent(logo)).not.toContain('/medium');
  expect(logo).not.toContain('tiny.png');
});
test('does not silently export a 30px thumbnail if original artwork is unavailable', async () => {
  requestJson.mockResolvedValue({ status: true, results: [] });
  expect(await resolveTeamLogo('Unknown Club', { sourceLogo: 'https://static.flashscore.com/res/image/data/tiny.png' })).toBeNull();
});
test('does not replace a team with an ambiguous search result', async () => {
  requestJson.mockResolvedValue({ status: true, results: [{ name: 'Aris Limassol', logoUrl: 'https://r2.thesportsdb.com/limassol.png' }, { name: 'Aris Petroupolis', logoUrl: '/loghi/petroupolis.png' }] });
  expect(await resolveTeamLogo('Aris (Cyp)', { sourceLogo: 'https://static.flashscore.com/res/image/data/aris.png' })).toBeNull();
});
test('does not use an unrelated club even if the provider returns only one result', async () => {
  requestJson.mockResolvedValue({ status: true, results: [{ name: 'Intercity', logoUrl: 'https://r2.thesportsdb.com/intercity.png' }] });
  expect(await resolveTeamLogo('Inter')).toBeNull();
});
test('accepts the verified alternate name of the same club', async () => {
  requestJson.mockResolvedValue({ status: true, results: [{ name: 'Inter Milan', aliases: ['Inter', 'Internazionale'], logoUrl: 'https://r2.thesportsdb.com/inter.png' }] });
  expect(decodeURIComponent(await resolveTeamLogo('Inter'))).toContain('thesportsdb.com/inter.png');
});
