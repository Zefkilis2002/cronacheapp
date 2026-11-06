const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLogoSearch } = require('../lib/logoSearch');
const { validateRemoteUrl, validateRedirect } = require('../lib/remoteUrl');
const badge = 'https://r2.thesportsdb.com/images/media/team/badge/roma.png';

test('logo provider uses the current public key and accepts Soccer badges', async t => {
  let requestedUrl;
  const service = createLogoSearch({ localTeams: [], apiKey: '123', request: async url => {
    requestedUrl = url;
    return { data: { teams: [{ strTeam: 'Roma', strSport: 'Soccer', strBadge: badge }, { strTeam: 'Roma Basket', strSport: 'Basketball', strBadge: badge }] } };
  } });
  t.after(service.close);
  const result = await service.search('Roma');
  assert.match(requestedUrl, /\/123\/searchteams\.php$/);
  assert.deepEqual(result.data.results.map(team => team.name), ['Roma']);
});
test('an exact catalog match does not call the external provider', async t => {
  const service = createLogoSearch({ localTeams: [{ name: 'PAOK', logoUrl: '/loghi/paok.png' }], request: () => { throw new Error('must not request'); } });
  t.after(service.close);
  assert.equal((await service.search(' paok ')).data.results[0].logoUrl, '/loghi/paok.png');
});
test('provider failure is not cached as no results', async t => {
  let calls = 0;
  const service = createLogoSearch({ localTeams: [], request: async () => {
    if (++calls === 1) throw new Error('429');
    return { data: { teams: [{ strTeam: 'Roma', strSport: 'Soccer', strBadge: badge }] } };
  } });
  t.after(service.close);
  await assert.rejects(service.search('Roma'));
  assert.equal((await service.search('Roma')).data.results[0].name, 'Roma');
});
test('common short names resolve the actual club rather than youth or unrelated teams', async t => {
  const queries = [];
  const service = createLogoSearch({ localTeams: [], request: async (url, options) => {
    queries.push(options.params.t);
    return { data: { teams: [{ strTeam: 'Inter Milan', strTeamAlternate: 'Inter, Internazionale', strSport: 'Soccer', strBadge: badge }] } };
  } });
  t.after(service.close);
  const result = await service.search('Inter');
  await service.search('Milan');
  assert.deepEqual(queries, ['Inter Milan', 'AC Milan']);
  assert.deepEqual(result.data.results[0].aliases, ['Inter', 'Internazionale']);
});
test('Italian Flashscore names retain a verified alias for the original artwork', async t => {
  let query;
  const service = createLogoSearch({ localTeams: [], request: async (url, options) => {
    query = options.params.t;
    return { data: { teams: [{ strTeam: 'Borussia Dortmund', strSport: 'Soccer', strBadge: badge }] } };
  } });
  t.after(service.close);
  assert.deepEqual((await service.search('Dortmund')).data.results[0].aliases, ['Dortmund']);
  assert.equal(query, 'Borussia Dortmund');
});
test('PSG uses its verified team ID when free name search omits it', async t => {
  let requestOptions;
  const service = createLogoSearch({ localTeams: [], request: async (url, options) => {
    requestOptions = { url, ...options };
    return { data: { teams: [{ strTeam: 'Paris Saint-Germain', strTeamAlternate: 'PSG, Paris SG', strSport: 'Soccer', strBadge: badge }] } };
  } });
  t.after(service.close);
  assert.equal((await service.search('PSG')).data.results[0].name, 'Paris Saint-Germain');
  assert.match(requestOptions.url, /\/lookupteam\.php$/);
  assert.deepEqual(requestOptions.params, { id: '133714' });
});
for (const url of [badge, 'https://static.flashscore.com/res/image/data/team.png', 'https://livesport-ott-images.ssl.cdn.cra.cz/team.png', 'https://images.fotmob.com/image_resources/logo/teamlogo/8563.png']) {
  test(`proxy permits known badge CDN: ${new URL(url).hostname}`, () => assert.equal(validateRemoteUrl(url).valid, true));
}
for (const url of ['http://127.0.0.1/', 'file://thesportsdb.com/etc/passwd', 'https://thesportsdb.com.evil.test/a', 'https://user:pass@thesportsdb.com/a', 'https://thesportsdb.com:8080/a', 'https://images.fotmob.com.evil.test/a', 'https://images.fotmob.com@127.0.0.1/a', 'https://fotmob.com/a']) {
  test(`proxy rejects unsafe URL: ${url}`, () => assert.equal(validateRemoteUrl(url).valid, false));
}
test('redirects to a private destination are rejected', () => {
  assert.throws(() => validateRedirect({ protocol: 'http:', hostname: '127.0.0.1', path: '/' }));
});
