import { Link, useParams } from 'react-router-dom'
import {
  getEngagement,
  getLearner,
  getTeacher,
  toggleHomeworkDone,
  updateSessionNotes,
  useSession,
} from '../mocks/store'
import { SUBJECT_LABELS } from '../types'
import { Button, ButtonLink } from '../components/Button'
import { PaymentPill, StatusPill } from '../components/StatusPill'
import { formatSessionWhen, teacherGivenName } from '../lib/format'
import { useState } from 'react'

export function SessionDetailPage() {
  const { id } = useParams()
  const session = useSession(id)
  const teacher = session ? getTeacher(session.teacherId) : undefined
  const engagement = session ? getEngagement(session.engagementId) : undefined

  const [privateDraft, setPrivateDraft] = useState<string | null>(null)

  if (!session || !teacher) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">Session not found</p>
        <ButtonLink to="/sessions" variant="secondary" className="mt-4">
          Back to sessions
        </ButtonLink>
      </div>
    )
  }

  const canJoin =
    session.status === 'scheduled' &&
    (session.paymentStatus === 'paid' || session.paymentStatus === 'free')
  const learners = session.learnerIds
    .map((lid) => getLearner(lid))
    .filter(Boolean)
  const privateNotes =
    privateDraft !== null ? privateDraft : (session.privateNotesGuardian ?? '')

  return (
    <div className="space-y-6 animate-rise">
      <Link
        to="/sessions"
        className="text-sm font-medium text-brand-700 transition hover:text-brand-800"
      >
        ← All sessions
      </Link>

      <div className="panel p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-base font-semibold text-white"
              style={{ background: teacher.avatarColor }}
            >
              {teacher.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-ink">
                  {session.title}
                </h1>
                <StatusPill status={session.status} />
                <PaymentPill status={session.paymentStatus} />
              </div>
              <p className="mt-1 text-muted">
                {teacher.name} · {SUBJECT_LABELS[session.subject]} ·{' '}
                {formatSessionWhen(session.startsAt, '')} · {session.durationMinutes} min
                {session.kind === 'intro' ? ' · Intro' : ''}
              </p>
              <p className="mt-1 text-sm text-brand-800">
                Learners:{' '}
                {learners
                  .map((l) =>
                    l!.kind === 'self' ? `${l!.name.split(' ')[0]} (you)` : l!.name,
                  )
                  .join(', ')}
              </p>
              <Link
                to={`/learn/${teacher.id}`}
                className="mt-2 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                View teacher
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canJoin ? (
              <ButtonLink to={`/sessions/${session.id}/room`}>Join classroom</ButtonLink>
            ) : (
              <Button type="button" disabled title="Available when scheduled and paid (or free intro)">
                Join classroom
              </Button>
            )}
            {engagement?.status === 'awaiting_payment' ? (
              <ButtonLink
                to={`/engagements/${engagement.id}/checkout`}
                variant="secondary"
              >
                Pay for sessions
              </ButtonLink>
            ) : null}
          </div>
        </div>

        {session.studentNote ? (
          <div className="mt-8 border-t border-line pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
              Your note to teacher
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">{session.studentNote}</p>
          </div>
        ) : null}

        <div className="mt-6 border-t border-line pt-6">
          <h2 className="text-xl font-bold tracking-tight text-ink">Session notes</h2>
          {session.sharedNotes ? (
            <p className="mt-2 leading-relaxed text-muted">{session.sharedNotes}</p>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Shared notes from your teacher will appear here after class.
            </p>
          )}
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <h2 className="text-xl font-bold tracking-tight text-ink">Your private notes</h2>
          <p className="mt-1 text-xs text-muted">Only visible to your family account.</p>
          <textarea
            className="mt-2 w-full rounded-2xl bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-brand-500/30"
            rows={3}
            value={privateNotes}
            onChange={(e) => setPrivateDraft(e.target.value)}
            onBlur={() => {
              if (privateDraft !== null) {
                updateSessionNotes(session.id, { privateNotesGuardian: privateDraft })
                setPrivateDraft(null)
              }
            }}
            placeholder="Reminders for yourself…"
          />
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <h2 className="text-xl font-bold tracking-tight text-ink">Homework</h2>
          {session.homework && session.homework.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {session.homework.map((item) => {
                const learner = getLearner(item.learnerId)
                return (
                  <li key={item.id}>
                    <div className="flex items-start gap-3 rounded-xl border border-line px-3 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleHomeworkDone(session.id, item.id)}
                        className="mt-0.5 accent-brand-700"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-muted">
                          {learner?.kind === 'self'
                            ? 'You'
                            : learner?.name.split(' ')[0] ?? 'Learner'}
                          {item.mark != null ? ` · Mark ${item.mark}/10` : ''}
                        </p>
                        <p className={item.done ? 'text-muted line-through' : 'text-ink'}>
                          {item.text}
                        </p>
                        {item.requiresAudio ? (
                          <Link
                            to={`/sessions/${session.id}/homework/${item.id}`}
                            className="mt-1 inline-block text-xs font-semibold text-brand-700"
                          >
                            Open audio workspace →
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No homework for this session yet.</p>
          )}
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <h2 className="text-xl font-bold tracking-tight text-ink">Transcript</h2>
          {session.transcript && session.transcript.length > 0 ? (
            <div className="mt-4 space-y-5">
              {session.transcript.map((section) => (
                <div key={section.heading}>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                    {section.heading}
                  </h3>
                  <p className="mt-2 leading-relaxed text-ink">{section.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">
              {session.status === 'completed'
                ? 'Transcript will appear after class.'
                : 'Transcript appears after the session is completed.'}
            </p>
          )}
        </div>

        {session.status === 'completed' && !session.reviewSubmitted ? (
          <p className="mt-6 text-sm text-muted">
            How was class with {teacherGivenName(teacher.name)}? Reviews open from your teacher’s
            Learn profile after more sessions.
          </p>
        ) : null}
      </div>
    </div>
  )
}
