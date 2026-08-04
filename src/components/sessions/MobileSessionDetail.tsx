import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { getLearner } from '../../mocks/store'
import type { Session, Teacher, TeachingEngagement } from '../../types'
import { SUBJECT_LABELS } from '../../types'
import { Button, ButtonLink } from '../Button'
import { PaymentPill, StatusPill } from '../StatusPill'
import {
  formatSessionTime,
  sessionDayLabel,
  teacherGivenName,
} from '../../lib/format'
import { formatSessionCountdown } from '../../lib/sessionJoin'

type Props = {
  session: Session
  teacher: Teacher
  engagement?: TeachingEngagement
  canJoin: boolean
  eligible: boolean
  privateNotes: string
  onPrivateChange: (value: string) => void
  onPrivateBlur: () => void
  onToggleHomework: (itemId: string) => void
}

/**
 * Mobile session dossier — compact header, sticky join/pay, dense sections.
 * Desktop tree stays in SessionDetailPage (lg+).
 */
export function MobileSessionDetail({
  session,
  teacher,
  engagement,
  canJoin,
  eligible,
  privateNotes,
  onPrivateChange,
  onPrivateBlur,
  onToggleHomework,
}: Props) {
  const learners = session.learnerIds
    .map((lid) => getLearner(lid))
    .filter(Boolean)
  const learnerLabel = learners
    .map((l) => (l!.kind === 'self' ? 'You' : l!.name.split(' ')[0]))
    .join(', ')
  const countdown = formatSessionCountdown(session)
  const needsPay = engagement?.status === 'awaiting_payment'

  return (
    <div className="flex flex-col gap-2.5 animate-rise pb-24 lg:hidden">
      <div className="px-0.5">
        <Link
          to="/sessions"
          className="text-xs font-medium text-brand-700 hover:text-brand-800"
        >
          ← Sessions
        </Link>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-line bg-surface px-3 py-3">
        <div className="flex items-start gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
            style={{ background: teacher.avatarColor }}
          >
            {teacher.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusPill status={session.status} />
              <PaymentPill status={session.paymentStatus} />
              {session.kind === 'intro' ? (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-800">
                  Intro
                </span>
              ) : null}
            </div>
            <h1 className="mt-1.5 text-base font-extrabold leading-snug tracking-tight text-ink">
              {session.title}
            </h1>
            <p className="mt-1 text-[11px] text-muted">
              {teacher.name} · {SUBJECT_LABELS[session.subject]}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-ink">
              {sessionDayLabel(session.startsAt)} · {formatSessionTime(session.startsAt)} ·{' '}
              {session.durationMinutes} min
            </p>
            <p className="mt-0.5 text-[11px] text-muted">Learners: {learnerLabel}</p>
            <p
              className={[
                'mt-1.5 text-xs font-bold tabular-nums',
                countdown.tone === 'live' || countdown.tone === 'open'
                  ? 'text-brand-700'
                  : 'text-ink',
              ].join(' ')}
            >
              {countdown.label}
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2 border-t border-line pt-3">
          <Link
            to={`/learn/${teacher.id}`}
            className="text-[11px] font-bold text-brand-700"
          >
            Teacher →
          </Link>
        </div>
      </div>

      {session.studentNote ? (
        <Section title="Your note">
          <p className="text-xs leading-relaxed text-ink">{session.studentNote}</p>
        </Section>
      ) : null}

      <Section title="Session notes">
        {session.sharedNotes ? (
          <p className="text-xs leading-relaxed text-muted">{session.sharedNotes}</p>
        ) : (
          <p className="text-xs text-muted">Shared notes appear after class.</p>
        )}
      </Section>

      <Section title="Private notes" hint="Only your family sees these">
        <textarea
          className="mt-1.5 w-full rounded-xl bg-canvas px-3 py-2 text-xs outline-none ring-1 ring-line focus:ring-2 focus:ring-brand-500/30"
          rows={2}
          value={privateNotes}
          onChange={(e) => onPrivateChange(e.target.value)}
          onBlur={onPrivateBlur}
          placeholder="Reminders for yourself…"
        />
      </Section>

      <Section title="Homework">
        {session.homework && session.homework.length > 0 ? (
          <ul className="mt-1.5 space-y-1.5">
            {session.homework.map((item) => {
              const learner = getLearner(item.learnerId)
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-2.5 rounded-xl border border-line px-2.5 py-2"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => onToggleHomework(item.id)}
                    className="mt-0.5 accent-brand-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-muted">
                      {learner?.kind === 'self'
                        ? 'You'
                        : learner?.name.split(' ')[0] ?? 'Learner'}
                      {item.mark != null ? ` · ${item.mark}/10` : ''}
                    </p>
                    <p
                      className={[
                        'text-xs',
                        item.done ? 'text-muted line-through' : 'text-ink',
                      ].join(' ')}
                    >
                      {item.text}
                    </p>
                    {item.requiresAudio ? (
                      <Link
                        to={`/sessions/${session.id}/homework/${item.id}`}
                        className="mt-0.5 inline-block text-[10px] font-bold text-brand-700"
                      >
                        Audio workspace →
                      </Link>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-xs text-muted">No homework yet.</p>
        )}
      </Section>

      <Section title="Transcript">
        {session.transcript && session.transcript.length > 0 ? (
          <div className="mt-1.5 space-y-3">
            {session.transcript.map((section) => (
              <div key={section.heading}>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  {section.heading}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ink">{section.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">
            {session.status === 'completed'
              ? 'Transcript will appear after class.'
              : 'Available after the session is completed.'}
          </p>
        )}
      </Section>

      {session.status === 'completed' && !session.reviewSubmitted ? (
        <p className="px-0.5 text-[11px] text-muted">
          How was class with {teacherGivenName(teacher.name)}? Reviews open from the teacher
          profile later.
        </p>
      ) : null}

      {/* Sticky actions above bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 px-3 pt-2.5 backdrop-blur-xl pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex gap-2">
          {canJoin ? (
            <ButtonLink to={`/sessions/${session.id}/room`} className="flex-1 !py-2.5 !text-sm">
              Join classroom
            </ButtonLink>
          ) : (
            <Button
              type="button"
              className="flex-1 !py-2.5 !text-sm"
              disabled
              title={
                eligible
                  ? 'Join opens 15 minutes before the session starts'
                  : 'Available when scheduled and paid (or free intro)'
              }
            >
              Join classroom
            </Button>
          )}
          {needsPay ? (
            <ButtonLink
              to={`/engagements/${engagement!.id}/checkout`}
              variant="secondary"
              className="!py-2.5 !text-sm"
            >
              Pay
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-2.5">
      <h2 className="text-xs font-bold tracking-tight text-ink">{title}</h2>
      {hint ? <p className="text-[10px] text-muted">{hint}</p> : null}
      <div className="mt-1">{children}</div>
    </div>
  )
}
