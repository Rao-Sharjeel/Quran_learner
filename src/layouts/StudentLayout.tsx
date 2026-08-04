import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MobileBottomNav } from '../components/MobileBottomNav'
import { CurrencySelector } from '../components/CurrencySelector'
import { AddFamilyModal, shouldShowFamilyModal } from '../components/AddFamilyModal'
import {
  markNotificationRead,
  useGuardian,
  useKids,
  useNotifications,
} from '../mocks/store'

const navItems = [
  { to: '/app', label: 'Home', end: true },
  { to: '/kids', label: 'Family', end: false },
  { to: '/learn', label: 'Learn' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/homework', label: 'Homework' },
  { to: '/ask', label: 'Ask' },
  { to: '/library', label: 'Read' },
] as const

export function StudentLayout() {
  const guardian = useGuardian()
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/app'
  const kids = useKids()
  const notifications = useNotifications()
  const unread = notifications.filter((n) => !n.read)
  const banner = unread[0]
  const [showFamily, setShowFamily] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    setProfileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!profileOpen) return
    function onDoc(e: MouseEvent) {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [profileOpen])

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
      <header className="sticky top-0 z-40 hidden border-b border-line/80 bg-canvas/75 backdrop-blur-xl lg:block">
        <div
          className={`mx-auto flex h-16 items-center justify-between gap-3 px-4 ${
            isHome ? 'max-w-[90rem]' : 'max-w-6xl'
          }`}
        >
          <NavLink
            to="/app"
            className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight text-ink"
          >
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Ilm"
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-brass/40"
            />
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

          <div className="flex shrink-0 items-center gap-2">
            <CurrencySelector size="sm" />
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2.5 rounded-2xl py-1 pl-1 pr-1.5 transition hover:bg-surface/80 sm:pr-2"
              >
                <div className="hidden text-right leading-tight sm:block">
                  <p className="text-sm font-semibold text-ink">{guardian.name}</p>
                  <p className="text-[11px] text-muted">Guardian</p>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-100 text-xs font-bold text-brand-800 ring-1 ring-brand-200/80">
                  {initials}
                </div>
              </button>

              {profileOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-1.5 min-w-[12.5rem] rounded-xl bg-surface py-1 shadow-lg ring-1 ring-line"
                >
                  <Link
                    role="menuitem"
                    to="/billing"
                    className="block px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas"
                    onClick={() => setProfileOpen(false)}
                  >
                    Billing
                  </Link>
                  <Link
                    role="menuitem"
                    to="/profile/edit"
                    className="block px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas"
                    onClick={() => setProfileOpen(false)}
                  >
                    Edit profile
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-muted transition hover:bg-canvas hover:text-ink"
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/login')
                    }}
                  >
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {banner ? (
        <div
          className={[
            'border-b px-3 py-2 transition-colors duration-300 sm:px-4 sm:py-2.5',
            isHireSuccess
              ? 'border-brand-800 bg-brand-700 text-white'
              : 'border-brand-200 bg-brand-50',
          ].join(' ')}
        >
          <div
            className={`mx-auto flex items-start gap-3 sm:items-center sm:justify-between ${
              isHome ? 'max-w-[90rem]' : 'max-w-6xl'
            }`}
          >
            <div
              className={[
                'min-w-0 flex-1',
                isHireSuccess ? 'text-white' : 'text-brand-900',
              ].join(' ')}
            >
              <p className="text-xs font-bold leading-snug sm:text-sm">{banner.title}</p>
              <p
                className={[
                  'mt-0.5 text-[11px] leading-snug line-clamp-2 sm:mt-0 sm:inline sm:text-sm sm:leading-normal',
                  isHireSuccess ? 'text-brand-100' : 'text-brand-800',
                ].join(' ')}
              >
                <span className="hidden sm:inline"> — </span>
                {banner.body}
              </p>
            </div>
            {!isHireSuccess ? (
              <div className="flex shrink-0 items-center gap-2.5 pt-0.5 sm:gap-2 sm:pt-0">
                {banner.href ? (
                  <Link
                    to={banner.href}
                    onClick={() => markNotificationRead(banner.id)}
                    className="text-xs font-bold text-brand-700 sm:text-sm sm:font-semibold"
                  >
                    Open
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="text-xs font-bold text-muted sm:text-sm sm:font-semibold"
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
