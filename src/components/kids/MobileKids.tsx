import { Link } from 'react-router-dom'
import type { LearnerProfile, Session } from '../../types'
import {
  openHomeworkCount,
  underReviewAskCount,
} from '../../mocks/store'

type Props = {
  self?: LearnerProfile
  kids: LearnerProfile[]
  sessions: Session[]
  error: string
  onRemove: (id: string, name: string) => void
}

/**
 * Mobile Family — dense learner list + compact actions.
 * Desktop tree stays in KidsPage (lg+).
 */
export function MobileKids({ self, kids, sessions, error, onRemove }: Props) {
  return (
    <div className="flex flex-col gap-2.5 animate-rise lg:hidden">
      <div className="flex items-end justify-between gap-2 px-0.5">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-ink">Family</h1>
          <p className="text-[11px] text-muted">You + kids · pick who when you book</p>
        </div>
        <Link
          to="/kids/new"
          className="shrink-0 rounded-full bg-brand-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
        >
          Add kid
        </Link>
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {self ? (
        <div>
          <p className="mb-1.5 px-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            You
          </p>
          <LearnerRow
            learner={self}
            subtitle="Your lessons & Ask"
            primaryTo={`/kids/${self.id}`}
            bookTo={`/learn?for=${self.id}`}
            bookLabel="Book for you"
          />
        </div>
      ) : null}

      <div>
        <p className="mb-1.5 px-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
          Kids
        </p>
        {kids.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center">
            <p className="text-sm font-semibold text-ink">No kids yet</p>
            <p className="mt-1 text-xs text-muted">Add a learner to book for them.</p>
            <Link
              to="/kids/new"
              className="mt-3 inline-block text-xs font-bold text-brand-700"
            >
              Add a kid →
            </Link>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-line bg-surface divide-y divide-line">
            {kids.map((kid) => {
              const pending = sessions.filter(
                (s) => s.learnerIds.includes(kid.id) && s.status === 'scheduled',
              ).length
              const homework = openHomeworkCount(kid.id)
              const asks = underReviewAskCount(kid.id)
              const bits = [
                kid.gradeLabel ?? 'Learner',
                pending > 0 ? `${pending} session${pending === 1 ? '' : 's'}` : null,
                homework > 0 ? `${homework} hw` : null,
                asks > 0 ? `${asks} Ask` : null,
              ].filter(Boolean)

              return (
                <li key={kid.id}>
                  <LearnerRow
                    learner={kid}
                    subtitle={bits.join(' · ')}
                    primaryTo={`/kids/${kid.id}`}
                    bookTo={`/learn?for=${kid.id}`}
                    bookLabel="Book"
                    editTo={`/kids/${kid.id}/edit`}
                    onRemove={() => onRemove(kid.id, kid.name)}
                    nested
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function LearnerRow({
  learner,
  subtitle,
  primaryTo,
  bookTo,
  bookLabel,
  editTo,
  onRemove,
  nested,
}: {
  learner: LearnerProfile
  subtitle: string
  primaryTo: string
  bookTo: string
  bookLabel: string
  editTo?: string
  onRemove?: () => void
  nested?: boolean
}) {
  const shell = nested
    ? 'px-3 py-2.5'
    : 'rounded-2xl border border-line bg-surface px-3 py-2.5'

  return (
    <div className={shell}>
      <Link to={primaryTo} className="flex items-center gap-3 active:opacity-80">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
          style={{ background: learner.avatarColor }}
        >
          {learner.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {learner.kind === 'self' ? `${learner.name.split(' ')[0]} (you)` : learner.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted">{subtitle}</p>
        </div>
        <span className="shrink-0 text-xs font-bold text-brand-700">Open →</span>
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line/80 pt-2 pl-14">
        <Link to={bookTo} className="text-[11px] font-bold text-brand-700">
          {bookLabel}
        </Link>
        {editTo ? (
          <Link to={editTo} className="text-[11px] font-bold text-muted">
            Edit
          </Link>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] font-bold text-red-700"
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  )
}
