import { useEffect, useState } from 'react'
import {
  getBookmark,
  getBookmarksForResource,
  getLearner,
  removeReadingBookmark,
  upsertReadingBookmark,
  useLearners,
  useReadingBookmarks,
} from '../mocks/store'
import { Button } from './Button'

function shortName(learnerId: string) {
  const learner = getLearner(learnerId)
  if (!learner) return 'Learner'
  return learner.kind === 'self' ? 'You' : learner.name.split(' ')[0]
}

/** Pick who this bookmark belongs to, save progress, or remove. */
export function ReadingBookmarkBar({ resourceId }: { resourceId: string }) {
  useReadingBookmarks()
  const learners = useLearners()
  const defaultLearner = learners.find((l) => l.kind === 'self')?.id ?? learners[0]?.id ?? ''
  const [learnerId, setLearnerId] = useState(defaultLearner)
  const existing = learnerId ? getBookmark(resourceId, learnerId) : undefined
  const [progress, setProgress] = useState(existing?.progressPercent ?? 10)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    const bm = learnerId ? getBookmark(resourceId, learnerId) : undefined
    setProgress(bm?.progressPercent ?? 10)
  }, [resourceId, learnerId])

  const familyOnBook = getBookmarksForResource(resourceId)

  function save() {
    if (!learnerId) return
    upsertReadingBookmark({
      resourceId,
      learnerId,
      progressPercent: progress,
      minutesSpent: Math.max(5, Math.round(progress * 0.6)),
    })
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  function remove() {
    if (!learnerId) return
    removeReadingBookmark(resourceId, learnerId)
    setProgress(10)
  }

  return (
    <div className="rounded-2xl bg-brand-800 px-4 py-3 text-brand-50 shadow-lg shadow-brand-800/20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-200">
            Bookmark for
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {learners.map((l) => {
              const active = l.id === learnerId
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLearnerId(l.id)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition',
                    active
                      ? 'bg-white text-brand-800'
                      : 'bg-white/10 text-brand-50 ring-1 ring-white/15 hover:bg-white/15',
                  ].join(' ')}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: active ? l.avatarColor : 'currentColor' }}
                  />
                  {l.kind === 'self' ? 'You' : l.name.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {existing ? (
            <Button
              type="button"
              variant="secondary"
              className="!bg-white/10 !py-1.5 !text-xs !text-white !ring-white/20 hover:!bg-white/15"
              onClick={remove}
            >
              Remove
            </Button>
          ) : null}
          <Button type="button" className="!bg-brass !py-1.5 !text-xs !text-brand-900 !shadow-none hover:!bg-brass-soft" onClick={save}>
            {existing ? 'Update bookmark' : 'Save bookmark'}
          </Button>
        </div>
      </div>

      <label className="mt-3 block">
        <span className="flex items-center justify-between text-xs text-brand-100">
          <span>Progress</span>
          <span className="font-bold tabular-nums">{progress}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="mt-1 w-full accent-brass"
        />
      </label>

      {savedFlash ? (
        <p className="mt-2 text-xs font-semibold text-brass-soft">Saved for {shortName(learnerId)}</p>
      ) : null}

      {familyOnBook.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-200">
            Family on this book
          </span>
          {familyOnBook.map((b) => {
            const learner = getLearner(b.learnerId)
            if (!learner) return null
            return (
              <span
                key={b.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-brand-50"
              >
                <span
                  className="grid h-4 w-4 place-items-center rounded-full text-[8px] font-bold text-white"
                  style={{ background: learner.avatarColor }}
                >
                  {learner.initials}
                </span>
                {shortName(learner.id)} · {b.progressPercent}% · {b.minutesSpent}m
              </span>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
