import { JoinClassPicker } from '../components/JoinClassPicker'
import { Link } from 'react-router-dom'

export function JoinSessionPage() {
  return (
    <div className="animate-rise space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <Link
            to="/sessions"
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            ← All sessions
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Join a class
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Upcoming sessions and time left. Join opens 15 minutes before class.
          </p>
        </div>
        <Link
          to="/sessions"
          className="text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          View all sessions →
        </Link>
      </div>

      <JoinClassPicker />
    </div>
  )
}
