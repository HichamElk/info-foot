import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/football';
import StandingsTable from '../components/standings/StandingsTable';
import MatchCard from '../components/live/MatchCard';

const LEAGUE_INFO = {
  39:  { name: 'Premier League',    country: 'Angleterre' },
  40:  { name: 'Championship',      country: 'Angleterre' },
  61:  { name: 'Ligue 1',           country: 'France' },
  62:  { name: 'Ligue 2',           country: 'France' },
  140: { name: 'La Liga',           country: 'Espagne' },
  135: { name: 'Serie A',           country: 'Italie' },
  78:  { name: 'Bundesliga',        country: 'Allemagne' },
  79:  { name: 'Bundesliga 2',      country: 'Allemagne' },
  144: { name: 'Jupiler Pro League',country: 'Belgique' },
  203: { name: 'Super Lig',         country: 'Turquie' },
  88:  { name: 'Eredivisie',        country: 'Pays-Bas' },
};

export default function LeaguePage() {
  const { id } = useParams();
  const leagueId = parseInt(id);

  const [standings, setStandings] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [leagueMeta, setLeagueMeta] = useState(null);
  const [loadingStandings, setLoadingStandings] = useState(true);
  const [loadingFixtures, setLoadingFixtures] = useState(true);
  const [errorStandings, setErrorStandings] = useState(null);
  const [activeTab, setActiveTab] = useState('standings');

  const info = LEAGUE_INFO[leagueId] || { name: `Ligue ${leagueId}`, country: '' };

  useEffect(() => {
    // Reset state on league change
    setStandings(null);
    setFixtures([]);
    setLeagueMeta(null);
    setLoadingStandings(true);
    setLoadingFixtures(true);
    setErrorStandings(null);

    api.getStandings(leagueId)
      .then((data) => {
        const response = data.response?.[0];
        if (response) {
          setLeagueMeta(response.league);
          setStandings(response.league.standings);
        } else {
          setErrorStandings('Classement non disponible pour cette saison.');
        }
      })
      .catch((err) => setErrorStandings(err.message))
      .finally(() => setLoadingStandings(false));

    api.getFixtures(leagueId)
      .then((data) => setFixtures(data.response || []))
      .catch(console.error)
      .finally(() => setLoadingFixtures(false));
  }, [leagueId]);

  return (
    <div className="space-y-6">
      {/* En-tete ligue */}
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center p-2 shrink-0">
          {leagueMeta ? (
            <img
              src={leagueMeta.logo}
              alt={leagueMeta.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-zinc-700 rounded-xl animate-pulse" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{info.name}</h1>
          <p className="text-zinc-400 mt-0.5">
            {info.country}
            {leagueMeta && (
              <span className="text-zinc-600"> · Saison {leagueMeta.season}</span>
            )}
          </p>
          {leagueMeta?.flag && (
            <img
              src={leagueMeta.flag}
              alt={info.country}
              className="w-6 h-4 object-cover rounded mt-1.5 opacity-60"
            />
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl w-fit border border-zinc-800">
        <button
          onClick={() => setActiveTab('standings')}
          className={activeTab === 'standings' ? 'tab-btn-active' : 'tab-btn-inactive'}
        >
          Classement
        </button>
        <button
          onClick={() => setActiveTab('fixtures')}
          className={activeTab === 'fixtures' ? 'tab-btn-active' : 'tab-btn-inactive'}
        >
          Prochains matchs
          {!loadingFixtures && fixtures.length > 0 && (
            <span className="ml-1.5 text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded-full">
              {fixtures.length}
            </span>
          )}
        </button>
      </div>

      {/* Contenu classement */}
      {activeTab === 'standings' && (
        <>
          {loadingStandings ? (
            <StandingsSkeleton />
          ) : errorStandings ? (
            <div className="card p-8 text-center">
              <p className="text-sm text-red-400">{errorStandings}</p>
            </div>
          ) : (
            <StandingsTable standings={standings} leagueId={leagueId} />
          )}
        </>
      )}

      {/* Contenu prochains matchs */}
      {activeTab === 'fixtures' && (
        <>
          {loadingFixtures ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="card h-24 animate-pulse" />
              ))}
            </div>
          ) : fixtures.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm text-zinc-500">Aucun match a venir.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {fixtures.map((f) => (
                <MatchCard key={f.fixture.id} fixture={f} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StandingsSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-10 bg-zinc-800 border-b border-zinc-800/50" />
      {[...Array(12)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800/30">
          <div className="w-5 h-3 bg-zinc-800 rounded" />
          <div className="w-5 h-5 bg-zinc-800 rounded-full" />
          <div className="h-3 bg-zinc-800 rounded w-32" />
          <div className="ml-auto flex gap-3">
            {[...Array(7)].map((_, j) => (
              <div key={j} className="w-6 h-3 bg-zinc-800 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
