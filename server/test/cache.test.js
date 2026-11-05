const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAsyncCache } = require('../lib/asyncCache');

test('concurrent cold requests execute the upstream operation once', async t => {
  const cache = createAsyncCache();
  t.after(cache.close);
  let release;
  let calls = 0;
  const fetch = () => { calls++; return new Promise(resolve => { release = resolve; }); };
  const requests = [cache.get('match', fetch), cache.get('match', fetch), cache.get('match', fetch)];
  await Promise.resolve();
  release({ score: 2 });
  const results = await Promise.all(requests);
  assert.equal(calls, 1);
  assert.deepEqual(results.map(r => [r.data.score, r.cacheStatus]), [[2, 'MISS'], [2, 'SHARED'], [2, 'SHARED']]);
});

test('failed upstream is retried instead of being cached as empty', async t => {
  const cache = createAsyncCache();
  t.after(cache.close);
  await assert.rejects(cache.get('team', () => { throw new Error('offline'); }));
  const result = await cache.get('team', async () => ({ found: true }));
  assert.equal(result.data.found, true);
});

test('stale data is immediate while only one refresh runs', async t => {
  let now = 1000;
  const cache = createAsyncCache({ now: () => now });
  t.after(cache.close);
  await cache.get('table', async () => ({ value: 1 }), { softTTL: 1 });
  now += 2000;
  let release;
  let calls = 0;
  const fetch = () => { calls++; return new Promise(resolve => { release = resolve; }); };
  const results = await Promise.all([cache.get('table', fetch, { softTTL: 1 }), cache.get('table', fetch, { softTTL: 1 })]);
  assert.equal(calls, 1);
  assert.deepEqual(results.map(r => [r.data.value, r.cacheStatus]), [[1, 'STALE'], [1, 'STALE']]);
  release({ value: 2 });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal((await cache.get('table', fetch)).data.value, 2);
});
