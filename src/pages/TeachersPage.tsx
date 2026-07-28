import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getLearner, listTeachers } from '../mocks/store'
import { SUBJECT_LABELS, type SubjectId } from '../types'
import { TeacherCard } from '../components/TeacherCard'

const subjects = Object.keys(SUBJECT_LABELS) as SubjectId[]

const fieldClass =
  'rounded-2xl bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line transition focus:bg-canvas focus:ring-2 focus:ring-brand-500/30'

export function TeachersPage() {
  const teachers = listTeachers()
  const [search] = useSearchParams()
  const forId = search.get('for') ?? undefined
  const forLearner = forId ? getLearner(forId) : undefined
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState<SubjectId | 'all'>('all')
  const [language, setLanguage] = useState<string>('all')

  const languages = useMemo(
    () => Array.from(new Set(teachers.flatMap((t) => t.languages))).sort(),
    [teachers],
  )

  const filtered = teachers.filter((t) => {
    const q = query.trim().toLowerCase()
    const matchesQuery =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.headline.toLowerCase().includes(q) ||
      t.subjects.some((s) => SUBJECT_LABELS[s].toLowerCase().includes(q))
    const matchesSubject = subject === 'all' || t.subjects.includes(subject)
    const matchesLanguage = language === 'all' || t.languages.includes(language)
    return matchesQuery && matchesSubject && matchesLanguage
  })

  return (
    <div className="space-y-8 animate-rise">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Learn
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          Hire a vetted teacher. Filter by subject, open a profile, pick weekly times, and send a
          request — sessions appear under Sessions after they accept.
        </p>
        {forLearner ? (
          <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
            Prefilling for{' '}
            <strong>
              {forLearner.kind === 'self'
                ? `${forLearner.name.split(' ')[0]} (you)`
                : forLearner.name}
            </strong>
            . You can add more learners on the request form.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          placeholder="Search teachers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${fieldClass} w-full sm:min-w-[14rem] sm:flex-1`}
        />
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value as SubjectId | 'all')}
          className={fieldClass}
          aria-label="Filter by subject"
        >
          <option value="all">All subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {SUBJECT_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className={fieldClass}
          aria-label="Filter by language"
        >
          <option value="all">All languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted">No teachers match these filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <TeacherCard key={t.id} teacher={t} forLearnerId={forId} />
          ))}
        </div>
      )}
    </div>
  )
}
