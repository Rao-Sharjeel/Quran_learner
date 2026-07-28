import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getGuardian,
  getLearner,
  getLibraryResource,
  getTeacher,
  joinableSessions,
  openHomeworkCount,
  underReviewAskCount,
  useLearners,
  useReadingBookmarks,
  useSessions,
} from '../mocks/store'
import type { LearnerProfile, ReadingBookmark, Session } from '../types'
import { SUBJECT_LABELS } from '../types'
import { BookCover } from '../components/BookCover'
import { ButtonLink } from '../components/Button'
import { HomeDiscoverCarousel } from '../components/HomeDiscoverCarousel'
import { MobileStudentHome } from '../components/home/MobileStudentHome'
import {
  addDays,
  classTitle,
  collectOpenHomework,
  dayKey,
  formatHour,
  latestBookmarkForLearner,
  sameDay,
  shortName,
  soonestAccepted,
  startOfDay,
  teacherGiven,
  upcomingSchedule,
  windowDays,
} from '../components/home/homeHelpers'
import { formatSessionWhen } from '../lib/format'

/**
 * Mockup-inspired densified home: dark hero, asymmetric board, family path.
 * Desktop (lg+): no page scroll — only column lists scroll if needed.
 * Mobile: separate MobileStudentHome tree (lg:hidden).
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
  const primaryLearner = primaryJoin ? getLearner(primaryJoin.learnerIds[0]!) : undefined
  const primaryTeacher = primaryJoin ? getTeacher(primaryJoin.teacherId) : undefined

  const today = startOfDay(new Date())
  const week = windowDays(today)
  const weekLabel = `${week[0]!.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${week[6]!.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`

  return (
    <>
      <MobileStudentHome />

      <div className="hidden min-h-0 flex-1 flex-col gap-1.5 overflow-hidden animate-rise lg:flex">
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
                to="/learn"
                className="!bg-transparent !px-3 !py-1.5 !text-xs !text-brass-soft !shadow-none ring-1 ring-brass/60 hover:!bg-brass/15"
              >
                Hire a teacher
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
            <Link
              to="/homework"
              className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-brand-50 ring-1 ring-white/15"
            >
              {homeworkTotal === 0 ? 'Hw clear' : `${homeworkTotal} hw`}
            </Link>
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
                    {formatSessionWhen(primaryJoin.startsAt, '')}
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

          <HomeDiscoverCarousel openHomework={openHomework} />

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
    </>
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
    <div className="flex min-h-0 flex-1 flex-col border-t border-line/80 bg-canvas/55">
      {/* Date rail: yesterday, today, then the next five days */}
      <div className="relative shrink-0 px-2.5 pb-2 pt-2">
        <div className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-brass/60 to-transparent" />
        <div className="grid grid-cols-7 gap-1">
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
              aria-pressed={isSelected}
              aria-label={`${day.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}${count ? `, ${count} class${count === 1 ? '' : 'es'}` : ', no classes'}`}
              className={`group relative flex min-w-0 flex-col items-center rounded-xl px-0.5 pb-1.5 pt-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                isSelected
                  ? 'bg-brand-800 text-white shadow-md shadow-brand-800/20'
                  : isToday
                    ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-200/90'
                    : 'text-ink hover:bg-surface/80'
              }`}
            >
              <span
                className={`text-[8px] font-extrabold uppercase tracking-[0.12em] ${
                  isSelected ? 'text-brand-200' : isToday ? 'text-brand-700' : 'text-muted'
                }`}
              >
                {isToday ? 'Today' : day.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <span className="mt-0.5 text-base font-extrabold leading-none tabular-nums">
                {day.getDate()}
              </span>
              <span
                className={`mt-1 grid h-3.5 min-w-3.5 place-items-center rounded-full px-1 text-[8px] font-extrabold tabular-nums ${
                  count > 0
                    ? isSelected
                      ? 'bg-brass text-brand-900'
                      : 'bg-brand-100 text-brand-800'
                    : isSelected
                      ? 'bg-white/10 text-white/40'
                      : 'bg-surface text-muted/50'
                }`}
              >
                {count || '–'}
              </span>
            </button>
          )
        })}
        </div>
      </div>

      {/* Selected-day agenda */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-2.5 pt-2">
        <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
          <p className="truncate text-xs font-extrabold tracking-tight text-ink">
            {sameDay(selectedDay, today)
              ? 'Today'
              : sameDay(selectedDay, addDays(today, -1))
                ? 'Yesterday'
                : sameDay(selectedDay, addDays(today, 1))
                  ? 'Tomorrow'
                  : selectedDay.toLocaleDateString(undefined, { weekday: 'long' })}
          </p>
          <p className="shrink-0 text-[10px] font-semibold text-muted">
            {selectedDay.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
          </p>
        </div>
        {selectedSessions.length === 0 ? (
          <div className="grid min-h-24 place-items-center rounded-xl border border-dashed border-line bg-surface/35 px-3 text-center">
            <div>
              <span className="mx-auto mb-1.5 block h-px w-8 bg-brass/70" />
              <p className="text-xs font-semibold text-muted">No classes scheduled</p>
            </div>
          </div>
        ) : (
          <ul className="relative space-y-1.5 before:absolute before:bottom-3 before:left-[3.05rem] before:top-3 before:w-px before:bg-line">
            {selectedSessions.map((session) => {
              const learner = getLearner(session.learnerIds[0]!)
              const teacher = getTeacher(session.teacherId)
              if (!learner || !teacher) return null
              const canJoin = joinableIds.has(session.id)
              return (
                <li key={session.id} className="relative flex items-stretch gap-2">
                  <div className="flex w-10 shrink-0 flex-col items-end justify-center text-right">
                      <p className="text-[11px] font-extrabold leading-none tabular-nums text-ink">
                        {formatHour(session.startsAt)}
                      </p>
                      {session.status === 'pending' ? (
                        <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.08em] text-muted">
                          Hold
                        </p>
                      ) : null}
                  </div>
                  <span
                    className="relative z-10 mt-[1.15rem] h-2.5 w-2.5 shrink-0 rounded-full border-2 border-canvas shadow-sm"
                    style={{ background: learner.avatarColor }}
                    aria-hidden
                  />
                  <Link
                    to={canJoin ? `/sessions/${session.id}/room` : `/sessions/${session.id}`}
                    className={`group min-w-0 flex-1 overflow-hidden rounded-xl border bg-canvas px-2.5 py-2 transition hover:-translate-y-0.5 hover:shadow-sm ${
                      canJoin ? 'border-brand-200' : 'border-line'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[9px] font-extrabold text-white"
                        style={{ background: learner.avatarColor }}
                      >
                        {learner.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-ink">
                          {classTitle(learner, session.subject)}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-muted">
                          {teacherGiven(teacher.name)}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-lg px-2 py-1 text-[9px] font-extrabold ${
                          canJoin
                            ? 'bg-brand-700 text-white'
                            : 'bg-surface text-brand-700 ring-1 ring-line'
                        }`}
                      >
                        {canJoin ? 'Join' : 'View'}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
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
  const next = soonestAccepted(sessions.filter((s) => s.learnerIds.includes(learner.id)))
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
              ? `Next: ${SUBJECT_LABELS[next.subject]} · ${formatSessionWhen(next.startsAt, '')}`
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
