import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getKid, updateKid } from '../mocks/store'
import { Button, ButtonLink } from '../components/Button'

const fieldClass =
  'w-full rounded-2xl bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line transition focus:bg-canvas focus:ring-2 focus:ring-brand-500/30'

export function KidEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const kid = id ? getKid(id) : undefined
  const [name, setName] = useState(kid?.name ?? '')
  const [age, setAge] = useState(kid?.age != null ? String(kid.age) : '')
  const [error, setError] = useState('')

  if (!kid) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">Kid not found</p>
        <ButtonLink to="/kids" variant="secondary" className="mt-4">
          Back to kids
        </ButtonLink>
      </div>
    )
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      updateKid(kid!.id, {
        name,
        age: age.trim() === '' ? '' : Number(age),
      })
      navigate(`/kids/${kid!.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update kid.')
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-rise">
      <Link
        to={`/kids/${kid.id}`}
        className="text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        ← {kid.name}
      </Link>

      <div className="panel p-6 md:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Edit kid
        </h1>
        <p className="mt-2 text-muted">Update name or age for this learner profile.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-ink">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              required
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
            />
          </label>

          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full">
            Save changes
          </Button>
        </form>
      </div>
    </div>
  )
}
