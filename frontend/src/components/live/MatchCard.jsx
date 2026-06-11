import { useState } from 'react';
import MatchModal from '../match/MatchModal';

function getMatchTime(fixture) {
  const { short, elapsed, extra } = fixture.fixture.status;
  if (['1H', '2H', 'ET'].includes(short)) {
    return { label: `${elapsed}${extra ? `+${extra}` : ''}'`, type: 'live' };
  }
  if (short === 'HT') return { label: 'MT', type: 'live' };
  if (short === 'FT') return { label: 'Termine', type: 'finished' };
  if (short === 'AET') return { label: 'Ap. prol.', type: 'finished' };
  if (short === 'PEN') return { label: 'Tirs au but', type: 'finished' };
  if (short === 'PST') return { label: 'Reporte', type: 'other' };
  if (short === 'CANC') return { label: 'Annule', type: 'other' };
  if (short === 'NS') {
    const date = new Date(fixture.fixture.date);
    return {
      label: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type: 'upcoming',
    };
  }
  return { label: fixture.fixture.status.long, type: 'other' };
}

export default function MatchCard({ fixture }) {
  const [showModal, setShowModal] = useState(false);
  const { home, away } = fixture.teams;
  const goals = fixture.goals;
  const time = getMatchTime(fixture);
  const hasScore = goals.home !== null;
  const homeWins = hasScore && goals.home > goals.away;
  const awayWins = hasScore && goals.away > goals.home;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="card-hover w-full p-4 text-left group"
      >
        {/* Ligue + heure/statut */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <img
              src={fixture.league.logo}
              alt=""
              className="w-3.5 h-3.5 object-contain shrink-0"
            />
            <span className="text-xs text-zinc-500 truncate">
              {fixture.league.name}
            </span>
          </div>
          {time.type === 'live' ? (
            <span className="badge-live shrink-0 ml-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
              {time.label}
            </span>
          ) : time.type === 'finished' ? (
            <span className="badge-finished shrink-0 ml-2">{time.label}</span>
          ) : time.type === 'upcoming' ? (
            <span className="badge-upcoming shrink-0 ml-2">{time.label}</span>
          ) : (
            <span className="text-xs text-zinc-500 shrink-0 ml-2">{time.label}</span>
          )}
        </div>

        {/* Equipes + scores */}
        <div className="space-y-2.5">
          <TeamRow
            team={home}
            score={goals.home}
            isWinner={homeWins}
            isLoser={awayWins}
          />
          <TeamRow
            team={away}
            score={goals.away}
            isWinner={awayWins}
            isLoser={homeWins}
          />
        </div>
      </button>

      {showModal && (
        <MatchModal
          fixtureId={fixture.fixture.id}
          fixture={fixture}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function TeamRow({ team, score, isWinner, isLoser }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <img
          src={team.logo}
          alt={team.name}
          className="w-5 h-5 object-contain shrink-0"
        />
        <span
          className={`text-sm truncate ${
            isLoser ? 'text-zinc-500 font-normal' : 'text-zinc-200 font-medium'
          }`}
        >
          {team.name}
        </span>
      </div>
      <span
        className={`text-sm tabular-nums shrink-0 font-bold ${
          isWinner
            ? 'text-zinc-100'
            : isLoser
            ? 'text-zinc-500'
            : 'text-zinc-400'
        }`}
      >
        {score !== null ? score : '-'}
      </span>
    </div>
  );
}
