import { JoinClassPicker } from '../components/JoinClassPicker'
import { ButtonLink } from '../components/Button'
import { Link } from 'react-router-dom'

export function JoinSessionPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 animate-rise">
      <Link to="/sessions" className="text-sm font-medium text-brand-700 hover:text-brand-800">
        ← All sessions
      </Link>

      <div className="panel p-6 md:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Join a class
        </h1>
        <p className="mt-2 text-muted">
          Accepted sessions ready to enter — each one is already tied to you or a kid.
        </p>
        <div className="mt-8">
          <JoinClassPicker />
        </div>
        <div className="mt-6">
          <ButtonLink to="/sessions" variant="secondary" className="w-full">
            View all sessions
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
