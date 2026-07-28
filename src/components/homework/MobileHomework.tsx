import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  getLearner,
  getTeacher,
  toggleHomeworkDone,
  useLearners,
  useSessions,
} from '../../mocks/store'
import type { HomeworkItem, Session, SubjectId } from '../../types'
import { SUBJECT_LABELS } from '../../types'
import { formatSessionWhen } from '../../lib/format'

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

/**
 * Mobile homework — list-first, compact filters. Desktop stays in HomeworkPage.
 */
export function MobileHomework() {
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
    <div className="flex flex-col gap-2.5 animate-rise lg:hidden">
      {/* Compact header + inline stats */}
      <div className="flex items-end justify-between gap-2 px-0.5">
        <h1 className="text-lg font-extrabold tracking-tight text-ink">Homework</h1>
        <div className="flex items-center gap-2 text-[10px] font-bold tabular-nums text-muted">
          <span>
            <span className="text-ink">{openCount}</span> open
          </span>
          <span className="text-line">·</span>
          <span>
            <span className="text-ink">{doneCount}</span> done
          </span>
          {audioOpen > 0 ? (
            <>
              <span className="text-line">·</span>
              <span className="text-brand-700">{audioOpen} audio</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Learner chips — horizontal scroll */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 snap-x snap-mandatory">
        <Chip
          active={learnerFilter === 'all'}
          onClick={() => setParams({})}
          label="Everyone"
        />
        {learners.map((l) => (
          <Chip
            key={l.id}
            active={learnerFilter === l.id}
            onClick={() => setParams({ learner: l.id })}
            label={l.kind === 'self' ? 'You' : l.name.split(' ')[0]}
            color={l.avatarColor}
          />
        ))}
      </div>

      {/* Search + status/kind in one compact block */}
      <div className="space-y-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-xl bg-canvas px-3 py-2 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-brand-500/30"
        />
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
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
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                status === id
                  ? 'bg-brand-800 text-white'
                  : 'bg-canvas text-muted ring-1 ring-line'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="mx-0.5 h-3 w-px shrink-0 bg-line" aria-hidden />
          {(
            [
              ['all', 'Any'],
              ['audio', 'Audio'],
              ['text', 'Written'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setKind(id)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                kind === id
                  ? 'bg-brass text-brand-900'
                  : 'bg-canvas text-muted ring-1 ring-line'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-canvas/70 px-3 py-8 text-center">
          <p className="text-sm font-semibold text-ink">No homework here</p>
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-brand-700"
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
        <section className="overflow-hidden rounded-xl bg-canvas ring-1 ring-line/80">
          <p className="border-b border-line/60 px-3 py-2 text-[10px] font-bold text-muted">
            {filtered.length} assignment{filtered.length === 1 ? '' : 's'}
          </p>
          <ul className="divide-y divide-line/60">
            {filtered.map((item) => {
              const learner = getLearner(item.learnerId)
              const teacher = getTeacher(item.teacherId)
              const href = item.requiresAudio
                ? `/sessions/${item.sessionId}/homework/${item.id}`
                : `/sessions/${item.sessionId}`
              return (
                <li
                  key={`${item.sessionId}-${item.id}`}
                  className={`flex items-start gap-2.5 px-3 py-2.5 ${
                    item.done ? 'bg-surface/40 opacity-70' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleHomeworkDone(item.sessionId, item.id)}
                    className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border text-[9px] font-bold ${
                      item.done
                        ? 'border-brand-700 bg-brand-700 text-white'
                        : 'border-brand-600/35 bg-brand-50 text-transparent'
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
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-muted">
                      {learner ? (
                        <span
                          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
                          style={{ background: learner.avatarColor }}
                        >
                          {shortName(item.learnerId)}
                        </span>
                      ) : null}
                      <span>{SUBJECT_LABELS[item.subject]}</span>
                      {item.requiresAudio ? (
                        <span className="rounded-full bg-brass-soft px-1.5 py-0.5 text-[9px] font-bold text-brand-800">
                          Audio
                        </span>
                      ) : null}
                      {teacher ? (
                        <span className="truncate">
                          · {teacher.name.replace(/^(Ustadh|Ustadha|Shaykh)\s+/, '')}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {formatSessionWhen(item.startsAt, item.slotLabel)}
                    </p>
                  </div>
                  <Link
                    to={href}
                    className="shrink-0 self-center rounded-lg bg-brand-700 px-2 py-1 text-[10px] font-bold text-white"
                  >
                    {item.requiresAudio ? 'Record' : 'Open'}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}

function Chip({
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
      className={`inline-flex shrink-0 snap-start items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
        active
          ? 'bg-brand-800 text-white'
          : 'bg-canvas text-muted ring-1 ring-line'
      }`}
    >
      {color ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} /> : null}
      {label}
    </button>
  )
}
