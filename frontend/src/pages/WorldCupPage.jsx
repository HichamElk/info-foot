import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/football';
import MatchCard from '../components/live/MatchCard';

// Groupes CDM 2026 (connus a l'avance)
const WC_GROUPS = {
  'Group A': [2, 6, 95, 21],        // USA, Maroc, Panama, Canada... selon tirage
  // Les groupes seront deduits automatiquement depuis les donnees API
};

function computeStandings(fixtures) {
  const teams = {};

  fixtures.forEach((f) => {
    if (f.fixture.status.short !== 'FT' && f.fixture.status.short !== 'AET') return;
    const { home, away } = f.teams;
    const gh = f.goals.home;
    const ga = f.goals.away;
    if (gh === null || ga === null) return;

    [home, away].forEach((t) => {
      if (!teams[t.id]) {
        teams[t.id] = {
          id: t.id, name: t.name, logo: t.logo,
          played: 0, win: 0, draw: 0, lose: 0,
          gf: 0, ga: 0, points: 0,
          group: f.league.round,
        };
      }
    });

    const isHome = (id) => id === home.id;
    const update = (team, scored, conceded) => {
      team.played++;
      team.gf += scored;
      team.ga += conceded;
      if (scored > conceded) { team.win++; team.points += 3; }
      else if (scored === conceded) { team.draw++; team.points += 1; }
      else { team.lose++; }
    };

    update(teams[home.id], gh, ga);
    update(teams[away.id], ga, gh);
  });

  // Deduire les groupes depuis les matchs (equipes qui ont joue ensemble)
  const groupMap = {};
  fixtures.forEach((f) => {
    const round = f.league.round;
    if (!round.startsWith('Group Stage')) return;
    const hId = f.teams.home.id;
    const aId = f.teams.away.id;
    if (!groupMap[hId]) groupMap[hId] = new Set();
    if (!groupMap[aId]) groupMap[aId] = new Set();
    groupMap[hId].add(aId);
    groupMap[aId].add(hId);
  });

  // Union-Find simplifie pour regrouper les equipes connectees
  const parent = {};
  const find = (x) => { if (parent[x] === undefined) parent[x] = x; return parent[x] === x ? x : (parent[x] = find(parent[x])); };
  const union = (x, y) => { parent[find(x)] = find(y); };

  Object.entries(groupMap).forEach(([teamId, opponents]) => {
    opponents.forEach((opId) => union(parseInt(teamId), opId));
  });

  // Regrouper
  const groups = {};
  Object.values(teams).forEach((team) => {
    const root = find(team.id);
    if (!groups[root]) groups[root] = [];
    groups[root].push(team);
  });

  return Object.values(groups).map((g) =>
    g.sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
  ).sort((a, b) => b.length - a.length);
}

export default function WorldCupPage() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');
  const [error, setError] = useState(null);

  const fetchWC = useCallback(async () => {
    try {
      const data = await api.getWC();
      setFixtures(data.response || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWC();
    const interval = setInterval(fetchWC, 120000);
    return () => clearInterval(interval);
  }, [fetchWC]);

  // Grouper les matchs par date
  const byDate = fixtures.reduce((acc, f) => {
    const date = f.fixture.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(f);
    return acc;
  }, {});

  const liveMatches = fixtures.filter((f) =>
    ['1H', '2H', 'HT', 'ET'].includes(f.fixture.status.short)
  );

  const completedCount = fixtures.filter((f) => f.fixture.status.short === 'FT').length;
  const standings = computeStandings(fixtures);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header CDM */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-900/40 via-zinc-900 to-zinc-900 border border-yellow-700/30 p-6">
        <div className="absolute top-0 right-0 text-[120px] opacity-5 leading-none select-none">
          &#x1F3C6;
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl border border-yellow-700/30 flex items-center justify-center text-4xl">
            &#x1F3C6;
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Coupe du Monde 2026</h1>
            <p className="text-yellow-400/80 text-sm mt-0.5">USA · Canada · Mexique · 11 juin — 19 juillet</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
              <span>{fixtures.length} matchs</span>
              <span>·</span>
              <span>{completedCount} joues</span>
              <span>·</span>
              <span>{fixtures.length - completedCount} a venir</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live CDM */}
      {liveMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h2 className="font-semibold text-zinc-100">En direct</h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-red-500/15 text-red-400 rounded-full">
              {liveMatches.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {liveMatches.map((f) => (
              <MatchCard key={f.fixture.id} fixture={f} />
            ))}
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl w-fit border border-zinc-800">
        <button
          onClick={() => setActiveTab('matches')}
          className={activeTab === 'matches' ? 'tab-btn-active' : 'tab-btn-inactive'}
        >
          Calendrier
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className={activeTab === 'standings' ? 'tab-btn-active' : 'tab-btn-inactive'}
        >
          Groupes
          {standings.length > 0 && (
            <span className="ml-1.5 text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded-full">
              {standings.length}
            </span>
          )}
        </button>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : activeTab === 'matches' ? (
        <MatchesTab byDate={byDate} today={today} />
      ) : (
        <StandingsTab groups={standings} completedCount={completedCount} />
      )}
    </div>
  );
}

