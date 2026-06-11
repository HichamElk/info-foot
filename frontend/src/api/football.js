const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getLive: () => request('/live'),
  getToday: () => request('/today'),
  getStandings: (leagueId, season = 2024) =>
    request(`/standings/${leagueId}?season=${season}`),
  getFixtures: (leagueId, season = 2024) =>
    request(`/fixtures/${leagueId}?season=${season}`),
  getTeamStats: (teamId, leagueId, season = 2024) =>
    request(`/teams/${teamId}/stats?league=${leagueId}&season=${season}`),
  getMatch: (fixtureId) => request(`/match/${fixtureId}`),
  getWC: () => request('/wc'),
};
