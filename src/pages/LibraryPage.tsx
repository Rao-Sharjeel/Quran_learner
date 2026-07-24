import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getBookmarksForResource,
  getLearner,
  listLibrary,
  useReadingBookmarks,
} from '../mocks/store'
import {
  LIBRARY_KIND_LABELS,
  LIBRARY_TOPIC_LABELS,
  type LibraryKind,
  type LibraryResource,
  type LibraryTopic,
} from '../types'
import { BookCover } from '../components/BookCover'

const fieldClass =
  'rounded-2xl bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line transition focus:bg-canvas focus:ring-2 focus:ring-brand-500/30'

export function LibraryPage() {
  const resources = listLibrary()
  const bookmarks = useReadingBookmarks()
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<LibraryTopic | 'all'>('all')
  const [kind, setKind] = useState<LibraryKind | 'all'>('all')
  const [familyOnly, setFamilyOnly] = useState(false)

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((b) => b.resourceId)),
    [bookmarks],
  )

  const topics = useMemo(
    () =>
      Array.from(new Set(resources.map((r) => r.topic))).sort((a, b) =>
        LIBRARY_TOPIC_LABELS[a].localeCompare(LIBRARY_TOPIC_LABELS[b]),
      ),
    [resources],
  )

  const filtered = resources.filter((r) => {
    const q = query.trim().toLowerCase()
    const matchesQuery =
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.author.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      LIBRARY_TOPIC_LABELS[r.topic].toLowerCase().includes(q)
    const matchesTopic = topic === 'all' || r.topic === topic
    const matchesKind = kind === 'all' || r.kind === kind
    const matchesFamily = !familyOnly || bookmarkedIds.has(r.id)
    return matchesQuery && matchesTopic && matchesKind && matchesFamily
  })

  return (
    <div className="space-y-7 animate-rise">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Library</h1>
        <p className="mt-2 max-w-xl text-muted">
          Browse the shelf — open a book for yourself or a kid, and pick up where you left off.
        </p>
      </div>

      {bookmarks.length > 0 ? (
        <section className="overflow-hidden rounded-3xl bg-brand-800 px-4 pb-4 pt-3 text-brand-50 shadow-lg shadow-brand-800/15">
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <h2 className="text-sm font-bold tracking-tight">Continue reading</h2>
            <span className="text-xs font-semibold text-brand-200">
              {bookmarks.length} on the shelf
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1 pt-2">
            {[...bookmarks]
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .map((b) => {
                const resource = resources.find((r) => r.id === b.resourceId)
                const learner = getLearner(b.learnerId)
                if (!resource || !learner) return null
                return (
                  <Link
                    key={b.id}
                    to={`/library/${resource.id}`}
                    className="group w-[7.5rem] shrink-0"
                  >
                    <span className="shelf-book block">
                      <span className="shelf-book__pages" aria-hidden />
                      <span className="shelf-book__spine" aria-hidden />
                      <span className="shelf-book__face block aspect-[2/3] w-full">
                        <BookCover
                          resource={resource}
                          className="h-full w-full rounded-none"
                          labelClassName="hidden"
                        />
                      </span>
                    </span>
                    <span className="mt-2 block">
                      <span className="line-clamp-2 text-xs font-bold leading-snug text-brand-50">
                        {resource.title}
                      </span>
                      <span className="mt-1 block text-[10px] text-brand-200">
                        {learner.kind === 'self' ? 'You' : learner.name.split(' ')[0]} ·{' '}
                        {b.progressPercent}%
                      </span>
                      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/15">
                        <span
                          className="block h-full rounded-full bg-brass"
                          style={{ width: `${b.progressPercent}%` }}
                        />
                      </span>
                    </span>
                  </Link>
                )
              })}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 panel p-4 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, author, or topic"
          className={`w-full flex-1 ${fieldClass}`}
        />
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value as LibraryTopic | 'all')}
          className={fieldClass}
        >
          <option value="all">All topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {LIBRARY_TOPIC_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as LibraryKind | 'all')}
          className={fieldClass}
        >
          <option value="all">All types</option>
          {(Object.keys(LIBRARY_KIND_LABELS) as LibraryKind[]).map((k) => (
            <option key={k} value={k}>
              {LIBRARY_KIND_LABELS[k]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setFamilyOnly((v) => !v)}
          className={[
            'rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition',
            familyOnly
              ? 'bg-brand-700 text-white'
              : 'bg-surface text-muted ring-1 ring-line hover:text-ink',
          ].join(' ')}
        >
          Bookmarked
        </button>
      </div>

      <p className="text-sm text-muted">
        {filtered.length === 0
          ? 'No books match these filters.'
          : `${filtered.length} book${filtered.length === 1 ? '' : 's'} on the shelf`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-canvas/70 px-5 py-10 text-center">
          <p className="font-semibold text-ink">Try another search</p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-brand-700 hover:text-brand-800"
            onClick={() => {
              setQuery('')
              setTopic('all')
              setKind('all')
              setFamilyOnly(false)
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="bookshelf px-4 pb-3 pt-6 sm:px-6">
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((resource) => (
              <ShelfBook key={resource.id} resource={resource} />
            ))}
          </div>
          <div className="bookshelf__plank mt-3" aria-hidden />
        </div>
      )}
    </div>
  )
}

function ShelfBook({ resource }: { resource: LibraryResource }) {
  const marks = getBookmarksForResource(resource.id)

  return (
    <Link to={`/library/${resource.id}`} className="group flex flex-col items-center text-center">
      <span className="shelf-book w-[78%] max-w-[9.5rem]">
        <span className="shelf-book__pages" aria-hidden />
        <span className="shelf-book__spine" aria-hidden />
        <span className="shelf-book__face block aspect-[2/3] w-full">
          <BookCover
            resource={resource}
            className="h-full w-full rounded-none"
            labelClassName="text-[7px] font-bold uppercase tracking-wide text-white/90"
          />
        </span>
      </span>
      <span className="mt-3 w-full px-0.5">
        <span className="line-clamp-2 text-sm font-bold leading-snug tracking-tight text-ink">
          {resource.title}
        </span>
        <span className="mt-0.5 line-clamp-1 block text-[11px] text-muted">{resource.author}</span>
        <span className="mt-1 block text-[10px] font-medium text-muted/90">
          {LIBRARY_TOPIC_LABELS[resource.topic]}
          {resource.format === 'pdf' ? ' · PDF' : ''}
        </span>
        {marks.length > 0 ? (
          <span className="mt-2 flex flex-wrap justify-center gap-1">
            {marks.map((b) => {
              const learner = getLearner(b.learnerId)
              if (!learner) return null
              return (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1 rounded-full bg-canvas px-1.5 py-0.5 text-[9px] font-bold text-ink ring-1 ring-line"
                  title={`${learner.name} · ${b.progressPercent}%`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: learner.avatarColor }}
                  />
                  {learner.kind === 'self' ? 'You' : learner.name.split(' ')[0]} {b.progressPercent}%
                </span>
              )
            })}
          </span>
        ) : null}
      </span>
    </Link>
  )
}
