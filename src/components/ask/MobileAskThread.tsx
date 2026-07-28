import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import type { AskQuestion, LearnerProfile, Teacher } from '../../types'
import { ASK_STATUS_LABELS, SUBJECT_LABELS } from '../../types'
import { BadgePill } from '../BadgePill'
import { Button } from '../Button'
import { askAuthorLabel, formatAskDate, teacherGivenName } from '../../lib/format'

type Props = {
  question: AskQuestion
  justAsked: boolean
  isOwner: boolean
  leadScholar?: Teacher
  endorsers: (Teacher | undefined)[]
  learners: LearnerProfile[]
  comment: string
  setComment: (v: string) => void
  commentAs: string
  setCommentAs: (v: string) => void
  replyDrafts: Record<string, string>
  setReplyDrafts: Dispatch<SetStateAction<Record<string, string>>>
  error: string
  clarifyError: string
  onComment: (e: FormEvent) => void
  onReply: (clarificationId: string) => void
  getTeacher: (id: string) => Teacher | undefined
}

/**
 * Quora-inspired mobile thread: tight question → answer → discussion.
 * Desktop stays in AskThreadPage (lg+).
 */
export function MobileAskThread({
  question,
  justAsked,
  isOwner,
  leadScholar,
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
}: Props) {
  const comments = question.comments ?? []
  const clarifications = question.clarifications ?? []

  return (
    <div className="flex flex-col gap-2.5 animate-rise lg:hidden">
      <Link
        to="/ask"
        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700"
      >
        ← Ask
      </Link>

      {justAsked ? (
        <div className="rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-800 ring-1 ring-brand-200/80">
          Submitted{question.anonymous ? ' anonymously' : ''}. Scholars may ask for more context.
        </div>
      ) : null}

      {/* Question */}
      <article className="overflow-hidden rounded-xl bg-canvas ring-1 ring-line/80">
        <div className="border-b border-line/60 px-3 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted">
              {SUBJECT_LABELS[question.topic]}
            </span>
            <span
              className={[
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                question.status === 'published'
                  ? 'bg-brand-50 text-brand-800'
                  : 'bg-amber-50 text-amber-950',
              ].join(' ')}
            >
              {ASK_STATUS_LABELS[question.status]}
            </span>
          </div>
          <h1 className="mt-2 text-lg font-extrabold leading-snug tracking-tight text-ink">
            {question.title}
          </h1>
          <p className="mt-1 text-[11px] text-muted">
            {askAuthorLabel(question)}
            {question.anonymous ? ' · anonymous' : ''} · {formatAskDate(question.createdAt)}
          </p>
        </div>

        <div className="px-3 py-3">
          <p className="text-sm leading-relaxed text-ink/90">{question.body}</p>

          {question.status === 'under_review' ? (
            <div className="mt-3 rounded-xl bg-surface/80 px-3 py-3 ring-1 ring-dashed ring-line">
              <p className="text-xs font-bold text-ink">Under review</p>
              <p className="mt-1 text-xs text-muted">
                Scholars are discussing privately. Clarifying questions show below.
              </p>
              <Link
                to={`/ask/${question.id}/scholar`}
                className="mt-2 inline-block text-xs font-semibold text-brand-700"
              >
                Scholar room →
              </Link>
            </div>
          ) : (
            <div className="mt-3 rounded-xl bg-brand-50/70 px-3 py-3 ring-1 ring-brand-100">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
                Endorsed answer
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">
                {question.publishedAnswer}
              </p>
              {leadScholar ? (
                <div className="mt-3 flex items-center gap-2.5 border-t border-brand-100 pt-3">
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-white"
                    style={{ background: leadScholar.avatarColor }}
                  >
                    {leadScholar.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-ink">{leadScholar.name}</p>
                    <p className="truncate text-[10px] text-muted">
                      {question.publishedAt ? formatAskDate(question.publishedAt) : ''}
                      {endorsers.length > 1
                        ? ` · +${endorsers.length - 1} endorser${endorsers.length > 2 ? 's' : ''}`
                        : ''}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {leadScholar.badges.slice(0, 2).map((b) => (
                        <BadgePill key={b} id={b} />
                      ))}
                    </div>
                  </div>
                  <Link
                    to={`/learn/${leadScholar.id}`}
                    className="shrink-0 rounded-lg bg-brand-700 px-2.5 py-1.5 text-[10px] font-bold text-white"
                  >
                    Hire {teacherGivenName(leadScholar.name)}
                  </Link>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </article>

      {/* Clarifications */}
      {question.status === 'under_review' && isOwner ? (
        <section className="rounded-xl bg-canvas px-3 py-3 ring-1 ring-line/80">
          <h2 className="text-xs font-bold text-ink">Scholar questions</h2>
          <p className="mt-0.5 text-[10px] text-muted">Replies stay private to this review.</p>
          <div className="mt-2.5 space-y-2">
            {clarifications.length === 0 ? (
              <p className="rounded-lg bg-surface px-2.5 py-3 text-xs text-muted">
                No clarifying questions yet.
              </p>
            ) : (
              clarifications.map((c) => {
                const scholar = getTeacher(c.scholarId)
                return (
                  <div
                    key={c.id}
                    className="rounded-lg bg-surface/80 px-2.5 py-2.5 ring-1 ring-line/60"
                  >
                    <p className="text-[10px] font-bold text-brand-700">
                      {scholar?.name ?? 'Scholar'} · {formatAskDate(c.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-ink">{c.body}</p>
                    {c.studentReply ? (
                      <div className="mt-1.5 rounded-md bg-brand-50 px-2 py-1.5 text-xs">
                        <p className="text-[10px] font-bold text-brand-700">Your reply</p>
                        <p className="mt-0.5 text-ink">{c.studentReply}</p>
                      </div>
                    ) : (
                      <div className="mt-1.5 space-y-1.5">
                        <textarea
                          value={replyDrafts[c.id] ?? ''}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                          }
                          rows={2}
                          placeholder="Share the details…"
                          className="w-full resize-y rounded-lg bg-canvas px-2.5 py-2 text-xs outline-none ring-1 ring-line focus:ring-brand-500/35"
                        />
                        <Button
                          type="button"
                          className="!rounded-lg !px-2.5 !py-1.5 !text-xs"
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
            <p className="mt-2 text-xs text-red-700" role="alert">
              {clarifyError}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Discussion */}
      {question.status === 'published' ? (
        <section className="rounded-xl bg-canvas px-3 py-3 ring-1 ring-line/80">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-ink">Discussion</h2>
            <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-bold text-muted">
              {comments.length}
            </span>
          </div>

          <div className="mt-2.5 space-y-1.5">
            {comments.length === 0 ? (
              <p className="rounded-lg bg-surface px-2.5 py-3 text-xs text-muted">
                No comments yet.
              </p>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg bg-surface/70 px-2.5 py-2 ring-1 ring-line/50"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-bold text-ink">{c.authorName}</p>
                    <p className="shrink-0 text-[10px] text-muted">
                      {formatAskDate(c.createdAt)}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink/90">{c.body}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={onComment} className="mt-3 space-y-2 border-t border-line/60 pt-3">
            <select
              value={commentAs}
              onChange={(e) => setCommentAs(e.target.value)}
              aria-label="Comment as"
              className="w-full rounded-lg bg-surface px-2.5 py-2 text-xs outline-none ring-1 ring-line focus:ring-brand-500/35"
            >
              {learners.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.kind === 'self' ? `${l.name} (you)` : l.name}
                </option>
              ))}
            </select>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Ask for more clarity…"
              className="w-full resize-y rounded-lg bg-surface px-2.5 py-2 text-xs outline-none ring-1 ring-line focus:ring-brand-500/35"
            />
            {error ? (
              <p className="text-xs text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="!w-full !rounded-lg !py-2 !text-xs">
              Post comment
            </Button>
          </form>
        </section>
      ) : null}
    </div>
  )
}
