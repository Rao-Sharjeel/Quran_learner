import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  getLearner,
  getTeacher,
  toggleHomeworkDone,
  useLearners,
  useSessions,
} from '../mocks/store'
import type { HomeworkItem, Session, SubjectId } from '../types'
import { SUBJECT_LABELS } from '../types'
import { ButtonLink } from '../components/Button'
import { MobileHomework } from '../components/homework/MobileHomework'
import { formatSessionWhen } from '../lib/format'

type HomeworkRow = HomeworkItem & {
  sessionId: string
  learnerId: string
  subject: SubjectId
  teacherId: string
  startsAt: string
  slotLabel: string
  sessionStatus: Session['status']
}

type StatusFilter = 'open' | 'done' | 'all'
type KindFilter = 'all' | 'audio' | 'text'

function shortName(learnerId: string) {
  const learner = getLearner(learnerId)
  if (!learner) return 'Learner'
  return learner.kind === 'self' ? 'You' : learner.name.split(' ')[0]
}

function collectHomework(sessions: Session[]): HomeworkRow[] {
  return sessions
    .flatMap((s) =>
      (s.homework ?? []).map((h) => ({
        ...h,
        sessionId: s.id,
        learnerId: h.learnerId,
        subject: s.subject,
        teacherId: s.teacherId,
        startsAt: s.startsAt,
        slotLabel: '',
        sessionStatus: s.status,
      })),
    )
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      return b.startsAt.localeCompare(a.startsAt)
    })
}

