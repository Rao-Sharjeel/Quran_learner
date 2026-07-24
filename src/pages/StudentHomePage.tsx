import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getGuardian,
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
} from '../mocks/store'
import type { HomeworkItem, LearnerProfile, ReadingBookmark, Session } from '../types'
import { SUBJECT_LABELS } from '../types'
import { BookCover } from '../components/BookCover'
import { ButtonLink } from '../components/Button'
import { formatSessionWhen } from '../lib/format'

type OpenHomeworkRow = HomeworkItem & {
  sessionId: string
  learnerId: string
  subject: Session['subject']
  teacherId: string
}

function soonestAccepted(sessions: Session[]) {
  return [...sessions]
    .filter((s) => s.status === 'accepted')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]
}

function upcomingSchedule(sessions: Session[]) {
  return [...sessions]
    .filter((s) => s.status === 'accepted' || s.status === 'pending')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}

function collectOpenHomework(sessions: Session[]): OpenHomeworkRow[] {
  return sessions.flatMap((s) =>
    (s.homework ?? [])
      .filter((h) => !h.done)
      .map((h) => ({
        ...h,
        sessionId: s.id,
        learnerId: s.learnerId,
        subject: s.subject,
        teacherId: s.teacherId,
      })),
  )
}

function shortName(learner: LearnerProfile) {
  return learner.kind === 'self' ? 'You' : learner.name.split(' ')[0]
}

function classTitle(learner: LearnerProfile, subject: Session['subject']) {
  const subjectLabel = SUBJECT_LABELS[subject]
  return learner.kind === 'self' ? `Your ${subjectLabel}` : `${shortName(learner)}’s ${subjectLabel}`
}

function teacherGiven(name: string) {
  const parts = name.split(' ')
  return parts.length > 1 ? parts.slice(1).join(' ') : name
}

