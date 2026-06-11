import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/football';
import MatchCard from './MatchCard';

export default function LiveScores() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  const fetchLive = useCallback(async () => {
    try {
      const data = await api.getLive();
      setFixtures(data.response || []);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 120000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <h2 className="font-semibold text-zinc-100">En direct</h2>
          {!loading && (
            <span className="text-xs font-semibold px-2 py-0.5 bg-red-500/15 text-red-400 rounded-full">
              {fixtures.length}
            </span>
          )}
        </div>
        {lastUpdate && (
          <span className="text-xs text-zinc-600">
            {lastUpdate.toLocaleTimeString('fr-FR')}
          </span>
        )}
      </div>

      {loading ? (
        <MatchGrid>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </MatchGrid>
      ) : error ? (
        <div className="card p-6 text-center">
          <p className="text-sm text-red-400">Erreur : {error}</p>
          <button
            onClick={fetchLive}
            className="mt-3 text-xs text-emerald-400 hover:underline"
          >
            Reessayer
          </button>
        </div>
      ) : fixtures.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-2xl mb-2">&#x1F3DF;</p>
          <p className="text-sm text-zinc-500">Aucun match en direct pour le moment.</p>
        </div>
      ) : (
        <MatchGrid>
          {fixtures.map((f) => (
            <MatchCard key={f.fixture.id} fixture={f} />
          ))}
        </MatchGrid>
      )}
    </section>
  );
}

function MatchGrid({ children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {children}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-4 animate-pulse">
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
  );
}
