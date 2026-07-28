import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MobileBottomNav } from '../components/MobileBottomNav'
import { AddFamilyModal, shouldShowFamilyModal } from '../components/AddFamilyModal'
import {
  getGuardian,
  markNotificationRead,
  useKids,
  useNotifications,
} from '../mocks/store'

const navItems = [
  { to: '/app', label: 'Home', end: true },
  { to: '/kids', label: 'Family', end: false },
  { to: '/learn', label: 'Learn' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/billing', label: 'Billing' },
  { to: '/homework', label: 'Homework' },
  { to: '/ask', label: 'Ask' },
  { to: '/library', label: 'Read' },
] as const

export function StudentLayout() {
  const guardian = getGuardian()
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/app'
  const kids = useKids()
  const notifications = useNotifications()
  const unread = notifications.filter((n) => !n.read)
  const banner = unread[0]
  const [showFamily, setShowFamily] = useState(false)
  const isHireSuccess = banner?.kind === 'hire_success'

  useEffect(() => {
    if (kids.length === 0 && shouldShowFamilyModal()) {
      setShowFamily(true)
    }
  }, [kids.length])

  useEffect(() => {
    if (!banner || banner.kind !== 'hire_success') return
    const timer = window.setTimeout(() => {
      markNotificationRead(banner.id)
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [banner?.id, banner?.kind])

  const initials = guardian.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return (
    <div
      className={`app-mesh text-ink ${
        isHome ? 'min-h-dvh lg:h-dvh lg:overflow-hidden' : 'min-h-screen'
      }`}
    >
      <header className="sticky top-0 z-20 hidden border-b border-line/80 bg-canvas/75 backdrop-blur-xl lg:block">
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

          <nav className="hidden max-w-[55%] items-center gap-0.5 overflow-x-auto rounded-2xl bg-surface/90 p-1 ring-1 ring-line sm:max-w-none lg:flex">
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
              className="hidden rounded-xl px-2.5 py-1.5 text-sm font-semibold text-muted transition hover:bg-surface hover:text-ink lg:inline"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {banner ? (
        <div
          className={[
            'border-b px-4 py-2.5 transition-colors duration-300',
            isHireSuccess
              ? 'border-brand-800 bg-brand-700 text-white'
              : 'border-brand-200 bg-brand-50',
          ].join(' ')}
        >
          <div
            className={`mx-auto flex flex-wrap items-center justify-between gap-2 ${
              isHome ? 'max-w-[90rem]' : 'max-w-6xl'
            }`}
          >
            <div
              className={[
                'min-w-0 text-sm',
                isHireSuccess ? 'text-white' : 'text-brand-900',
              ].join(' ')}
            >
              <span className="font-bold">{banner.title}</span>
              <span className={isHireSuccess ? 'text-brand-100' : 'text-brand-800'}>
                {' '}
                — {banner.body}
              </span>
            </div>
            {!isHireSuccess ? (
              <div className="flex gap-2">
                {banner.href ? (
                  <Link
                    to={banner.href}
                    onClick={() => markNotificationRead(banner.id)}
                    className="text-sm font-semibold text-brand-700"
                  >
                    Open
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="text-sm font-semibold text-muted"
                  onClick={() => markNotificationRead(banner.id)}
                >
                  Dismiss
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <main
        className={`mx-auto px-4 ${
          isHome
            ? [
                'w-full max-w-[90rem] py-3',
                'pb-[calc(4.5rem+env(safe-area-inset-bottom))]',
                'lg:flex lg:h-[calc(100dvh-4rem)] lg:flex-col lg:py-2.5 lg:pb-2.5',
              ].join(' ')
            : [
                'max-w-6xl py-6 sm:py-8',
                'pb-[calc(5.5rem+env(safe-area-inset-bottom))]',
                'lg:pb-8',
              ].join(' ')
        }`}
      >
        <Outlet />
      </main>

      <MobileBottomNav />
      {showFamily ? <AddFamilyModal onClose={() => setShowFamily(false)} /> : null}
    </div>
  )
}
