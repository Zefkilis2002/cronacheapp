const axios = require('axios');
const { createAsyncCache } = require('./asyncCache');
const { validateRemoteUrl } = require('./remoteUrl');

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
const SEARCH_NAMES = {
  inter: 'Inter Milan', milan: 'AC Milan',
  barcellona: 'Barcelona', dortmund: 'Borussia Dortmund', betis: 'Real Betis',
  'rb lipsia': 'RB Leipzig', 'slavia praga': 'Slavia Prague',
  'atl. madrid': 'Atletico Madrid', bayern: 'Bayern Munich',
  'manchester utd': 'Manchester United', lilla: 'Lille', psv: 'PSV Eindhoven',
};
const TEAM_IDS = { psg: '133714', 'paris sg': '133714', 'paris saint-germain': '133714' };

function createLogoSearch({ localTeams, request = axios.get, apiKey = process.env.THESPORTSDB_API_KEY || '123' }) {
  const cache = createAsyncCache({ maxKeys: 1500 });
  const indexed = localTeams.map(team => ({ ...team, key: normalize(team.name) }));
  const search = query => cache.get(`logos:${normalize(query)}`, async () => {
    const q = normalize(query);
    const local = indexed.filter(team => team.key.includes(q));
    // Exact catalog matches never need the public API (30 requests/minute).
    if (local.some(team => team.key === q)) return { status: true, results: local.map(({ key, ...team }) => team) };
    try {
      const teamId = TEAM_IDS[q];
      const response = await request(`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(apiKey)}/${teamId ? 'lookupteam' : 'searchteams'}.php`, {
        params: teamId ? { id: teamId } : { t: SEARCH_NAMES[q] || query }, timeout: 5000,
      });
      if (!response.data || !Object.prototype.hasOwnProperty.call(response.data, 'teams')) throw new Error('Risposta provider non valida');
      const remote = (response.data.teams || [])
        .filter(team => team.strSport === 'Soccer' && team.strBadge && validateRemoteUrl(team.strBadge).valid)
        .map(team => {
          const aliases = String(team.strTeamAlternate || '').split(/[,|;]/).map(alias => alias.trim()).filter(Boolean);
          if (SEARCH_NAMES[q] && [team.strTeam, ...aliases].some(name => normalize(name) === normalize(SEARCH_NAMES[q]))) aliases.push(query);
          return { name: team.strTeam, logoUrl: team.strBadge, aliases: [...new Set(aliases)] };
        });
      const combined = local.map(({ key, ...team }) => team);
      for (const team of remote) {
        if (!combined.some(item => normalize(item.name) === normalize(team.name))) combined.push(team);
      }
      combined.sort((a, b) => Number(normalize(b.name) === q) - Number(normalize(a.name) === q));
      return { status: true, results: combined.slice(0, 10).map(team => ({ ...team, logo_url: team.logoUrl })) };
    } catch (error) {
      // Throw so an outage/429 is never cached as a successful empty search.
      error.localResults = local.map(({ key, ...team }) => team);
      throw error;
    }
  }, { softTTL: 3600, hardTTL: 86400 });
  return { search, close: cache.close };
}

module.exports = { createLogoSearch, normalize };
