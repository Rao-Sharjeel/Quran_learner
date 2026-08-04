import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { getTeacher } from '../../mocks/store'
import type { AskQuestion, HomeworkItem, LearnerProfile, Session } from '../../types'
import { SUBJECT_LABELS } from '../../types'
import { formatSessionTime, sessionDayLabel } from '../../lib/format'

type OpenHw = HomeworkItem & { sessionId: string }

type Props = {
  learner: LearnerProfile
  displayName: string
  homeworkCount: number
  askOpen: number
  upcoming: Session[]
  openHw: OpenHw[]
  learnerAsks: AskQuestion[]
}

/**
 * Mobile learner hub — compact profile, quick actions, dense lists.
 * Desktop tree stays in KidHubPage (lg+).
 */
export function MobileKidHub({
  learner,
  displayName,
  homeworkCount,
  askOpen,
  upcoming,
  openHw,
  learnerAsks,
}: Props) {
  return (
    <div className="flex flex-col gap-2.5 animate-rise lg:hidden">
      <Link
        to="/kids"
        className="px-0.5 text-xs font-medium text-brand-700 hover:text-brand-800"
      >
        ← Family
      </Link>

      <div className="rounded-2xl border border-line bg-surface px-3 py-3">
        <div className="flex items-center gap-3">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
            style={{ background: learner.avatarColor }}
          >
            {learner.initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold tracking-tight text-ink">
              {displayName}
            </h1>
            <p className="mt-0.5 truncate text-[11px] text-muted">
              {learner.kind === 'self' ? 'Your learning' : learner.gradeLabel ?? 'Learner'} ·{' '}
              {learner.hifzSummary}
            </p>
            <p className="mt-1 text-[10px] font-medium tabular-nums text-muted">
              <span className="text-ink">{homeworkCount}</span> hw ·{' '}
              <span className="text-ink">{askOpen}</span> Ask ·{' '}
              <span className="text-ink">{learner.readingMinutesWeek}</span> min read
            </p>
          </div>
        </div>

        <div className="-mx-0.5 mt-3 flex gap-1.5 overflow-x-auto border-t border-line px-0.5 pt-3 pb-0.5 snap-x snap-mandatory">
          <ActionChip to={`/learn?for=${learner.id}`} label="Book" primary />
          <ActionChip to={`/sessions?learner=${learner.id}`} label="Sessions" />
          <ActionChip to="/ask/new" label="Ask" />
          <ActionChip to={`/homework?learner=${learner.id}`} label="Homework" />
          {learner.kind === 'kid' ? (
            <ActionChip to={`/kids/${learner.id}/edit`} label="Edit" />
          ) : null}
        </div>
      </div>

      <Section
        title="Upcoming"
        empty="No upcoming sessions"
        action={
          <Link
            to={`/sessions?learner=${learner.id}`}
            className="text-[11px] font-bold text-brand-700"
          >
            All →
          </Link>
        }
      >
        {upcoming.length === 0 ? null : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {upcoming.map((session) => {
              const teacher = getTeacher(session.teacherId)
              if (!teacher) return null
              return (
                <li key={session.id}>
                  <Link
                    to={`/sessions/${session.id}`}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 active:bg-brand-50/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{session.title}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {teacher.name} · {SUBJECT_LABELS[session.subject]} ·{' '}
                        {sessionDayLabel(session.startsAt)}{' '}
                        {formatSessionTime(session.startsAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-brand-700">→</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section
        title="Homework"
        empty="No open homework"
        action={
          <Link
            to={`/homework?learner=${learner.id}`}
            className="text-[11px] font-bold text-brand-700"
          >
            Manage →
          </Link>
        }
      >
        {openHw.length === 0 ? null : (
          <ul className="space-y-1.5">
            {openHw.map((h) => (
              <li
                key={h.id}
                className="rounded-xl border border-line bg-canvas/60 px-3 py-2"
              >
                <p className="text-xs text-ink line-clamp-2">{h.text}</p>
                <Link
                  to={
                    h.requiresAudio
                      ? `/sessions/${h.sessionId}/homework/${h.id}`
                      : `/sessions/${h.sessionId}`
                  }
                  className="mt-1 inline-block text-[10px] font-bold text-brand-700"
                >
                  {h.requiresAudio ? 'Audio workspace →' : 'Session →'}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Ask Scholars" empty="No questions yet">
        {learnerAsks.length === 0 ? null : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {learnerAsks.map((q) => (
              <li key={q.id}>
                <Link
                  to={`/ask/${q.id}`}
                  className="block px-3 py-2.5 active:bg-brand-50/60"
                >
                  <p className="truncate text-sm font-semibold text-ink">{q.title}</p>
                  <p className="mt-0.5 text-[11px] capitalize text-muted">
                    {q.status.replace('_', ' ')}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Reading">
        <p className="text-xs text-ink">
          <span className="font-bold tabular-nums">{learner.readingMinutesWeek}</span> min this
          week
        </p>
        <p className="mt-0.5 text-[11px] text-muted">
          {learner.lastReadingTitle
            ? `Last: ${learner.lastReadingTitle}`
            : 'No recent reading yet.'}
        </p>
        <Link
          to="/library"
          className="mt-2 inline-block text-[11px] font-bold text-brand-700"
        >
          Open library →
        </Link>
      </Section>
    </div>
  )
}

function ActionChip({
  to,
  label,
  primary,
}: {
  to: string
  label: string
  primary?: boolean
}) {
  return (
    <Link
      to={to}
      className={[
        'snap-start shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold',
        primary
          ? 'bg-brand-700 text-white'
          : 'bg-canvas text-brand-800 ring-1 ring-line',
      ].join(' ')}
    >
      {label}
    </Link>
  )
}

function Section({
  title,
  empty,
  action,
  children,
}: {
  title: string
  empty?: string
  action?: ReactNode
  children: ReactNode
}) {
  const isEmpty = children == null

  return (
    <section className="rounded-2xl border border-line bg-surface px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold tracking-tight text-ink">{title}</h2>
        {action}
      </div>
      {isEmpty && empty ? <p className="text-xs text-muted">{empty}</p> : children}
    </section>
  )
}
