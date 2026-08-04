import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getGuardian, updateGuardian } from '../mocks/store'
import { Button, ButtonLink } from '../components/Button'

const fieldClass =
  'w-full rounded-2xl bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line transition focus:bg-canvas focus:ring-2 focus:ring-brand-500/30'

export function EditProfilePage() {
  const navigate = useNavigate()
  const guardian = getGuardian()
  const [name, setName] = useState(guardian.name)
  const [email, setEmail] = useState(guardian.email)
  const [error, setError] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      updateGuardian({ name, email })
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update profile.')
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-rise">
      <Link to="/app" className="text-sm font-medium text-brand-700 hover:text-brand-800">
        ← Home
      </Link>

      <div className="panel p-6 md:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Edit profile</h1>
        <p className="mt-2 text-muted">Update your guardian account details.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-ink">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              required
              autoComplete="name"
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-ink">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
              required
              autoComplete="email"
            />
          </label>

          {error ? (
            <p className="text-sm font-medium text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit">Save changes</Button>
            <ButtonLink to="/app" variant="secondary">
              Cancel
            </ButtonLink>
          </div>
        </form>
      </div>
    </div>
  )
}
