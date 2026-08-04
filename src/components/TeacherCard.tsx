import { Link } from 'react-router-dom'
import type { Teacher } from '../types'
import { SUBJECT_LABELS } from '../types'
import { useCurrency } from '../context/CurrencyContext'
import { BadgePill } from './BadgePill'

export function TeacherCard({
  teacher,
  forLearnerId,
}: {
  teacher: Teacher
  forLearnerId?: string
}) {
  const { formatUsd } = useCurrency()
  const to = forLearnerId
    ? `/learn/${teacher.id}?for=${forLearnerId}`
    : `/learn/${teacher.id}`
  return (
    <Link
      to={to}
      className="group flex flex-col panel p-5 transition hover:-translate-y-0.5 hover:bg-brand-50/50 hover:outline-brand-200 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-semibold text-white"
          style={{ background: teacher.avatarColor }}
        >
          {teacher.initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-ink group-hover:text-brand-800">
            {teacher.name}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted">{teacher.headline}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {teacher.badges.slice(0, 3).map((b) => (
          <BadgePill key={b} id={b} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {teacher.subjects.slice(0, 4).map((s) => (
          <span
            key={s}
            className="rounded-lg bg-brand-50 px-2 py-0.5 text-xs text-brand-800"
          >
            {SUBJECT_LABELS[s]}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-5 text-sm">
        <span className="text-muted">
          ★ {teacher.rating.toFixed(1)} · {teacher.durationMinutes} min
        </span>
        <span className="font-semibold text-ink">
          {formatUsd(teacher.rateUsd)}/session
        </span>
      </div>
    </Link>
  )
}
