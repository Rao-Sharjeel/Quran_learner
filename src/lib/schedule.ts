import type { WeeklyAvailabilitySlot } from '../types'

const WEEKDAY_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

/** Next occurrence of weekday+HH:mm at or after `from` (local). */
export function nextOccurrence(
  slot: WeeklyAvailabilitySlot,
  from: Date,
): Date {
  const [hh, mm] = slot.startTime.split(':').map(Number)
  const candidate = new Date(from)
  candidate.setSeconds(0, 0)
  candidate.setHours(hh ?? 0, mm ?? 0, 0, 0)

  const dayDelta = (slot.weekday - candidate.getDay() + 7) % 7
  candidate.setDate(candidate.getDate() + dayDelta)
  if (candidate.getTime() < from.getTime()) {
    candidate.setDate(candidate.getDate() + 7)
  }
  return candidate
}

/** All occurrences of slots between from and until (exclusive end of until day). */
export function generateOccurrences(
  slots: WeeklyAvailabilitySlot[],
  from: Date,
  until: Date,
): { slot: WeeklyAvailabilitySlot; startsAt: Date }[] {
  const out: { slot: WeeklyAvailabilitySlot; startsAt: Date }[] = []
  for (const slot of slots) {
    let cursor = nextOccurrence(slot, from)
    while (cursor.getTime() < until.getTime()) {
      out.push({ slot, startsAt: new Date(cursor) })
      cursor = new Date(cursor)
      cursor.setDate(cursor.getDate() + 7)
    }
  }
  return out.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
}

export function formatWeeklySlotLabel(slot: WeeklyAvailabilitySlot) {
  const [hh, mm] = slot.startTime.split(':').map(Number)
  const d = new Date()
  d.setHours(hh ?? 0, mm ?? 0, 0, 0)
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${WEEKDAY_FULL[slot.weekday]} ${time}`
}
