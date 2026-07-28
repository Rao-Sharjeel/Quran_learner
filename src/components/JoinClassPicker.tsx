import { Link } from 'react-router-dom'
import { getLearner, getTeacher, joinableSessions, useSessions } from '../mocks/store'
import { SUBJECT_LABELS } from '../types'
import { formatSessionWhen } from '../lib/format'
import { ButtonLink } from './Button'

export function JoinClassPicker() {
  useSessions()
  const joinable = joinableSessions()

  if (joinable.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-5 py-8 text-center">
        <p className="font-semibold text-ink">No classes ready to join</p>
        <p className="mt-1 text-sm text-muted">
          Join opens for scheduled sessions that are paid or free intro.
        </p>
        <ButtonLink to="/sessions" variant="secondary" className="mt-4">
          View sessions
        </ButtonLink>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {joinable.map((session) => {
        const teacher = getTeacher(session.teacherId)
        if (!teacher) return null
        const learners = session.learnerIds
          .map((id) => getLearner(id))
          .filter(Boolean)
          .map((l) => (l!.kind === 'self' ? 'You' : l!.name.split(' ')[0]))
          .join(', ')
        return (
          <li key={session.id}>
            <Link
              to={`/sessions/${session.id}/room`}
              className="flex flex-col gap-2 panel p-4 transition hover:bg-brand-50/50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-ink">{session.title}</p>
                <p className="text-sm text-muted">
                  {teacher.name} · {learners} · {SUBJECT_LABELS[session.subject]} ·{' '}
                  {formatSessionWhen(session.startsAt, '')}
                </p>
              </div>
              <span className="text-sm font-semibold text-brand-700">Join →</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
