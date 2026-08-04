import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  endEngagement,
  getEngagement,
  getLearner,
  getTeacher,
  markNotHired,
  useEngagements,
  useLearners,
  useSessions,
} from '../mocks/store'
import { lastFuturePaidSession } from '../mocks/engagementHelpers'
import {
  ENGAGEMENT_STATUS_LABELS,
  PACKAGE_SESSION_COUNT,
  SUBJECT_LABELS,
  type TeachingEngagement,
} from '../types'
import { ButtonLink } from '../components/Button'
import { ConfirmModal } from '../components/ConfirmModal'
import { MobileSessions } from '../components/sessions/MobileSessions'
import { PaymentPill, StatusPill } from '../components/StatusPill'
import {
  formatPaidThroughDate,
  formatSessionTime,
  isSessionDayUpcoming,
  sessionDayKey,
  sessionDayLabel,
} from '../lib/format'
import type { Session } from '../types'

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
  if (open === 0) return 'Homework done'
  return `${open} homework open`
}

type DayGroup = {
  key: string
  label: string
  upcoming: boolean
  sessions: Session[]
}

function groupSessionsByDay(sessions: Session[]): DayGroup[] {
  const byKey = new Map<string, Session[]>()
  for (const session of sessions) {
    const key = sessionDayKey(session.startsAt)
    const list = byKey.get(key)
    if (list) list.push(session)
    else byKey.set(key, [session])
  }

  const groups: DayGroup[] = [...byKey.entries()].map(([key, daySessions]) => {
    const sorted = [...daySessions].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )
    const first = sorted[0]!
    return {
      key,
      label: sessionDayLabel(first.startsAt),
      upcoming: isSessionDayUpcoming(first.startsAt),
      sessions: sorted,
    }
  })

  const upcoming = groups
    .filter((g) => g.upcoming)
    .sort((a, b) => a.key.localeCompare(b.key))
  const past = groups
    .filter((g) => !g.upcoming)
    .sort((a, b) => b.key.localeCompare(a.key))

  return [...upcoming, ...past]
}

type ConfirmAction =
  | { kind: 'end'; engagementId: string; teacherName: string }
  | { kind: 'not_hire'; engagementId: string; teacherName: string }

