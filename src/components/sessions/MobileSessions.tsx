import { Link } from 'react-router-dom'
import {
  getEngagement,
  getLearner,
  getTeacher,
} from '../../mocks/store'
import {
  ENGAGEMENT_STATUS_LABELS,
  PACKAGE_SESSION_COUNT,
  SUBJECT_LABELS,
  type TeachingEngagement,
} from '../../types'
import type { Session } from '../../types'
import { PaymentPill, StatusPill } from '../StatusPill'
import { lastFuturePaidSession } from '../../mocks/engagementHelpers'
import {
  formatPaidThroughDate,
  formatSessionTime,
} from '../../lib/format'

type DayGroup = {
  key: string
  label: string
  upcoming: boolean
  sessions: Session[]
}

function learnerNames(ids: string[]) {
  return ids
    .map((id) => {
      const l = getLearner(id)
      if (!l) return null
      return l.kind === 'self' ? 'You' : l.name.split(' ')[0]
    })
    .filter(Boolean)
    .join(', ')
}

function homeworkMeta(session: Session) {
  const items = session.homework
  if (!items || items.length === 0) return null
  const open = items.filter((h) => !h.done).length
  if (open === 0) return 'Hw done'
  return `${open} hw`
}

type Props = {
  justRequested?: string
  yourTeachers: TeachingEngagement[]
  notHired: TeachingEngagement[]
  allSessions: Session[]
  filterId: string
  learners: { id: string; kind: string; name: string; avatarColor: string }[]
  groups: DayGroup[]
  onSetLearner: (id: string | null) => void
  onEnd: (engagementId: string, teacherName: string) => void
  onNotHire: (engagementId: string, teacherName: string) => void
}

/**
 * Mobile sessions — compact teachers strip + day timeline.
 * Desktop tree stays in SessionsPage (lg+).
 */
