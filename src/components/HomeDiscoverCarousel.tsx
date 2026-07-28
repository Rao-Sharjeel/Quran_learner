import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getLearner,
  getTeacher,
  listCourses,
  listTeachers,
  toggleHomeworkDone,
} from '../mocks/store'
import type { Course, HomeworkItem, SubjectId, Teacher } from '../types'
import { SUBJECT_LABELS } from '../types'

type OpenHomeworkRow = HomeworkItem & {
  sessionId: string
  learnerId: string
  subject: SubjectId
  teacherId: string
}

const SLIDES = [
  {
    id: 'homework',
    label: 'Homework',
    eyebrow: 'Family tasks',
    shell: 'bg-brand-50 outline-brand-100',
    tabOn: 'bg-brand-700 text-white',
    tabOff: 'bg-canvas/80 text-muted ring-1 ring-brand-100 hover:text-ink',
    dotOn: 'bg-brand-700',
    dotOff: 'bg-brand-200 hover:bg-brand-500',
    border: 'border-brand-100',
    eyebrowClass: 'text-brand-600',
    linkClass: 'text-brand-700',
  },
  {
    id: 'new',
    label: 'New courses',
    eyebrow: 'Just arrived',
    shell: 'bg-brand-100/70 outline-brand-200',
    tabOn: 'bg-brand-800 text-white',
    tabOff: 'bg-canvas/70 text-muted ring-1 ring-brand-200/80 hover:text-ink',
    dotOn: 'bg-brand-800',
    dotOff: 'bg-brand-200 hover:bg-brand-500',
    border: 'border-brand-200/80',
    eyebrowClass: 'text-brand-700',
    linkClass: 'text-brand-800',
  },
  {
    id: 'popular',
    label: 'Popular',
    eyebrow: 'Trending',
    shell: 'bg-brass-soft/55 outline-[#d9c89a]',
    tabOn: 'bg-[#8a641c] text-brass-soft',
    tabOff: 'bg-canvas/70 text-muted ring-1 ring-[#d9c89a] hover:text-ink',
    dotOn: 'bg-brass',
    dotOff: 'bg-[#d4c194] hover:bg-brass',
    border: 'border-[#d9c89a]',
    eyebrowClass: 'text-[#8a641c]',
    linkClass: 'text-[#8a641c]',
  },
  {
    id: 'scholars',
    label: 'Scholars',
    eyebrow: 'Selected',
    shell: 'bg-brand-800 outline-brand-800 text-brand-50',
    tabOn: 'bg-brass text-brand-900',
    tabOff: 'bg-brand-700/80 text-brand-100 ring-1 ring-white/10 hover:bg-brand-700',
    dotOn: 'bg-brass',
    dotOff: 'bg-brand-600 hover:bg-brass/70',
    border: 'border-white/10',
    eyebrowClass: 'text-brass-soft',
    linkClass: 'text-brass-soft',
  },
] as const

const AUTO_MS = 5500

function shortName(learnerId: string) {
  const learner = getLearner(learnerId)
  if (!learner) return 'Learner'
  return learner.kind === 'self' ? 'You' : learner.name.split(' ')[0]
}

function levelLabel(level: Course['level']) {
  return level[0]!.toUpperCase() + level.slice(1)
}

function teacherGiven(name: string) {
  return name.replace(/^(Ustadh|Ustadha|Shaykh)\s+/, '')
}

/**
 * Home middle column: auto-rotating discover carousel.
 * Each slide has its own visual language.
 */
