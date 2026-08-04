/** Join opens this many minutes before session start. */
export const JOIN_OPENS_MINUTES_BEFORE = 15
/** Stay joinable this many minutes after the scheduled end. */
export const JOIN_GRACE_MINUTES_AFTER_END = 10

export type SessionJoinTiming = {
  startsAt: string
  durationMinutes: number
}

export function sessionJoinBounds(session: SessionJoinTiming) {
  const startMs = new Date(session.startsAt).getTime()
  const endMs = startMs + session.durationMinutes * 60_000
  const opensAt = startMs - JOIN_OPENS_MINUTES_BEFORE * 60_000
  const closesAt = endMs + JOIN_GRACE_MINUTES_AFTER_END * 60_000
  return { startMs, endMs, opensAt, closesAt }
}

/** True when the classroom door is open. */
export function isSessionJoinOpen(session: SessionJoinTiming, now = new Date()) {
  if (Number.isNaN(new Date(session.startsAt).getTime())) return false
  const { opensAt, closesAt } = sessionJoinBounds(session)
  const t = now.getTime()
  return t >= opensAt && t <= closesAt
}

/** Scheduled class that has not fully closed yet (upcoming or live). */
export function isSessionStillJoinRelevant(session: SessionJoinTiming, now = new Date()) {
  if (Number.isNaN(new Date(session.startsAt).getTime())) return false
  const { closesAt } = sessionJoinBounds(session)
  return now.getTime() <= closesAt
}

/**
 * Relative countdown copy for the join list.
 * Prefer “time until start”; when already in the join window, say Join now / in progress.
 */
export function formatSessionCountdown(session: SessionJoinTiming, now = new Date()) {
  const { startMs, endMs, opensAt, closesAt } = sessionJoinBounds(session)
  const t = now.getTime()

  if (t > closesAt) return { label: 'Ended', tone: 'muted' as const, canJoin: false }
  if (t >= startMs && t <= endMs) {
    return { label: 'In progress', tone: 'live' as const, canJoin: true }
  }
  if (t >= opensAt && t < startMs) {
    return {
      label: `Starts in ${formatDurationMs(startMs - t)}`,
      tone: 'open' as const,
      canJoin: true,
    }
  }
  if (t > endMs && t <= closesAt) {
    return { label: 'Just ended — still open', tone: 'open' as const, canJoin: true }
  }

  return {
    label: `Starts in ${formatDurationMs(startMs - t)}`,
    tone: 'soon' as const,
    canJoin: false,
  }
}

/** Compact human duration: 2d 4h · 3h 12m · 45 min · <1 min */
export function formatDurationMs(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSec / 86_400)
  const hours = Math.floor((totalSec % 86_400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`
  }
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  if (mins > 0) return `${mins} min`
  return '<1 min'
}