export function MobileSessions({
  justRequested,
  yourTeachers,
  notHired,
  allSessions,
  filterId,
  learners,
  groups,
  onSetLearner,
  onEnd,
  onNotHire,
}: Props) {
  return (
    <div className="flex flex-col gap-2.5 animate-rise lg:hidden">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h1 className="text-lg font-extrabold tracking-tight text-ink">Sessions</h1>
        <div className="flex shrink-0 gap-1.5">
          <Link
            to="/sessions/join"
            className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-bold text-brand-800 ring-1 ring-line"
          >
            Join
          </Link>
          <Link
            to="/learn"
            className="rounded-full bg-brand-700 px-2.5 py-1 text-[11px] font-bold text-white"
          >
            Hire
          </Link>
        </div>
      </div>

      {justRequested ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-800">
          Request sent. Your teacher will review it.
        </div>
      ) : null}

      {yourTeachers.length > 0 ? (
        <div className="space-y-1.5">
          <h2 className="px-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Your teachers
          </h2>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 snap-x snap-mandatory">
            {yourTeachers.map((eng) => (
              <MobileTeacherCard
                key={eng.id}
                eng={eng}
                sessions={allSessions}
                onEnd={() => {
                  const teacher = getTeacher(eng.teacherId)
                  onEnd(eng.id, teacher?.name ?? 'this teacher')
                }}
                onNotHire={() => {
                  const teacher = getTeacher(eng.teacherId)
                  onNotHire(eng.id, teacher?.name ?? 'this teacher')
                }}
              />
            ))}
          </div>
        </div>
      ) : null}

      {notHired.length > 0 ? (
        <details className="rounded-xl bg-canvas ring-1 ring-line/80">
          <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-bold text-muted">
            Not hired ({notHired.length})
          </summary>
          <ul className="divide-y divide-line/60 border-t border-line/60">
            {notHired.map((eng) => {
              const teacher = getTeacher(eng.teacherId)
              if (!teacher) return null
              return (
                <li key={eng.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink">{teacher.name}</p>
                    <p className="truncate text-[10px] text-muted">
                      {SUBJECT_LABELS[eng.subject]} · {learnerNames(eng.learnerIds)}
                    </p>
                  </div>
                  <Link
                    to={`/learn/${teacher.id}`}
                    className="shrink-0 text-[10px] font-bold text-brand-700"
                  >
                    Learn →
                  </Link>
                </li>
              )
            })}
          </ul>
        </details>
      ) : null}

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 snap-x snap-mandatory">
        <Chip
          active={filterId === 'all'}
          onClick={() => onSetLearner(null)}
          label="Everyone"
        />
        {learners.map((l) => (
          <Chip
            key={l.id}
            active={filterId === l.id}
            onClick={() => onSetLearner(l.id)}
            label={l.kind === 'self' ? 'You' : l.name.split(' ')[0]}
            color={l.avatarColor}
          />
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-canvas/70 px-3 py-8 text-center">
          <p className="text-sm font-semibold text-ink">No sessions yet</p>
          <p className="mt-1 text-xs text-muted">Hire a teacher from Learn to get started.</p>
          <Link
            to="/learn"
            className="mt-3 inline-block rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-bold text-white"
          >
            Go to Learn
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-1.5 px-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                {group.label}
              </h2>
              <ul className="overflow-hidden rounded-xl bg-canvas ring-1 ring-line/80 divide-y divide-line/60">
                {group.sessions.map((session) => {
                  const teacher = getTeacher(session.teacherId)
                  if (!teacher) return null
                  const hw = homeworkMeta(session)
                  const eng = getEngagement(session.engagementId)
                  return (
                    <li key={session.id}>
                      <Link
                        to={`/sessions/${session.id}`}
                        className="flex items-center gap-2.5 px-3 py-2.5 active:bg-brand-50/60"
                      >
                        <div
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-white"
                          style={{ background: teacher.avatarColor }}
                        >
                          {teacher.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ink">{session.title}</p>
                          <p className="mt-0.5 truncate text-[10px] text-muted">
                            {formatSessionTime(session.startsAt)} · {learnerNames(session.learnerIds)} ·{' '}
                            {session.durationMinutes}m
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <PaymentPill status={session.paymentStatus} />
                            {hw ? (
                              <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-800">
                                {hw}
                              </span>
                            ) : null}
                            {eng?.status === 'pending' ? (
                              <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">
                                Pending
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <StatusPill status={session.status} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function MobileTeacherCard({
  eng,
  sessions,
  onEnd,
  onNotHire,
}: {
  eng: TeachingEngagement
  sessions: Session[]
  onEnd: () => void
  onNotHire: () => void
}) {
  const teacher = getTeacher(eng.teacherId)
  if (!teacher) return null

  const awaitingPay = eng.status === 'awaiting_payment'
  const showPay = awaitingPay || eng.status === 'active'
  const paidThrough =
    eng.status === 'active' ? lastFuturePaidSession(sessions, eng.id) : null

  return (
    <div
      className={[
        'w-[16.5rem] shrink-0 snap-start rounded-xl p-3',
        awaitingPay ? 'bg-brand-50 ring-2 ring-brand-200' : 'bg-canvas ring-1 ring-line/80',
      ].join(' ')}
    >
      <div className="flex items-start gap-2">
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-white"
          style={{ background: teacher.avatarColor }}
        >
          {teacher.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-ink">{teacher.name}</p>
          <p className="truncate text-[10px] text-muted">
            {SUBJECT_LABELS[eng.subject]} · {ENGAGEMENT_STATUS_LABELS[eng.status]}
          </p>
          <p className="truncate text-[10px] text-muted">{learnerNames(eng.learnerIds)}</p>
        </div>
      </div>

      {paidThrough ? (
        <p className="mt-1.5 text-[10px] font-semibold text-brand-800">
          Paid through {formatPaidThroughDate(paidThrough.startsAt)}
        </p>
      ) : null}
      {awaitingPay ? (
        <p className="mt-1.5 text-[10px] text-brand-800">
          Pay for {PACKAGE_SESSION_COUNT}+ sessions to hire.
        </p>
      ) : null}
      {eng.teacherMessage ? (
        <p className="mt-1 line-clamp-2 text-[10px] text-amber-900">
          Teacher: {eng.teacherMessage}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {showPay ? (
          <Link
            to={`/engagements/${eng.id}/checkout`}
            className="rounded-lg bg-brand-700 px-2 py-1 text-[10px] font-bold text-white"
          >
            {awaitingPay ? 'Pay' : 'Pay more'}
          </Link>
        ) : null}
        <Link
          to={`/learn/${teacher.id}`}
          className="rounded-lg bg-surface px-2 py-1 text-[10px] font-bold text-brand-800 ring-1 ring-line"
        >
          Profile
        </Link>
        {awaitingPay || eng.status === 'pending' ? (
          <button
            type="button"
            onClick={onNotHire}
            className="rounded-lg px-2 py-1 text-[10px] font-bold text-red-800"
          >
            {eng.status === 'pending' ? 'Withdraw' : 'Don’t hire'}
          </button>
        ) : null}
        {eng.status === 'active' || eng.status === 'intro_scheduled' ? (
          <button
            type="button"
            onClick={onEnd}
            className="rounded-lg px-2 py-1 text-[10px] font-bold text-red-800"
          >
            End
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Chip({
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
        'inline-flex shrink-0 snap-start items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition',
        active
          ? 'bg-brand-700 text-white'
          : 'bg-canvas text-muted ring-1 ring-line',
      ].join(' ')}
    >
      {color ? (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: active ? 'white' : color }}
        />
      ) : null}
      {label}
    </button>
  )
}
