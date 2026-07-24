import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getGuardian, getLearners, useAskQuestions } from '../mocks/store'
import { SUBJECT_LABELS, type AskQuestion, type SubjectId } from '../types'
import { Button, ButtonLink } from '../components/Button'
import { askAuthorLabel, formatAskDate, matchesAskSearch } from '../lib/format'

type HomeTab = 'featured' | 'recent'

/** Modern edtech Ask hub — product UI, not a blog archive. */
export function AskListPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const guardian = getGuardian()
  const familyIds = new Set(getLearners().map((l) => l.id))
  const all = useAskQuestions()

  const qParam = params.get('q') ?? ''
  const topicParam = (params.get('topic') as SubjectId | null) ?? null
  const [draft, setDraft] = useState(qParam)
  const [topicFilter, setTopicFilter] = useState('')
  const [homeTab, setHomeTab] = useState<HomeTab>('featured')

  const published = useMemo(
    () => all.filter((q) => q.status === 'published'),
    [all],
  )

  const familyUnderReview = all.filter(
    (q) => q.status === 'under_review' && familyIds.has(q.studentId),
  )

  const topicRows = useMemo(() => {
    const counts = {} as Record<SubjectId, number>
    for (const id of Object.keys(SUBJECT_LABELS) as SubjectId[]) counts[id] = 0
    for (const q of published) counts[q.topic] = (counts[q.topic] ?? 0) + 1

    const needle = topicFilter.trim().toLowerCase()
    return (Object.keys(SUBJECT_LABELS) as SubjectId[])
      .map((id) => ({
        id,
        label: SUBJECT_LABELS[id],
        count: counts[id] ?? 0,
      }))
      .filter((t) => !needle || t.label.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return a.label.localeCompare(b.label)
      })
  }, [published, topicFilter])

  const featured = useMemo(
    () =>
      [...published]
        .sort((a, b) => (b.comments?.length ?? 0) - (a.comments?.length ?? 0))
        .slice(0, 5),
    [published],
  )

  const recent = useMemo(
    () =>
      [...published]
        .sort((a, b) =>
          (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
        )
        .slice(0, 6),
    [published],
  )

  const searchResults = useMemo(() => {
    if (!qParam.trim()) return []
    return published
      .filter((q) => matchesAskSearch(q, qParam, SUBJECT_LABELS))
      .sort((a, b) =>
        (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
      )
  }, [published, qParam])

  const topicResults = useMemo(() => {
    if (!topicParam || !(topicParam in SUBJECT_LABELS)) return []
    return published
      .filter((q) => q.topic === topicParam)
      .sort((a, b) =>
        (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
      )
  }, [published, topicParam])

  const mode: 'home' | 'search' | 'topic' = qParam.trim()
    ? 'search'
    : topicParam && topicParam in SUBJECT_LABELS
      ? 'topic'
      : 'home'

  function onSearch(e: FormEvent) {
    e.preventDefault()
    const next = draft.trim()
    if (!next) {
      setParams({})
      return
    }
    setParams({ q: next })
  }

  function selectTopic(id: SubjectId) {
    setDraft('')
    setParams({ topic: id })
  }

  function clearToHome() {
    setDraft('')
    setParams({})
  }

  const homeList = homeTab === 'featured' ? featured : recent

  return (
    <div className="space-y-6 animate-rise">
      {/* Product hero — edtech command surface, not a blog masthead */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-brand-800 px-5 py-6 text-white sm:px-7 sm:py-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 100% 0%, rgb(47 107 87 / 0.55), transparent 55%), radial-gradient(ellipse 50% 60% at 0% 100%, rgb(156 126 74 / 0.22), transparent 50%)',
          }}
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-lg">
            <p className="text-xs font-semibold text-brand-200">Knowledge base</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Ask Scholars
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-brand-100/90">
              Find endorsed answers fast. Comment for clarity. Ask only when the archive doesn’t
              cover it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-50 ring-1 ring-white/15">
              {published.length} answers
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-50 ring-1 ring-white/15">
              {topicRows.filter((t) => t.count > 0).length} topics
            </span>
            <ButtonLink
              to="/ask/new"
              className="!bg-white !px-3.5 !py-2 !text-sm !text-brand-800 hover:!bg-brand-50"
            >
              Ask a question
            </ButtonLink>
          </div>
        </div>

        <form onSubmit={onSearch} className="relative mt-5 flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-700/50">
              <SearchIcon />
            </span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search tajweed, hifz, seerah…"
              className="w-full rounded-2xl border-0 bg-white py-3 pl-10 pr-3.5 text-sm text-ink shadow-lg shadow-brand-900/20 outline-none ring-0 placeholder:text-muted focus:ring-2 focus:ring-brass/40"
              aria-label="Search answered questions"
            />
          </div>
          <Button
            type="submit"
            className="!rounded-2xl !bg-brass !px-5 !text-white hover:!brightness-110"
          >
            Search
          </Button>
        </form>
      </section>

      {familyUnderReview.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-amber-50 px-4 py-2.5 text-sm ring-1 ring-amber-200/80">
          <span className="inline-flex h-6 items-center rounded-full bg-amber-200/80 px-2 text-[11px] font-bold uppercase tracking-wide text-amber-950">
            Review
          </span>
          <span className="font-medium text-amber-950">
            {familyUnderReview.length} for {guardian.name.split(' ')[0]}’s family
          </span>
          {familyUnderReview.slice(0, 2).map((q) => (
            <Link
              key={q.id}
              to={`/ask/${q.id}`}
              className="text-brand-800 underline-offset-2 hover:underline"
            >
              {q.title.length > 36 ? `${q.title.slice(0, 36)}…` : q.title}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="flex flex-col overflow-hidden rounded-2xl bg-canvas shadow-sm shadow-brand-800/5 ring-1 ring-line/80 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)]">
          <div className="space-y-2 border-b border-line/80 px-3 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Topics</p>
              <span className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                {topicRows.length}
              </span>
            </div>
            <input
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              placeholder="Filter…"
              className="w-full rounded-xl bg-surface px-2.5 py-2 text-xs outline-none ring-1 ring-transparent focus:bg-canvas focus:ring-brand-500/30"
              aria-label="Filter topics"
            />
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto p-1.5">
            <TopicNavItem
              label="Overview"
              count={published.length}
              active={mode === 'home'}
              onClick={clearToHome}
            />
            {topicRows.map((t) => (
              <TopicNavItem
                key={t.id}
                label={t.label}
                count={t.count}
                active={mode === 'topic' && topicParam === t.id}
                onClick={() => selectTopic(t.id)}
              />
            ))}
            {topicRows.length === 0 ? (
              <p className="px-2.5 py-3 text-xs text-muted">No topics match.</p>
            ) : null}
          </nav>
        </aside>

        <main className="min-w-0 space-y-4">
          {mode === 'search' ? (
            <Panel
              title={`Results`}
              subtitle={`${searchResults.length} for “${qParam}”`}
              action={
                <button
                  type="button"
                  onClick={clearToHome}
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                >
                  Clear
                </button>
              }
            >
              <AnswerFeed
                questions={searchResults}
                empty="No matches. Try another search or ask scholars."
                onAsk={() => navigate('/ask/new')}
              />
            </Panel>
          ) : null}

          {mode === 'topic' && topicParam ? (
            <Panel
              title={SUBJECT_LABELS[topicParam]}
              subtitle={`${topicResults.length} published`}
              action={
                <Button
                  type="button"
                  variant="secondary"
                  className="!rounded-xl !px-3 !py-1.5 !text-xs"
                  onClick={() => navigate('/ask/new')}
                >
                  Ask in topic
                </Button>
              }
            >
              <AnswerFeed
                questions={topicResults}
                empty="Nothing published here yet."
                onAsk={() => navigate('/ask/new')}
              />
            </Panel>
          ) : null}

          {mode === 'home' ? (
            <Panel
              title="Answers"
              subtitle="Curated — pick a topic for the full set"
              action={
                <div className="inline-flex rounded-xl bg-surface p-0.5 ring-1 ring-line/70">
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
                        'rounded-[0.65rem] px-3 py-1.5 text-xs font-semibold transition',
                        homeTab === id
                          ? 'bg-white text-ink shadow-sm'
                          : 'text-muted hover:text-ink',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              }
            >
              <AnswerFeed
                questions={homeList}
                empty="No answers yet."
                onAsk={() => navigate('/ask/new')}
              />
            </Panel>
          ) : null}
        </main>
      </div>
    </div>
  )
}

function TopicNavItem({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition',
        active
          ? 'bg-brand-50 font-semibold text-brand-800 ring-1 ring-brand-200/80'
          : 'text-ink/90 hover:bg-surface',
      ].join(' ')}
    >
      <span className="truncate">{label}</span>
      <span
        className={[
          'rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
          active ? 'bg-brand-100 text-brand-800' : 'bg-surface text-muted',
        ].join(' ')}
      >
        {count}
      </span>
    </button>
  )
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-canvas shadow-sm shadow-brand-800/5 ring-1 ring-line/80">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function AnswerFeed({
  questions,
  empty,
  onAsk,
}: {
  questions: AskQuestion[]
  empty: string
  onAsk: () => void
}) {
  if (questions.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm font-semibold text-ink">{empty}</p>
        <Button type="button" className="mt-3 !rounded-xl !px-3 !py-2 !text-xs" onClick={onAsk}>
          Ask scholars
        </Button>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-line/70">
      {questions.map((q) => (
        <li key={q.id}>
          <Link
            to={`/ask/${q.id}`}
            className="group flex gap-3 px-4 py-3.5 transition hover:bg-brand-50/40"
          >
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
          </Link>
        </li>
      ))}
    </ul>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
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
