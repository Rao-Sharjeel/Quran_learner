import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { CurrencySelector } from './CurrencySelector'

const primaryTabs = [
  { to: '/app', label: 'Home', end: true, icon: 'home' },
  { to: '/kids', label: 'Family', end: false, icon: 'family' },
  { to: '/sessions', label: 'Sessions', icon: 'sessions' },
  { to: '/ask', label: 'Ask', icon: 'ask' },
] as const

const moreLinks = [
  { to: '/learn', label: 'Learn' },
  { to: '/billing', label: 'Billing' },
  { to: '/profile/edit', label: 'Edit profile' },
  { to: '/homework', label: 'Homework' },
  { to: '/library', label: 'Read' },
] as const

type TabIcon = (typeof primaryTabs)[number]['icon'] | 'more'

function tabActive(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}

function NavIcon({ name }: { name: TabIcon }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.85,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
    className: 'shrink-0',
  }

  const icons: Record<TabIcon, ReactNode> = {
    home: (
      <svg {...common}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    ),
    family: (
      <svg {...common}>
        <circle cx="9" cy="8" r="2.5" />
        <circle cx="16" cy="9.5" r="2" />
        <path d="M4.5 19c.4-2.8 2.4-4.5 4.5-4.5s4.1 1.7 4.5 4.5" />
        <path d="M13.2 19c.3-2 1.7-3.3 3.3-3.3 1.4 0 2.6.9 3 2.5" />
      </svg>
    ),
    sessions: (
      <svg {...common}>
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
        <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
      </svg>
    ),
    ask: (
      <svg {...common}>
        <path d="M20 12.2a7.2 7.2 0 0 1-10.6 6.3L5 19.5l1.2-3.4A7.2 7.2 0 1 1 20 12.2Z" />
      </svg>
    ),
    more: (
      <svg {...common}>
        <rect x="4.25" y="4.25" width="6" height="6" rx="1.4" />
        <rect x="13.75" y="4.25" width="6" height="6" rx="1.4" />
        <rect x="4.25" y="13.75" width="6" height="6" rx="1.4" />
        <rect x="13.75" y="13.75" width="6" height="6" rx="1.4" />
      </svg>
    ),
  }

  return icons[name]
}

/**
 * Mobile-only bottom tabs. Hidden at lg+ so desktop top nav stays authoritative.
 */
export function MobileBottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)
  const panelId = useId()
  const moreRef = useRef<HTMLDivElement>(null)
  const moreActive = moreLinks.some((l) => tabActive(location.pathname, l.to))

  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!moreOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    function onPointer(e: MouseEvent | TouchEvent) {
      const el = moreRef.current
      if (el && !el.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
    }
  }, [moreOpen])

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 lg:hidden" ref={moreRef}>
      {moreOpen ? (
        <div
          id={panelId}
          role="menu"
          className="mx-3 mb-2 overflow-hidden rounded-2xl bg-canvas shadow-lg shadow-brand-800/15 outline outline-1 outline-line"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
            <span className="text-sm font-semibold text-ink">Currency</span>
            <CurrencySelector size="sm" />
          </div>
          {moreLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              role="menuitem"
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                [
                  'block border-b border-line/70 px-4 py-3 text-sm font-semibold transition last:border-b-0',
                  isActive ? 'bg-brand-50 text-brand-800' : 'text-ink hover:bg-surface',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMoreOpen(false)
              navigate('/login')
            }}
            className="block w-full px-4 py-3 text-left text-sm font-semibold text-muted transition hover:bg-surface hover:text-ink"
          >
            Log out
          </button>
        </div>
      ) : null}

      <nav
        className="border-t border-line/80 bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
        aria-label="Primary"
      >
        <ul className="mx-auto flex h-[3.75rem] max-w-lg items-stretch justify-around px-1">
          {primaryTabs.map((tab) => {
            const active = tabActive(
              location.pathname,
              tab.to,
              'end' in tab ? tab.end : false,
            )
            return (
              <li key={tab.to} className="flex min-w-0 flex-1">
                <NavLink
                  to={tab.to}
                  end={'end' in tab ? tab.end : false}
                  className={[
                    'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold leading-none tracking-tight transition',
                    active ? 'text-brand-800' : 'text-muted',
                  ].join(' ')}
                >
                  <NavIcon name={tab.icon} />
                  <span>{tab.label}</span>
                </NavLink>
              </li>
            )
          })}
          <li className="flex min-w-0 flex-1">
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls={panelId}
              onClick={() => setMoreOpen((o) => !o)}
              className={[
                'flex flex-1 flex-col items-center justify-center gap-1 border-0 bg-transparent p-0 text-[10px] font-bold leading-none tracking-tight transition',
                moreActive || moreOpen ? 'text-brand-800' : 'text-muted',
              ].join(' ')}
            >
              <NavIcon name="more" />
              <span className="text-[10px] font-bold leading-none">More</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}
