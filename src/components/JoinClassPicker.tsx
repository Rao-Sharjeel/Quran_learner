import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getLearner,
  getTeacher,
  upcomingJoinSessions,
  useSessions,
} from '../mocks/store'
import { SUBJECT_LABELS } from '../types'
import { formatSessionTime, sessionDayLabel } from '../lib/format'
import { formatSessionCountdown } from '../lib/sessionJoin'
import { ButtonLink } from './Button'

export function JoinClassPicker() {
  useSessions()
  const [now, setNow] = useState(() => new Date())
  const upcoming = upcomingJoinSessions(now)

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1_000)
    return () => window.clearInterval(id)
  }, [])

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-5 py-8 text-center">
        <p className="font-semibold text-ink">No upcoming classes</p>
        <p className="mt-1 text-sm text-muted">
          When you have a paid or free intro session scheduled, it will show here with
          time left until it starts.
        </p>
        <ButtonLink to="/sessions" variant="secondary" className="mt-4">
          View sessions
        </ButtonLink>
      </div>
    )
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {upcoming.map((session) => {
        const teacher = getTeacher(session.teacherId)
        if (!teacher) return null
        const learners = session.learnerIds
          .map((id) => getLearner(id))
          .filter(Boolean)
          .map((l) => (l!.kind === 'self' ? 'You' : l!.name.split(' ')[0]))
          .join(', ')
        const countdown = formatSessionCountdown(session, now)
        const href = countdown.canJoin
          ? `/sessions/${session.id}/room`
          : `/sessions/${session.id}`

        return (
          <li key={session.id}>
            <Link
              to={href}
              className={[
                'flex h-full flex-col justify-between gap-3 rounded-2xl border bg-surface px-4 py-3.5 transition',
                countdown.canJoin
                  ? 'border-brand-300 hover:bg-brand-50/50'
                  : 'border-line hover:bg-canvas/80',
              ].join(' ')}
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold leading-snug text-ink">{session.title}</p>
                  <span
                    className={[
                      'shrink-0 text-sm font-semibold',
                      countdown.canJoin ? 'text-brand-700' : 'text-muted',
                    ].join(' ')}
                  >
                    {countdown.canJoin ? 'Join →' : 'Details →'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {teacher.name} · {learners} · {SUBJECT_LABELS[session.subject]}
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {sessionDayLabel(session.startsAt, now)} ·{' '}
                  {formatSessionTime(session.startsAt)}
                </p>
              </div>

              <p
                className={[
                  'text-sm font-bold tabular-nums',
                  countdown.tone === 'live' || countdown.tone === 'open'
                    ? 'text-brand-700'
                    : 'text-ink',
                ].join(' ')}
              >
                {countdown.label}
              </p>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
