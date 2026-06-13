import { useState, useEffect } from 'react';
import { api } from '../api/football';
import LiveScores from '../components/live/LiveScores';
import MatchCard from '../components/live/MatchCard';

export default function Home() {
  const [todayFixtures, setTodayFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getToday()
      .then((data) => setTodayFixtures(data.response || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Grouper par ligue
  const byLeague = todayFixtures.reduce((acc, f) => {
    const key = f.league.id;
    if (!acc[key]) acc[key] = { league: f.league, fixtures: [] };
    acc[key].fixtures.push(f);
    return acc;
  }, {});

  const leagueGroups = Object.values(byLeague);

  return (
    <div className="space-y-10">
      {/* En-tete */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Tableau de bord</h1>
        <p className="text-zinc-500 capitalize mt-1">{today}</p>
      </div>

      {/* Matchs en direct */}
      <LiveScores />

      {/* Matchs du jour */}
      <section>
        <h2 className="font-semibold text-zinc-100 mb-4">Matchs du jour</h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="h-3 bg-zinc-800 rounded w-28" />
                  <div className="h-3 bg-zinc-800 rounded w-10" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-zinc-800 rounded w-32" />
                    <div className="h-4 bg-zinc-800 rounded w-4" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-zinc-800 rounded w-28" />
                    <div className="h-4 bg-zinc-800 rounded w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-red-400">Erreur de chargement : {error}</p>
          </div>
        ) : leagueGroups.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-2xl mb-2">&#x1F4C5;</p>
            <p className="text-sm text-zinc-500">Aucun match programme aujourd'hui.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {leagueGroups.map(({ league, fixtures }) => (
              <div key={league.id}>
                <div className="flex items-center gap-2.5 mb-3">
                  <img
                    src={league.logo}
                    alt={league.name}
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-sm font-medium text-zinc-400">
                    {league.name}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-sm text-zinc-600">{league.country}</span>
                  <span className="text-xs text-zinc-600 ml-auto">
                    {fixtures.length} match{fixtures.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {fixtures.map((f) => (
                    <MatchCard key={f.fixture.id} fixture={f} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
