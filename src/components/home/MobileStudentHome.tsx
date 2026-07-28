import { Link } from 'react-router-dom'
import { BookCover } from '../BookCover'
import { ButtonLink } from '../Button'
import { formatSessionWhen } from '../../lib/format'
import {
  getLearner,
  getLibraryResource,
  getTeacher,
  joinableSessions,
  openHomeworkCount,
  toggleHomeworkDone,
  underReviewAskCount,
  useLearners,
  useReadingBookmarks,
  useSessions,
  getGuardian,
} from '../../mocks/store'
import { SUBJECT_LABELS } from '../../types'
import {
  classTitle,
  collectOpenHomework,
  formatHour,
  latestBookmarkForLearner,
  sameDay,
  shortName,
  soonestAccepted,
  startOfDay,
  teacherGiven,
  upcomingSchedule,
  type OpenHomeworkRow,
} from './homeHelpers'

/**
 * Mobile-only student home. Mounted below lg; desktop tree is separate.
 * First viewport: greeting → primary action → week stats, then scroll sections.
 */
export function MobileStudentHome() {
  const guardian = getGuardian()
  const learners = useLearners()
  const sessions = useSessions()
  const bookmarks = useReadingBookmarks()
  const firstName = guardian.name.split(' ')[0]
  const joinable = joinableSessions()
  const joinableIds = new Set(joinable.map((s) => s.id))
  const schedule = upcomingSchedule(sessions)
  const openHomework = collectOpenHomework(sessions)
  const homeworkTotal = openHomework.length
  const readingTotal = learners.reduce((n, l) => n + l.readingMinutesWeek, 0)

  const shelf = [...bookmarks]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6)

  const primaryJoin = joinable[0]
  const primaryLearner = primaryJoin ? getLearner(primaryJoin.learnerIds[0]!) : undefined
  const primaryTeacher = primaryJoin ? getTeacher(primaryJoin.teacherId) : undefined

  const today = startOfDay(new Date())
  const todaySessions = schedule.filter((s) => sameDay(new Date(s.startsAt), today))
  const nextUp =
    schedule.find((s) => new Date(s.startsAt).getTime() >= Date.now()) ?? schedule[0]
  const nextLearner = nextUp ? getLearner(nextUp.learnerIds[0]!) : undefined
  const nextTeacher = nextUp ? getTeacher(nextUp.teacherId) : undefined

  return (
    <div className="flex flex-col gap-3 animate-rise lg:hidden">
      {/* 1. Compact greeting + brand mark */}
      <div className="flex items-center justify-between gap-3 px-0.5 pt-1">
        <h1 className="min-w-0 text-xl font-extrabold tracking-tight text-ink">
          Assalamu alaikum, {firstName}
        </h1>
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Ilm"
          className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-brass/40"
        />
      </div>

      {/* 2. Primary action */}
      {primaryJoin && primaryLearner && primaryTeacher ? (
        <Link
          to={`/sessions/${primaryJoin.id}/room`}
          className="flex items-center justify-between gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-brand-700 px-4 py-4 text-white shadow-md shadow-brand-800/20"
        >
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brass-soft">
              Ready now
            </span>
            <span className="mt-1 block truncate text-lg font-extrabold tracking-tight">
              {classTitle(primaryLearner, primaryJoin.subject)}
            </span>
            <span className="mt-0.5 block truncate text-xs text-brand-100">
              {teacherGiven(primaryTeacher.name)} ·{' '}
              {formatSessionWhen(primaryJoin.startsAt, '')}
            </span>
          </div>
          <span className="shrink-0 rounded-xl bg-brass px-4 py-2.5 text-sm font-extrabold text-brand-900 shadow-sm">
            Join
          </span>
        </Link>
      ) : nextUp && nextLearner && nextTeacher ? (
        <Link
          to={
            joinableIds.has(nextUp.id)
              ? `/sessions/${nextUp.id}/room`
              : `/sessions/${nextUp.id}`
          }
          className="flex items-center justify-between gap-3 overflow-hidden rounded-2xl bg-canvas px-4 py-4 shadow-sm outline outline-1 outline-line"
        >
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600">
              Next up
            </span>
            <span className="mt-1 block truncate text-base font-extrabold tracking-tight text-ink">
              {classTitle(nextLearner, nextUp.subject)}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted">
              {teacherGiven(nextTeacher.name)} ·{' '}
              {formatSessionWhen(nextUp.startsAt, '')}
            </span>
          </div>
          <span className="shrink-0 rounded-xl bg-brand-700 px-3.5 py-2 text-xs font-extrabold text-white">
            View
          </span>
        </Link>
      ) : (
        <div className="rounded-2xl bg-canvas px-4 py-4 shadow-sm outline outline-1 outline-line">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600">
            Next up
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">Nothing scheduled</p>
          <ButtonLink to="/learn" className="mt-3 !px-3 !py-2 !text-xs">
            Book a teacher
          </ButtonLink>
        </div>
      )}

      {/* 3. This week stats */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          This week
        </span>
        <Link
          to="/library"
          className="rounded-full bg-brass px-2.5 py-1 text-[11px] font-bold text-brand-900"
        >
          {readingTotal}m read
        </Link>
        <Link
          to="/homework"
          className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-bold text-ink ring-1 ring-line"
        >
          {homeworkTotal === 0 ? 'Hw clear' : `${homeworkTotal} hw`}
        </Link>
        <Link
          to="/learn"
          className="ms-auto text-[11px] font-semibold text-brand-700"
        >
          Book →
        </Link>
      </div>

      {/* 4. Today’s agenda */}
      <section className="overflow-hidden rounded-2xl bg-canvas shadow-sm outline outline-1 outline-line">
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
          <h2 className="text-sm font-bold tracking-tight text-ink">Today</h2>
          <Link to="/sessions" className="text-[11px] font-semibold text-brand-700">
            Week →
          </Link>
        </div>
        {todaySessions.length === 0 ? (
          <p className="border-t border-line/80 px-3.5 py-4 text-sm text-muted">
            No classes today.
          </p>
        ) : (
          <ul className="divide-y divide-line/70 border-t border-line/80">
            {todaySessions.map((session) => {
              const learner = getLearner(session.learnerIds[0]!)
              const teacher = getTeacher(session.teacherId)
              if (!learner || !teacher) return null
              const canJoin = joinableIds.has(session.id)
              return (
                <li key={session.id}>
                  <Link
                    to={canJoin ? `/sessions/${session.id}/room` : `/sessions/${session.id}`}
                    className="flex items-center gap-3 px-3.5 py-3 transition active:bg-surface/80"
                  >
                    <span className="w-12 shrink-0 text-right text-[11px] font-extrabold tabular-nums text-ink">
                      {formatHour(session.startsAt)}
                    </span>
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[9px] font-extrabold text-white"
                      style={{ background: learner.avatarColor }}
                    >
                      {learner.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink">
                        {classTitle(learner, session.subject)}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted">
                        {teacherGiven(teacher.name)}
                        {session.status === 'pending' ? ' · Hold' : ''}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-extrabold ${
                        canJoin
                          ? 'bg-brand-700 text-white'
                          : 'bg-surface text-brand-700 ring-1 ring-line'
                      }`}
                    >
                      {canJoin ? 'Join' : 'View'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* 5. Homework peek */}
      <section className="overflow-hidden rounded-2xl bg-brand-50 shadow-sm outline outline-1 outline-brand-100">
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600">
              Family tasks
            </p>
            <h2 className="text-sm font-bold tracking-tight text-ink">Homework</h2>
          </div>
          <Link to="/homework" className="text-[11px] font-semibold text-brand-700">
            All →
          </Link>
        </div>
        <div className="border-t border-brand-100 px-2.5 pb-2.5 pt-2">
          <MobileHomeworkPeek items={openHomework.slice(0, 3)} />
        </div>
      </section>

      {/* 6. Reading shelf strip */}
      <section className="overflow-hidden rounded-2xl bg-canvas shadow-sm outline outline-1 outline-line">
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
          <h2 className="text-sm font-bold tracking-tight text-ink">Reading</h2>
          <Link to="/library" className="text-[11px] font-semibold text-brand-700">
            Library →
          </Link>
        </div>
        {shelf.length === 0 ? (
          <div className="border-t border-line/70 px-3.5 py-4">
            <p className="text-sm text-muted">No bookmarks yet.</p>
            <ButtonLink
              to="/library"
              className="mt-2 !bg-brand-700 !px-2.5 !py-1.5 !text-[11px] !text-white !shadow-none"
            >
              Browse
            </ButtonLink>
          </div>
        ) : (
          <ul className="flex gap-2.5 overflow-x-auto border-t border-line/70 px-3 py-3 snap-x snap-mandatory">
            {shelf.map((b) => {
              const resource = getLibraryResource(b.resourceId)
              const learner = getLearner(b.learnerId)
              if (!resource || !learner) return null
              return (
                <li key={b.id} className="w-[7.5rem] shrink-0 snap-start">
                  <Link to={`/library/${resource.id}`} className="block">
                    <BookCover
                      resource={resource}
                      className="aspect-[3/4] w-full rounded-lg shadow-sm shadow-black/20"
                    />
                    <span className="mt-1.5 line-clamp-2 block text-[11px] font-bold leading-snug text-ink">
                      {resource.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted">
                      {shortName(learner)} · {b.progressPercent}%
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* 7. Family path */}
      <section className="overflow-hidden rounded-2xl bg-canvas px-3 py-3 shadow-sm outline outline-1 outline-line">
        <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
          <h2 className="text-sm font-bold tracking-tight text-ink">Family</h2>
          <div className="flex items-center gap-2">
            <Link to="/kids/new" className="text-[11px] font-semibold text-brand-700">
              + Kid
            </Link>
            <Link to="/kids" className="text-[11px] font-semibold text-brand-700">
              Manage →
            </Link>
          </div>
        </div>
        <ul className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
          {learners.map((learner) => {
            const next = soonestAccepted(sessions.filter((s) => s.learnerIds.includes(learner.id)))
            const hw = openHomeworkCount(learner.id)
            const ask = underReviewAskCount(learner.id)
            const reading = latestBookmarkForLearner(bookmarks, learner.id)
            return (
              <li key={learner.id} className="w-[11.5rem] shrink-0 snap-start">
                <Link
                  to={`/kids/${learner.id}`}
                  className="block h-full rounded-xl bg-surface/90 px-3 py-2.5 ring-1 ring-line transition active:bg-brand-50"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-white"
                      style={{ background: learner.avatarColor }}
                    >
                      {learner.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1">
                        <span className="truncate text-sm font-bold text-ink">
                          {shortName(learner)}
                        </span>
                        {hw + ask > 0 ? (
                          <span className="rounded-full bg-brass-soft px-1.5 text-[9px] font-bold text-brand-800">
                            {hw + ask}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-muted">
                        {next
                          ? `Next: ${SUBJECT_LABELS[next.subject]}`
                          : 'No upcoming class'}
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 truncate border-t border-line/70 pt-2 text-[10px] text-muted">
                    {reading
                      ? `Reading · ${reading.progressPercent}%`
                      : hw > 0
                        ? `${hw} homework open`
                        : 'Homework clear'}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function MobileHomeworkPeek({ items }: { items: OpenHomeworkRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-canvas/80 px-3 py-5 text-center ring-1 ring-brand-100">
        <p className="text-sm font-semibold text-ink">You’re clear</p>
        <p className="mt-0.5 text-[11px] text-muted">No open homework right now.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const learner = getLearner(item.learnerId)
        const href = item.requiresAudio
          ? `/sessions/${item.sessionId}/homework/${item.id}`
          : `/sessions/${item.sessionId}`
        return (
          <li key={`${item.sessionId}-${item.id}`}>
            <div className="flex items-start gap-2 rounded-xl bg-canvas/90 px-2.5 py-2 ring-1 ring-brand-100">
              <button
                type="button"
                onClick={() => toggleHomeworkDone(item.sessionId, item.id)}
                className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-md border border-brand-600/35 bg-brand-50 text-[9px] text-transparent transition hover:border-brand-700 hover:text-brand-700"
                aria-label={`Mark done: ${item.text}`}
              >
                ✓
              </button>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
                  {item.text}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {learner ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
                      style={{ background: learner.avatarColor }}
                    >
                      {shortName(learner)}
                    </span>
                  ) : null}
                  <span className="text-[10px] font-medium text-muted">
                    {SUBJECT_LABELS[item.subject]}
                  </span>
                </div>
              </div>
              <Link
                to={href}
                className="shrink-0 self-center rounded-lg bg-brand-700 px-2 py-1 text-[10px] font-bold text-white"
              >
                {item.requiresAudio ? 'Record' : 'Open'}
              </Link>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