export function HomeDiscoverCarousel({
  openHomework,
}: {
  openHomework: OpenHomeworkRow[]
}) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const slide = SLIDES[index]!

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
    }, AUTO_MS)
    return () => window.clearInterval(id)
  }, [paused])

  const courses = listCourses()
  const newCourses = courses.filter((c) => c.isNew).slice(0, 4)
  const popularCourses = [...courses]
    .filter((c) => c.isPopular)
    .sort((a, b) => b.students - a.students)
    .slice(0, 4)
  const scholars = [...listTeachers()]
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, 4)

  const footerLink =
    slide.id === 'homework'
      ? { to: '/homework', label: 'Manage homework →' }
      : { to: '/learn', label: slide.id === 'scholars' ? 'All teachers →' : 'Browse →' }

  const mutedFooter =
    slide.id === 'scholars' ? 'text-brand-200' : 'text-muted'
  const titleClass = slide.id === 'scholars' ? 'text-white' : 'text-ink'

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-2xl shadow-sm outline outline-1 transition-colors duration-500 ${slide.shell}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false)
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-1.5">
        <div className="min-w-0">
          <p
            className={`text-[9px] font-bold uppercase tracking-[0.14em] ${slide.eyebrowClass}`}
          >
            {slide.eyebrow}
          </p>
          <h2 className={`truncate text-sm font-bold tracking-tight ${titleClass}`}>
            {slide.label}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Show ${s.label}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition ${
                i === index ? `w-4 ${slide.dotOn}` : `w-1.5 ${slide.dotOff}`
              }`}
            />
          ))}
        </div>
      </div>

      <div className={`flex shrink-0 gap-1 overflow-x-auto border-t px-2 py-1.5 ${slide.border}`}>
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold transition ${
              i === index ? slide.tabOn : slide.tabOff
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={`relative min-h-0 flex-1 overflow-hidden border-t ${slide.border}`}>
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          <SlidePane>
            <HomeworkSlide items={openHomework} />
          </SlidePane>
          <SlidePane>
            <NewCoursesSlide courses={newCourses} />
          </SlidePane>
          <SlidePane>
            <PopularCoursesSlide courses={popularCourses} />
          </SlidePane>
          <SlidePane>
            <ScholarsSlide scholars={scholars} />
          </SlidePane>
        </div>
      </div>

      <div
        className={`flex shrink-0 items-center justify-between gap-2 border-t px-3 py-1.5 ${slide.border}`}
      >
        <span className={`text-[10px] font-medium ${mutedFooter}`}>
          {paused ? 'Paused' : 'Auto-rotating'}
        </span>
        <Link to={footerLink.to} className={`text-[11px] font-semibold ${slide.linkClass}`}>
          {footerLink.label}
        </Link>
      </div>
    </section>
  )
}

function SlidePane({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full min-h-0 w-full shrink-0 overflow-y-auto p-2">{children}</div>
  )
}

/** Clean task cards — soft pine, no notepad motif */
function HomeworkSlide({ items }: { items: OpenHomeworkRow[] }) {
  if (items.length === 0) {
    return (
      <div className="grid min-h-28 place-items-center rounded-xl bg-canvas/80 px-3 text-center ring-1 ring-brand-100">
        <div>
          <p className="text-sm font-semibold text-ink">You’re clear</p>
          <p className="mt-0.5 text-[11px] text-muted">No open homework right now.</p>
        </div>
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
            <div className="flex items-start gap-2 rounded-xl bg-canvas/90 px-2.5 py-2 ring-1 ring-brand-100 transition hover:ring-brand-200">
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
                      {shortName(item.learnerId)}
                    </span>
                  ) : null}
                  <span className="text-[10px] font-medium text-muted">
                    {SUBJECT_LABELS[item.subject]}
                  </span>
                  {item.requiresAudio ? (
                    <span className="rounded-full bg-brass-soft px-1.5 py-0.5 text-[9px] font-bold text-brand-800">
                      Audio
                    </span>
                  ) : (
                    <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-800">
                      Task
                    </span>
                  )}
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

/** Fresh pine tiles — no blue */
function NewCoursesSlide({ courses }: { courses: Course[] }) {
  if (courses.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-brand-200 bg-canvas/70 px-3 py-6 text-center text-sm text-muted">
        No new courses yet.
      </p>
    )
  }

  return (
    <ul className="space-y-1.5">
      {courses.map((course) => {
        const teacher = getTeacher(course.teacherId)
        return (
          <li key={course.id}>
            <Link
              to={`/learn/${course.teacherId}`}
              className="group relative flex overflow-hidden rounded-xl bg-canvas/90 ring-1 ring-brand-200/80 transition hover:-translate-y-0.5 hover:bg-canvas hover:shadow-sm"
            >
              <span
                className="w-1.5 shrink-0"
                style={{ background: course.accentColor }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 p-2.5">
                <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-brand-800 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-brand-50">
                  New
                </span>
                <span className="block truncate text-sm font-extrabold tracking-tight text-ink">
                  {course.title}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-muted">
                  {teacher ? teacherGiven(teacher.name) : 'Teacher'} ·{' '}
                  {SUBJECT_LABELS[course.subject]}
                </span>
                <span className="mt-1.5 flex items-center gap-2 text-[10px] font-semibold text-brand-700">
                  <span>{levelLabel(course.level)}</span>
                  <span className="text-brand-200">·</span>
                  <span>{course.weeks} weeks</span>
                </span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/** Ranked leaderboard with brass medals + enrollment bars */
function PopularCoursesSlide({ courses }: { courses: Course[] }) {
  if (courses.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#d9c89a] bg-canvas/70 px-3 py-6 text-center text-sm text-muted">
        No popular courses yet.
      </p>
    )
  }

  const maxStudents = Math.max(...courses.map((c) => c.students), 1)

  return (
    <ul className="space-y-1.5">
      {courses.map((course, i) => {
        const teacher = getTeacher(course.teacherId)
        const rank = i + 1
        const pct = Math.round((course.students / maxStudents) * 100)
        return (
          <li key={course.id}>
            <Link
              to={`/learn/${course.teacherId}`}
              className="flex items-center gap-2 rounded-xl bg-canvas/85 px-2 py-2 ring-1 ring-[#d9c89a] transition hover:bg-brass-soft/40"
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${
                  rank === 1
                    ? 'bg-brass text-brand-900 shadow-sm'
                    : rank === 2
                      ? 'bg-[#c9b07a] text-brand-900'
                      : rank === 3
                        ? 'bg-[#b89f68] text-brand-900'
                        : 'bg-surface text-[#8a641c]'
                }`}
              >
                {rank}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ink">{course.title}</span>
                <span className="mt-0.5 block truncate text-[10px] text-muted">
                  {teacher ? teacherGiven(teacher.name) : 'Teacher'}
                </span>
                <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-surface">
                  <span
                    className="block h-full rounded-full bg-brass"
                    style={{ width: `${Math.max(18, pct)}%` }}
                  />
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-xs font-extrabold tabular-nums text-[#8a641c]">
                  {course.students}
                </span>
                <span className="block text-[8px] font-bold uppercase tracking-wide text-muted">
                  enrolled
                </span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/** Dark scholarly roster */
function ScholarsSlide({ scholars }: { scholars: Teacher[] }) {
  return (
    <ul className="space-y-1.5">
      {scholars.map((teacher) => (
        <li key={teacher.id}>
          <Link
            to={`/learn/${teacher.id}`}
            className="flex items-center gap-2.5 rounded-xl bg-brand-700/50 px-2 py-2 ring-1 ring-white/10 transition hover:bg-brand-700/80"
          >
            <span className="relative shrink-0">
              <span
                className="grid h-11 w-11 place-items-center rounded-full text-[11px] font-extrabold text-white ring-2 ring-brass/50"
                style={{ background: teacher.avatarColor }}
              >
                {teacher.initials}
              </span>
              {teacher.badges.includes('forum_scholar') ? (
                <span className="absolute -bottom-0.5 -end-0.5 grid h-4 w-4 place-items-center rounded-full bg-brass text-[8px] font-extrabold text-brand-900">
                  ★
                </span>
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-white">{teacher.name}</span>
              <span className="mt-0.5 block truncate text-[11px] text-brand-200">
                {teacher.subjects
                  .slice(0, 2)
                  .map((s) => SUBJECT_LABELS[s])
                  .join(' · ')}
              </span>
            </span>
            <span className="shrink-0 rounded-lg bg-brass/15 px-2 py-1 text-center ring-1 ring-brass/35">
              <span className="block text-xs font-extrabold tabular-nums text-brass-soft">
                {teacher.rating.toFixed(1)}
              </span>
              <span className="block text-[8px] font-bold uppercase tracking-wide text-brand-200">
                {teacher.reviewCount} rev
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
