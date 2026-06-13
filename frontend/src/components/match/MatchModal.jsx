import { useState, useEffect } from 'react';
import { api } from '../../api/football';

// Detail d'un match :
// - infos + score : football-data
// - stats / compositions / evenements : soccer-football-info (champ `sfi`, best effort)
// - effectifs (fallback si pas de compo SFI) : football-data /teams/{id}

const STATUS_LABELS = {
  FINISHED: 'Terminé',
  IN_PLAY: 'En direct',
  PAUSED: 'Mi-temps',
  POSTPONED: 'Reporté',
  SUSPENDED: 'Suspendu',
  CANCELLED: 'Annulé',
};

const EVENT_META = {
  goal: { icon: '⚽', label: 'But' },
  own_goal: { icon: '⚽', label: 'CSC' },
  penalty: { icon: '⚽', label: 'Penalty' },
  penalty_goal: { icon: '⚽', label: 'Penalty' },
  missed_penalty: { icon: '❌', label: 'Penalty manqué' },
  yellow_card: { icon: '🟨', label: 'Carton jaune' },
  red_card: { icon: '🟥', label: 'Carton rouge' },
  yellow_red_card: { icon: '🟥', label: 'Deux jaunes' },
  substitution: { icon: '🔄', label: 'Remplacement' },
};

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

// --- Position groups (effectif football-data, fallback) ---
const POS_ORDER = ['Gardiens', 'Défenseurs', 'Milieux', 'Attaquants', 'Autres'];
function bucket(position) {
  const p = (position || '').toLowerCase();
  if (p.includes('keeper')) return 'Gardiens';
  if (p.includes('back') || p.includes('defence') || p.includes('defender')) return 'Défenseurs';
  if (p.includes('midfield')) return 'Milieux';
  if (p.includes('forward') || p.includes('offence') || p.includes('winger') || p.includes('striker') || p.includes('attack'))
    return 'Attaquants';
  return 'Autres';
}
function groupSquad(squad) {
  const groups = {};
  for (const player of squad || []) {
    const key = bucket(player.position);
    (groups[key] = groups[key] || []).push(player);
  }
  return POS_ORDER.filter((k) => groups[k]?.length).map((k) => ({ label: k, players: groups[k] }));
}

