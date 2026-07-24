import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createBookingRequest, getTeacher, useLearners } from '../mocks/store'
import { SUBJECT_LABELS, type SubjectId } from '../types'
import { Button, ButtonLink } from '../components/Button'
import { LearnerPicker } from '../components/LearnerPicker'

const fieldClass =
  'w-full rounded-2xl bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line transition focus:bg-canvas focus:ring-2 focus:ring-brand-500/30'

export function BookSessionPage() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const teacher = id ? getTeacher(id) : undefined
  const learners = useLearners()
  const preselect = search.get('for')
  const defaultLearner =
    (preselect && learners.some((l) => l.id === preselect) && preselect) ||
    learners.find((l) => l.kind === 'self')?.id ||
    learners[0]?.id ||
    ''

  const [learnerId, setLearnerId] = useState(defaultLearner)
  const [slotId, setSlotId] = useState(teacher?.availability[0]?.id ?? '')
  const [subject, setSubject] = useState<SubjectId>(teacher?.subjects[0] ?? 'quran_reading')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const selectedSlot = useMemo(
    () => teacher?.availability.find((s) => s.id === slotId),
    [teacher, slotId],
  )

  if (!teacher) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">Teacher not found</p>
        <ButtonLink to="/teachers" variant="secondary" className="mt-4">
          Back to directory
        </ButtonLink>
      </div>
    )
  }

  const selectedTeacher = teacher

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!learnerId) {
      setError('Choose who this session is for.')
      return
    }
    try {
      const session = createBookingRequest({
        teacherId: selectedTeacher.id,
        slotId,
        subject,
        studentNote: note,
        learnerId,
      })
      navigate(`/sessions/${session.id}`, {
        state: { justBooked: true },
      })
    } catch {
      setError('Could not create booking. Pick another slot or learner.')
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-rise">
      <Link
        to={`/teachers/${teacher.id}`}
        className="text-sm font-medium text-brand-700 transition hover:text-brand-800"
      >
        ← {teacher.name}
      </Link>

      <div className="panel p-6 md:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Request a session
        </h1>
        <p className="mt-2 text-muted">
          Choose who the lesson is for, then pick a slot. You’ll see status under Sessions once
          they respond.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <LearnerPicker value={learnerId} onChange={setLearnerId} />

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-ink">Subject</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as SubjectId)}
              className={fieldClass}
            >
              {teacher.subjects.map((s) => (
                <option key={s} value={s}>
                  {SUBJECT_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-ink">Available slot</legend>
            <div className="space-y-2">
              {teacher.availability.map((slot) => (
                <label
                  key={slot.id}
                  className={[
                    'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition',
                    slotId === slot.id
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-line hover:border-brand-200',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="slot"
                    checked={slotId === slot.id}
                    onChange={() => setSlotId(slot.id)}
                    className="accent-brand-700"
                  />
                  {slot.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-ink">Note to teacher (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. I want help with Surah Al-Mulk tajweed"
              className={`${fieldClass} resize-y`}
            />
          </label>

          {selectedSlot ? (
            <p className="rounded-xl bg-brand-50 px-3 py-2.5 text-sm text-brand-800">
              Requesting <strong>{selectedSlot.label}</strong> · ${teacher.rateUsd}/hr
            </p>
          ) : null}

          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={!learnerId}>
            Send booking request
          </Button>
        </form>
      </div>
    </div>
  )
}
