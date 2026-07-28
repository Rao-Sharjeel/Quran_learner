import { useState, type FormEvent } from 'react'
import { addKid, useKids } from '../mocks/store'
import { Button } from './Button'

const SKIP_KEY = 'ilm_family_modal_skipped'

export function shouldShowFamilyModal() {
  if (typeof window === 'undefined') return false
  if (localStorage.getItem(SKIP_KEY) === '1') return false
  return true
}

export function AddFamilyModal({ onClose }: { onClose: () => void }) {
  const kids = useKids()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [error, setError] = useState('')

  function skip() {
    localStorage.setItem(SKIP_KEY, '1')
    onClose()
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      addKid({
        name,
        age: age.trim() ? Number(age) : undefined,
      })
      setName('')
      setAge('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-900/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-labelledby="family-modal-title"
        className="w-full max-w-md rounded-3xl bg-canvas p-6 shadow-xl outline outline-1 outline-line"
      >
        <h2 id="family-modal-title" className="text-xl font-extrabold tracking-tight text-ink">
          Add your family
        </h2>
        <p className="mt-2 text-sm text-muted">
          Add kids who will learn with you. You can always manage this under Family.
        </p>

        {kids.length > 0 ? (
          <ul className="mt-4 space-y-1 text-sm text-ink">
            {kids.map((k) => (
              <li key={k.id}>
                {k.name}
                {k.age != null ? ` · ${k.age}` : ''}
              </li>
            ))}
          </ul>
        ) : null}

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input
            className="w-full rounded-2xl bg-surface px-3.5 py-2.5 text-sm ring-1 ring-line"
            placeholder="Child’s name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full rounded-2xl bg-surface px-3.5 py-2.5 text-sm ring-1 ring-line"
            placeholder="Age (optional)"
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button type="submit" className="w-full">
            Add child
          </Button>
        </form>

        <div className="mt-3 flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Done
          </Button>
          <Button type="button" variant="ghost" className="flex-1" onClick={skip}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
}
