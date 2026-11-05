const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');
let server;
let base;
before(async () => {
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));

test('health endpoint identifies the deployed revision and is not cached', async () => {
  const res = await fetch(base + '/api/health-check');
  assert.equal((await res.json()).version, '2026-11-05');
  assert.equal(res.headers.get('cache-control'), 'no-store');
});
for (const path of [
  '/api/search-logos?q=aa&q=bb',
  '/api/get-matches?country=../private&league=test',
  '/api/get-match-details?matchId=invalid',
  '/api/get-lineups?matchUrl=http://127.0.0.1/private',
  '/api/search-competitions?q=' + 'a'.repeat(101),
  '/proxy-image?url=file://thesportsdb.com/etc/passwd',
]) {
  test(`rejects invalid request without invoking a scraper: ${path.slice(0, 80)}`, async () => {
    const res = await fetch(base + path);
    assert.ok([400, 403].includes(res.status));
  });
}