export function HomeworkPage() {
  const [params, setParams] = useSearchParams()
  const learnerFilter = params.get('learner') ?? 'all'
  const [status, setStatus] = useState<StatusFilter>('open')
  const [kind, setKind] = useState<KindFilter>('all')
  const [query, setQuery] = useState('')

  const learners = useLearners()
  const sessions = useSessions()
  const all = useMemo(() => collectHomework(sessions), [sessions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((row) => {
      if (learnerFilter !== 'all' && row.learnerId !== learnerFilter) return false
      if (status === 'open' && row.done) return false
      if (status === 'done' && !row.done) return false
      if (kind === 'audio' && !row.requiresAudio) return false
      if (kind === 'text' && row.requiresAudio) return false
      if (!q) return true
      const teacher = getTeacher(row.teacherId)
      const hay = [
        row.text,
        SUBJECT_LABELS[row.subject],
        shortName(row.learnerId),
        teacher?.name ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [all, learnerFilter, status, kind, query])

  const openCount = all.filter((h) => !h.done).length
  const doneCount = all.filter((h) => h.done).length
  const audioOpen = all.filter((h) => !h.done && h.requiresAudio).length

  return (
    <>
      <MobileHomework />

      <div className="hidden space-y-6 animate-rise lg:block">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Homework
            </h1>
            <p className="mt-2 max-w-xl text-muted">
              Manage assignments across the family — mark complete, open audio reviews, or jump to
              the class.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to="/sessions" variant="secondary">
              Sessions
            </ButtonLink>
            <ButtonLink to="/app" variant="secondary">
              Home
            </ButtonLink>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Open" value={openCount} hint="Still to finish" />
          <StatCard label="Done" value={doneCount} hint="Completed" />
          <StatCard label="Audio due" value={audioOpen} hint="Needs a recording" />
        </div>

        <div className="space-y-3 panel p-4">
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={learnerFilter === 'all'}
              onClick={() => setParams({})}
              label="Everyone"
            />
            {learners.map((l) => (
              <FilterChip
                key={l.id}
                active={learnerFilter === l.id}
                onClick={() => setParams({ learner: l.id })}
                label={l.kind === 'self' ? 'You' : l.name.split(' ')[0]}
                color={l.avatarColor}
              />
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search homework, subject, or teacher"
              className="w-full flex-1 rounded-2xl bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line transition focus:bg-canvas focus:ring-2 focus:ring-brand-500/30"
            />
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['open', 'Open'],
                  ['done', 'Done'],
                  ['all', 'All'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStatus(id)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                    status === id
                      ? 'bg-brand-800 text-white'
                      : 'bg-surface text-muted ring-1 ring-line hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['all', 'Any type'],
                  ['audio', 'Audio'],
                  ['text', 'Written'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setKind(id)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                    kind === id
                      ? 'bg-brass text-brand-900'
                      : 'bg-surface text-muted ring-1 ring-line hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm text-muted">
          {filtered.length === 0
            ? 'No homework matches these filters.'
            : `${filtered.length} assignment${filtered.length === 1 ? '' : 's'}`}
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-canvas/70 px-5 py-12 text-center">
            <p className="font-semibold text-ink">No homework here</p>
            <p className="mt-1 text-sm text-muted">
              Try another learner filter, or clear Open / Audio toggles.
            </p>
            <button
              type="button"
              className="mt-4 text-sm font-semibold text-brand-700"
              onClick={() => {
                setParams({})
                setStatus('all')
                setKind('all')
                setQuery('')
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-canvas shadow-sm outline outline-1 outline-line">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-brand-700">
                Family homework
              </p>
              <p className="text-[11px] font-bold text-muted">
                {openCount} open · {doneCount} done
              </p>
            </div>
            <ul className="divide-y divide-line">
              {filtered.map((item) => {
                const learner = getLearner(item.learnerId)
                const teacher = getTeacher(item.teacherId)
                const href = item.requiresAudio
                  ? `/sessions/${item.sessionId}/homework/${item.id}`
                  : `/sessions/${item.sessionId}`
                return (
                  <li
                    key={`${item.sessionId}-${item.id}`}
                    className={`group flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center ${
                      item.done ? 'bg-surface/40 opacity-70' : 'bg-canvas'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleHomeworkDone(item.sessionId, item.id)}
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-bold transition ${
                        item.done
                          ? 'border-brand-700 bg-brand-700 text-white'
                          : 'border-brand-600/35 bg-brand-50 text-transparent hover:border-brand-700 hover:text-brand-700'
                      }`}
                      aria-label={item.done ? `Mark open: ${item.text}` : `Mark done: ${item.text}`}
                    >
                      ✓
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold leading-snug text-ink ${
                          item.done ? 'line-through decoration-brand-700/40' : ''
                        }`}
                      >
                        {item.text}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {learner ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                            style={{ background: learner.avatarColor }}
                          >
                            {shortName(item.learnerId)}
                          </span>
                        ) : null}
                        <span className="text-[11px] font-medium text-muted">
                          {SUBJECT_LABELS[item.subject]}
                        </span>
                        {teacher ? (
                          <span className="text-[11px] text-muted">
                            · {teacher.name.replace(/^(Ustadh|Ustadha|Shaykh)\s+/, '')}
                          </span>
                        ) : null}
                        <span className="text-[11px] text-muted">
                          · {formatSessionWhen(item.startsAt, item.slotLabel)}
                        </span>
                        {item.requiresAudio ? (
                          <span className="rounded-full bg-brass-soft px-1.5 py-0.5 text-[9px] font-bold text-brand-800">
                            Audio
                          </span>
                        ) : null}
                        {item.done ? (
                          <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-800">
                            Done
                          </span>
                        ) : null}
                        {item.submission ? (
                          <span className="rounded-full bg-brand-800 px-1.5 py-0.5 text-[9px] font-bold text-brand-50">
                            Uploaded
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                      <Link
                        to={href}
                        className="rounded-xl bg-brand-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-800"
                      >
                        {item.requiresAudio ? 'Audio review' : 'Open class'}
                      </Link>
                      <Link
                        to={`/sessions/${item.sessionId}`}
                        className="rounded-xl bg-surface px-3 py-1.5 text-xs font-bold text-brand-800 ring-1 ring-line transition hover:bg-brand-50"
                      >
                        Session
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: number
  hint: string
}) {
  return (
    <div className="rounded-2xl bg-canvas px-4 py-3 shadow-sm outline outline-1 outline-line">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">{value}</p>
      <p className="text-[11px] text-muted">{hint}</p>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean
  onClick: () => void
  label: string
  color?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
        active
          ? 'bg-brand-800 text-white'
          : 'bg-surface text-muted ring-1 ring-line hover:text-ink'
      }`}
    >
      {color ? (
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      ) : null}
      {label}
    </button>
  )
}
