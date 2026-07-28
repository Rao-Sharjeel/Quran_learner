import { Link, useNavigate } from 'react-router-dom'
import { SUBJECT_LABELS } from '../../types'
import { AskAnswerFeed } from './AskAnswerFeed'
import { useAskListController } from './useAskListController'

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Quora-inspired mobile Ask hub: compact search, horizontal topic chips, feed-first.
 * Desktop tree stays in AskListPage (lg+).
 */
export function MobileAskList() {
  const navigate = useNavigate()
  const {
    guardian,
    familyUnderReview,
    topicRows,
    qParam,
    topicParam,
    draft,
    setDraft,
    homeTab,
    setHomeTab,
    mode,
    onSearch,
    selectTopic,
    clearToHome,
    searchResults,
    topicResults,
    activeQuestions,
  } = useAskListController()

  const firstName = guardian.name.split(' ')[0]

  const feedTitle =
    mode === 'search'
      ? `${searchResults.length} results`
      : mode === 'topic' && topicParam
        ? SUBJECT_LABELS[topicParam]
        : homeTab === 'featured'
          ? 'Featured'
          : 'Recent'

  const feedEmpty =
    mode === 'search'
      ? 'No matches. Try another search or ask scholars.'
      : mode === 'topic'
        ? 'Nothing published here yet.'
        : 'No answers yet.'

  return (
    <div className="flex flex-col gap-2.5 animate-rise lg:hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h1 className="text-lg font-extrabold tracking-tight text-ink">Ask Scholars</h1>
        <Link
          to="/ask/new"
          className="shrink-0 rounded-full bg-brand-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
        >
          Ask
        </Link>
      </div>

      {/* Search — Quora-style single line */}
      <form onSubmit={onSearch} className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <SearchIcon />
        </span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search answered questions…"
          className="w-full rounded-xl bg-canvas py-2.5 pl-9 pr-3 text-sm text-ink outline-none ring-1 ring-line placeholder:text-muted focus:ring-2 focus:ring-brand-500/30"
          aria-label="Search answered questions"
        />
      </form>

      {/* Horizontal topic chips — replaces sidebar */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 snap-x snap-mandatory">
        <TopicChip
          label="All"
          active={mode === 'home'}
          onClick={() => clearToHome()}
        />
        {topicRows
          .filter((t) => t.count > 0)
          .map((t) => (
            <TopicChip
              key={t.id}
              label={t.label}
              count={t.count}
              active={mode === 'topic' && topicParam === t.id}
              onClick={() => selectTopic(t.id)}
            />
          ))}
      </div>

      {/* Family review — compact strip */}
      {familyUnderReview.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto rounded-xl bg-amber-50 px-2.5 py-2 ring-1 ring-amber-200/80">
          <span className="shrink-0 rounded-full bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-950">
            Review
          </span>
          {familyUnderReview.slice(0, 2).map((q) => (
            <Link
              key={q.id}
              to={`/ask/${q.id}`}
              className="shrink-0 truncate text-xs font-medium text-amber-950 underline-offset-2 active:underline"
            >
              {q.title.length > 28 ? `${q.title.slice(0, 28)}…` : q.title}
            </Link>
          ))}
          {familyUnderReview.length > 2 ? (
            <span className="shrink-0 text-[10px] text-amber-800">
              +{familyUnderReview.length - 2}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Feed header */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-ink">{feedTitle}</h2>
          {mode === 'search' ? (
            <button
              type="button"
              onClick={clearToHome}
              className="text-[11px] font-semibold text-brand-700"
            >
              Clear search
            </button>
          ) : mode === 'home' ? (
            <p className="text-[10px] text-muted">For {firstName}&apos;s family</p>
          ) : null}
        </div>
        {mode === 'home' ? (
          <div className="inline-flex shrink-0 rounded-lg bg-surface p-0.5 ring-1 ring-line/70">
            {(
              [
                ['featured', 'Featured'],
                ['recent', 'Recent'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setHomeTab(id)}
                className={[
                  'rounded-md px-2 py-1 text-[10px] font-bold transition',
                  homeTab === id
                    ? 'bg-canvas text-ink shadow-sm'
                    : 'text-muted',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        ) : mode === 'topic' ? (
          <button
            type="button"
            onClick={() => navigate('/ask/new')}
            className="shrink-0 text-[11px] font-semibold text-brand-700"
          >
            Ask in topic
          </button>
        ) : null}
      </div>

      {/* Answer feed */}
      <section className="overflow-hidden rounded-xl bg-canvas ring-1 ring-line/80">
        <AskAnswerFeed
          questions={activeQuestions}
          empty={feedEmpty}
          onAsk={() => navigate('/ask/new')}
          compact
        />
      </section>
    </div>
  )
}

function TopicChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex shrink-0 snap-start items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition',
        active
          ? 'bg-brand-700 text-white'
          : 'bg-canvas text-ink ring-1 ring-line',
      ].join(' ')}
    >
      {label}
      {count != null && count > 0 ? (
        <span
          className={[
            'rounded-full px-1 text-[9px] font-bold tabular-nums',
            active ? 'bg-white/20 text-white' : 'bg-surface text-muted',
          ].join(' ')}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}
