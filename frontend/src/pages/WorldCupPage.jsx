import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/football';
import MatchModal from '../components/match/MatchModal';

// --- Helpers football-data.org ------------------------------------------------

const LIVE_STATUSES = ['IN_PLAY', 'PAUSED'];

const STAGE_LABELS = {
  GROUP_STAGE: 'Phase de groupes',
  LAST_16: '8es de finale',
  QUARTER_FINALS: 'Quarts de finale',
  SEMI_FINALS: 'Demi-finales',
  THIRD_PLACE: 'Match pour la 3e place',
  FINAL: 'Finale',
};

// Libelle de phase d'un match : "GROUP_A" -> "Groupe A", sinon nom de la phase finale
function phaseLabel(match) {
  if (match.group) {
    const letter = match.group.replace(/^GROUP[_\s]*/i, '');
    return `Groupe ${letter}`;
  }
  if (match.stage) {
    return STAGE_LABELS[match.stage] || match.stage.replace(/_/g, ' ');
  }
  return 'Match';
}

function statusLabel(status, utcDate) {
  switch (status) {
    case 'IN_PLAY':
      return 'EN DIRECT';
    case 'PAUSED':
      return 'MI-TEMPS';
    case 'FINISHED':
      return 'Terminé';
    case 'POSTPONED':
      return 'Reporté';
    case 'SUSPENDED':
      return 'Suspendu';
    case 'CANCELLED':
      return 'Annulé';
    default:
      // SCHEDULED / TIMED : heure de coup d'envoi (locale)
      return new Date(utcDate).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
  }
}

function Team({ team, bold }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {team.crest && (
        <img src={team.crest} alt={team.name} className="w-5 h-5 object-contain shrink-0" />
      )}
      <span className={`truncate ${bold ? 'text-zinc-100 font-semibold' : 'text-zinc-300'}`}>
        {team.shortName || team.name}
      </span>
    </div>
  );
}

function WCMatchCard({ match }) {
  const [showModal, setShowModal] = useState(false);
  const { homeTeam, awayTeam, score, status, utcDate } = match;
  const live = LIVE_STATUSES.includes(status);
  const finished = status === 'FINISHED';
  const showScore = live || finished;
  const fh = score?.fullTime?.home;
  const fa = score?.fullTime?.away;
  const winner = score?.winner; // HOME_TEAM | AWAY_TEAM | DRAW | null

  return (
    <>
      <button onClick={() => setShowModal(true)} className="card-hover w-full p-4 text-left">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-600 truncate">
          {phaseLabel(match)}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            live
              ? 'bg-red-500/15 text-red-400'
              : finished
              ? 'bg-zinc-800 text-zinc-400'
              : 'bg-zinc-800 text-zinc-500'
          }`}
        >
          {live && <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-1 align-middle" />}
          {statusLabel(status, utcDate)}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Team team={homeTeam} bold={winner === 'HOME_TEAM'} />
          <span className={`text-sm tabular-nums ${showScore ? 'text-zinc-100 font-bold' : 'text-zinc-600'}`}>
            {showScore ? (fh ?? 0) : ''}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <Team team={awayTeam} bold={winner === 'AWAY_TEAM'} />
          <span className={`text-sm tabular-nums ${showScore ? 'text-zinc-100 font-bold' : 'text-zinc-600'}`}>
            {showScore ? (fa ?? 0) : ''}
          </span>
        </div>
      </div>
      </button>

      {showModal && (
        <MatchModal
          matchId={match.id}
          fixture={{ teams: { home: homeTeam, away: awayTeam } }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// --- Page ---------------------------------------------------------------------

export default function WorldCupPage() {
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');
  const [error, setError] = useState(null);

  const fetchWC = useCallback(async () => {
    try {
      const [st, mt] = await Promise.all([api.getWCStandings(), api.getWCMatches()]);
      setStandings(st.standings || []);
      setMatches(mt.matches || []);
      setError(null);
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

  const liveMatches = matches.filter((m) => LIVE_STATUSES.includes(m.status));
  const completedCount = matches.filter((m) => m.status === 'FINISHED').length;

  // Calendrier : matchs groupes par date locale, tries chronologiquement
  const sorted = [...matches].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
  const byDate = sorted.reduce((acc, m) => {
    const date = new Date(m.utcDate).toLocaleDateString('fr-CA'); // YYYY-MM-DD local
    if (!acc[date]) acc[date] = [];
    acc[date].push(m);
    return acc;
  }, {});

  const today = new Date().toLocaleDateString('fr-CA');

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
              <span>{matches.length} matchs</span>
              <span>·</span>
              <span>{completedCount} joues</span>
              <span>·</span>
              <span>{matches.length - completedCount} a venir</span>
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
            {liveMatches.map((m) => (
              <WCMatchCard key={m.id} match={m} />
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
        <StandingsTab standings={standings} />
      )}
    </div>
  );
}

function MatchesTab({ byDate, today }) {
  const dates = Object.keys(byDate).sort();
  if (dates.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-zinc-500">Aucun match disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dates.map((date) => {
        const isToday = date === today;
        const d = new Date(date + 'T12:00:00');
        const label = d.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
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
              {byDate[date].map((m) => (
                <WCMatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StandingsTab({ standings }) {
  // On ne garde que les poules (groupes), pas les eventuels classements de phase finale
  const groups = standings.filter((s) => s.group && (s.table || []).length > 0);

  if (groups.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-zinc-500">Classements indisponibles.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {groups.map((group) => {
        const letter = group.group.replace(/^Group\s*/i, '');
        return (
          <div key={group.group} className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/40 flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded flex items-center justify-center">
                {letter}
              </div>
              <span className="text-sm font-semibold text-zinc-200">Groupe {letter}</span>
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
                {group.table.map((row) => (
                  <tr
                    key={row.team.id}
                    className={`border-b border-zinc-800/40 ${row.position <= 2 ? 'border-l-2 border-l-yellow-500/60' : ''}`}
                  >
                    <td className="py-2.5 pl-4 pr-2">
                      <div className="flex items-center gap-2">
                        {row.team.crest && (
                          <img src={row.team.crest} alt={row.team.name} className="w-5 h-5 object-contain shrink-0" />
                        )}
                        <span className="text-zinc-200 font-medium truncate">
                          {row.team.shortName || row.team.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-zinc-400">{row.playedGames}</td>
                    <td className="py-2.5 px-2 text-center text-zinc-400">{row.won}</td>
                    <td className="py-2.5 px-2 text-center text-zinc-400">{row.draw}</td>
                    <td className="py-2.5 px-2 text-center text-zinc-400">{row.lost}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={
                          row.goalDifference > 0
                            ? 'text-emerald-400'
                            : row.goalDifference < 0
                            ? 'text-red-400'
                            : 'text-zinc-400'
                        }
                      >
                        {row.goalDifference > 0 ? '+' : ''}
                        {row.goalDifference}
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 pr-4 text-center font-bold text-zinc-100">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2 flex items-center gap-1.5 text-xs text-zinc-600">
              <div className="w-2 h-2 border-l-2 border-l-yellow-500/60 rounded-sm" />
              <span>Qualifies pour les 1/8</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
