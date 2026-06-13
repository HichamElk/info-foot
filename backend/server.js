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

// 2e source : football-data.org (donnees CDM 2026 completes : poules, classements officiels)
// Plan gratuit : 10 req/min. Auth via header X-Auth-Token.
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY;
const fdClient = axios.create({
  baseURL: 'https://api.football-data.org/v4',
  headers: FOOTBALL_DATA_KEY ? { 'X-Auth-Token': FOOTBALL_DATA_KEY } : {},
});

// 3e source : soccer-football-info (RapidAPI) — UNIQUEMENT pour le detail de match
// (stats, compositions, evenements). PLAN GRATUIT 200 req/JOUR -> jamais de polling,
// que des appels a la demande, fortement caches. Auth via headers RapidAPI.
const SFI_KEY = process.env.SFI_KEY;
const sfiClient = axios.create({
  baseURL: 'https://soccer-football-info.p.rapidapi.com',
  headers: SFI_KEY
    ? { 'x-rapidapi-key': SFI_KEY, 'x-rapidapi-host': 'soccer-football-info.p.rapidapi.com' }
    : {},
});

// Garde : refuse proprement si la cle football-data est absente
function requireFootballData(res) {
  if (!FOOTBALL_DATA_KEY) {
    res.status(503).json({ error: 'FOOTBALL_DATA_KEY manquante dans backend/.env' });
    return false;
  }
  return true;
}

// --- Adaptateurs football-data -> format api-sports (reutilise par le front) ---
// Le frontend (MatchCard, StandingsTable, Home...) attend le shape api-sports.
// On convertit les reponses football-data pour ne pas reecrire les composants.

const FD_STATUS = {
  FINISHED:  { short: 'FT',   long: 'Match termine' },
  IN_PLAY:   { short: 'LIVE', long: 'En direct' },
  PAUSED:    { short: 'HT',   long: 'Mi-temps' },
  SUSPENDED: { short: 'CANC', long: 'Suspendu' },
  POSTPONED: { short: 'PST',  long: 'Reporte' },
  CANCELLED: { short: 'CANC', long: 'Annule' },
  AWARDED:   { short: 'FT',   long: 'Sur tapis vert' },
};

function fdMatchToFixture(m) {
  const st = FD_STATUS[m.status] || { short: 'NS', long: 'A venir' };
  return {
    fixture: {
      id: m.id,
      date: m.utcDate,
      status: { short: st.short, long: st.long, elapsed: m.minute ?? null },
    },
    league: {
      id: m.competition?.id,
      name: m.competition?.name,
      country: m.area?.name || '',
      logo: m.competition?.emblem,
      round: m.stage,
    },
    teams: {
      home: { id: m.homeTeam?.id, name: m.homeTeam?.shortName || m.homeTeam?.name, logo: m.homeTeam?.crest },
      away: { id: m.awayTeam?.id, name: m.awayTeam?.shortName || m.awayTeam?.name, logo: m.awayTeam?.crest },
    },
    goals: {
      home: m.score?.fullTime?.home ?? null,
      away: m.score?.fullTime?.away ?? null,
    },
  };
}

function fdStandingsToApiSports(body) {
  const comp = body.competition || {};
  const season = body.season || {};
  const total = (body.standings || []).find((s) => s.type === 'TOTAL') || (body.standings || [])[0];
  const table = (total?.table || []).map((row) => ({
    rank: row.position,
    team: { id: row.team.id, name: row.team.shortName || row.team.name, logo: row.team.crest },
    points: row.points,
    goalsDiff: row.goalDifference,
    form: row.form ? row.form.replace(/[^WDL]/g, '') : null, // "W,D,L" -> "WDL"
    description: null, // football-data ne fournit pas les zones de qualif par ligne
    all: {
      played: row.playedGames,
      win: row.won,
      draw: row.draw,
      lose: row.lost,
      goals: { for: row.goalsFor, against: row.goalsAgainst },
    },
  }));
  return {
    response: [
      {
        league: {
          id: comp.id,
          name: comp.name,
          country: body.area?.name || '',
          logo: comp.emblem,
          flag: null,
          season: season.startDate ? new Date(season.startDate).getFullYear() : null,
          standings: [table],
        },
      },
    ],
  };
}

async function cachedRequest(key, ttl, fn) {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const data = await fn();
  cache.set(key, data, ttl);
  return data;
}

// --- soccer-football-info : recuperation du detail d'un match (best effort) ----
// Strategie : mapper la competition football-data -> championnat SFI, trouver le
// match par noms d'equipes, puis recuperer son detail complet (stats/compos/events).