function latestBookmarkForLearner(bookmarks: ReadingBookmark[], learnerId: string) {
  return [...bookmarks]
    .filter((b) => b.learnerId === learnerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number) {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function windowDays(anchor: Date) {
  // Yesterday, today, and the next 5 days (7 total)
  const day = startOfDay(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(day, i - 1))
}

function formatHour(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/**
 * Mockup-inspired densified home: dark hero, asymmetric board, family path.
 * No page scroll on desktop — only column lists scroll if needed.
 */
export function StudentHomePage() {
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
  const askTotal = learners.reduce((n, l) => n + underReviewAskCount(l.id), 0)
  const readingTotal = learners.reduce((n, l) => n + l.readingMinutesWeek, 0)

  const shelf = [...bookmarks]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4)

  const primaryJoin = joinable[0]
  const primaryLearner = primaryJoin ? getLearner(primaryJoin.learnerId) : undefined
  const primaryTeacher = primaryJoin ? getTeacher(primaryJoin.teacherId) : undefined

  const today = startOfDay(new Date())
  const week = windowDays(today)
  const weekLabel = `${week[0]!.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${week[6]!.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden animate-rise">
      {/* Dark hero: greeting + CTAs + this week */}
      <header className="relative shrink-0 overflow-hidden rounded-2xl bg-brand-800 text-white shadow-md shadow-brand-800/25">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'72\' height=\'72\' viewBox=\'0 0 72 72\'%3E%3Cpath fill=\'none\' stroke=\'%23b8922a\' stroke-width=\'1\' d=\'M0 36h72M36 0v72M0 0l72 72M72 0L0 72\'/%3E%3C/svg%3E")',
            backgroundSize: '72px 72px',
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-3 px-3.5 pb-2.5 pt-3 sm:px-4">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Assalamu alaikum, {firstName}
            </h1>
            <p className="mt-0.5 font-arabic text-sm text-brand-100/90" dir="rtl" lang="ar">
              هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ
              <span className="ms-1.5 font-sans text-[10px] text-brand-200">39:9</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {askTotal > 0 ? (
              <Link
                to="/ask"
                className="rounded-xl bg-brass/15 px-3 py-1.5 text-xs font-bold text-brass-soft ring-1 ring-brass/50 transition hover:bg-brass/25"
              >
                {askTotal} Ask waiting
              </Link>
            ) : null}
            <ButtonLink
              to="/teachers"
              className="!bg-transparent !px-3 !py-1.5 !text-xs !text-brass-soft !shadow-none ring-1 ring-brass/60 hover:!bg-brass/15"
            >
              Book a teacher
            </ButtonLink>
          </div>
        </div>
        <div className="relative flex flex-wrap items-center gap-1.5 border-t border-white/10 bg-black/15 px-3.5 py-2 sm:px-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-200">
            This week
          </span>
          <Link
            to="/library"
            className="rounded-full bg-brass px-2 py-0.5 text-[11px] font-bold text-brand-900"
          >
            {readingTotal}m read
          </Link>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-brand-50 ring-1 ring-white/15">
            {homeworkTotal === 0 ? 'Hw clear' : `${homeworkTotal} hw`}
          </span>
          {learners.map((learner) => (
            <Link
              key={learner.id}
              to={`/kids/${learner.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-50 ring-1 ring-white/15"
            >
              <span
                className="grid h-4 w-4 place-items-center rounded-full text-[8px] font-bold text-white"
                style={{ background: learner.avatarColor }}
              >
                {learner.initials}
              </span>
              {shortName(learner)}
            </Link>
          ))}
        </div>
      </header>

      {/* Asymmetric board: Primary | Homework | Reading */}
      <div className="grid min-h-0 flex-1 grid-rows-[auto] gap-1.5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col gap-1.5 overflow-hidden">
          {primaryJoin && primaryLearner && primaryTeacher ? (
            <Link
              to={`/sessions/${primaryJoin.id}/room`}
              className="group flex shrink-0 items-center justify-between gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-brand-700 px-3.5 py-3 text-white shadow-md shadow-brand-800/20 transition hover:from-brand-700 hover:to-brand-600"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brass-soft">
                  Ready now
                </span>
                <span className="mt-0.5 block truncate text-base font-extrabold tracking-tight">
                  {classTitle(primaryLearner, primaryJoin.subject)}
                </span>
                <span className="mt-0.5 block truncate text-xs text-brand-100">
                  {teacherGiven(primaryTeacher.name)} ·{' '}
                  {formatSessionWhen(primaryJoin.startsAt, primaryJoin.slotLabel)}
                </span>
              </div>
              <span className="shrink-0 rounded-xl bg-brass px-3.5 py-2 text-xs font-extrabold text-brand-900 shadow-sm">
                Join class
              </span>
            </Link>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-canvas shadow-sm outline outline-1 outline-line">
            <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-1.5">
              <div className="min-w-0">
                <h2 className="text-sm font-bold tracking-tight text-ink">Upcoming</h2>
                <p className="text-[10px] font-medium text-muted">{weekLabel}</p>
              </div>
              <Link to="/sessions" className="text-[11px] font-semibold text-brand-700">
                All →
              </Link>
            </div>
            {schedule.length === 0 ? (
              <p className="border-t border-line/80 px-3 py-3 text-sm text-muted">
                Nothing scheduled.
              </p>
            ) : (
              <WeekCalendar
                days={week}
                today={today}
                sessions={schedule}
                joinableIds={joinableIds}
              />
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-brand-50/90 shadow-sm outline outline-1 outline-brand-100">
          <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-1.5">
            <h2 className="text-sm font-bold tracking-tight text-ink">Homework</h2>
            <span className="text-[11px] font-bold tabular-nums text-brand-700">
              {homeworkTotal === 0 ? 'Done' : `${homeworkTotal} open`}
            </span>
          </div>
          {openHomework.length === 0 ? (
            <p className="border-t border-brand-100 px-3 py-3 text-sm text-muted">
              No open homework.
            </p>
          ) : (
            <ul className="min-h-0 space-y-1.5 overflow-y-auto border-t border-brand-100 p-2">
              {openHomework.map((item) => {
                const learner = getLearner(item.learnerId)
                if (!learner) return null
                return (
                  <li key={`${item.sessionId}-${item.id}`}>
                    <div className="flex items-start gap-2 rounded-xl bg-canvas/80 px-2.5 py-2 ring-1 ring-brand-100/80">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggleHomeworkDone(item.sessionId, item.id)}
                        className="mt-0.5 accent-brand-700"
                        aria-label={`Mark done: ${item.text}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium text-ink">{item.text}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted">
                          {shortName(learner)} · {SUBJECT_LABELS[item.subject]}
                        </p>
                        {item.requiresAudio ? (
                          <span className="mt-1 inline-block rounded-full bg-brass-soft px-1.5 py-0.5 text-[9px] font-bold text-brand-800">
                            Audio required
                          </span>
                        ) : (
                          <span className="mt-1 inline-block rounded-full bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-800">
                            In progress
                          </span>
                        )}
                      </div>
                      <Link
                        to={
                          item.requiresAudio
                            ? `/sessions/${item.sessionId}/homework/${item.id}`
                            : `/sessions/${item.sessionId}`
                        }
                        className="shrink-0 text-[11px] font-semibold text-brand-700"
                      >
                        {item.requiresAudio ? 'Audio' : 'Open'}
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="reading-shelf flex min-h-0 flex-col overflow-hidden rounded-2xl text-ink shadow-sm outline outline-1 outline-line">
          <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-1.5">
            <h2 className="text-sm font-bold tracking-tight text-ink">Reading shelf</h2>
            <Link to="/library" className="text-[11px] font-semibold text-brand-700">
              Library →
            </Link>
          </div>
          {shelf.length === 0 ? (
            <div className="border-t border-line/70 px-3 py-3">
              <p className="text-sm text-muted">No bookmarks yet.</p>
              <ButtonLink
                to="/library"
                className="mt-2 !bg-brand-700 !px-2.5 !py-1 !text-[11px] !text-white !shadow-none"
              >
                Browse
              </ButtonLink>
            </div>
          ) : (
            <ul className="grid min-h-0 grid-cols-2 gap-1.5 overflow-y-auto border-t border-line/70 p-2">
              {shelf.map((b) => {
                const resource = getLibraryResource(b.resourceId)
                const learner = getLearner(b.learnerId)
                if (!resource || !learner) return null
                return (
                  <li key={b.id}>
                    <Link
                      to={`/library/${resource.id}`}
                      className="flex h-full flex-col gap-1.5 rounded-xl bg-canvas/80 p-1.5 ring-1 ring-line/80 transition hover:bg-canvas hover:ring-brand-200"
                    >
                      <BookCover
                        resource={resource}
                        className="mx-auto aspect-[3/4] w-[72%] max-w-[7.5rem] rounded-lg shadow-sm shadow-black/20"
                      />
                      <span className="min-w-0">
                        <span className="line-clamp-2 block text-[11px] font-bold leading-snug text-ink">
                          {resource.title}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-muted">
                          {shortName(learner)} · {b.progressPercent}% · {b.minutesSpent}m
                        </span>
                        <span className="mt-1 block h-1 overflow-hidden rounded-full bg-surface">
                          <span
                            className="block h-full rounded-full bg-brand-600"
                            style={{ width: `${b.progressPercent}%` }}
                          />
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Family learning path */}
      <section className="shrink-0 overflow-hidden rounded-2xl bg-canvas px-3 py-2 shadow-sm outline outline-1 outline-line">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold tracking-tight text-ink">Family learning path</h2>
          <div className="flex items-center gap-2">
            <Link to="/kids/new" className="text-[11px] font-semibold text-brand-700">
              + Kid
            </Link>
            <Link to="/kids" className="text-[11px] font-semibold text-brand-700">
              Manage →
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5 xl:grid-cols-4">
          {learners.map((learner) => (
            <LearnerPathCard
              key={learner.id}
              learner={learner}
              sessions={sessions}
              bookmarks={bookmarks}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function WeekCalendar({
  days,
  today,
  sessions,
  joinableIds,
}: {
  days: Date[]
  today: Date
  sessions: Session[]
  joinableIds: Set<string>
}) {
  const sessionsByDay = useMemo(() => {
    const map = new Map<string, Session[]>()
    for (const day of days) {
      const key = dayKey(day)
      map.set(
        key,
        sessions
          .filter((s) => sameDay(new Date(s.startsAt), day))
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      )
    }
    return map
  }, [days, sessions])

  const defaultDay = useMemo(() => {
    const todayKey = dayKey(today)
    if ((sessionsByDay.get(todayKey) ?? []).length > 0) return todayKey
    for (const day of days) {
      const key = dayKey(day)
      if ((sessionsByDay.get(key) ?? []).length > 0) return key
    }
    return todayKey
  }, [days, today, sessionsByDay])

  const [selectedKey, setSelectedKey] = useState(defaultDay)
  const selectedDay = days.find((d) => dayKey(d) === selectedKey) ?? today
  const selectedSessions = sessionsByDay.get(selectedKey) ?? []

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-line/80">
      {/* Compact week strip — scan which days have class */}
      <div className="grid shrink-0 grid-cols-7 gap-1 border-b border-line/70 px-2 py-1.5">
        {days.map((day) => {
          const key = dayKey(day)
          const count = (sessionsByDay.get(key) ?? []).length
          const isToday = sameDay(day, today)
          const isSelected = key === selectedKey
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKey(key)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-0.5 py-1 transition ${
                isSelected
                  ? 'bg-brand-700 text-white shadow-sm'
                  : isToday
                    ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-200'
                    : 'text-ink hover:bg-surface'
              }`}
            >
              <span
                className={`text-[9px] font-bold uppercase tracking-wide ${
                  isSelected ? 'text-brand-100' : 'text-muted'
                }`}
              >
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <span className="text-sm font-extrabold tabular-nums">{day.getDate()}</span>
              <span className="flex h-1.5 items-center gap-0.5">
                {count === 0 ? (
                  <span
                    className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white/25' : 'bg-line'}`}
                  />
                ) : (
                  Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 w-1 rounded-full ${
                        isSelected ? 'bg-brass' : 'bg-brand-600'
                      }`}
                    />
                  ))
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* Readable agenda for the selected day */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <p className="mb-1.5 px-0.5 text-[11px] font-semibold text-muted">
          {sameDay(selectedDay, today)
            ? 'Today · '
            : sameDay(selectedDay, addDays(today, -1))
              ? 'Yesterday · '
              : sameDay(selectedDay, addDays(today, 1))
                ? 'Tomorrow · '
                : ''}
          {selectedDay.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
          {selectedSessions.length > 0
            ? ` · ${selectedSessions.length} class${selectedSessions.length === 1 ? '' : 'es'}`
            : ''}
        </p>
        {selectedSessions.length === 0 ? (
          <p className="rounded-xl bg-surface/70 px-3 py-4 text-center text-sm text-muted ring-1 ring-line">
            No classes this day.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {selectedSessions.map((session) => {
              const learner = getLearner(session.learnerId)
              const teacher = getTeacher(session.teacherId)
              if (!learner || !teacher) return null
              const canJoin = joinableIds.has(session.id)
              return (
                <li key={session.id}>
                  <div className="flex items-center gap-2.5 rounded-xl bg-surface/80 px-2.5 py-2 ring-1 ring-line">
                    <div className="w-12 shrink-0 text-center">
                      <p className="text-sm font-extrabold tabular-nums leading-none text-ink">
                        {formatHour(session.startsAt)}
                      </p>
                      {session.status === 'pending' ? (
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-muted">
                          Pending
                        </p>
                      ) : null}
                    </div>
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-white"
                      style={{ background: learner.avatarColor }}
                    >
                      {learner.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {classTitle(learner, session.subject)}
                      </p>
                      <p className="truncate text-[11px] text-muted">
                        {teacherGiven(teacher.name)}
                      </p>
                    </div>
                    {canJoin ? (
                      <Link
                        to={`/sessions/${session.id}/room`}
                        className="shrink-0 rounded-lg bg-brand-700 px-2.5 py-1.5 text-[11px] font-bold text-white"
                      >
                        Join
                      </Link>
                    ) : (
                      <Link
                        to={`/sessions/${session.id}`}
                        className="shrink-0 text-[11px] font-semibold text-brand-700"
                      >
                        Details
                      </Link>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function LearnerPathCard({
  learner,
  sessions,
  bookmarks,
}: {
  learner: LearnerProfile
  sessions: Session[]
  bookmarks: ReadingBookmark[]
}) {
  const next = soonestAccepted(sessions.filter((s) => s.learnerId === learner.id))
  const hw = openHomeworkCount(learner.id)
  const ask = underReviewAskCount(learner.id)
  const reading = latestBookmarkForLearner(bookmarks, learner.id)
  const readingResource = reading ? getLibraryResource(reading.resourceId) : undefined

  return (
    <Link
      to={`/kids/${learner.id}`}
      className="rounded-xl bg-surface/90 px-2.5 py-2 ring-1 ring-line transition hover:bg-brand-50 hover:ring-brand-200"
    >
      <div className="flex items-center gap-2">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-white"
          style={{ background: learner.avatarColor }}
        >
          {learner.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1">
            <span className="truncate text-sm font-bold text-ink">{shortName(learner)}</span>
            {hw + ask > 0 ? (
              <span className="rounded-full bg-brass-soft px-1 text-[9px] font-bold text-brand-800">
                {hw + ask}
              </span>
            ) : null}
          </span>
          <span className="block truncate text-[10px] text-muted">
            {next
              ? `Next: ${SUBJECT_LABELS[next.subject]} · ${formatSessionWhen(next.startsAt, next.slotLabel)}`
              : 'No upcoming class'}
          </span>
        </span>
      </div>
      <ul className="mt-1.5 space-y-0.5 border-t border-line/70 pt-1.5 text-[10px] text-muted">
        <li className="flex items-center gap-1.5 truncate">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${hw > 0 ? 'bg-brass' : 'bg-line'}`}
          />
          {hw > 0 ? `${hw} homework open` : 'Homework clear'}
        </li>
        <li className="flex items-center gap-1.5 truncate">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${reading ? 'bg-brand-600' : 'bg-line'}`}
          />
          {reading && readingResource
            ? `Reading · ${reading.progressPercent}%`
            : 'No current reading'}
        </li>
      </ul>
    </Link>
  )
}
