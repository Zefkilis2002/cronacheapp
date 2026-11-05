import { resolveTeamLogo } from '../../utils/logoSearch';

export const resolveWebLogos = async (names) => {
  const unique = [...new Set((names || []).filter(Boolean))];
  const urls = await Promise.all(unique.map(name => resolveTeamLogo(name)));
  return Object.fromEntries(unique.flatMap((name, i) => urls[i] ? [[name, urls[i]]] : []));
};
