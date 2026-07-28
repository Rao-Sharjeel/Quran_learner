import { useLearners } from '../mocks/store'

/** Multi-select learners (self + kids) for engagement requests / sessions */
export function MultiLearnerPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (ids: string[]) => void
}) {
  const learners = useLearners()

  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((x) => x !== id))
    else onChange([...value, id])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {learners.map((l) => {
        const active = value.includes(l.id)
        const label = l.kind === 'self' ? `${l.name.split(' ')[0]} (you)` : l.name
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => toggle(l.id)}
            className={[
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
              active
                ? 'bg-brand-700 text-white'
                : 'bg-canvas text-muted ring-1 ring-line hover:text-ink',
            ].join(' ')}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: active ? 'white' : l.avatarColor }}
            />
            {label}
          </button>
        )
      })}
    </div>
  )
}
