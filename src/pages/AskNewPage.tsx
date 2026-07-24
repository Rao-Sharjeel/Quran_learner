import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createAskQuestion, useAskQuestions, useLearners } from '../mocks/store'
import { SUBJECT_LABELS, type SubjectId } from '../types'
import { Button } from '../components/Button'
import { LearnerPicker } from '../components/LearnerPicker'
import { askAuthorLabel, formatAskDate, matchesAskSearch } from '../lib/format'

const topics = Object.keys(SUBJECT_LABELS) as SubjectId[]

const fieldClass =
  'w-full rounded-2xl bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line transition focus:bg-canvas focus:ring-2 focus:ring-brand-500/30'

export function AskNewPage() {
  const navigate = useNavigate()
  const all = useAskQuestions()
  const learners = useLearners()
  const defaultLearner =
    learners.find((l) => l.kind === 'self')?.id || learners[0]?.id || ''
  const [learnerId, setLearnerId] = useState(defaultLearner)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [topic, setTopic] = useState<SubjectId>('tajweed')
  const [anonymous, setAnonymous] = useState(false)
  const [error, setError] = useState('')

  const searchText = `${title} ${body}`.trim()
  const similar = useMemo(() => {
    if (searchText.length < 3) return []
    return all
      .filter((q) => q.status === 'published')
      .filter((q) => matchesAskSearch(q, searchText, SUBJECT_LABELS))
      .slice(0, 5)
  }, [all, searchText])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!learnerId) {
      setError('Choose who is asking.')
      return
    }
    if (!title.trim() || !body.trim()) {
      setError('Add a title and your question to continue.')
      return
    }
    setError('')
    try {
      const question = createAskQuestion({
        title,
        body,
        topic,
        anonymous,
        learnerId,
      })
      navigate(`/ask/${question.id}`, { state: { justAsked: true } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit question.')
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-rise">
      <Link to="/ask" className="text-sm font-medium text-brand-700 transition hover:text-brand-800">
        ← Ask Scholars
      </Link>

      <div className="rounded-2xl bg-canvas p-6 shadow-sm shadow-brand-800/5 ring-1 ring-line/80 md:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Ask a question
        </h1>
        <p className="mt-2 text-sm text-muted">
          Search the archive first. If nothing fits, submit for private scholar review — for
          yourself or a kid.
        </p>

        <form onSubmit={onSubmit} className="mt-7 space-y-5">
          <LearnerPicker
            value={learnerId}
            onChange={setLearnerId}
            label="Who is asking?"
          />

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-ink">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary of your question"
              className={fieldClass}
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-ink">Topic</span>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value as SubjectId)}
              className={fieldClass}
            >
              {topics.map((t) => (
                <option key={t} value={t}>
                  {SUBJECT_LABELS[t]}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-ink">Your question</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Share enough context for scholars to answer carefully."
              className={`${fieldClass} resize-y`}
            />
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-surface/80 px-4 py-3 text-sm ring-1 ring-line/70">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="mt-0.5 accent-brand-700"
            />
            <span>
              <span className="font-medium text-ink">Ask anonymously</span>
              <span className="mt-0.5 block text-muted">
                Name stays hidden on the public thread. Scholars still see a real student asked.
              </span>
            </span>
          </label>

          {similar.length > 0 ? (
            <div className="rounded-2xl bg-brass-soft/50 px-4 py-3 ring-1 ring-brass/25">
              <p className="text-sm font-semibold text-brand-800">Similar answers already exist</p>
              <p className="mt-1 text-xs text-brand-700">
                Check these before submitting — you may find what you need.
              </p>
              <ul className="mt-3 space-y-1.5">
                {similar.map((q) => (
                  <li key={q.id}>
                    <Link
                      to={`/ask/${q.id}`}
                      className="block rounded-xl bg-white/80 px-3 py-2 text-sm transition hover:bg-white"
                    >
                      <span className="font-medium text-ink">{q.title}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {SUBJECT_LABELS[q.topic]} · {askAuthorLabel(q)} ·{' '}
                        {formatAskDate(q.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : searchText.length >= 3 ? (
            <p className="text-sm text-muted">No close matches in published answers yet.</p>
          ) : null}

          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full !rounded-xl" disabled={!learnerId}>
            Submit question
          </Button>
        </form>
      </div>
    </div>
  )
}
