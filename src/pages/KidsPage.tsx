import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getSelfLearner,
  openHomeworkCount,
  removeKid,
  underReviewAskCount,
  useKids,
  useSessions,
} from '../mocks/store'
import { ButtonLink } from '../components/Button'

export function KidsPage() {
  const kids = useKids()
  const self = getSelfLearner()
  const sessions = useSessions()
  const [error, setError] = useState('')

  function onRemove(id: string, name: string) {
    setError('')
    if (!window.confirm(`Remove ${name} from your family account?`)) return
    const result = removeKid(id)
    if (!result.ok) setError(result.reason)
  }

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Family
          </h1>
          <p className="mt-2 max-w-xl text-muted">
            You can take lessons yourself and manage kids under this account. Pick who a booking
            or Ask is for at the time you book or ask — not in the header.
          </p>
        </div>
        <ButtonLink to="/kids/new">Add a kid</ButtonLink>
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {self ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">You</h2>
          <div className="flex flex-col gap-4 panel p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-semibold text-white"
                style={{ background: self.avatarColor }}
              >
                {self.initials}
              </div>
              <div>
                <p className="font-semibold text-ink">{self.name} (you)</p>
                <p className="text-sm text-muted">Your own lessons and Ask threads</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/kids/${self.id}`}
                className="rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Open
              </Link>
              <Link
                to={`/teachers?for=${self.id}`}
                className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100"
              >
                Book for you
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Kids</h2>
        {kids.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-canvas/70 px-5 py-10 text-center">
            <p className="font-semibold text-ink">No kids yet</p>
            <p className="mt-1 text-sm text-muted">Add a learner profile to book for them.</p>
            <ButtonLink to="/kids/new" className="mt-4">
              Add a kid
            </ButtonLink>
          </div>
        ) : (
          <ul className="space-y-3">
            {kids.map((kid) => {
              const pending = sessions.filter(
                (s) =>
                  s.learnerId === kid.id &&
                  (s.status === 'pending' || s.status === 'accepted'),
              ).length
              const homework = openHomeworkCount(kid.id)
              const asks = underReviewAskCount(kid.id)
              return (
                <li
                  key={kid.id}
                  className="flex flex-col gap-4 panel p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-semibold text-white"
                      style={{ background: kid.avatarColor }}
                    >
                      {kid.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{kid.name}</p>
                      <p className="text-sm text-muted">
                        {kid.gradeLabel ?? 'Learner'}
                        {pending > 0
                          ? ` · ${pending} active session${pending === 1 ? '' : 's'}`
                          : ''}
                        {homework > 0 ? ` · ${homework} homework` : ''}
                        {asks > 0 ? ` · ${asks} Ask open` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/kids/${kid.id}`}
                      className="rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                    >
                      Open
                    </Link>
                    <Link
                      to={`/teachers?for=${kid.id}`}
                      className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100"
                    >
                      Book
                    </Link>
                    <Link
                      to={`/kids/${kid.id}/edit`}
                      className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => onRemove(kid.id, kid.name)}
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
