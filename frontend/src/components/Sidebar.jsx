import { Link, useLocation } from 'react-router-dom';

export const LEAGUES = [
  { id: 39,  name: 'Premier League',    country: 'Angleterre' },
  { id: 40,  name: 'Championship',      country: 'Angleterre' },
  { id: 61,  name: 'Ligue 1',           country: 'France' },
  { id: 62,  name: 'Ligue 2',           country: 'France' },
  { id: 140, name: 'La Liga',           country: 'Espagne' },
  { id: 135, name: 'Serie A',           country: 'Italie' },
  { id: 78,  name: 'Bundesliga',        country: 'Allemagne' },
  { id: 79,  name: 'Bundesliga 2',      country: 'Allemagne' },
  { id: 144, name: 'Jupiler Pro',       country: 'Belgique' },
  { id: 203, name: 'Super Lig',         country: 'Turquie' },
  { id: 88,  name: 'Eredivisie',        country: 'Pays-Bas' },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col z-20">
      {/* Logo */}
      <div className="p-5 border-b border-zinc-800">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-lg">
            &#x26BD;
          </div>
          <span className="font-bold text-lg text-zinc-100 tracking-tight">TontonPhil</span>
        </Link>
      </div>

      {/* Navigation principale */}
      <nav className="p-3 border-b border-zinc-800">
        <Link
          to="/"
          className={pathname === '/' ? 'sidebar-link-active' : 'sidebar-link-inactive'}
        >
          <span className="flex items-center justify-center w-5">
            {pathname === '/' ? (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            ) : (
              <span className="w-2 h-2 bg-zinc-600 rounded-full" />
            )}
          </span>
          <span>Live &amp; Aujourd'hui</span>
        </Link>
      </nav>

      {/* Liste des championnats */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-3 mb-2 mt-1">
          Championnats
        </p>
        <div className="space-y-0.5">
          {LEAGUES.map((league) => {
            const active = pathname === `/league/${league.id}`;
            return (
              <Link
                key={league.id}
                to={`/league/${league.id}`}
                className={active ? 'sidebar-link-active' : 'sidebar-link-inactive'}
              >
                <img
                  src={`https://media.api-sports.io/football/leagues/${league.id}.png`}
                  alt={league.name}
                  className="w-5 h-5 object-contain shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm">{league.name}</p>
                  <p className="text-xs text-zinc-600 truncate">{league.country}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600 text-center">
          TontonPhil · API-Football
        </p>
      </div>
    </aside>
  );
}
