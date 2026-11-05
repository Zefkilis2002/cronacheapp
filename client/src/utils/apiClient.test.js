import { getCachedJson, requestJson, toCanvasUrl } from './apiClient';
import config from '../config';

afterEach(() => { jest.restoreAllMocks(); });
test('deduplicates concurrent requests and reuses the successful response', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: true, results: ['Roma'] }) });
  const values = await Promise.all([requestJson('/api/test-shared'), requestJson('/api/test-shared')]);
  await requestJson('/api/test-shared');
  expect(values[0]).toEqual(values[1]);
  expect(fetch).toHaveBeenCalledTimes(1);
});
test('failed requests can be retried', async () => {
  global.fetch = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ok: true, json: async () => ({ status: true }) });
  await expect(requestJson('/api/test-retry')).rejects.toThrow('offline');
  await expect(requestJson('/api/test-retry')).resolves.toEqual({ status: true });
});
test('a cancelled subscriber does not cancel another subscriber', async () => {
  let finish;
  global.fetch = jest.fn().mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const controller = new AbortController();
  const cancelled = requestJson('/api/test-cancel', { signal: controller.signal });
  const active = requestJson('/api/test-cancel');
  controller.abort();
  await expect(cancelled).rejects.toHaveProperty('name', 'AbortError');
  finish({ ok: true, json: async () => ({ status: true, value: 7 }) });
  await expect(active).resolves.toHaveProperty('value', 7);
});
test('degraded responses are not cached', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: true, degraded: true, results: [] }) });
  await requestJson('/api/test-degraded');
  expect(getCachedJson('/api/test-degraded')).toBeNull();
});
test('expired responses are fetched again', async () => {
  const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: true }) });
  await requestJson('/api/test-expiry', { ttl: 10 });
  clock.mockReturnValue(1011);
  await requestJson('/api/test-expiry', { ttl: 10 });
  expect(fetch).toHaveBeenCalledTimes(2);
});
test('canvas URLs preserve local images and avoid double proxying', () => {
  const proxy = `${config.API_BASE_URL}/proxy-image?url=https%3A%2F%2Fstatic.flashscore.com%2Fa.png`;
  expect(toCanvasUrl('/loghi/a.png')).toBe('/loghi/a.png');
  expect(toCanvasUrl(proxy)).toBe(proxy);
  expect(toCanvasUrl('javascript:alert(1)')).toBeNull();
});
test('selecting a web logo removes provider thumbnail sizing', () => {
  expect(decodeURIComponent(toCanvasUrl('https://r2.thesportsdb.com/images/media/team/badge/roma.png/tiny'))).not.toContain('/tiny');
});
test('an existing proxy URL is upgraded to original artwork without nesting', () => {
  const proxy = `${config.API_BASE_URL}/proxy-image?url=${encodeURIComponent('https://r2.thesportsdb.com/roma.png/small')}`;
  const selected = toCanvasUrl(proxy);
  expect(decodeURIComponent(selected)).not.toContain('/small');
  expect(selected.match(/proxy-image/g)).toHaveLength(1);
});
