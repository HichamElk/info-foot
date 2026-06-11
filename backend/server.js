import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import NodeCache from 'node-cache';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.RAPIDAPI_KEY;

if (!API_KEY) {
  console.error('RAPIDAPI_KEY manquante dans le fichier .env');
  process.exit(1);
}

// Durees de cache : live=30s, standings/fixtures=5min, stats=10min
const cache = new NodeCache();

app.use(cors());
app.use(express.json());

const apiClient = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: {
    'x-apisports-key': API_KEY,
  },
});

async function cachedRequest(key, ttl, fn) {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const data = await fn();
  cache.set(key, data, ttl);
  return data;
}

// Matchs en direct
app.get('/api/live', async (req, res) => {
  try {
    const data = await cachedRequest('live', 120, async () => {
      const { data } = await apiClient.get('/fixtures', { params: { live: 'all' } });
      return data;
    });
    res.json(data);
  } catch (err) {
    console.error('GET /api/live', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Helper : fixtures par date (cache partage entre /today et /wc)
async function getFixturesByDate(date) {
  const today = new Date().toISOString().split('T')[0];
  const isPast = date < today;
  const ttl = isPast ? 43200 : 120; // passe: 12h (immuable), aujourd'hui/futur: 2min
  return cachedRequest(`fixtures_date_${date}`, ttl, async () => {
    const { data } = await apiClient.get('/fixtures', { params: { date } });
    return data;
  });
}

// Matchs du jour
app.get('/api/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await getFixturesByDate(today);
    res.json(data);
  } catch (err) {
    console.error('GET /api/today', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Matchs Coupe du Monde (fenetre glissante : 7 jours passes + aujourd'hui + 7 jours futurs)
app.get('/api/wc', async (req, res) => {
  try {
    const WC_START = new Date('2026-06-11');
    const WC_END   = new Date('2026-07-19');
    const now      = new Date();

    const from = new Date(Math.max(now.getTime() - 7 * 86400000, WC_START.getTime()));
    const to   = new Date(Math.min(now.getTime() + 7 * 86400000, WC_END.getTime()));

    const dates = [];
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    const fixtures = [];
    for (const date of dates) {
      const data = await getFixturesByDate(date);
      const wc = (data.response || []).filter(f => f.league.id === 1);
      fixtures.push(...wc);
    }

    fixtures.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
    res.json({ response: fixtures, results: fixtures.length });
  } catch (err) {
    console.error('GET /api/wc', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Classement d'une ligue
app.get('/api/standings/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const season = req.query.season || 2024;
    const data = await cachedRequest(`standings_${leagueId}_${season}`, 300, async () => {
      const { data } = await apiClient.get('/standings', {
        params: { league: leagueId, season },
      });
      return data;
    });
    res.json(data);
  } catch (err) {
    console.error('GET /api/standings', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Prochains matchs d'une ligue
app.get('/api/fixtures/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const season = req.query.season || 2024;
    const data = await cachedRequest(`fixtures_${leagueId}_${season}`, 300, async () => {
      const { data } = await apiClient.get('/fixtures', {
        params: { league: leagueId, season, next: 10 },
      });
      return data;
    });
    res.json(data);
  } catch (err) {
    console.error('GET /api/fixtures', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Statistiques d'une equipe
app.get('/api/teams/:teamId/stats', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { league, season = 2024 } = req.query;
    const data = await cachedRequest(`stats_${teamId}_${league}_${season}`, 600, async () => {
      const { data } = await apiClient.get('/teams/statistics', {
        params: { team: teamId, league, season },
      });
      return data;
    });
    res.json(data);
  } catch (err) {
    console.error('GET /api/teams/stats', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Detail d'un match : evenements + statistiques + compositions
app.get('/api/match/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const data = await cachedRequest(`match_${fixtureId}`, 60, async () => {
      const [events, stats, lineups] = await Promise.all([
        apiClient.get('/fixtures/events', { params: { fixture: fixtureId } }),
        apiClient.get('/fixtures/statistics', { params: { fixture: fixtureId } }),
        apiClient.get('/fixtures/lineups', { params: { fixture: fixtureId } }),
      ]);
      return {
        events: events.data.response,
        statistics: stats.data.response,
        lineups: lineups.data.response,
      };
    });
    res.json(data);
  } catch (err) {
    console.error('GET /api/match', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
