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
          Teachers
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          Every teacher is reviewed before they appear here. When you book, choose whether the
          session is for you or a kid.
        </p>
        {forLearner ? (
          <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
            Prefilling booking for{' '}
            <strong>
              {forLearner.kind === 'self'
                ? `${forLearner.name.split(' ')[0]} (you)`
                : forLearner.name}
            </strong>
            . You can change this on the book form.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 panel p-4 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or topic"
          className={`w-full flex-1 ${fieldClass}`}
        />
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value as SubjectId | 'all')}
          className={fieldClass}
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
        >
          <option value="all">All languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-muted">
        {filtered.length === 0
          ? 'No teachers match these filters.'
          : `${filtered.length} teacher${filtered.length === 1 ? '' : 's'}`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-canvas/70 px-5 py-10 text-center">
          <p className="font-semibold text-ink">Try another subject or language</p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-brand-700 hover:text-brand-800"
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} forLearnerId={forId} />
          ))}
        </div>
      )}
    </div>
  )
}
