import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  createEngagementRequest,
  getGuardian,
  getTeacher,
  hadFreeIntro,
  useLearners,
} from '../mocks/store'
import {
  INTRO_DURATION_MINUTES,
  PACKAGE_SESSION_COUNT,
  SUBJECT_LABELS,
  WEEKDAY_LABELS,
  type SubjectId,
} from '../types'
import { Button, ButtonLink } from '../components/Button'
import { MultiLearnerPicker } from '../components/MultiLearnerPicker'
import { useCurrency } from '../context/CurrencyContext'

const fieldClass =
  'w-full rounded-2xl bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line transition focus:bg-canvas focus:ring-2 focus:ring-brand-500/30'

export function BookSessionPage() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const { formatUsd } = useCurrency()
  const teacher = id ? getTeacher(id) : undefined
  const learners = useLearners()
  const preselect = search.get('for')
  const defaultLearners = useMemo(() => {
    if (preselect && learners.some((l) => l.id === preselect)) return [preselect]
    const self = learners.find((l) => l.kind === 'self')
    return self ? [self.id] : []
  }, [learners, preselect])

  const [learnerIds, setLearnerIds] = useState<string[]>(defaultLearners)
  const [slotIds, setSlotIds] = useState<string[]>([])
  const [subject, setSubject] = useState<SubjectId>(teacher?.subjects[0] ?? 'quran_reading')
  const [titleSuggestion, setTitleSuggestion] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  if (!teacher) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">Teacher not found</p>
        <ButtonLink to="/learn" variant="secondary" className="mt-4">
          Back to Learn
        </ButtonLink>
      </div>
    )
  }

  const introAvailable = !hadFreeIntro(getGuardian().id, teacher.id)
  const slotsSorted = [...teacher.availability].sort((a, b) => a.weekday - b.weekday)
  const packageFrom = formatUsd(teacher.rateUsd * PACKAGE_SESSION_COUNT)

  function toggleSlot(slotId: string) {
    setSlotIds((prev) =>
      prev.includes(slotId) ? prev.filter((x) => x !== slotId) : [...prev, slotId],
    )
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const engagement = createEngagementRequest({
        teacherId: teacher!.id,
        weeklySlotIds: slotIds,
        subject,
        learnerIds,
        titleSuggestion,
        studentNote: note,
      })
      navigate('/sessions', {
        state: { justRequested: engagement.id },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send request')
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-rise">
      <Link
        to={`/learn/${teacher.id}`}
        className="text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        ← {teacher.name}
      </Link>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Request sessions
        </h1>
        <p className="mt-2 text-muted">
          {formatUsd(teacher.rateUsd)}/session · {teacher.durationMinutes} min regular ·{' '}
          {introAvailable
            ? `free ${INTRO_DURATION_MINUTES}-min intro first`
            : 'no free intro (you’ve studied with this teacher before)'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="panel space-y-5 p-6">
        <div>
          <label className="text-sm font-semibold text-ink">Learners</label>
          <p className="mt-0.5 text-xs text-muted">
            Everyone joins from the same device in one class.
          </p>
          <div className="mt-2">
            <MultiLearnerPicker value={learnerIds} onChange={setLearnerIds} />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink" htmlFor="subject">
            Subject
          </label>
          <select
            id="subject"
            className={`${fieldClass} mt-1.5`}
            value={subject}
            onChange={(e) => setSubject(e.target.value as SubjectId)}
          >
            {teacher.subjects.map((s) => (
              <option key={s} value={s}>
                {SUBJECT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">Weekly times</p>
          <p className="mt-0.5 text-xs text-muted">
            Select one or more recurring spots. After payment, at least{' '}
            {PACKAGE_SESSION_COUNT} sessions are scheduled across these times.
          </p>
          <ul className="mt-3 space-y-2">
            {slotsSorted.map((slot) => {
              const active = slotIds.includes(slot.id)
              return (
                <li key={slot.id}>
                  <button
                    type="button"
                    onClick={() => toggleSlot(slot.id)}
                    className={[
                      'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition',
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-900'
                        : 'border-line hover:border-brand-200',
                    ].join(' ')}
                  >
                    <span>
                      <span className="font-semibold">
                        {WEEKDAY_LABELS[slot.weekday]}
                      </span>{' '}
                      {slot.label.replace(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s/, '')}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">
                      {active ? 'Selected' : 'Select'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink" htmlFor="title">
            Session topic (optional)
          </label>
          <input
            id="title"
            className={`${fieldClass} mt-1.5`}
            value={titleSuggestion}
            onChange={(e) => setTitleSuggestion(e.target.value)}
            placeholder="e.g. Madd rules in Juz Amma"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-ink" htmlFor="note">
            Note to teacher (optional)
          </label>
          <textarea
            id="note"
            rows={3}
            className={`${fieldClass} mt-1.5`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="rounded-xl bg-canvas px-3 py-3 text-sm text-muted ring-1 ring-line">
          <p>
            After accept:{' '}
            {introAvailable
              ? `free intro → then pay for at least ${PACKAGE_SESSION_COUNT} sessions (from ${packageFrom}).`
              : `pay for at least ${PACKAGE_SESSION_COUNT} sessions (from ${packageFrom}) — no free intro.`}
          </p>
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <Button
          type="submit"
          className="w-full"
          disabled={learnerIds.length === 0 || slotIds.length === 0}
        >
          Send request
        </Button>
      </form>
    </div>
  )
}
