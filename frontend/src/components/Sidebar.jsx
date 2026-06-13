import { Link, useLocation } from 'react-router-dom';

// Codes football-data.org (plan gratuit). id = code utilise dans les routes /league/:id
export const LEAGUES = [
  { id: 'PL',  name: 'Premier League', country: 'Angleterre', logo: 'https://crests.football-data.org/PL.png' },
  { id: 'PD',  name: 'La Liga',        country: 'Espagne',    logo: 'https://crests.football-data.org/laliga.png' },
  { id: 'SA',  name: 'Serie A',        country: 'Italie',     logo: 'https://crests.football-data.org/c111.png' },
  { id: 'BL1', name: 'Bundesliga',     country: 'Allemagne',  logo: 'https://crests.football-data.org/BL1.png' },
  { id: 'FL1', name: 'Ligue 1',        country: 'France',     logo: 'https://crests.football-data.org/FL1.png' },
  { id: 'DED', name: 'Eredivisie',     country: 'Pays-Bas',   logo: 'https://crests.football-data.org/ED.png' },
  { id: 'PPL', name: 'Primeira Liga',  country: 'Portugal',   logo: 'https://crests.football-data.org/PPL.png' },
  { id: 'ELC', name: 'Championship',   country: 'Angleterre', logo: 'https://crests.football-data.org/ELC.png' },
  { id: 'BSA', name: 'Brésil Série A', country: 'Brésil',     logo: 'https://crests.football-data.org/bsa.png' },
];

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { pathname } = useLocation();

  return (
    <>
      {/* Overlay sombre (mobile/tablette quand le menu est ouvert) */}
      {open && <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={onClose} />}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col z-40 transform transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
      <nav className="p-3 border-b border-zinc-800 space-y-0.5">
        <Link
          to="/"
          onClick={onClose}
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
        <Link
          to="/world-cup"
          onClick={onClose}
          className={pathname === '/world-cup'
            ? 'sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-yellow-500/10 text-yellow-400 font-medium'
            : 'sidebar-link-inactive'
          }
        >
          <span className="flex items-center justify-center w-5 text-base">&#x1F3C6;</span>
          <span>Coupe du Monde 2026</span>
          <span className="ml-auto text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full font-semibold">
            LIVE
          </span>
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
                onClick={onClose}
                className={active ? 'sidebar-link-active' : 'sidebar-link-inactive'}
              >
                <img
                  src={league.logo}
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
          TontonPhil · football-data.org
        </p>
      </div>
      </aside>
    </>
  );
}
