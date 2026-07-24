import { Link } from 'react-router-dom'
import { getLearner, getTeacher, joinableSessions, useSessions } from '../mocks/store'
import { SUBJECT_LABELS } from '../types'
import { formatSessionWhen } from '../lib/format'
import { ButtonLink } from './Button'

/** List of accepted classes ready to enter — each session already has its learner */
export function JoinClassPicker({
  title = 'Ready to join',
  compact = false,
}: {
  title?: string
  compact?: boolean
}) {
  useSessions() // re-render on changes
  const joinable = joinableSessions()

  if (joinable.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-canvas/70 px-5 py-8 text-center">
        <p className="font-semibold text-ink">No classes ready to join</p>
        <p className="mt-1 text-sm text-muted">Accepted sessions will appear here.</p>
        <ButtonLink to="/teachers" className="mt-4" variant="secondary">
          Book a teacher
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {title ? <p className="text-sm font-medium text-ink">{title}</p> : null}
      <ul className="space-y-2">
        {joinable.map((session) => {
          const learner = getLearner(session.learnerId)
          const teacher = getTeacher(session.teacherId)
          if (!learner || !teacher) return null
          return (
            <li key={session.id}>
              <Link
                to={`/sessions/${session.id}/room`}
                className="flex items-center gap-3 rounded-2xl bg-surface/80 px-3 py-3 ring-1 ring-line transition hover:bg-brand-50 hover:ring-brand-200"
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xs font-semibold text-white"
                  style={{ background: learner.avatarColor }}
                >
                  {learner.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">
                    {learner.kind === 'self'
                      ? `Your ${SUBJECT_LABELS[session.subject]}`
                      : `${learner.name.split(' ')[0]}’s ${SUBJECT_LABELS[session.subject]}`}
                  </span>
                  <span className="block text-xs text-muted">
                    {teacher.name} ·{' '}
                    {formatSessionWhen(session.startsAt, session.slotLabel)}
                  </span>
                </span>
                <span className="shrink-0 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white">
                  Join
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