// Championnats SFI connus (resolus une fois). Code = code competition football-data.
const SFI_CHAMP_SEED = {
  WC: '5085a3cde16c822b',
  PL: 'eb57e70ef2e7077e',
};
// Indices pour resoudre les autres a la volee (filtre par pays ISO-2 + mots-cles).
const SFI_HINTS = {
  PD: { c: 'es', kw: ['laliga', 'la liga', 'primera division'], excl: ['women', 'femenino', 'u-', 'segunda', 'rfef', ' b'] },
  SA: { c: 'it', kw: ['serie a'], excl: ['women', 'u-', 'femminile'] },
  BL1: { c: 'de', kw: ['bundesliga'], excl: ['women', 'u-', '2', 'frauen'] },
  FL1: { c: 'fr', kw: ['ligue 1'], excl: ['women', 'u-', 'feminin'] },
  DED: { c: 'nl', kw: ['eredivisie'], excl: ['women', 'vrouwen'] },
  PPL: { c: 'pt', kw: ['primeira liga', 'liga portugal'], excl: ['women', 'u-'] },
  ELC: { c: 'gb', kw: ['championship'], excl: ['women', 'u-', 'scotland', 'national', 'premier'] },
  BSA: { c: 'br', kw: ['serie a', 'brasileiro'], excl: ['women', 'u-', 'feminino', ' b'] },
};

const normName = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

