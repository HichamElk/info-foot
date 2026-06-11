import { useState, useEffect } from 'react';
import { api } from '../../api/football';

const STAT_LABELS = {
  'Shots on Goal':    'Tirs cadres',
  'Shots off Goal':   'Tirs non cadres',
  'Total Shots':      'Total tirs',
  'Blocked Shots':    'Tirs bloques',
  'Shots insidebox':  'Tirs dans la surface',
  'Shots outsidebox': 'Tirs hors surface',
  'Fouls':            'Fautes',
  'Corner Kicks':     'Corners',
  'Offsides':         'Hors-jeux',
  'Ball Possession':  'Possession',
  'Yellow Cards':     'Cartons jaunes',
  'Red Cards':        'Cartons rouges',
  'Goalkeeper Saves': 'Arrets du gardien',
  'Total passes':     'Passes totales',
  'Passes accurate':  'Passes precises',
  'Passes %':         'Precision passes',
  'expected_goals':   'xG',
};

function getStatusDisplay(fixture) {
  const s = fixture.fixture.status.short;
  const elapsed = fixture.fixture.status.elapsed;
  if (['1H', '2H', 'ET'].includes(s)) return { text: `${elapsed}'`, live: true };
  if (s === 'HT') return { text: 'Mi-temps', live: true };
  if (s === 'FT') return { text: 'Termine', live: false };
  if (s === 'NS') {
    const d = new Date(fixture.fixture.date);
    return { text: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), live: false };
  }
  return { text: fixture.fixture.status.long, live: false };
}

