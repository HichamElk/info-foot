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

// Matchs du jour
app.get('/api/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await cachedRequest(`today_${today}`, 120, async () => {
      const { data } = await apiClient.get('/fixtures', { params: { date: today } });
      return data;
    });
    res.json(data);
  } catch (err) {
    console.error('GET /api/today', err.message);
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