export default function MatchModal({ matchId, fixture, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    api
      .getMatch(matchId)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [matchId]);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const match = data?.match;
  const status = match?.status;
  const played = status === 'FINISHED';
  const live = status === 'IN_PLAY' || status === 'PAUSED';
  const ft = match?.score?.fullTime;
  const htScore = match?.score?.halfTime;

  const home = match?.homeTeam || fixture?.teams?.home;
  const away = match?.awayTeam || fixture?.teams?.away;

  const sfi = data?.sfi;
  const homeS = sfi ? (sfi.homeIsA ? sfi.teamA : sfi.teamB) : null;
  const awayS = sfi ? (sfi.homeIsA ? sfi.teamB : sfi.teamA) : null;
  const venue = sfi?.stadium || match?.venue;
  const referee = sfi?.referee || match?.referees?.[0]?.name;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {match?.competition?.name && (
                <p className="text-xs text-zinc-500 mb-2">
                  {match.competition.name}
                  {match.group ? ` · ${match.group.replace(/_/g, ' ')}` : match.stage ? ` · ${match.stage.replace(/_/g, ' ')}` : ''}
                </p>
              )}
              <div className="flex items-center justify-center gap-4">
                <TeamHead team={home} />
                <div className="text-center shrink-0">
                  {played || live ? (
                    <>
                      <div className="text-2xl font-bold text-zinc-100 tabular-nums">
                        {ft?.home ?? 0} - {ft?.away ?? 0}
                      </div>
                      {htScore && htScore.home != null && (
                        <div className="text-xs text-zinc-500 mt-0.5">MT {htScore.home}-{htScore.away}</div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-zinc-400">
                      {match?.utcDate
                        ? new Date(match.utcDate).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </div>
                  )}
                  <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${live ? 'bg-red-500/15 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    {STATUS_LABELS[status] || 'À venir'}
                  </span>
                </div>
                <TeamHead team={away} align="right" />
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 rounded-lg transition-colors ml-3 shrink-0">
              x
            </button>
          </div>

          {(venue || referee) && (
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-zinc-500">
              {venue && <span>🏟 {venue}</span>}
              {referee && <span>👤 {referee}</span>}
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="p-5 space-y-7">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-400 text-center py-6">{error}</p>
          ) : (
            <>
              {sfi && <StatsSection home={homeS} away={awayS} />}
              {sfi?.events?.length > 0 && <EventsSection events={sfi.events} homeIsA={sfi.homeIsA} homeName={home?.shortName || home?.name} awayName={away?.shortName || away?.name} />}

              {homeS?.lineup?.start?.length || awayS?.lineup?.start?.length ? (
                <Section title="Compositions">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <LineupColumn name={home?.shortName || home?.name} crest={home?.crest} lineup={homeS?.lineup} manager={homeS?.manager} />
                    <LineupColumn name={away?.shortName || away?.name} crest={away?.crest} lineup={awayS?.lineup} manager={awayS?.manager} />
                  </div>
                </Section>
              ) : (
                <Section title="Effectifs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <SquadColumn team={data?.homeTeam} />
                    <SquadColumn team={data?.awayTeam} />
                  </div>
                </Section>
              )}

              {!sfi && (
                <p className="text-xs text-zinc-600 text-center">
                  Statistiques et compositions de match indisponibles pour ce match.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Statistiques ---
function StatsSection({ home, away }) {
  const hs = home?.stats;
  const as = away?.stats;
  if (!hs && !as) return null;
  const rows = [
    { label: 'Possession (%)', h: num(hs?.possession), a: num(as?.possession), bar: true },
    { label: 'Tirs', h: num(hs?.shoots?.t), a: num(as?.shoots?.t) },
    { label: 'Tirs cadrés', h: num(hs?.shoots?.on), a: num(as?.shoots?.on) },
    { label: 'Corners', h: num(hs?.corners?.t), a: num(as?.corners?.t) },
    { label: 'Fautes', h: num(hs?.fouls?.t), a: num(as?.fouls?.t) },
    { label: 'Cartons jaunes', h: num(hs?.fouls?.y_c), a: num(as?.fouls?.y_c) },
    { label: 'Cartons rouges', h: num(hs?.fouls?.r_c), a: num(as?.fouls?.r_c) },
    { label: 'xG', h: num(hs?.xG?.live), a: num(as?.xG?.live) },
  ].filter((r) => r.h !== null || r.a !== null);
  if (!rows.length) return null;

  return (
    <Section title="Statistiques">
      <div className="space-y-2.5">
        {rows.map((r) => (
          <StatRow key={r.label} {...r} />
        ))}
      </div>
    </Section>
  );
}

function StatRow({ label, h, a, bar }) {
  const hv = h ?? 0;
  const av = a ?? 0;
  const total = hv + av;
  const hPct = bar ? (h ?? 0) : total > 0 ? (hv / total) * 100 : 50;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-semibold text-zinc-200 tabular-nums w-10">{h ?? '-'}</span>
        <span className="text-xs text-zinc-500">{label}</span>
        <span className="font-semibold text-zinc-200 tabular-nums w-10 text-right">{a ?? '-'}</span>
      </div>
      <div className="flex gap-1 h-1.5">
        <div className="flex-1 bg-zinc-800 rounded-l overflow-hidden flex justify-end">
          <div className="bg-emerald-500/70 h-full" style={{ width: `${bar ? hPct : hPct}%` }} />
        </div>
        <div className="flex-1 bg-zinc-800 rounded-r overflow-hidden">
          <div className="bg-sky-500/70 h-full" style={{ width: `${bar ? (a ?? 0) : 100 - hPct}%` }} />
        </div>
      </div>
    </div>
  );
}

// --- Evenements ---
function EventsSection({ events, homeIsA, homeName, awayName }) {
  const ordered = [...events].sort((x, y) => parseInt(x.timer) - parseInt(y.timer));
  return (
    <Section title="Événements">
      <div className="space-y-1.5">
        {ordered.map((e, i) => {
          const meta = EVENT_META[e.type] || { icon: '•', label: e.type };
          const isHome = (e.team === 'A') === !!homeIsA;
          return (
            <div key={i} className={`flex items-center gap-2 text-sm ${isHome ? '' : 'flex-row-reverse text-right'}`}>
              <span className="text-xs text-zinc-500 tabular-nums w-10 shrink-0">{e.timer}'</span>
              <span className="shrink-0">{meta.icon}</span>
              <span className="text-zinc-400 text-xs">{meta.label}</span>
              <span className="text-zinc-600 text-xs truncate">· {isHome ? homeName : awayName}</span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// --- Compositions (SFI) ---
function LineupColumn({ name, crest, lineup, manager }) {
  return (
    <div>
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
        {crest && <img src={crest} alt={name} className="w-5 h-5 object-contain" />}
        <span className="font-semibold text-zinc-200 text-sm truncate">{name}</span>
        {manager?.name && <span className="text-xs text-zinc-500 ml-auto truncate">🎯 {manager.name}</span>}
      </div>
      <div className="mt-3">
        <p className="text-xs font-semibold text-zinc-500 mb-1">Titulaires</p>
        <PlayerList players={lineup?.start} />
        {lineup?.substitutions?.length > 0 && (
          <>
            <p className="text-xs font-semibold text-zinc-500 mt-3 mb-1">Remplaçants</p>
            <PlayerList players={lineup.substitutions} dim />
          </>
        )}
      </div>
    </div>
  );
}

function PlayerList({ players, dim }) {
  if (!players?.length) return <p className="text-sm text-zinc-600">Indisponible.</p>;
  return (
    <ul className="space-y-0.5">
      {players.map((p) => (
        <li key={p.id} className={`text-sm flex items-center gap-2 ${dim ? 'text-zinc-500' : 'text-zinc-300'}`}>
          <span className="text-xs text-zinc-600 tabular-nums w-5 shrink-0">{p.s_n ?? ''}</span>
          <span className="truncate">{p.name}</span>
        </li>
      ))}
    </ul>
  );
}

// --- Effectif football-data (fallback) ---
function SquadColumn({ team }) {
  if (!team?.squad?.length) {
    return (
      <div>
        <SquadHeader team={team} />
        <p className="text-sm text-zinc-600 mt-2">Effectif indisponible.</p>
      </div>
    );
  }
  const groups = groupSquad(team.squad);
  return (
    <div>
      <SquadHeader team={team} />
      <div className="space-y-3 mt-3">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="text-xs font-semibold text-zinc-500 mb-1">{g.label}</p>
            <ul className="space-y-0.5">
              {g.players.map((p) => (
                <li key={p.id} className="text-sm text-zinc-300 flex items-center justify-between gap-2">
                  <span className="truncate">{p.name}</span>
                  {p.nationality && <span className="text-xs text-zinc-600 shrink-0">{p.nationality}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function SquadHeader({ team }) {
  if (!team) return null;
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
      {team.crest && <img src={team.crest} alt={team.name} className="w-5 h-5 object-contain" />}
      <span className="font-semibold text-zinc-200 text-sm truncate">{team.shortName || team.name}</span>
      {team.coach?.name && <span className="text-xs text-zinc-500 ml-auto truncate">🎯 {team.coach.name}</span>}
    </div>
  );
}

// --- Helpers ---
function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 text-center">{title}</p>
      {children}
    </div>
  );
}

function TeamHead({ team, align }) {
  if (!team) return <div className="flex-1" />;
  return (
    <div className={`flex-1 flex items-center gap-2 min-w-0 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      {team.crest && <img src={team.crest} alt={team.name} className="w-8 h-8 object-contain shrink-0" />}
      <span className="font-semibold text-zinc-100 truncate">{team.shortName || team.name}</span>
    </div>
  );
}
