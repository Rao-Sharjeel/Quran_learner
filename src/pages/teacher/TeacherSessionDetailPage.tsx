import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import {
  assignHomework,
  getLearner,
  getTeacher,
  setHomeworkMark,
  updateSessionNotes,
  updateSessionTitle,
  useSession,
} from '../../mocks/store'
import { Button, ButtonLink } from '../../components/Button'
import { PaymentPill, StatusPill } from '../../components/StatusPill'
import { formatSessionWhen } from '../../lib/format'

export function TeacherSessionDetailPage() {
  const { id } = useParams()
  const session = useSession(id)
  const teacher = session ? getTeacher(session.teacherId) : undefined
  const [title, setTitle] = useState(session?.title ?? '')
  const [shared, setShared] = useState(session?.sharedNotes ?? '')
  const [priv, setPriv] = useState(session?.privateNotesTeacher ?? '')
  const [hwText, setHwText] = useState('')
  const [hwLearner, setHwLearner] = useState(session?.learnerIds[0] ?? '')
  const [msg, setMsg] = useState('')

  if (!session || !teacher) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">Session not found</p>
        <ButtonLink to="/teacher" variant="secondary" className="mt-4">
          Back
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-rise">
      <Link to="/teacher" className="text-sm font-medium text-brand-700">
        ← Today
      </Link>

      <div className="panel space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              Session title
            </label>
            <input
              className="mt-1 w-full rounded-2xl bg-surface px-3 py-2 text-lg font-bold ring-1 ring-line"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                try {
                  updateSessionTitle(session.id, title)
                  setMsg('Title saved')
                } catch (e) {
                  setMsg(e instanceof Error ? e.message : 'Error')
                }
              }}
            />
            <p className="mt-1 text-sm text-muted">
              {formatSessionWhen(session.startsAt, '')} · {session.durationMinutes} min
            </p>
            <div className="mt-2 flex gap-1.5">
              <StatusPill status={session.status} />
              <PaymentPill status={session.paymentStatus} />
            </div>
          </div>
          {session.status === 'scheduled' &&
          (session.paymentStatus === 'paid' || session.paymentStatus === 'free') ? (
            <ButtonLink to={`/teacher/sessions/${session.id}/room`}>Join classroom</ButtonLink>
          ) : null}
        </div>

        <div>
          <h2 className="font-bold text-ink">Shared notes</h2>
          <textarea
            className="mt-2 w-full rounded-2xl bg-surface px-3 py-2 text-sm ring-1 ring-line"
            rows={3}
            value={shared}
            onChange={(e) => setShared(e.target.value)}
            onBlur={() => updateSessionNotes(session.id, { sharedNotes: shared })}
          />
        </div>

        <div>
          <h2 className="font-bold text-ink">Your private notes</h2>
          <textarea
            className="mt-2 w-full rounded-2xl bg-surface px-3 py-2 text-sm ring-1 ring-line"
            rows={2}
            value={priv}
            onChange={(e) => setPriv(e.target.value)}
            onBlur={() => updateSessionNotes(session.id, { privateNotesTeacher: priv })}
          />
        </div>

        <div>
          <h2 className="font-bold text-ink">Homework by learner</h2>
          <ul className="mt-2 space-y-2">
            {(session.homework ?? []).map((h) => {
              const learner = getLearner(h.learnerId)
              return (
                <li
                  key={h.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-semibold">
                      {learner?.name.split(' ')[0] ?? 'Learner'}
                    </span>
                    : {h.text}
                    {h.done ? ' ✓' : ''}
                  </span>
                  <label className="flex items-center gap-1 text-xs">
                    Mark
                    <input
                      type="number"
                      min={0}
                      max={10}
                      className="w-14 rounded-lg bg-surface px-2 py-1 ring-1 ring-line"
                      value={h.mark ?? ''}
                      onChange={(e) =>
                        setHomeworkMark(session.id, h.id, Number(e.target.value))
                      }
                    />
                    /10
                  </label>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 space-y-2 rounded-xl bg-canvas p-3 ring-1 ring-line">
            <p className="text-sm font-semibold">Assign homework</p>
            <select
              className="w-full rounded-xl bg-surface px-3 py-2 text-sm ring-1 ring-line"
              value={hwLearner}
              onChange={(e) => setHwLearner(e.target.value)}
            >
              {session.learnerIds.map((lid) => {
                const l = getLearner(lid)
                return (
                  <option key={lid} value={lid}>
                    {l?.name ?? lid}
                  </option>
                )
              })}
            </select>
            <input
              className="w-full rounded-xl bg-surface px-3 py-2 text-sm ring-1 ring-line"
              placeholder="Homework text"
              value={hwText}
              onChange={(e) => setHwText(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                try {
                  assignHomework(session.id, { learnerId: hwLearner, text: hwText })
                  setHwText('')
                  setMsg('Homework assigned')
                } catch (e) {
                  setMsg(e instanceof Error ? e.message : 'Error')
                }
              }}
            >
              Assign
            </Button>
          </div>
        </div>

        {msg ? <p className="text-sm text-brand-700">{msg}</p> : null}
      </div>
    </div>
  )
}