export default function MatchModal({ fixtureId, fixture, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');

  useEffect(() => {
    api.getMatch(fixtureId)
      .then(setDetails)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fixtureId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const { home, away } = fixture.teams;
  const goals = fixture.goals;
  const status = getStatusDisplay(fixture);

  const tabs = [
    { key: 'events',     label: 'Evenements' },
    { key: 'statistics', label: 'Statistiques' },
    { key: 'lineups',    label: 'Compositions' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tete score */}
        <div className="relative p-6 bg-gradient-to-b from-zinc-800 to-zinc-900 border-b border-zinc-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            x
          </button>

          {/* Ligue */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <img src={fixture.league.logo} alt="" className="w-4 h-4 object-contain" />
            <span className="text-xs text-zinc-400">{fixture.league.name}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs text-zinc-500">{fixture.league.round}</span>
          </div>

          {/* Score */}
          <div className="flex items-center justify-between gap-4">
            <TeamHeader team={home} align="left" />
            <div className="text-center shrink-0 px-4">
              {goals.home !== null ? (
                <div className="text-5xl font-bold text-zinc-100 tabular-nums tracking-tight">
                  {goals.home} - {goals.away}
                </div>
              ) : (
                <div className="text-2xl font-medium text-zinc-400">vs</div>
              )}
              <div className="mt-2">
                {status.live ? (
                  <span className="badge-live">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                    {status.text}
                  </span>
                ) : (
                  <span className="badge-finished">{status.text}</span>
                )}
              </div>
            </div>
            <TeamHeader team={away} align="right" />
          </div>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-zinc-800 bg-zinc-900">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === key
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !details ? (
            <p className="text-center text-zinc-500 py-12">Donnees non disponibles.</p>
          ) : (
            <div className="p-4">
              {activeTab === 'events' && (
                <EventsTab events={details.events} homeId={home.id} />
              )}
              {activeTab === 'statistics' && (
                <StatisticsTab statistics={details.statistics} teams={{ home, away }} />
              )}
              {activeTab === 'lineups' && (
                <LineupsTab lineups={details.lineups} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamHeader({ team, align }) {
  return (
    <div className={`flex flex-col items-center gap-2 flex-1 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <img src={team.logo} alt={team.name} className="w-14 h-14 object-contain" />
      <span className="text-sm font-semibold text-zinc-100 text-center">{team.name}</span>
    </div>
  );
}

// --- Onglet evenements ---

const EVENT_ICON = {
  'Normal Goal': '⚽',
  'Own Goal':    '⚽',
  'Penalty':     '⚽',
  'Missed Penalty': '❌',
  'Yellow Card': '🟨',
  'Red Card':    '🟥',
  'Yellow Red Card': '🟥',
};

function EventsTab({ events, homeId }) {
  if (!events || events.length === 0) {
    return (
      <p className="text-center text-zinc-500 py-10">
        Aucun evenement disponible.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((ev, i) => {
        const isHome = ev.team.id === homeId;
        const icon = EVENT_ICON[ev.detail] || (ev.type === 'subst' ? '🔄' : '📋');
        const isGoal = ev.type === 'Goal';
        const minute = `${ev.time.elapsed}${ev.time.extra ? `+${ev.time.extra}` : ''}'`;

        return (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 ${
              isHome ? '' : 'flex-row-reverse'
            }`}
          >
            {/* Minute */}
            <span className="text-xs text-zinc-500 w-10 tabular-nums text-center shrink-0">
              {minute}
            </span>

            {/* Icone */}
            <span className="text-base shrink-0">{icon}</span>

            {/* Info */}
            <div className={`flex-1 ${isHome ? 'text-left' : 'text-right'}`}>
              <span className={`text-sm ${isGoal ? 'font-semibold text-zinc-100' : 'text-zinc-300'}`}>
                {ev.player.name}
              </span>
              {ev.type === 'subst' && ev.assist?.name && (
                <span className="text-xs text-zinc-500 block">
                  {isHome ? '▲' : '▼'} {ev.assist.name}
                </span>
              )}
              {ev.type === 'Goal' && ev.assist?.name && (
                <span className="text-xs text-zinc-500 block">
                  Passe : {ev.assist.name}
                </span>
              )}
              {ev.detail === 'Own Goal' && (
                <span className="text-xs text-red-400 block">But contre son camp</span>
              )}
              {ev.detail === 'Penalty' && (
                <span className="text-xs text-yellow-400 block">Penalty</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Onglet statistiques ---

function StatisticsTab({ statistics, teams }) {
  if (!statistics || statistics.length < 2) {
    return (
      <p className="text-center text-zinc-500 py-10">
        Statistiques non disponibles.
      </p>
    );
  }

  const [homeStats, awayStats] = statistics;

  return (
    <div>
      {/* En-tetes equipes */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-2">
          <img src={teams.home.logo} alt="" className="w-6 h-6 object-contain" />
          <span className="text-sm font-medium text-zinc-200">{teams.home.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-200">{teams.away.name}</span>
          <img src={teams.away.logo} alt="" className="w-6 h-6 object-contain" />
        </div>
      </div>

      <div className="space-y-4">
        {homeStats.statistics.map((s, i) => {
          const label = STAT_LABELS[s.type] || s.type;
          const away = awayStats.statistics[i]?.value;
          return <StatBar key={i} label={label} home={s.value} away={away} />;
        })}
      </div>
    </div>
  );
}

function StatBar({ label, home, away }) {
  const parseVal = (v) => {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'string' && v.endsWith('%')) return parseFloat(v);
    return Number(v) || 0;
  };

  const h = parseVal(home);
  const a = parseVal(away);
  const total = h + a;
  const hPct = total === 0 ? 50 : Math.round((h / total) * 100);

  return (
    <div className="px-2">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-semibold text-zinc-100 tabular-nums">{home ?? 0}</span>
        <span className="text-xs text-zinc-500">{label}</span>
        <span className="font-semibold text-zinc-100 tabular-nums">{away ?? 0}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-800">
        <div
          className="bg-blue-400 transition-all duration-500"
          style={{ width: `${hPct}%` }}
        />
        <div
          className="bg-orange-400 transition-all duration-500"
          style={{ width: `${100 - hPct}%` }}
        />
      </div>
    </div>
  );
}

// --- Onglet compositions ---

function LineupsTab({ lineups }) {
  if (!lineups || lineups.length === 0) {
    return (
      <p className="text-center text-zinc-500 py-10">
        Compositions non disponibles.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {lineups.map((lineup, i) => (
        <div key={i} className="min-w-0">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-800">
            <img src={lineup.team.logo} alt="" className="w-7 h-7 object-contain shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{lineup.team.name}</p>
              <p className="text-xs text-zinc-500">{lineup.formation}</p>
            </div>
          </div>

          <div className="space-y-1">
            {lineup.startXI?.map((p, j) => (
              <div key={j} className="flex items-center gap-2 text-sm py-0.5">
                <span className="text-xs text-zinc-600 w-4 text-right tabular-nums shrink-0">
                  {p.player.number}
                </span>
                <span className="text-zinc-200 truncate flex-1">{p.player.name}</span>
                <span className="text-xs text-zinc-600 shrink-0">{p.player.pos}</span>
              </div>
            ))}
          </div>

          {lineup.substitutes?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-800/60">
              <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Remplacants</p>
              {lineup.substitutes.map((p, j) => (
                <div key={j} className="flex items-center gap-2 text-sm py-0.5">
                  <span className="text-xs text-zinc-700 w-4 text-right tabular-nums shrink-0">
                    {p.player.number}
                  </span>
                  <span className="text-zinc-500 truncate">{p.player.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
