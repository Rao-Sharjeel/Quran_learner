import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getTeacher, listReviewsForTeacher } from '../mocks/store'
import { SUBJECT_LABELS, WEEKDAY_LABELS } from '../types'
import { BadgePill } from '../components/BadgePill'
import { ButtonLink } from '../components/Button'

export function TeacherProfilePage() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const forId = search.get('for')
  const hireTo = forId ? `/learn/${id}/hire?for=${forId}` : `/learn/${id}/hire`
  const teacher = id ? getTeacher(id) : undefined
  const reviews = id ? listReviewsForTeacher(id) : []

  if (!teacher) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">Teacher not found</p>
        <ButtonLink to="/learn" variant="secondary" className="mt-4">
          Back to Learn
        </ButtonLink>
      </div>
    )
  }

  const byWeekday = [...teacher.availability].sort((a, b) => a.weekday - b.weekday)

  return (
    <div className="space-y-6 animate-rise">
      <Link
        to="/learn"
        className="text-sm font-medium text-brand-700 transition hover:text-brand-800"
      >
        ← Learn
      </Link>

      <div className="panel p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div
            className="grid h-20 w-20 place-items-center rounded-2xl text-xl font-semibold text-white"
            style={{ background: teacher.avatarColor }}
          >
            {teacher.initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">
              {teacher.name}
            </h1>
            <p className="mt-1 text-muted">{teacher.headline}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {teacher.badges.map((b) => (
                <BadgePill key={b} id={b} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span>
                ★ {teacher.rating.toFixed(1)} ({teacher.reviewCount} reviews)
              </span>
              <span className="text-muted">{teacher.languages.join(' · ')}</span>
              <span className="font-semibold">
                ${teacher.rateUsd}/session · {teacher.durationMinutes} min
              </span>
            </div>
          </div>
          <ButtonLink to={hireTo} className="shrink-0">
            Request sessions
          </ButtonLink>
        </div>

        <div className="mt-8 grid gap-8 border-t border-line pt-8 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <h2 className="text-xl font-bold tracking-tight">About</h2>
            <p className="leading-relaxed text-muted">{teacher.bio}</p>
            <h2 className="pt-2 text-xl font-bold tracking-tight">Subjects</h2>
            <div className="flex flex-wrap gap-2">
              {teacher.subjects.map((s) => (
                <span
                  key={s}
                  className="rounded-lg bg-brand-50 px-3 py-1 text-sm text-brand-800"
                >
                  {SUBJECT_LABELS[s]}
                </span>
              ))}
            </div>

            <h2 className="pt-4 text-xl font-bold tracking-tight">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted">No written reviews yet.</p>
            ) : (
              <ul className="space-y-3">
                {reviews.map((review) => (
                  <li key={review.id} className="rounded-2xl border border-line px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <p className="font-semibold text-ink">{review.studentName}</p>
                      <p className="text-muted">
                        ★ {review.rating} · {review.dateLabel}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{review.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight">Weekly availability</h2>
            <p className="mt-1 text-xs text-muted">
              Recurring spots · {teacher.timezone}
            </p>
            <ul className="mt-3 space-y-2">
              {byWeekday.map((slot) => (
                <li
                  key={slot.id}
                  className="rounded-xl border border-line px-3 py-2.5 text-sm"
                >
                  <span className="font-semibold text-ink">
                    {WEEKDAY_LABELS[slot.weekday]}
                  </span>{' '}
                  <span className="text-muted">{slot.label.replace(/^\w+\s/, '')}</span>
                </li>
              ))}
            </ul>
            <ButtonLink to={hireTo} variant="secondary" className="mt-4 w-full">
              Pick times & send request
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  )
}
