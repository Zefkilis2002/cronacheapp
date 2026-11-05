import { findTeamLogo, normalizeTeamName } from './LogoConstants';
import { getCachedJson, requestJson, toCanvasUrl } from './apiClient';

export const cleanTeamName = name => String(name || '').replace(/\s*\([A-Za-z]{2,3}\)\s*$/, '').trim();
const pathFor = (query, mode = 'team') => `/api/${mode === 'competition' ? 'search-competitions' : 'search-logos'}?q=${encodeURIComponent(cleanTeamName(query).toLowerCase())}`;

export const getCachedLogoSearch = (query, mode) => getCachedJson(pathFor(query, mode));
export const searchLogos = (query, { mode = 'team', signal } = {}) =>
  requestJson(pathFor(query, mode), { signal, ttl: 30 * 60 * 1000 });

export async function resolveTeamLogo(name, { sourceLogo, signal } = {}) {
  const local = findTeamLogo(name);
  if (local) return local;
  if (sourceLogo) return toCanvasUrl(sourceLogo);
  const query = cleanTeamName(name);
  if (query.length < 2) return null;
  try {
    const data = await searchLogos(query, { signal });
    const wanted = normalizeTeamName(query);
    const exact = (data.results || []).find(team => normalizeTeamName(team.name) === wanted);
    const best = exact || (data.results?.length === 1 ? data.results[0] : null);
    return toCanvasUrl(best?.logoUrl || best?.logo_url);
  } catch {
    return null;
  }
}
