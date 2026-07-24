import type { LearnerProfile } from '../types'
import { useLearners } from '../mocks/store'

export function LearnerPicker({
  value,
  onChange,
  label = 'Who is this for?',
  kidsOnly = false,
}: {
  value: string
  onChange: (learnerId: string) => void
  label?: string
  /** When true, hide the parent “You” option (e.g. kid-only flows) */
  kidsOnly?: boolean
}) {
  const learners = useLearners().filter((l) => (kidsOnly ? l.kind === 'kid' : true))

  if (learners.length === 0) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
        Add a kid under Kids before booking for them.
      </p>
    )
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <div className="space-y-2">
        {learners.map((learner) => (
          <LearnerOption
            key={learner.id}
            learner={learner}
            selected={value === learner.id}
            onSelect={() => onChange(learner.id)}
          />
        ))}
      </div>
    </fieldset>
  )
}

function LearnerOption({
  learner,
  selected,
  onSelect,
}: {
  learner: LearnerProfile
  selected: boolean
  onSelect: () => void
}) {
  return (
    <label
      className={[
        'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition',
        selected ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-brand-200',
      ].join(' ')}
    >
      <input
        type="radio"
        name="learner"
        checked={selected}
        onChange={onSelect}
        className="accent-brand-700"
      />
      <span
        className="grid h-9 w-9 place-items-center rounded-lg text-xs font-semibold text-white"
        style={{ background: learner.avatarColor }}
      >
        {learner.initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-ink">
          {learner.kind === 'self' ? `${learner.name.split(' ')[0]} (you)` : learner.name}
        </span>
        <span className="block text-xs text-muted">
          {learner.kind === 'self' ? 'Your own lessons' : learner.gradeLabel ?? 'Kid'}
        </span>
      </span>
    </label>
  )
}
