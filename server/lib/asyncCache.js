const NodeCache = require('node-cache');

// Share cold misses as well as background refreshes: one scrape per key.
function createAsyncCache({ now = Date.now, maxKeys = 10000 } = {}) {
  const cache = new NodeCache({ stdTTL: 1800, maxKeys, useClones: false });
  const inflight = new Map();

  const refresh = (key, fetchFn, hardTTL) => {
    if (inflight.has(key)) return inflight.get(key);
    const task = Promise.resolve().then(fetchFn).then(data => {
      const wrapped = { ...data, _cachedAt: now() };
      // Capacity pressure must not turn a successful upstream response into 500.
      if (cache.getStats().keys >= maxKeys && !cache.has(key)) cache.del(cache.keys()[0]);
      cache.set(key, wrapped, hardTTL);
      return wrapped;
    }).finally(() => inflight.delete(key));
    inflight.set(key, task);
    return task;
  };

  const get = async (key, fetchFn, { softTTL = 180, hardTTL = 1800 } = {}) => {
    const cached = cache.get(key);
    if (cached) {
      if ((now() - cached._cachedAt) / 1000 < softTTL) return { data: cached, cacheStatus: 'HIT' };
      refresh(key, fetchFn, hardTTL).catch(err => console.warn(`[Cache] ${key}: ${err.message}`));
      return { data: cached, cacheStatus: 'STALE' };
    }
    const shared = inflight.has(key);
    return { data: await refresh(key, fetchFn, hardTTL), cacheStatus: shared ? 'SHARED' : 'MISS' };
  };
  return { get, close: () => cache.close() };
}

module.exports = { createAsyncCache };
