import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getLearner, getTeacher, useLearners, useSessions } from '../mocks/store'
import { SUBJECT_LABELS } from '../types'
import { ButtonLink } from '../components/Button'
import { StatusPill } from '../components/StatusPill'
import { formatSessionWhen } from '../lib/format'

export function SessionsPage() {
  const [params, setParams] = useSearchParams()
  const filterId = params.get('learner') ?? 'all'
  const learners = useLearners()
  const all = useSessions()

  const sessions = useMemo(() => {
    if (filterId === 'all') return all
    return all.filter((s) => s.learnerId === filterId)
  }, [all, filterId])

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Sessions
          </h1>
          <p className="mt-2 text-muted">
            Everyone’s requests, upcoming classes, and past lessons — filter by learner anytime.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/sessions/join" variant="secondary">
            Join a class
          </ButtonLink>
          <ButtonLink to="/teachers" variant="secondary">
            Book another
          </ButtonLink>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={filterId === 'all'}
          onClick={() => setParams({})}
          label="Everyone"
        />
        {learners.map((l) => (
          <FilterChip
            key={l.id}
            active={filterId === l.id}
            onClick={() => setParams({ learner: l.id })}
            label={l.kind === 'self' ? 'You' : l.name.split(' ')[0]}
            color={l.avatarColor}
          />
        ))}
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-canvas/70 px-5 py-10 text-center">
          <p className="font-semibold text-ink">No sessions in this view</p>
          <p className="mt-1 text-sm text-muted">Find a teacher and choose who the booking is for.</p>
          <ButtonLink to="/teachers" className="mt-4">
            Find a teacher
          </ButtonLink>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const teacher = getTeacher(session.teacherId)
            const learner = getLearner(session.learnerId)
            if (!teacher) return null
            return (
              <Link
                key={session.id}
                to={`/sessions/${session.id}`}
                className="flex flex-col gap-3 panel p-4 transition hover:bg-brand-50/50 hover:outline-brand-200 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-xl text-sm font-semibold text-white"
                    style={{ background: teacher.avatarColor }}
                  >
                    {teacher.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{teacher.name}</p>
                    <p className="text-sm text-muted">
                      {learner
                        ? learner.kind === 'self'
                          ? 'You'
                          : learner.name.split(' ')[0]
                        : 'Learner'}{' '}
                      · {SUBJECT_LABELS[session.subject]} ·{' '}
                      {formatSessionWhen(session.startsAt, session.slotLabel)}
                    </p>
                  </div>
                </div>
                <StatusPill status={session.status} />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string
  active: boolean
  onClick: () => void
  color?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
        active
          ? 'bg-brand-700 text-white'
          : 'bg-canvas text-muted ring-1 ring-line hover:text-ink',
      ].join(' ')}
    >
      {color ? (
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: active ? 'white' : color }}
        />
      ) : null}
      {label}
    </button>
  )
}
