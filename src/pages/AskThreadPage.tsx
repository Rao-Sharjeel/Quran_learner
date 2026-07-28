import { useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  addAskComment,
  getGuardian,
  getKid,
  getTeacher,
  replyToClarification,
  useAskQuestion,
  useLearners,
} from '../mocks/store'
import { ASK_STATUS_LABELS, SUBJECT_LABELS } from '../types'
import { Button, ButtonLink } from '../components/Button'
import { BadgePill } from '../components/BadgePill'
import { MobileAskThread } from '../components/ask/MobileAskThread'
import { askAuthorLabel, formatAskDate, teacherGivenName } from '../lib/format'

export function AskThreadPage() {
  const { id } = useParams()
  const location = useLocation()
  const justAsked = Boolean((location.state as { justAsked?: boolean } | null)?.justAsked)
  const question = useAskQuestion(id)
  const guardian = getGuardian()
  const learners = useLearners()
  const [comment, setComment] = useState('')
  const [commentAs, setCommentAs] = useState(learners.find((l) => l.kind === 'self')?.id ?? '')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [clarifyError, setClarifyError] = useState('')

  if (!question) {
    return (
      <div className="rounded-2xl bg-canvas p-8 text-center shadow-sm ring-1 ring-line/80">
        <p className="font-semibold">Question not found</p>
        <ButtonLink to="/ask" variant="secondary" className="mt-4">
          Back to Ask Scholars
        </ButtonLink>
      </div>
    )
  }

  const askerKid = getKid(question.studentId)
  const isOwner = Boolean(askerKid && askerKid.guardianId === guardian.id)
  if (question.status === 'under_review' && !isOwner) {
    return (
      <div className="rounded-2xl bg-canvas p-8 text-center shadow-sm ring-1 ring-line/80">
        <p className="font-semibold">Still under review</p>
        <p className="mt-2 text-sm text-muted">
          Only published answers are public. Browse the archive while scholars review.
        </p>
        <ButtonLink to="/ask" variant="secondary" className="mt-4">
          Browse answers
        </ButtonLink>
      </div>
    )
  }

  const endorsers = (question.publishedByIds ?? [])
    .map((scholarId) => getTeacher(scholarId))
    .filter(Boolean)
  const leadScholar = endorsers[0]
  const comments = question.comments ?? []
  const clarifications = question.clarifications ?? []

  function onComment(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      addAskComment(question!.id, comment, commentAs || undefined)
      setComment('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post comment.')
    }
  }

  function onReply(clarificationId: string) {
    setClarifyError('')
    try {
      replyToClarification(question!.id, clarificationId, replyDrafts[clarificationId] ?? '')
      setReplyDrafts((prev) => ({ ...prev, [clarificationId]: '' }))
    } catch (err) {
      setClarifyError(err instanceof Error ? err.message : 'Could not send reply.')
    }
  }

  const fieldClass =
    'w-full rounded-xl bg-surface px-3 py-2.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-canvas focus:ring-brand-500/35'

  const mobileProps = {
    question,
    justAsked,
    isOwner,
    leadScholar: leadScholar ?? undefined,
    endorsers,
    learners,
    comment,
    setComment,
    commentAs,
    setCommentAs,
    replyDrafts,
    setReplyDrafts,
    error,
    clarifyError,
    onComment,
    onReply,
    getTeacher,
  }

  return (
    <>
      <MobileAskThread {...mobileProps} />

      <div className="mx-auto hidden max-w-3xl space-y-4 animate-rise lg:block">
        <Link
          to="/ask"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          ← Ask Scholars
        </Link>

        {justAsked ? (
          <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-200/80">
            Submitted{question.anonymous ? ' anonymously' : ''}. Scholars may ask for more context.
            The endorsed answer will appear here when published.
          </div>
        ) : null}

        <article className="overflow-hidden rounded-2xl bg-canvas shadow-sm shadow-brand-800/5 ring-1 ring-line/80">
          <div className="border-b border-line/70 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                {SUBJECT_LABELS[question.topic]}
              </span>
              <span
                className={[
                  'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                  question.status === 'published'
                    ? 'bg-brand-50 text-brand-800'
                    : 'bg-amber-50 text-amber-950',
                ].join(' ')}
              >
                {ASK_STATUS_LABELS[question.status]}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
              {question.title}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {askAuthorLabel(question)}
              {question.anonymous ? ' · anonymous' : ''} · {formatAskDate(question.createdAt)}
            </p>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <p className="text-[15px] leading-relaxed text-ink/90">{question.body}</p>

            {question.status === 'under_review' ? (
              <div className="mt-6 rounded-2xl bg-surface/80 px-4 py-4 ring-1 ring-dashed ring-line">
                <p className="text-sm font-semibold text-ink">Under review</p>
                <p className="mt-1 text-sm text-muted">
                  Scholars are discussing privately. Clarifying questions for you show below.
                </p>
                <Link
                  to={`/ask/${question.id}/scholar`}
                  className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  Open private scholar room (demo) →
                </Link>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-brand-50/60 px-4 py-5 ring-1 ring-brand-100">
                <p className="text-xs font-semibold text-brand-700">Endorsed answer</p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink">
                  {question.publishedAnswer}
                </p>
                {endorsers.length > 0 ? (
                  <div className="mt-5 flex flex-col gap-4 border-t border-brand-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className="grid h-11 w-11 place-items-center rounded-xl text-sm font-semibold text-white"
                        style={{ background: leadScholar!.avatarColor }}
                      >
                        {leadScholar!.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{leadScholar!.name}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {question.publishedAt ? formatAskDate(question.publishedAt) : ''} ·{' '}
                          {endorsers.map((s) => s!.name).join(' · ')}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {leadScholar!.badges.map((b) => (
                            <BadgePill key={b} id={b} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <ButtonLink to={`/learn/${leadScholar!.id}`} className="!rounded-xl !text-sm">
                      Hire {teacherGivenName(leadScholar!.name)}
                    </ButtonLink>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </article>

        {question.status === 'under_review' && isOwner ? (
          <section className="rounded-2xl bg-canvas p-5 shadow-sm ring-1 ring-line/80 sm:p-6">
            <h2 className="text-sm font-semibold text-ink">Scholar questions for you</h2>
            <p className="mt-1 text-xs text-muted">
              Replies stay with this review — not the public discussion.
            </p>
            <div className="mt-4 space-y-3">
              {clarifications.length === 0 ? (
                <p className="rounded-xl bg-surface px-3 py-4 text-sm text-muted">
                  No clarifying questions yet.
                </p>
              ) : (
                clarifications.map((c) => {
                  const scholar = getTeacher(c.scholarId)
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl bg-surface/80 px-3.5 py-3.5 ring-1 ring-line/60"
                    >
                      <p className="text-xs font-semibold text-brand-700">
                        {scholar?.name ?? 'Scholar'} · {formatAskDate(c.createdAt)}
                      </p>
                      <p className="mt-1.5 text-sm text-ink">{c.body}</p>
                      {c.studentReply ? (
                        <div className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm">
                          <p className="text-[11px] font-semibold text-brand-700">Your reply</p>
                          <p className="mt-0.5 text-ink">{c.studentReply}</p>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={replyDrafts[c.id] ?? ''}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                            }
                            rows={3}
                            placeholder="Share the details they asked for…"
                            className={`${fieldClass} resize-y`}
                          />
                          <Button
                            type="button"
                            className="!rounded-xl !text-sm"
                            onClick={() => onReply(c.id)}
                          >
                            Send reply
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
            {clarifyError ? (
              <p className="mt-3 text-sm text-red-700" role="alert">
                {clarifyError}
              </p>
            ) : null}
          </section>
        ) : null}

        {question.status === 'published' ? (
          <section className="rounded-2xl bg-canvas p-5 shadow-sm ring-1 ring-line/80 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink">Discussion</h2>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted">
                {comments.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Comment to get more clarity — follow-ups are public on this thread.
            </p>

            <div className="mt-4 space-y-2">
              {comments.length === 0 ? (
                <p className="rounded-xl bg-surface px-3 py-4 text-sm text-muted">
                  No comments yet. Ask a follow-up if something is unclear.
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl bg-surface/70 px-3.5 py-3 ring-1 ring-line/50"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{c.authorName}</p>
                      <p className="text-[11px] text-muted">{formatAskDate(c.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ink/90">{c.body}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={onComment} className="mt-5 space-y-3 border-t border-line/70 pt-5">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-ink">Comment as</span>
                <select
                  value={commentAs}
                  onChange={(e) => setCommentAs(e.target.value)}
                  className={fieldClass}
                >
                  {learners.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.kind === 'self' ? `${l.name} (you)` : l.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-ink">Ask for more clarity</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="What still isn’t clear?"
                  className={`${fieldClass} resize-y`}
                />
              </label>
              {error ? (
                <p className="text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="!rounded-xl">
                Post comment
              </Button>
            </form>
          </section>
        ) : null}
      </div>
    </>
  )
}