// Deux noms d'equipe "matchent" si l'un contient l'autre (apres normalisation)
function nameMatch(a, b) {
  const x = normName(a);
  const y = normName(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

async function resolveSfiChamp(code) {
  if (!code) return null;
  if (SFI_CHAMP_SEED[code]) return SFI_CHAMP_SEED[code];
  const cacheKey = `sfi_champ_${code}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  const hint = SFI_HINTS[code];
  let id = null;
  if (hint) {
    for (let p = 1; p <= 6 && !id; p++) {
      const { data } = await sfiClient.get('/championships/list/', { params: { c: hint.c, l: 'en_US', p } });
      const arr = data.result || [];
      if (!arr.length) break;
      const found = arr.find((x) => {
        const nm = (x.name || '').toLowerCase();
        return hint.kw.some((k) => nm.includes(k)) && !hint.excl.some((e) => nm.includes(e));
      });
      if (found) id = found.id;
    }
  }
  cache.set(cacheKey, id, 604800); // 7 jours (meme un echec est mis en cache)
  return id;
}

// Trouve le match SFI correspondant (pagination, arret des qu'on le trouve)
async function findSfiMatch(champId, homeName, awayName) {
  for (let p = 1; p <= 12; p++) {
    const page = await cachedRequest(`sfi_by_${champId}_${p}`, 3600, async () => {
      const { data } = await sfiClient.get('/matches/by/full/', { params: { c: champId, l: 'en_US', p } });
      return data;
    });
    const arr = page.result || [];
    if (!arr.length) break;
    const hit = arr.find((m) => {
      const a = m.teamA?.name;
      const b = m.teamB?.name;
      return (
        (nameMatch(a, homeName) && nameMatch(b, awayName)) ||
        (nameMatch(a, awayName) && nameMatch(b, homeName))
      );
    });
    if (hit) return hit;
    const items = page.pagination?.[0]?.items;
    if (items && p * (page.pagination[0].per_page || 25) >= items) break;
  }
  return null;
}

// Detail complet (stats/compos/events) d'un match SFI a partir de son id
async function sfiMatchDetail(sfiId) {
  return cachedRequest(`sfi_full_${sfiId}`, 86400, async () => {
    const { data } = await sfiClient.get('/matches/view/full/', { params: { i: sfiId, l: 'en_US' } });
    return data.result?.[0] || data.result || null;
  });
}

// Enrichit un match football-data avec le detail SFI. Renvoie null si indispo.
async function getSfiEnrichment(fdMatch) {
  if (!SFI_KEY) return null;
  try {
    const champId = await resolveSfiChamp(fdMatch.competition?.code);
    if (!champId) return null;
    const homeName = fdMatch.homeTeam?.name;
    const awayName = fdMatch.awayTeam?.name;
    const hit = await findSfiMatch(champId, homeName, awayName);
    if (!hit) return null;
    const d = await sfiMatchDetail(hit.id);
    if (!d) return null;

    // SFI teamA == equipe domicile football-data ?
    const homeIsA = nameMatch(d.teamA?.name, homeName);
    const pick = (t) => ({ name: t?.name, stats: t?.stats || null, lineup: t?.lineup || null, manager: t?.manager || null });
    return {
      homeIsA,
      teamA: pick(d.teamA),
      teamB: pick(d.teamB),
      events: Array.isArray(d.events) ? d.events : [],
      referee: d.referee?.name || null,
      stadium: d.stadium?.name || null,
    };
  } catch (err) {
    console.error('SFI enrichment', err.response?.status || '', err.message);
    return null; // jamais bloquant
  }
}

// Matchs en direct (football-data : status LIVE = IN_PLAY + PAUSED)
app.get('/api/live', async (req, res) => {
  if (!requireFootballData(res)) return;
  try {
    const data = await cachedRequest('fd_live', 60, async () => {
      const { data } = await fdClient.get('/matches', { params: { status: 'LIVE' } });
      return data;
    });
    res.json({ response: (data.matches || []).map(fdMatchToFixture) });
  } catch (err) {
    const status = err.response?.status || 500;
    console.error('GET /api/live', status, err.message);
    res.status(status).json({ error: err.response?.data?.message || err.message });
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

// Matchs du jour (football-data : /matches renvoie les matchs du jour par defaut)
app.get('/api/today', async (req, res) => {
  if (!requireFootballData(res)) return;
  try {
    const data = await cachedRequest('fd_today', 120, async () => {
      const { data } = await fdClient.get('/matches');
      return data;
    });
    res.json({ response: (data.matches || []).map(fdMatchToFixture) });
  } catch (err) {
    const status = err.response?.status || 500;
    console.error('GET /api/today', status, err.message);
    res.status(status).json({ error: err.response?.data?.message || err.message });
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

// --- Coupe du Monde 2026 via football-data.org (poules + classements officiels) ---

// Classements officiels par poule
app.get('/api/wc/standings', async (req, res) => {
  if (!requireFootballData(res)) return;
  try {
    const data = await cachedRequest('fd_wc_standings', 600, async () => {
      const { data } = await fdClient.get('/competitions/WC/standings');
      return data;
    });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    console.error('GET /api/wc/standings', status, err.message);
    res.status(status).json({ error: err.response?.data?.message || err.message });
  }
});

// Tous les matchs de la CDM (compositions des groupes, calendrier complet)
app.get('/api/wc/matches', async (req, res) => {
  if (!requireFootballData(res)) return;
  try {
    const data = await cachedRequest('fd_wc_matches', 300, async () => {
      const { data } = await fdClient.get('/competitions/WC/matches');
      return data;
    });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    console.error('GET /api/wc/matches', status, err.message);
    res.status(status).json({ error: err.response?.data?.message || err.message });
  }
});

// Classement d'une ligue (leagueId = code football-data : PL, FL1, PD, SA, BL1, DED, PPL, ELC, BSA)
app.get('/api/standings/:leagueId', async (req, res) => {
  if (!requireFootballData(res)) return;
  try {
    const { leagueId } = req.params;
    const data = await cachedRequest(`fd_standings_${leagueId}`, 600, async () => {
      const { data } = await fdClient.get(`/competitions/${leagueId}/standings`);
      return data;
    });
    res.json(fdStandingsToApiSports(data));
  } catch (err) {
    const status = err.response?.status || 500;
    console.error('GET /api/standings', status, err.message);
    res.status(status).json({ error: err.response?.data?.message || err.message });
  }
});

// Prochains matchs d'une ligue (les 12 prochains matchs programmes)
app.get('/api/fixtures/:leagueId', async (req, res) => {
  if (!requireFootballData(res)) return;
  try {
    const { leagueId } = req.params;
    const data = await cachedRequest(`fd_fixtures_${leagueId}`, 600, async () => {
      const { data } = await fdClient.get(`/competitions/${leagueId}/matches`, {
        params: { status: 'SCHEDULED' },
      });
      return data;
    });
    const upcoming = (data.matches || [])
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
      .slice(0, 12)
      .map(fdMatchToFixture);
    res.json({ response: upcoming });
  } catch (err) {
    const status = err.response?.status || 500;
    console.error('GET /api/fixtures', status, err.message);
    res.status(status).json({ error: err.response?.data?.message || err.message });
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

// Detail d'un match (football-data) : infos match + score + effectifs des 2 equipes.
// NB plan gratuit : pas de compo reelle/stats/events du match -> on affiche les
// EFFECTIFS complets de chaque equipe (/teams/{id}) + l'entraineur.
app.get('/api/match/:matchId', async (req, res) => {
  if (!requireFootballData(res)) return;
  try {
    const { matchId } = req.params;

    // Effectif d'une equipe : cache long (24h), partage entre tous les matchs
    const fetchTeam = async (id) => {
      if (!id) return null;
      try {
        return await cachedRequest(`fd_team_${id}`, 86400, async () => {
          const { data } = await fdClient.get(`/teams/${id}`);
          return data;
        });
      } catch {
        return null; // une equipe sans fiche ne doit pas casser la modal
      }
    };

    const data = await cachedRequest(`fd_match_${matchId}`, 300, async () => {
      const { data: match } = await fdClient.get(`/matches/${matchId}`);
      const [homeTeam, awayTeam, sfi] = await Promise.all([
        fetchTeam(match.homeTeam?.id),
        fetchTeam(match.awayTeam?.id),
        getSfiEnrichment(match), // stats/compos/events (best effort, peut etre null)
      ]);
      return { match, homeTeam, awayTeam, sfi };
    });

    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    console.error('GET /api/match', status, err.message);
    res.status(status).json({ error: err.response?.data?.message || err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
