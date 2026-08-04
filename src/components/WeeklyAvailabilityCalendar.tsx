import { useMemo, useState } from 'react'
import type { WeeklyAvailabilitySlot } from '../types'

type DayCell = {
  date: Date
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6
  slots: WeeklyAvailabilitySlot[]
  key: string
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number) {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** Monday of the week containing `d` (local). */
function startOfWeekMonday(d: Date) {
  const day = startOfLocalDay(d)
  const dow = day.getDay() // 0 Sun … 6 Sat
  const delta = dow === 0 ? -6 : 1 - dow
  return addDays(day, delta)
}

function formatTime(hhmm: string) {
  const [hh, mm] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(hh ?? 0, mm ?? 0, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function formatTimezone(tz: string) {
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(new Date())
    const name = parts.find((p) => p.type === 'timeZoneName')?.value
    return name ? `${tz.replace(/_/g, ' ')} (${name})` : tz.replace(/_/g, ' ')
  } catch {
    return tz.replace(/_/g, ' ')
  }
}

/** Build a Date for `slot.startTime` on the given calendar day. */
function slotOnDay(slot: WeeklyAvailabilitySlot, day: Date) {
  const [hh, mm] = slot.startTime.split(':').map(Number)
  const d = new Date(day)
  d.setHours(hh ?? 0, mm ?? 0, 0, 0)
  return d
}

/** Slots still bookable on `day` (hides past times when day is today). */
function visibleSlotsForDay(slots: WeeklyAvailabilitySlot[], day: Date, now = new Date()) {
  const dayStart = startOfLocalDay(day)
  const todayStart = startOfLocalDay(now)
  if (dayStart < todayStart) return []
  if (dayStart.getTime() === todayStart.getTime()) {
    return slots.filter((s) => slotOnDay(s, day).getTime() > now.getTime())
  }
  return slots
}

/**
 * Calendly-inspired weekly availability:
 * pick a day → see outlined time slots (only actionable options).
 */
export function WeeklyAvailabilityCalendar({
  slots,
  durationMinutes,
  timezone,
}: {
  slots: WeeklyAvailabilitySlot[]
  durationMinutes: number
  timezone: string
}) {
  const slotsByWeekday = useMemo(() => {
    const map = new Map<number, WeeklyAvailabilitySlot[]>()
    for (const slot of slots) {
      const list = map.get(slot.weekday) ?? []
      list.push(slot)
      map.set(slot.weekday, list)
    }
    for (const [day, list] of map) {
      map.set(
        day,
        [...list].sort((a, b) => a.startTime.localeCompare(b.startTime)),
      )
    }
    return map
  }, [slots])

  const [weekOffset, setWeekOffset] = useState(0)

  const weekDays = useMemo(() => {
    const monday = addDays(startOfWeekMonday(new Date()), weekOffset * 7)
    const cells: DayCell[] = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(monday, i)
      const weekday = date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
      const daySlots = slotsByWeekday.get(weekday) ?? []
      cells.push({
        date,
        weekday,
        slots: daySlots,
        key: dayKey(date),
      })
    }
    return cells
  }, [slotsByWeekday, weekOffset])

  const todayStart = startOfLocalDay(new Date())
  const firstOpen =
    weekDays.find(
      (d) =>
        d.date >= todayStart && visibleSlotsForDay(d.slots, d.date).length > 0,
    ) ?? weekDays.find((d) => visibleSlotsForDay(d.slots, d.date).length > 0)

  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const selected =
    weekDays.find((d) => d.key === selectedKey) ?? firstOpen ?? weekDays[0]!

  // Keep selection in sync when week changes
  const active = weekDays.find((d) => d.key === selected.key) ?? selected

  const weekLabel = `${weekDays[0]!.date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })} – ${weekDays[6]!.date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`

  const todayKey = dayKey(new Date())

  if (slots.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-ink">Select a time</h2>
        <p className="text-sm text-muted">No weekly spots listed yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">Select a time</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <ClockIcon />
            {durationMinutes} min
          </span>
          <span className="text-line">·</span>
          <span className="inline-flex items-center gap-1">
            <GlobeIcon />
            {formatTimezone(timezone)}
          </span>
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line">
        {/* Week nav — Calendly header */}
        <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
          <button
            type="button"
            onClick={() => {
              setWeekOffset((w) => Math.max(0, w - 1))
              setSelectedKey(null)
            }}
            disabled={weekOffset === 0}
            className="grid h-8 w-8 place-items-center rounded-lg text-brand-800 transition hover:bg-brand-50 disabled:opacity-30"
            aria-label="Previous week"
          >
            ‹
          </button>
          <p className="text-sm font-semibold text-ink">{weekLabel}</p>
          <button
            type="button"
            onClick={() => {
              setWeekOffset((w) => Math.min(3, w + 1))
              setSelectedKey(null)
            }}
            disabled={weekOffset >= 3}
            className="grid h-8 w-8 place-items-center rounded-lg text-brand-800 transition hover:bg-brand-50 disabled:opacity-30"
            aria-label="Next week"
          >
            ›
          </button>
        </div>

        {/* Day picker — Calendly date row */}
        <div className="grid grid-cols-7 gap-1 px-2 py-3 sm:gap-1.5 sm:px-3">
          {weekDays.map((day) => {
            const daySlots = visibleSlotsForDay(day.slots, day.date)
            const open = daySlots.length > 0
            const isSelected = day.key === active.key
            const isToday = day.key === todayKey
            const isPast = day.date < startOfLocalDay(new Date()) && !isToday
            const canSelect = open && !isPast

            return (
              <button
                key={day.key}
                type="button"
                disabled={!canSelect}
                onClick={() => setSelectedKey(day.key)}
                className={[
                  'flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition',
                  canSelect ? 'hover:bg-brand-50' : 'cursor-default',
                  isSelected ? 'bg-brand-50' : '',
                ].join(' ')}
              >
                <span
                  className={[
                    'text-[10px] font-bold uppercase tracking-wide',
                    isSelected || isToday ? 'text-brand-700' : 'text-muted',
                    !open || isPast ? 'opacity-40' : '',
                  ].join(' ')}
                >
                  {day.date.toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
                <span
                  className={[
                    'grid h-9 w-9 place-items-center rounded-full text-sm font-bold tabular-nums transition',
                    isSelected
                      ? 'bg-brand-700 text-white shadow-sm'
                      : canSelect
                        ? 'text-ink ring-1 ring-brand-200'
                        : 'text-muted/50',
                    isToday && !isSelected && canSelect ? 'ring-2 ring-brand-500' : '',
                  ].join(' ')}
                >
                  {day.date.getDate()}
                </span>
                {open ? (
                  <span
                    className={[
                      'text-[9px] font-semibold tabular-nums',
                      isSelected ? 'text-brand-700' : 'text-muted',
                    ].join(' ')}
                  >
                    {daySlots.length}
                  </span>
                ) : (
                  <span className="h-3" aria-hidden />
                )}
              </button>
            )
          })}
        </div>

        {/* Time list — all openings that day */}
        <div className="border-t border-line px-3 py-3 sm:px-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-ink">
              {active.date.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            {(() => {
              const n = visibleSlotsForDay(active.slots, active.date).length
              return n > 0 ? (
                <p className="text-xs text-muted">
                  {n} {n === 1 ? 'opening' : 'openings'}
                </p>
              ) : null
            })()}
          </div>

          {(() => {
            const daySlots = visibleSlotsForDay(active.slots, active.date)
            if (daySlots.length === 0) {
              return (
                <p className="mt-3 text-sm text-muted">No times available this day.</p>
              )
            }
            return (
              <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-0.5 sm:max-h-72">
                {daySlots.map((slot) => {
                  const onSelectedDay = slotOnDay(slot, active.date)
                  return (
                    <li key={slot.id}>
                      <div
                        className="flex w-full items-center justify-center rounded-lg border-2 border-brand-600 bg-white px-3 py-2.5 text-sm font-bold text-brand-800 transition hover:bg-brand-50"
                        title={onSelectedDay.toLocaleString()}
                      >
                        {formatTime(slot.startTime)}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )
          })()}

          <p className="mt-3 text-[11px] text-muted">
            Recurring weekly spots · {slots.length} total · times shown in teacher’s zone
          </p>
        </div>
      </div>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v4.5l2.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 12h16M12 4c2.5 2.8 3.5 5.5 3.5 8s-1 5.2-3.5 8c-2.5-2.8-3.5-5.5-3.5-8s1-5.2 3.5-8Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  )
}
