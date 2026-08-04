import { Link, useParams } from 'react-router-dom'
import {
  getTeacher,
  openHomeworkCount,
  underReviewAskCount,
  useAskQuestions,
  useLearners,
  useSessions,
} from '../mocks/store'
import { SUBJECT_LABELS } from '../types'
import { ButtonLink } from '../components/Button'
import { formatSessionWhen } from '../lib/format'
import { MobileKidHub } from '../components/kids/MobileKidHub'

export function KidHubPage() {
  const { id } = useParams()
  const learners = useLearners()
  const learner = learners.find((k) => k.id === id)
  const sessions = useSessions()
  const asks = useAskQuestions()

  if (!learner) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">Learner not found</p>
        <ButtonLink to="/kids" variant="secondary" className="mt-4">
          Back to family
        </ButtonLink>
      </div>
    )
  }

  const learnerSessions = sessions
    .filter((s) => s.learnerIds.includes(learner.id))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const upcoming = learnerSessions
    .filter((s) => s.status === 'scheduled')
    .slice(0, 3)
  const openHw = sessions
    .filter((s) => s.learnerIds.includes(learner.id) && s.homework)
    .flatMap((s) =>
      (s.homework ?? [])
        .filter((h) => !h.done && h.learnerId === learner.id)
        .map((h) => ({ ...h, sessionId: s.id })),
    )
    .slice(0, 5)
  const learnerAsks = asks
    .filter((q) => q.studentId === learner.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)
  const homeworkCount = openHomeworkCount(learner.id)
  const askOpen = underReviewAskCount(learner.id)
  const displayName =
    learner.kind === 'self' ? `${learner.name.split(' ')[0]} (you)` : learner.name

  return (
    <>
      <MobileKidHub
        learner={learner}
        displayName={displayName}
        homeworkCount={homeworkCount}
        askOpen={askOpen}
        upcoming={upcoming}
        openHw={openHw}
        learnerAsks={learnerAsks}
      />

      <div className="hidden space-y-8 animate-rise lg:block">
        <Link to="/app" className="text-sm font-medium text-brand-700 hover:text-brand-800">
          ← Family home
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-4 panel p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div
              className="grid h-16 w-16 place-items-center rounded-2xl text-lg font-semibold text-white"
              style={{ background: learner.avatarColor }}
            >
              {learner.initials}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-ink">
                {displayName}
              </h1>
              <p className="mt-1 text-muted">
                {learner.kind === 'self' ? 'Your learning' : learner.gradeLabel ?? 'Learner'} ·
                Hifz: {learner.hifzSummary}
              </p>
              <p className="mt-2 text-sm text-muted">
                {homeworkCount} open homework · {askOpen} Ask under review ·{' '}
                {learner.readingMinutesWeek} min reading this week
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to={`/learn?for=${learner.id}`}>Book teacher</ButtonLink>
            <ButtonLink to={`/sessions?learner=${learner.id}`} variant="secondary">
              Sessions
            </ButtonLink>
            <ButtonLink to="/ask/new" variant="secondary">
              Ask scholar
            </ButtonLink>
            {learner.kind === 'kid' ? (
              <ButtonLink to={`/kids/${learner.id}/edit`} variant="ghost">
                Edit profile
              </ButtonLink>
            ) : null}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel p-5">
            <h2 className="text-lg font-bold tracking-tight text-ink">Upcoming sessions</h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No pending or accepted sessions.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {upcoming.map((session) => {
                  const teacher = getTeacher(session.teacherId)
                  if (!teacher) return null
                  return (
                    <li key={session.id}>
                      <Link
                        to={`/sessions/${session.id}`}
                        className="block rounded-xl border border-line px-3 py-2.5 transition hover:bg-brand-50/50 hover:outline-brand-200"
                      >
                        <p className="font-medium text-ink">{teacher.name}</p>
                        <p className="text-xs text-muted">
                          {SUBJECT_LABELS[session.subject]} ·{' '}
                          {formatSessionWhen(session.startsAt, '')} ·{' '}
                          {session.status}
                        </p>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="panel p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold tracking-tight text-ink">Open homework</h2>
              <Link
                to={`/homework?learner=${learner.id}`}
                className="text-sm font-semibold text-brand-700"
              >
                Manage →
              </Link>
            </div>
            {openHw.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No open homework items.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {openHw.map((h) => (
                  <li key={h.id} className="rounded-xl bg-surface px-3 py-2 text-ink">
                    {h.text}
                    <Link
                      to={
                        h.requiresAudio
                          ? `/sessions/${h.sessionId}/homework/${h.id}`
                          : `/sessions/${h.sessionId}`
                      }
                      className="mt-1 block text-xs font-medium text-brand-700"
                    >
                      {h.requiresAudio ? 'Open audio homework' : 'Open session'}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel p-5">
            <h2 className="text-lg font-bold tracking-tight text-ink">Ask Scholars</h2>
            {learnerAsks.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No questions yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {learnerAsks.map((q) => (
                  <li key={q.id}>
                    <Link
                      to={`/ask/${q.id}`}
                      className="block rounded-xl border border-line px-3 py-2.5 transition hover:bg-brand-50/50 hover:outline-brand-200"
                    >
                      <p className="font-medium text-ink">{q.title}</p>
                      <p className="text-xs text-muted">{q.status.replace('_', ' ')}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel p-5">
            <h2 className="text-lg font-bold tracking-tight text-ink">Reading</h2>
            <p className="mt-3 text-sm text-ink">
              {learner.readingMinutesWeek} minutes this week
            </p>
            {learner.lastReadingTitle ? (
              <p className="mt-1 text-sm text-muted">Last opened: {learner.lastReadingTitle}</p>
            ) : (
              <p className="mt-1 text-sm text-muted">No recent reading yet.</p>
            )}
            <ButtonLink to="/library" variant="secondary" className="mt-4">
              Open library
            </ButtonLink>
          </section>
        </div>
      </div>
    </>
  )
}
