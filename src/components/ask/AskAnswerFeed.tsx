import { Link } from 'react-router-dom'
import type { AskQuestion } from '../../types'
import { SUBJECT_LABELS } from '../../types'
import { Button } from '../Button'
import { askAuthorLabel, formatAskDate } from '../../lib/format'

export function AskAnswerFeed({
  questions,
  empty,
  onAsk,
  compact = false,
}: {
  questions: AskQuestion[]
  empty: string
  onAsk: () => void
  compact?: boolean
}) {
  if (questions.length === 0) {
    return (
      <div className={compact ? 'px-3 py-8 text-center' : 'px-4 py-10 text-center'}>
        <p className="text-sm font-semibold text-ink">{empty}</p>
        <Button
          type="button"
          className="mt-3 !rounded-xl !px-3 !py-2 !text-xs"
          onClick={onAsk}
        >
          Ask scholars
        </Button>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-line/60">
      {questions.map((q) => (
        <li key={q.id}>
          <Link
            to={`/ask/${q.id}`}
            className={[
              'group block transition active:bg-brand-50/50',
              compact ? 'px-3 py-3' : 'flex gap-3 px-4 py-3.5 hover:bg-brand-50/40',
            ].join(' ')}
          >
            {compact ? (
              <div className="min-w-0">
                <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink group-active:text-brand-800">
                  {q.title}
                </p>
                {q.publishedAnswer ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                    {q.publishedAnswer}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
                  <span className="rounded-full bg-surface px-1.5 py-0.5 font-semibold text-brand-700">
                    {SUBJECT_LABELS[q.topic]}
                  </span>
                  <span>{formatAskDate(q.publishedAt ?? q.createdAt)}</span>
                  <span className="text-line">·</span>
                  <span>{q.comments?.length ?? 0} comments</span>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <AnswerIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink group-hover:text-brand-800">
                      {q.title}
                    </p>
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted">
                      {SUBJECT_LABELS[q.topic]}
                    </span>
                  </div>
                  {q.publishedAnswer ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                      {q.publishedAnswer}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted">
                    <span>{formatAskDate(q.publishedAt ?? q.createdAt)}</span>
                    <span className="text-line">·</span>
                    <span>{askAuthorLabel(q)}</span>
                    <span className="text-line">·</span>
                    <span className="font-medium text-brand-700">
                      {q.comments?.length ?? 0} comments
                    </span>
                  </div>
                </div>
              </>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function AnswerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 8h10M7 12h7M6 4h12a2 2 0 012 2v9a2 2 0 01-2 2h-4l-4 3v-3H6a2 2 0 01-2-2V6a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
