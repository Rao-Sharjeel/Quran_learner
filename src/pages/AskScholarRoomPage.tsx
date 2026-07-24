import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  addScholarMessage,
  agreeAskDraft,
  askStudentClarification,
  createAskDraft,
  getTeacher,
  listForumScholars,
  setActiveScholar,
  useActiveScholarId,
  useAskQuestion,
} from '../mocks/store'
import { ASK_STATUS_LABELS, SUBJECT_LABELS } from '../types'
import { Button, ButtonLink } from '../components/Button'
import { askAuthorLabel, formatAskDate, teacherGivenName } from '../lib/format'

export function AskScholarRoomPage() {
  const { id } = useParams()
  const question = useAskQuestion(id)
  const activeScholarId = useActiveScholarId()
  const scholars = listForumScholars()
  const activeScholar = getTeacher(activeScholarId)

  const [chatDraft, setChatDraft] = useState('')
  const [answerDraft, setAnswerDraft] = useState('')
  const [clarifyDraft, setClarifyDraft] = useState('')
  const [error, setError] = useState('')

  if (!question) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">Question not found</p>
        <ButtonLink to="/ask" variant="secondary" className="mt-4">
          Back to Ask Scholars
        </ButtonLink>
      </div>
    )
  }

  const draftAuthor = question.draft ? getTeacher(question.draft.authorId) : undefined
  const isAuthor = question.draft?.authorId === activeScholarId
  const hasAgreed = question.draft?.agreeIds.includes(activeScholarId)
  const canAgree =
    question.status === 'under_review' &&
    question.draft &&
    !isAuthor &&
    !hasAgreed
  const clarifications = question.clarifications ?? []

  function sendMessage(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      addScholarMessage(question!.id, chatDraft)
      setChatDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message.')
    }
  }

  function submitDraft(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      createAskDraft(question!.id, answerDraft)
      setAnswerDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create draft.')
    }
  }

  function onAgree() {
    setError('')
    try {
      agreeAskDraft(question!.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not agree.')
    }
  }

  function sendClarification(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      askStudentClarification(question!.id, clarifyDraft)
      setClarifyDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not ask the student.')
    }
  }

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/ask/${question.id}`}
          className="text-sm font-medium text-brand-700 transition hover:text-brand-800"
        >
          ← Student thread
        </Link>
        <span
          className={[
            'inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
            question.status === 'published'
              ? 'bg-brand-50 text-brand-800 ring-brand-200'
              : 'bg-amber-50 text-amber-950 ring-amber-200',
          ].join(' ')}
        >
          {ASK_STATUS_LABELS[question.status]}
        </span>
      </div>

      <div className="panel p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Private scholar room · {SUBJECT_LABELS[question.topic]}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {question.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{question.body}</p>
        <p className="mt-3 text-xs text-muted">
          From {askAuthorLabel(question)}
          {question.anonymous ? ' · anonymous to the public' : ''} ·{' '}
          {formatAskDate(question.createdAt)}
        </p>
      </div>

      <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3">
        <p className="text-sm font-semibold text-brand-800">Acting as (demo)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {scholars.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveScholar(s.id)}
              className={[
                'rounded-xl px-3 py-1.5 text-sm font-medium transition',
                activeScholarId === s.id
                  ? 'bg-brand-700 text-white'
                  : 'bg-canvas text-brand-800 ring-1 ring-brand-200 hover:bg-brand-100',
              ].join(' ')}
            >
              {teacherGivenName(s.name)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-brand-700">
          Switch scholars to chat, ask the student for context, draft, then agree to publish.
        </p>
      </div>

      {question.status === 'under_review' ? (
        <section className="panel p-5 sm:p-6">
          <h2 className="text-xl font-bold tracking-tight text-ink">Ask the student</h2>
          <p className="mt-1 text-sm text-muted">
            Need more scenario detail? Your question appears on the student’s under-review thread.
            Their reply shows here for the scholar room.
          </p>

          <div className="mt-4 space-y-3">
            {clarifications.length === 0 ? (
              <p className="text-sm text-muted">No clarifying questions sent yet.</p>
            ) : (
              clarifications.map((c) => {
                const scholar = getTeacher(c.scholarId)
                return (
                  <div key={c.id} className="rounded-2xl border border-line px-4 py-3 text-sm">
                    <p className="text-xs font-semibold text-brand-700">
                      {scholar?.name ?? 'Scholar'} asked · {formatAskDate(c.createdAt)}
                    </p>
                    <p className="mt-1 text-ink">{c.body}</p>
                    {c.studentReply ? (
                      <div className="mt-2 rounded-xl bg-brand-50 px-3 py-2">
                        <p className="text-xs font-semibold text-brand-700">
                          Student reply
                          {question.anonymous ? ' (anonymous asker)' : ''}
                        </p>
                        <p className="mt-1 text-ink">{c.studentReply}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-amber-800">Waiting for student reply…</p>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <form onSubmit={sendClarification} className="mt-4 space-y-2">
            <textarea
              value={clarifyDraft}
              onChange={(e) => setClarifyDraft(e.target.value)}
              rows={3}
              placeholder="e.g. Are you asking about continuous reading, or stopping at ayah ends?"
              className="w-full resize-y rounded-2xl bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line transition focus:bg-canvas focus:ring-2 focus:ring-brand-500/30"
            />
            <Button type="submit">Send question to student</Button>
          </form>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="panel">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-xl font-bold tracking-tight text-ink">Private discussion</h2>
            <p className="text-sm text-muted">
              Scholar-to-scholar only — not visible to the student.
            </p>
          </div>
          <div className="max-h-[360px] space-y-3 overflow-y-auto px-5 py-4">
            {question.privateMessages.length === 0 ? (
              <p className="text-sm text-muted">No messages yet. Start the deliberation.</p>
            ) : (
              question.privateMessages.map((m) => {
                const scholar = getTeacher(m.scholarId)
                return (
                  <div key={m.id} className="rounded-2xl bg-brand-50/70 px-3.5 py-2.5 text-sm">
                    <p className="text-xs font-semibold text-brand-700">
                      {scholar ? scholar.name : 'Scholar'} · {formatAskDate(m.createdAt)}
                    </p>
                    <p className="mt-1 text-ink">{m.body}</p>
                  </div>
                )
              })
            )}
          </div>
          {question.status === 'under_review' ? (
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-line p-4">
              <input
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder={`Message as ${activeScholar ? teacherGivenName(activeScholar.name) : 'scholar'}`}
                className="w-full rounded-2xl bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line transition focus:bg-canvas focus:ring-2 focus:ring-brand-500/30"
              />
              <Button type="submit">Send</Button>
            </form>
          ) : (
            <p className="border-t border-line px-5 py-3 text-sm text-muted">
              This thread is published. Discussion is closed.
            </p>
          )}
        </section>

        <section className="panel p-5 sm:p-6">
          <h2 className="text-xl font-bold tracking-tight text-ink">Answer draft</h2>
          <p className="mt-1 text-sm text-muted">Publish rule: drafter + at least one agree.</p>

          {question.draft ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-line bg-brand-50/50 px-4 py-3">
                <p className="text-xs font-semibold text-brand-700">
                  Draft by {draftAuthor?.name ?? 'Scholar'}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink">{question.draft.body}</p>
                <p className="mt-3 text-xs text-muted">
                  Agrees: {question.draft.agreeIds.length}{' '}
                  {question.draft.agreeIds.length === 0
                    ? '(needs one more scholar)'
                    : question.draft.agreeIds
                        .map((sid) => teacherGivenName(getTeacher(sid)?.name ?? sid))
                        .join(', ')}
                </p>
              </div>

              {canAgree ? (
                <Button type="button" onClick={onAgree} className="w-full">
                  Agree & publish
                </Button>
              ) : null}

              {isAuthor && question.status === 'under_review' ? (
                <p className="text-sm text-muted">Waiting for another forum scholar to agree.</p>
              ) : null}

              {hasAgreed && question.status === 'under_review' ? (
                <p className="text-sm text-brand-700">You already agreed on this draft.</p>
              ) : null}
            </div>
          ) : question.status === 'under_review' ? (
            <form onSubmit={submitDraft} className="mt-4 space-y-3">
              <textarea
                value={answerDraft}
                onChange={(e) => setAnswerDraft(e.target.value)}
                rows={6}
                placeholder="Write the proposed public answer…"
                className="w-full resize-y rounded-2xl bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line transition focus:bg-canvas focus:ring-2 focus:ring-brand-500/30"
              />
              <Button type="submit" className="w-full">
                Create draft
              </Button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted">Published — see the public thread.</p>
          )}

          {question.status === 'published' ? (
            <ButtonLink to={`/ask/${question.id}`} className="mt-4 w-full" variant="secondary">
              View public thread
            </ButtonLink>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  )
}
