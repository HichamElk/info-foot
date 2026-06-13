import { useState, useEffect } from 'react';

const FORM_STYLE = {
  W: 'bg-emerald-500 text-white',
  D: 'bg-yellow-500 text-black',
  L: 'bg-red-500 text-white',
};

function getZoneBorder(description) {
  if (!description) return '';
  const d = description.toLowerCase();
  if (d.includes('champions league')) return 'border-l-2 border-l-blue-500';
  if (d.includes('europa league') || d.includes('conference')) return 'border-l-2 border-l-orange-400';
  if (d.includes('relegat')) return 'border-l-2 border-l-red-500';
  return '';
}

export default function StandingsTable({ standings }) {
  const [selectedTeam, setSelectedTeam] = useState(null);

  if (!standings || standings.length === 0) return null;

  const teams = standings[0];

  return (
    <>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-xs text-zinc-500 font-medium py-3 pl-4 pr-2 w-8">#</th>
              <th className="text-left text-xs text-zinc-500 font-medium py-3 px-2">Equipe</th>
              <th className="text-center text-xs text-zinc-500 font-medium py-3 px-2">MJ</th>
              <th className="text-center text-xs text-zinc-500 font-medium py-3 px-2">V</th>
              <th className="text-center text-xs text-zinc-500 font-medium py-3 px-2">N</th>
              <th className="text-center text-xs text-zinc-500 font-medium py-3 px-2">D</th>
              <th className="text-center text-xs text-zinc-500 font-medium py-3 px-2">BP</th>
              <th className="text-center text-xs text-zinc-500 font-medium py-3 px-2">BC</th>
              <th className="text-center text-xs text-zinc-500 font-medium py-3 px-2">DB</th>
              <th className="text-left text-xs text-zinc-500 font-medium py-3 px-2 hidden md:table-cell">Forme</th>
              <th className="text-center text-xs text-zinc-500 font-medium py-3 pl-2 pr-4">Pts</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((entry, idx) => {
              const form = entry.form ? entry.form.slice(-5).split('') : [];
              const zoneBorder = getZoneBorder(entry.description);
              const rowBg = idx % 2 === 1 ? 'bg-zinc-950/30' : '';

              return (
                <tr
                  key={entry.team.id}
                  onClick={() => setSelectedTeam(entry)}
                  className={`${rowBg} ${zoneBorder} hover:bg-zinc-800/50 cursor-pointer transition-colors`}
                >
                  <td className="py-3 pl-4 pr-2 text-zinc-500 font-medium">{entry.rank}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={entry.team.logo}
                        alt={entry.team.name}
                        className="w-5 h-5 object-contain shrink-0"
                      />
                      <span className="font-medium text-zinc-200 whitespace-nowrap">{entry.team.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center text-zinc-400">{entry.all.played}</td>
                  <td className="py-3 px-2 text-center text-zinc-400">{entry.all.win}</td>
                  <td className="py-3 px-2 text-center text-zinc-400">{entry.all.draw}</td>
                  <td className="py-3 px-2 text-center text-zinc-400">{entry.all.lose}</td>
                  <td className="py-3 px-2 text-center text-zinc-400">{entry.all.goals.for}</td>
                  <td className="py-3 px-2 text-center text-zinc-400">{entry.all.goals.against}</td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={
                        entry.goalsDiff > 0
                          ? 'text-emerald-400'
                          : entry.goalsDiff < 0
                          ? 'text-red-400'
                          : 'text-zinc-400'
                      }
                    >
                      {entry.goalsDiff > 0 ? `+${entry.goalsDiff}` : entry.goalsDiff}
                    </span>
                  </td>
                  <td className="py-3 px-2 hidden md:table-cell">
                    <div className="flex gap-0.5">
                      {form.map((r, i) => (
                        <span
                          key={i}
                          className={`w-5 h-5 flex items-center justify-center text-xs font-bold rounded ${
                            FORM_STYLE[r] || 'bg-zinc-700 text-zinc-400'
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 pl-2 pr-4 text-center">
                    <span className="font-bold text-zinc-100">{entry.points}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legende zones */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-3 border-l-2 border-l-blue-500 rounded-sm" />
          <span>Ligue des Champions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-3 border-l-2 border-l-orange-400 rounded-sm" />
          <span>Europa / Conference League</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-3 border-l-2 border-l-red-500 rounded-sm" />
          <span>Relegation</span>
        </div>
      </div>

      {selectedTeam && (
        <TeamStatsModal
          entry={selectedTeam}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </>
  );
}

// ---- Modal stats equipe ----

function TeamStatsModal({ entry, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const form = entry.form ? entry.form.split('') : [];
  const goalsFor = entry.all?.goals?.for;
  const goalsAgainst = entry.all?.goals?.against;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <img
              src={entry.team.logo}
              alt={entry.team.name}
              className="w-11 h-11 object-contain"
            />
            <div>
              <h3 className="font-semibold text-zinc-100">{entry.team.name}</h3>
              {entry.description && (
                <p className="text-xs text-zinc-500 mt-0.5">{entry.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            x
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Saison classement */}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Classement</p>
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Points" value={entry.points} accent />
              <StatBox label="Rang" value={`#${entry.rank}`} />
              <StatBox
                label="Diff. buts"
                value={entry.goalsDiff > 0 ? `+${entry.goalsDiff}` : entry.goalsDiff}
                color={entry.goalsDiff > 0 ? 'text-emerald-400' : entry.goalsDiff < 0 ? 'text-red-400' : ''}
              />
            </div>
          </div>

          {/* W/D/L */}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Bilan ({entry.all.played} matchs)</p>
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Victoires" value={entry.all.win} color="text-emerald-400" />
              <StatBox label="Nuls" value={entry.all.draw} color="text-yellow-400" />
              <StatBox label="Defaites" value={entry.all.lose} color="text-red-400" />
            </div>
          </div>

          {/* Forme */}
          {form.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Forme recente</p>
              <div className="flex gap-1.5 flex-wrap">
                {form.map((r, i) => (
                  <span
                    key={i}
                    className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-md ${
                      FORM_STYLE[r] || 'bg-zinc-700 text-zinc-400'
                    }`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Buts (donnees du classement football-data) */}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Buts</p>
            <div className="grid grid-cols-2 gap-2">
              <StatBox label="Marques" value={goalsFor} />
              <StatBox label="Encaisses" value={goalsAgainst} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, accent, color }) {
  return (
    <div className="bg-zinc-800/60 rounded-lg p-3 text-center">
      <p className={`text-xl font-bold ${accent ? 'text-emerald-400' : color || 'text-zinc-100'}`}>
        {value ?? '-'}
      </p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}
