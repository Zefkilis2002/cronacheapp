const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSemaphore } = require('../lib/semaphore');
test('browser capacity is reserved atomically and released once', async () => {
  const acquire = createSemaphore(1);
  const release = await acquire();
  let entered = false;
  const waiting = acquire().then(unlock => { entered = true; return unlock; });
  await Promise.resolve();
  assert.equal(entered, false);
  release();
  release();
  const unlock = await waiting;
  assert.equal(entered, true);
  unlock();
});
test('an overloaded browser queue fails without exceeding capacity', async () => {
  const acquire = createSemaphore(1, 10);
  const release = await acquire();
  await assert.rejects(acquire(), /Server occupato/);
  release();
  (await acquire())();
});