export function SessionsPage() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const justRequested = (location.state as { justRequested?: string } | null)?.justRequested
  const filterId = params.get('learner') ?? 'all'
  const learners = useLearners()
  const all = useSessions()
  const engagements = useEngagements()
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)

  const closeConfirm = useCallback(() => setConfirm(null), [])

  const yourTeachers = engagements.filter(
    (e) =>
      e.status !== 'declined' &&
      e.status !== 'ended' &&
      e.status !== 'not_hired',
  )
  const notHired = engagements.filter((e) => e.status === 'not_hired')

  const filtered = useMemo(() => {
    const horizon = new Date()
    horizon.setDate(horizon.getDate() + 60)
    const pastFloor = new Date()
    pastFloor.setDate(pastFloor.getDate() - 90)

    let list = all.filter((s) => {
      const t = new Date(s.startsAt).getTime()
      if (s.status === 'cancelled') return false
      if (s.status === 'completed') return t >= pastFloor.getTime()
      return t <= horizon.getTime()
    })
    if (filterId !== 'all') {
      list = list.filter((s) => s.learnerIds.includes(filterId))
    }
    return list
  }, [all, filterId])

  const groups = useMemo(() => groupSessionsByDay(filtered), [filtered])

  function openEnd(engagementId: string, teacherName: string) {
    setConfirm({ kind: 'end', engagementId, teacherName })
  }

  function openNotHire(engagementId: string, teacherName: string) {
    setConfirm({ kind: 'not_hire', engagementId, teacherName })
  }

  return (
    <>
      <MobileSessions
        justRequested={justRequested}
        yourTeachers={yourTeachers}
        notHired={notHired}
        allSessions={all}
        filterId={filterId}
        learners={learners}
        groups={groups}
        onSetLearner={(id) => (id ? setParams({ learner: id }) : setParams({}))}
        onEnd={openEnd}
        onNotHire={openNotHire}
      />

      <div className="hidden space-y-6 animate-rise lg:block">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Sessions
            </h1>
            <p className="mt-2 text-muted">
              Timeline with teachers you’ve hired — about two months ahead. Hire someone new from
              Learn.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to="/sessions/join" variant="secondary">
              Join a class
            </ButtonLink>
            <ButtonLink to="/learn" variant="secondary">
              Hire a teacher
            </ButtonLink>
          </div>
        </div>

        {justRequested ? (
          <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
            Request sent. Your teacher will review it — check here and notifications when they
            respond.
          </div>
        ) : null}

        {yourTeachers.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
              Your teachers
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {yourTeachers.map((eng) => (
                <TeacherEngagementCard
                  key={eng.id}
                  eng={eng}
                  sessions={all}
                  onEnd={() => {
                    const teacher = getTeacher(eng.teacherId)
                    openEnd(eng.id, teacher?.name ?? 'this teacher')
                  }}
                  onNotHire={() => {
                    const teacher = getTeacher(eng.teacherId)
                    openNotHire(eng.id, teacher?.name ?? 'this teacher')
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {notHired.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
              Not hired
            </h2>
            <p className="text-sm text-muted">
              Teachers you chose not to continue with after the intro. You can still find them on
              Learn if you change your mind.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {notHired.map((eng) => {
                const teacher = getTeacher(eng.teacherId)
                if (!teacher) return null
                return (
                  <div
                    key={eng.id}
                    className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-ink">{teacher.name}</p>
                      <p className="text-sm text-muted">
                        {SUBJECT_LABELS[eng.subject]} · {ENGAGEMENT_STATUS_LABELS[eng.status]} ·{' '}
                        {learnerNames(eng.learnerIds)}
                      </p>
                    </div>
                    <ButtonLink to={`/learn/${teacher.id}`} variant="secondary">
                      View on Learn
                    </ButtonLink>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={filterId === 'all'}
            onClick={() => setParams({})}
            label="Everyone"
          />
          {learners.map((l) => (
            <FilterChip
              key={l.id}
              active={filterId === l.id}
              onClick={() => setParams({ learner: l.id })}
              label={l.kind === 'self' ? 'You' : l.name.split(' ')[0]}
              color={l.avatarColor}
            />
          ))}
        </div>

        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-canvas/70 px-5 py-10 text-center">
            <p className="font-semibold text-ink">No sessions yet</p>
            <p className="mt-1 text-sm text-muted">
              Hire a teacher from Learn to get started.
            </p>
            <ButtonLink to="/learn" className="mt-4">
              Go to Learn
            </ButtonLink>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.key} className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                  {group.label}
                </h2>
                <div className="space-y-3">
                  {group.sessions.map((session) => {
                    const teacher = getTeacher(session.teacherId)
                    if (!teacher) return null
                    const hw = homeworkMeta(session)
                    const eng = getEngagement(session.engagementId)
                    return (
                      <Link
                        key={session.id}
                        to={`/sessions/${session.id}`}
                        className="flex flex-col gap-3 panel p-4 transition hover:bg-brand-50/50 hover:outline-brand-200 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-semibold text-white"
                            style={{ background: teacher.avatarColor }}
                          >
                            {teacher.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-ink">{session.title}</p>
                            <p className="text-sm text-muted">
                              {teacher.name} · {learnerNames(session.learnerIds)} ·{' '}
                              {formatSessionTime(session.startsAt)} · {session.durationMinutes}{' '}
                              min
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <PaymentPill status={session.paymentStatus} />
                              {hw ? (
                                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-800">
                                  {hw}
                                </span>
                              ) : null}
                              {session.sharedNotes ? (
                                <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted ring-1 ring-line">
                                  Notes
                                </span>
                              ) : null}
                              {session.transcript?.length ? (
                                <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted ring-1 ring-line">
                                  Transcript
                                </span>
                              ) : null}
                              {eng?.status === 'pending' ? (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                                  Request pending
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <StatusPill status={session.status} />
                      </Link>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(confirm)}
        title={
          confirm?.kind === 'not_hire' ? 'Don’t hire this teacher?' : 'End sessions?'
        }
        body={
          confirm?.kind === 'not_hire'
            ? `Move ${confirm.teacherName} to Not hired. Unpaid future sessions will be cancelled.`
            : confirm
              ? `Stop working with ${confirm.teacherName}. Unpaid future sessions will be cancelled; paid ones stay on your calendar.`
              : ''
        }
        confirmLabel={confirm?.kind === 'not_hire' ? 'Don’t hire' : 'End sessions'}
        cancelLabel="Cancel"
        onCancel={closeConfirm}
        onConfirm={() => {
          if (!confirm) return
          if (confirm.kind === 'not_hire') markNotHired(confirm.engagementId)
          else endEngagement(confirm.engagementId)
          setConfirm(null)
        }}
      />
    </>
  )
}

function TeacherEngagementCard({
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
  const navigate = useNavigate()
  const teacher = getTeacher(eng.teacherId)
  if (!teacher) return null

  const awaitingPay = eng.status === 'awaiting_payment'
  const showPay = awaitingPay || eng.status === 'active'
  const paidThrough = eng.status === 'active'
    ? lastFuturePaidSession(sessions, eng.id)
    : null

  const menuItems: { label: string; onClick: () => void; danger?: boolean }[] = []
  if (awaitingPay) {
    menuItems.push({ label: 'Don’t hire', onClick: onNotHire, danger: true })
  }
  if (eng.status === 'active' || eng.status === 'intro_scheduled') {
    menuItems.push({ label: 'End sessions', onClick: onEnd, danger: true })
  }
  if (eng.status === 'pending') {
    menuItems.push({ label: 'Withdraw request', onClick: onNotHire, danger: true })
  }
  menuItems.push({
    label: 'View teacher',
    onClick: () => navigate(`/learn/${teacher.id}`),
  })

  return (
    <div
      className={[
        'flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between',
        awaitingPay
          ? 'bg-brand-50 ring-2 ring-brand-200'
          : 'panel',
      ].join(' ')}
    >
      <div className="min-w-0">
        <p className="font-semibold text-ink">{teacher.name}</p>
        <p className="text-sm text-muted">
          {SUBJECT_LABELS[eng.subject]} · {ENGAGEMENT_STATUS_LABELS[eng.status]} ·{' '}
          {learnerNames(eng.learnerIds)}
        </p>
        {paidThrough ? (
          <p className="mt-1 text-sm text-brand-800">
            Paid through {formatPaidThroughDate(paidThrough.startsAt)}
          </p>
        ) : null}
        {awaitingPay ? (
          <p className="mt-1 text-sm text-brand-800">
            Pay for {PACKAGE_SESSION_COUNT}+ sessions to hire, or don’t hire from the menu.
          </p>
        ) : null}
        {eng.teacherMessage ? (
          <p className="mt-1 text-xs text-amber-900">Teacher: {eng.teacherMessage}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {showPay ? (
          <ButtonLink to={`/engagements/${eng.id}/checkout`} variant="secondary">
            {awaitingPay ? 'Pay for sessions' : 'Pay for more sessions'}
          </ButtonLink>
        ) : null}
        <TeacherCardMenu items={menuItems} />
      </div>
    </div>
  )
}

function TeacherCardMenu({
  items,
}: {
  items: { label: string; onClick: () => void; danger?: boolean }[]
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="More actions"
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-canvas text-ink ring-1 ring-line transition hover:bg-surface hover:ring-brand-200"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex flex-col items-center gap-0.5" aria-hidden>
          <span className="h-1 w-1 rounded-full bg-current" />
          <span className="h-1 w-1 rounded-full bg-current" />
          <span className="h-1 w-1 rounded-full bg-current" />
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[11rem] overflow-hidden rounded-xl bg-surface py-1 shadow-lg ring-1 ring-line"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={[
                'block w-full px-3 py-2 text-left text-sm font-semibold transition hover:bg-canvas',
                item.danger ? 'text-red-800' : 'text-ink',
              ].join(' ')}
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function FilterChip({
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
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
        active
          ? 'bg-brand-700 text-white'
          : 'bg-canvas text-muted ring-1 ring-line hover:text-ink',
      ].join(' ')}
    >
      {color ? (
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: active ? 'white' : color }}
        />
      ) : null}
      {label}
    </button>
  )
}
