import { findTeamLogo, normalizeTeamName } from './LogoConstants';
import { getCachedJson, requestJson, toCanvasUrl } from './apiClient';
import { originalLogoUrl, isFlashscoreThumbnail } from './logoImage';

export const cleanTeamName = name => String(name || '').replace(/\s*\([A-Za-z]{2,3}\)\s*$/, '').trim();
const pathFor = (query, mode = 'team') => `/api/${mode === 'competition' ? 'search-competitions' : 'search-logos'}?q=${encodeURIComponent(cleanTeamName(query).toLowerCase())}`;

export const getCachedLogoSearch = (query, mode) => getCachedJson(pathFor(query, mode));
export const searchLogos = (query, { mode = 'team', signal } = {}) =>
  requestJson(pathFor(query, mode), { signal, ttl: 30 * 60 * 1000 });

export async function resolveTeamLogo(name, { sourceLogo, signal } = {}) {
  const local = findTeamLogo(name);
  if (local) return local;
  // Flashscore result badges are 30px thumbnails, participant badges only
  // 100px. Resolve original artwork before accepting either in an export.
  const source = originalLogoUrl(sourceLogo);
  if (source && !isFlashscoreThumbnail(source)) return toCanvasUrl(source);
  const query = cleanTeamName(name);
  if (query.length < 2) return null;
  try {
    const data = await searchLogos(query, { signal });
    const wanted = normalizeTeamName(query);
    const best = (data.results || []).find(team =>
      [team.name, ...(team.aliases || [])].some(alias => normalizeTeamName(alias) === wanted)
    );
    return toCanvasUrl(originalLogoUrl(best?.logoUrl || best?.logo_url));
  } catch {
    return null;
  }
}
