import { useState } from 'react'
import {
  getLearner,
  teacherAcceptEngagement,
  teacherDeclineEngagement,
  teacherRescheduleMessage,
  useActiveTeacherId,
  useEngagements,
  getTeacher,
} from '../../mocks/store'
import { ENGAGEMENT_STATUS_LABELS, SUBJECT_LABELS, WEEKDAY_LABELS } from '../../types'
import { Button } from '../../components/Button'

export function TeacherRequestsPage() {
  const teacherId = useActiveTeacherId()
  const engagements = useEngagements().filter(
    (e) => e.teacherId === teacherId && e.status === 'pending',
  )
  const [messageDraft, setMessageDraft] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const teacher = getTeacher(teacherId)

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Hire requests</h1>
        <p className="mt-2 text-muted">Accept, decline, or send a reschedule note.</p>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {engagements.length === 0 ? (
        <p className="text-sm text-muted">No pending requests.</p>
      ) : (
        <ul className="space-y-4">
          {engagements.map((eng) => {
            const slots =
              teacher?.availability.filter((s) => eng.weeklySlotIds.includes(s.id)) ?? []
            const learners = eng.learnerIds
              .map((id) => getLearner(id)?.name)
              .filter(Boolean)
              .join(', ')
            return (
              <li key={eng.id} className="panel space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">
                      {SUBJECT_LABELS[eng.subject]} · {learners}
                    </p>
                    <p className="text-sm text-muted">
                      {ENGAGEMENT_STATUS_LABELS[eng.status]}
                      {eng.titleSuggestion ? ` · “${eng.titleSuggestion}”` : ''}
                    </p>
                    {eng.studentNote ? (
                      <p className="mt-1 text-sm text-muted">Note: {eng.studentNote}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted">
                      Weekly:{' '}
                      {slots
                        .map((s) => `${WEEKDAY_LABELS[s.weekday]} ${s.label}`)
                        .join(' · ') || eng.weeklySlotIds.join(', ')}
                    </p>
                  </div>
                </div>
                <textarea
                  className="w-full rounded-2xl bg-surface px-3 py-2 text-sm ring-1 ring-line"
                  rows={2}
                  placeholder="Message to reschedule…"
                  value={messageDraft[eng.id] ?? ''}
                  onChange={(e) =>
                    setMessageDraft((d) => ({ ...d, [eng.id]: e.target.value }))
                  }
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      try {
                        setError('')
                        teacherAcceptEngagement(eng.id)
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed')
                      }
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      try {
                        setError('')
                        const msg = messageDraft[eng.id]
                        if (msg?.trim()) teacherRescheduleMessage(eng.id, msg)
                        teacherDeclineEngagement(eng.id, messageDraft[eng.id])
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed')
                      }
                    }}
                  >
                    Decline
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      try {
                        setError('')
                        teacherRescheduleMessage(eng.id, messageDraft[eng.id] ?? '')
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed')
                      }
                    }}
                  >
                    Send message
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
