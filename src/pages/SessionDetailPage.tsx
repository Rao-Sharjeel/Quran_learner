import { Link, useLocation, useParams } from 'react-router-dom'
import {
  getLearner,
  getTeacher,
  submitSessionReview,
  toggleHomeworkDone,
  useSession,
} from '../mocks/store'
import { SUBJECT_LABELS } from '../types'
import { Button, ButtonLink } from '../components/Button'
import { StatusPill } from '../components/StatusPill'
import { formatSessionWhen, teacherGivenName } from '../lib/format'

export function SessionDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const justBooked = Boolean(
    (location.state as { justBooked?: boolean } | null)?.justBooked,
  )
  const session = useSession(id)
  const teacher = session ? getTeacher(session.teacherId) : undefined
  const learner = session ? getLearner(session.learnerId) : undefined

  if (!session || !teacher) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">Session not found</p>
        <ButtonLink to="/sessions" variant="secondary" className="mt-4">
          Back to sessions
        </ButtonLink>
      </div>
    )
  }

  const canJoin = session.status === 'accepted'
  const showReview = session.status === 'completed'
  const learnerLabel = learner
    ? learner.kind === 'self'
      ? `${learner.name.split(' ')[0]} (you)`
      : learner.name
    : null

  return (
    <div className="space-y-6 animate-rise">
      <Link
        to="/sessions"
        className="text-sm font-medium text-brand-700 transition hover:text-brand-800"
      >
        ← All sessions
      </Link>

      {justBooked ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Booking request sent
          {learnerLabel ? ` for ${learnerLabel}` : ''}. You’ll be notified when{' '}
          {teacherGivenName(teacher.name)} responds.
        </div>
      ) : null}

      <div className="panel p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-base font-semibold text-white"
              style={{ background: teacher.avatarColor }}
            >
              {teacher.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-ink">
                  {teacher.name}
                </h1>
                <StatusPill status={session.status} />
              </div>
              <p className="mt-1 text-muted">
                {SUBJECT_LABELS[session.subject]} ·{' '}
                {formatSessionWhen(session.startsAt, session.slotLabel)}
              </p>
              {learner ? (
                <p className="mt-1 text-sm text-brand-800">
                  For{' '}
                  <Link
                    to={`/kids/${learner.id}`}
                    className="font-semibold underline-offset-2 hover:underline"
                  >
                    {learnerLabel}
                  </Link>
                </p>
              ) : null}
              <Link
                to={`/teachers/${teacher.id}`}
                className="mt-2 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                View profile
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canJoin ? (
              <ButtonLink to={`/sessions/${session.id}/room`}>Join classroom</ButtonLink>
            ) : (
              <Button type="button" disabled title="Available once the session is accepted">
                Join classroom
              </Button>
            )}
            <ButtonLink to="/sessions/join" variant="secondary">
              All joinable
            </ButtonLink>
          </div>
        </div>

        {session.studentNote ? (
          <div className="mt-8 border-t border-line pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
              Your note
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">{session.studentNote}</p>
          </div>
        ) : null}

        {session.teacherNotes ? (
          <div className="mt-6 border-t border-line pt-6">
            <h2 className="text-xl font-bold tracking-tight text-ink">Session notes</h2>
            <p className="mt-2 leading-relaxed text-muted">{session.teacherNotes}</p>
          </div>
        ) : session.status === 'accepted' ? (
          <div className="mt-6 border-t border-line pt-6">
            <h2 className="text-xl font-bold tracking-tight text-ink">Session notes</h2>
            <p className="mt-2 text-sm text-muted">
              Notes from your teacher will appear here after the session.
            </p>
          </div>
        ) : null}

        {session.homework && session.homework.length > 0 ? (
          <div className="mt-6 border-t border-line pt-6">
            <h2 className="text-xl font-bold tracking-tight text-ink">Homework</h2>
            <ul className="mt-3 space-y-2">
              {session.homework.map((item) => (
                <li key={item.id}>
                  <div className="flex items-start gap-3 rounded-xl border border-line px-3 py-3 text-sm transition hover:border-brand-200">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleHomeworkDone(session.id, item.id)}
                      className="mt-0.5 accent-brand-700"
                      aria-label={`Mark done: ${item.text}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={item.done ? 'text-muted line-through' : 'text-ink'}>
                        {item.text}
                      </p>
                      {item.requiresAudio ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-800">
                            Audio
                          </span>
                          {item.submission ? (
                            <span className="text-xs text-muted">
                              Uploaded · {item.comments?.length ?? 0} note
                              {(item.comments?.length ?? 0) === 1 ? '' : 's'}
                            </span>
                          ) : (
                            <span className="text-xs text-muted">Recording needed</span>
                          )}
                          <Link
                            to={`/sessions/${session.id}/homework/${item.id}`}
                            className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                          >
                            Open audio workspace →
                          </Link>
                          {item.submission ? (
                            <Link
                              to={`/sessions/${session.id}/homework/${item.id}?as=teacher`}
                              className="text-xs font-semibold text-muted hover:text-brand-700"
                            >
                              Teacher review
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {showReview ? (
          <div className="mt-6 border-t border-line pt-6">
            <h2 className="text-xl font-bold tracking-tight text-ink">Leave a review</h2>
            {session.reviewSubmitted ? (
              <p className="mt-2 text-sm text-brand-700">
                Thanks — your review was submitted.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted">
                  Tell other students how this session went with {teacherGivenName(teacher.name)}.
                </p>
                <Button
                  type="button"
                  className="mt-4"
                  onClick={() => submitSessionReview(session.id)}
                >
                  Leave review
                </Button>
              </>
            )}
          </div>
        ) : null}

        {session.status === 'pending' ? (
          <p className="mt-8 text-sm text-muted">
            Waiting for the teacher to accept. Check back under Sessions, or keep browsing the
            directory.
          </p>
        ) : null}
      </div>
    </div>
  )
}
