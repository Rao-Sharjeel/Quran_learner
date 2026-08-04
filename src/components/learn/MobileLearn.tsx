import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getLearner, listTeachers } from '../../mocks/store'
import { SUBJECT_LABELS, type SubjectId, type Teacher } from '../../types'
import { useCurrency } from '../../context/CurrencyContext'

const subjects = Object.keys(SUBJECT_LABELS) as SubjectId[]

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Mobile Learn directory — search + subject chips + dense teacher list.
 * Desktop tree stays in TeachersPage (lg+).
 */
export function MobileLearn() {
  const teachers = listTeachers()
  const [search] = useSearchParams()
  const forId = search.get('for') ?? undefined
  const forLearner = forId ? getLearner(forId) : undefined
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState<SubjectId | 'all'>('all')
  const [language, setLanguage] = useState<string>('all')
  const { formatUsd } = useCurrency()

  const languages = useMemo(
    () => Array.from(new Set(teachers.flatMap((t) => t.languages))).sort(),
    [teachers],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teachers.filter((t) => {
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.headline.toLowerCase().includes(q) ||
        t.subjects.some((s) => SUBJECT_LABELS[s].toLowerCase().includes(q))
      const matchesSubject = subject === 'all' || t.subjects.includes(subject)
      const matchesLanguage = language === 'all' || t.languages.includes(language)
      return matchesQuery && matchesSubject && matchesLanguage
    })
  }, [teachers, query, subject, language])

  return (
    <div className="flex flex-col gap-2.5 animate-rise lg:hidden">
      <div className="flex items-end justify-between gap-2 px-0.5">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-ink">Learn</h1>
          <p className="text-[11px] text-muted">Hire a teacher · pick weekly times</p>
        </div>
        <p className="shrink-0 text-[10px] font-bold tabular-nums text-muted">
          <span className="text-ink">{filtered.length}</span> teachers
        </p>
      </div>

      {forLearner ? (
        <p className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-800">
          Prefilling for{' '}
          <strong>
            {forLearner.kind === 'self'
              ? `${forLearner.name.split(' ')[0]} (you)`
              : forLearner.name}
          </strong>
        </p>
      ) : null}

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teachers…"
          className="w-full rounded-xl bg-canvas py-2.5 pl-9 pr-3 text-sm text-ink outline-none ring-1 ring-line placeholder:text-muted focus:ring-2 focus:ring-brand-500/30"
          aria-label="Search teachers"
        />
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 snap-x snap-mandatory">
        <Chip
          label="All"
          active={subject === 'all'}
          onClick={() => setSubject('all')}
        />
        {subjects.map((s) => (
          <Chip
            key={s}
            label={SUBJECT_LABELS[s]}
            active={subject === s}
            onClick={() => setSubject(s)}
          />
        ))}
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 snap-x snap-mandatory">
        <Chip
          label="Any language"
          active={language === 'all'}
          onClick={() => setLanguage('all')}
        />
        {languages.map((l) => (
          <Chip
            key={l}
            label={l}
            active={language === l}
            onClick={() => setLanguage(l)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center">
          <p className="text-sm font-semibold text-ink">No teachers match</p>
          <p className="mt-1 text-xs text-muted">Try another subject or clear search.</p>
          <button
            type="button"
            className="mt-3 text-xs font-bold text-brand-700"
            onClick={() => {
              setQuery('')
              setSubject('all')
              setLanguage('all')
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-line bg-surface divide-y divide-line">
          {filtered.map((teacher) => (
            <li key={teacher.id}>
              <MobileTeacherRow
                teacher={teacher}
                forLearnerId={forId}
                price={formatUsd(teacher.rateUsd)}
              />
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

function MobileTeacherRow({
  teacher,
  forLearnerId,
  price,
}: {
  teacher: Teacher
  forLearnerId?: string
  price: string
}) {
  const to = forLearnerId
    ? `/learn/${teacher.id}?for=${forLearnerId}`
    : `/learn/${teacher.id}`

  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2.5 transition active:bg-brand-50/60"
    >
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
        style={{ background: teacher.avatarColor }}
      >
        {teacher.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold text-ink">{teacher.name}</p>
          <p className="shrink-0 text-xs font-bold tabular-nums text-ink">{price}</p>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted">{teacher.headline}</p>
        <p className="mt-1 truncate text-[10px] font-medium text-muted">
          ★ {teacher.rating.toFixed(1)} · {teacher.durationMinutes} min ·{' '}
          {teacher.subjects
            .slice(0, 2)
            .map((s) => SUBJECT_LABELS[s])
            .join(' · ')}
          {teacher.subjects.length > 2 ? '…' : ''}
        </p>
      </div>
    </Link>
  )
}
