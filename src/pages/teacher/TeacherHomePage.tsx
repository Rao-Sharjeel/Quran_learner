import { Link } from 'react-router-dom'
import {
  getLearner,
  joinableSessions,
  useActiveTeacherId,
  useSessions,
} from '../../mocks/store'
import { formatSessionWhen } from '../../lib/format'
import { PaymentPill, StatusPill } from '../../components/StatusPill'
import { ButtonLink } from '../../components/Button'

export function TeacherHomePage() {
  const teacherId = useActiveTeacherId()
  const sessions = useSessions()
  const mineJoinable = joinableSessions().filter((s) => s.teacherId === teacherId)
  const upcoming = [...sessions]
    .filter((s) => s.teacherId === teacherId && s.status === 'scheduled')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 8)

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Today & upcoming</h1>
        <p className="mt-2 text-muted">Your scheduled sessions with families.</p>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-muted">No upcoming sessions. Check Requests for new hires.</p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((session) => {
            const learners = session.learnerIds
              .map((id) => getLearner(id)?.name.split(' ')[0])
              .filter(Boolean)
              .join(', ')
            return (
              <li key={session.id}>
                <Link
                  to={`/teacher/sessions/${session.id}`}
                  className="flex flex-col gap-2 panel p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-ink">{session.title}</p>
                    <p className="text-sm text-muted">
                      {learners} · {formatSessionWhen(session.startsAt, '')} ·{' '}
                      {session.durationMinutes} min
                    </p>
                    <div className="mt-2 flex gap-1.5">
                      <StatusPill status={session.status} />
                      <PaymentPill status={session.paymentStatus} />
                    </div>
                  </div>
                  {mineJoinable.some((j) => j.id === session.id) ? (
                    <ButtonLink to={`/teacher/sessions/${session.id}/room`} variant="secondary">
                      Join room
                    </ButtonLink>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
