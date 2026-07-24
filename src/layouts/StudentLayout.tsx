import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getGuardian } from '../mocks/store'

const navItems = [
  { to: '/app', label: 'Home', end: true },
  { to: '/kids', label: 'Family', end: false },
  { to: '/teachers', label: 'Teachers' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/ask', label: 'Ask' },
  { to: '/library', label: 'Read' },
] as const

export function StudentLayout() {
  const guardian = getGuardian()
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/app'
  const initials = guardian.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return (
    <div className={`app-mesh text-ink ${isHome ? 'h-dvh overflow-hidden' : 'min-h-screen'}`}>
      <header className="sticky top-0 z-20 border-b border-line/80 bg-canvas/75 backdrop-blur-xl">
        <div
          className={`mx-auto flex h-16 items-center justify-between gap-3 px-4 ${
            isHome ? 'max-w-[90rem]' : 'max-w-6xl'
          }`}
        >
          <NavLink
            to="/app"
            className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight text-ink"
          >
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-700 text-xs font-extrabold text-white shadow-md shadow-brand-700/25">
              Ilm
            </span>
            <span className="hidden sm:inline">Ilm</span>
          </NavLink>

          <nav className="flex max-w-[55%] items-center gap-0.5 overflow-x-auto rounded-2xl bg-surface/90 p-1 ring-1 ring-line sm:max-w-none">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) =>
                  [
                    'shrink-0 rounded-xl px-2.5 py-1.5 text-sm font-semibold transition sm:px-3',
                    isActive
                      ? 'bg-canvas text-brand-800 shadow-sm ring-1 ring-line'
                      : 'text-muted hover:text-ink',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right leading-tight lg:block">
              <p className="text-sm font-semibold text-ink">{guardian.name}</p>
              <p className="text-[11px] text-muted">Guardian</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-100 text-xs font-bold text-brand-800 ring-1 ring-brand-200/80">
              {initials}
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="hidden rounded-xl px-2.5 py-1.5 text-sm font-semibold text-muted transition hover:bg-surface hover:text-ink sm:inline"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main
        className={`mx-auto px-4 ${
          isHome
            ? 'flex h-[calc(100dvh-4rem)] w-full max-w-[90rem] flex-col py-2.5'
            : 'max-w-6xl py-6 sm:py-8'
        }`}
      >
        <Outlet />
      </main>
    </div>
  )
}