function MatchesTab({ byDate, today }) {
  const dates = Object.keys(byDate).sort();
  if (dates.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-zinc-500">Aucun match dans la fenetre de 15 jours.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dates.map((date) => {
        const isToday = date === today;
        const d = new Date(date + 'T12:00:00');
        const label = d.toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long',
        });

        return (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-sm font-medium capitalize ${isToday ? 'text-yellow-400' : 'text-zinc-400'}`}>
                {label}
              </span>
              {isToday && (
                <span className="text-xs px-2 py-0.5 bg-yellow-500/15 text-yellow-400 rounded-full font-semibold">
                  Aujourd'hui
                </span>
              )}
              <span className="text-xs text-zinc-600 ml-auto">{byDate[date].length} match(s)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {byDate[date].map((f) => (
                <MatchCard key={f.fixture.id} fixture={f} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StandingsTab({ groups, completedCount }) {
  if (completedCount === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-2xl mb-3">&#x23F3;</p>
        <p className="text-sm text-zinc-400">Les classements apparaitront apres les premiers matchs.</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-zinc-500">Classements en cours de calcul...</p>
      </div>
    );
  }

  const letters = 'ABCDEFGHIJKL';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {groups.map((group, gi) => (
        <div key={gi} className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/40 flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded flex items-center justify-center">
              {letters[gi] || gi + 1}
            </div>
            <span className="text-sm font-semibold text-zinc-200">Groupe {letters[gi] || gi + 1}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs text-zinc-500 font-medium py-2 pl-4 pr-2">Equipe</th>
                <th className="text-center text-xs text-zinc-500 font-medium py-2 px-2">MJ</th>
                <th className="text-center text-xs text-zinc-500 font-medium py-2 px-2">V</th>
                <th className="text-center text-xs text-zinc-500 font-medium py-2 px-2">N</th>
                <th className="text-center text-xs text-zinc-500 font-medium py-2 px-2">D</th>
                <th className="text-center text-xs text-zinc-500 font-medium py-2 px-2">DB</th>
                <th className="text-center text-xs text-zinc-500 font-medium py-2 pl-2 pr-4">Pts</th>
              </tr>
            </thead>
            <tbody>
              {group.map((team, ti) => (
                <tr key={team.id} className={`border-b border-zinc-800/40 ${ti < 2 ? 'border-l-2 border-l-yellow-500/60' : ''}`}>
                  <td className="py-2.5 pl-4 pr-2">
                    <div className="flex items-center gap-2">
                      <img src={team.logo} alt={team.name} className="w-5 h-5 object-contain shrink-0" />
                      <span className="text-zinc-200 font-medium truncate">{team.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center text-zinc-400">{team.played}</td>
                  <td className="py-2.5 px-2 text-center text-zinc-400">{team.win}</td>
                  <td className="py-2.5 px-2 text-center text-zinc-400">{team.draw}</td>
                  <td className="py-2.5 px-2 text-center text-zinc-400">{team.lose}</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={(team.gf - team.ga) > 0 ? 'text-emerald-400' : (team.gf - team.ga) < 0 ? 'text-red-400' : 'text-zinc-400'}>
                      {team.gf - team.ga > 0 ? '+' : ''}{team.gf - team.ga}
                    </span>
                  </td>
                  <td className="py-2.5 pl-2 pr-4 text-center font-bold text-zinc-100">{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 flex items-center gap-1.5 text-xs text-zinc-600">
            <div className="w-2 h-2 border-l-2 border-l-yellow-500/60 rounded-sm" />
            <span>Qualifies pour les 1/8</span>
          </div>
        </div>
      ))}
    </div>
  );
}
