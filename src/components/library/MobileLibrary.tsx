import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getBookmarksForResource,
  getLearner,
  listLibrary,
  useReadingBookmarks,
} from '../../mocks/store'
import {
  LIBRARY_KIND_LABELS,
  LIBRARY_TOPIC_LABELS,
  type LibraryKind,
  type LibraryResource,
  type LibraryTopic,
} from '../../types'
import { BookCover } from '../BookCover'

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Mobile Library — continue strip, chips, compact 2-col shelf.
 * Desktop tree stays in LibraryPage (lg+).
 */
export function MobileLibrary() {
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

  const kinds = Object.keys(LIBRARY_KIND_LABELS) as LibraryKind[]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resources.filter((r) => {
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
  }, [resources, query, topic, kind, familyOnly, bookmarkedIds])

  const continueReading = useMemo(
    () =>
      [...bookmarks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [bookmarks],
  )

  return (
    <div className="flex flex-col gap-2.5 animate-rise lg:hidden">
      <div className="flex items-end justify-between gap-2 px-0.5">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-ink">Library</h1>
          <p className="text-[11px] text-muted">Browse · continue for you or a kid</p>
        </div>
        <p className="shrink-0 text-[10px] font-bold tabular-nums text-muted">
          <span className="text-ink">{filtered.length}</span> books
        </p>
      </div>

      {continueReading.length > 0 ? (
        <section className="overflow-hidden rounded-2xl bg-brand-800 px-3 pb-3 pt-2.5 text-brand-50">
          <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
            <h2 className="text-xs font-bold tracking-tight">Continue</h2>
            <span className="text-[10px] font-semibold text-brand-200">
              {continueReading.length} open
            </span>
          </div>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-0.5 snap-x snap-mandatory">
            {continueReading.map((b) => {
              const resource = resources.find((r) => r.id === b.resourceId)
              const learner = getLearner(b.learnerId)
              if (!resource || !learner) return null
              return (
                <Link
                  key={b.id}
                  to={`/library/${resource.id}`}
                  className="w-[5.5rem] shrink-0 snap-start"
                >
                  <span className="block overflow-hidden rounded-lg ring-1 ring-white/15">
                    <BookCover
                      resource={resource}
                      className="aspect-[2/3] w-full"
                      labelClassName="hidden"
                    />
                  </span>
                  <span className="mt-1.5 block line-clamp-2 text-[10px] font-bold leading-snug text-brand-50">
                    {resource.title}
                  </span>
                  <span className="mt-0.5 block text-[9px] text-brand-200">
                    {learner.kind === 'self' ? 'You' : learner.name.split(' ')[0]} ·{' '}
                    {b.progressPercent}%
                  </span>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/15">
                    <span
                      className="block h-full rounded-full bg-brass"
                      style={{ width: `${b.progressPercent}%` }}
                    />
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <SearchIcon />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, author…"
          className="w-full rounded-xl bg-canvas py-2.5 pl-9 pr-3 text-sm text-ink outline-none ring-1 ring-line placeholder:text-muted focus:ring-2 focus:ring-brand-500/30"
          aria-label="Search library"
        />
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 snap-x snap-mandatory">
        <Chip label="All topics" active={topic === 'all'} onClick={() => setTopic('all')} />
        {topics.map((t) => (
          <Chip
            key={t}
            label={LIBRARY_TOPIC_LABELS[t]}
            active={topic === t}
            onClick={() => setTopic(t)}
          />
        ))}
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 snap-x snap-mandatory">
        <Chip label="All types" active={kind === 'all'} onClick={() => setKind('all')} />
        {kinds.map((k) => (
          <Chip
            key={k}
            label={LIBRARY_KIND_LABELS[k]}
            active={kind === k}
            onClick={() => setKind(k)}
          />
        ))}
        <Chip
          label="Bookmarked"
          active={familyOnly}
          onClick={() => setFamilyOnly((v) => !v)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center">
          <p className="text-sm font-semibold text-ink">No books match</p>
          <button
            type="button"
            className="mt-2 text-xs font-bold text-brand-700"
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
        <ul className="grid grid-cols-2 gap-x-3 gap-y-4">
          {filtered.map((resource) => (
            <li key={resource.id}>
              <MobileShelfBook resource={resource} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'snap-start shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition',
        active
          ? 'bg-brand-700 text-white'
          : 'bg-canvas text-muted ring-1 ring-line',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function MobileShelfBook({ resource }: { resource: LibraryResource }) {
  const marks = getBookmarksForResource(resource.id)

  return (
    <Link to={`/library/${resource.id}`} className="group flex flex-col">
      <span className="overflow-hidden rounded-lg shadow-sm ring-1 ring-line">
        <BookCover
          resource={resource}
          className="aspect-[2/3] w-full"
          labelClassName="text-[7px] font-bold uppercase tracking-wide text-white/90"
        />
      </span>
      <span className="mt-1.5 px-0.5">
        <span className="line-clamp-2 text-xs font-bold leading-snug text-ink">
          {resource.title}
        </span>
        <span className="mt-0.5 line-clamp-1 block text-[10px] text-muted">
          {resource.author}
        </span>
        {marks.length > 0 ? (
          <span className="mt-1 flex flex-wrap gap-1">
            {marks.slice(0, 2).map((b) => {
              const learner = getLearner(b.learnerId)
              if (!learner) return null
              return (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1 rounded-full bg-canvas px-1.5 py-0.5 text-[9px] font-bold text-ink ring-1 ring-line"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: learner.avatarColor }}
                  />
                  {learner.kind === 'self' ? 'You' : learner.name.split(' ')[0]}{' '}
                  {b.progressPercent}%
                </span>
              )
            })}
          </span>
        ) : null}
      </span>
    </Link>
  )
}
