import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addKid } from '../mocks/store'
import { Button } from '../components/Button'

const fieldClass =
  'w-full rounded-2xl bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line transition focus:bg-canvas focus:ring-2 focus:ring-brand-500/30'

export function KidNewPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [error, setError] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const parsed = age.trim() === '' ? undefined : Number(age)
      if (parsed !== undefined && (Number.isNaN(parsed) || parsed < 1 || parsed > 18)) {
        setError('Age must be between 1 and 18.')
        return
      }
      const kid = addKid({ name, age: parsed })
      navigate(`/kids/${kid.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add kid.')
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-rise">
      <Link to="/kids" className="text-sm font-medium text-brand-700 hover:text-brand-800">
        ← Kids
      </Link>

      <div className="panel p-6 md:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Add a kid
        </h1>
        <p className="mt-2 text-muted">
          Create a learner profile under your guardian account.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-ink">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              placeholder="e.g. Omar Rahman"
              required
              autoFocus
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-ink">Age (optional)</span>
            <input
              type="number"
              min={1}
              max={18}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={fieldClass}
              placeholder="e.g. 11"
            />
          </label>

          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full">
            Save kid
          </Button>
        </form>
      </div>
    </div>
  )
}
