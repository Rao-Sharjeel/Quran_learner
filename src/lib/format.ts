export function formatSessionWhen(startsAt: string, slotLabel: string) {
  const date = new Date(startsAt)
  if (Number.isNaN(date.getTime())) return slotLabel
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Local calendar day key YYYY-MM-DD for grouping sessions */
export function sessionDayKey(startsAt: string) {
  const date = new Date(startsAt)
  if (Number.isNaN(date.getTime())) return startsAt.slice(0, 10)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** Today / Tomorrow / Yesterday / "Thu, Jul 23" */
export function sessionDayLabel(startsAt: string, now = new Date()) {
  const date = new Date(startsAt)
  if (Number.isNaN(date.getTime())) return startsAt.slice(0, 10)

  const day = startOfLocalDay(date)
  const today = startOfLocalDay(now)
  const dayMs = 24 * 60 * 60 * 1000
  const diff = (day - today) / dayMs

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatSessionTime(startsAt: string) {
  const date = new Date(startsAt)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** e.g. "Fri, Aug 8" — coverage end date for paid sessions */
export function formatPaidThroughDate(startsAt: string) {
  const date = new Date(startsAt)
  if (Number.isNaN(date.getTime())) return startsAt.slice(0, 10)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** True if the session's local calendar day is today or later */
export function isSessionDayUpcoming(startsAt: string, now = new Date()) {
  const date = new Date(startsAt)
  if (Number.isNaN(date.getTime())) return false
  return startOfLocalDay(date) >= startOfLocalDay(now)
}

const TITLES = new Set(['Ustadh', 'Ustadha', 'Shaykh', 'Sheikh'])

export function teacherGivenName(fullName: string) {
  const parts = fullName.split(' ').filter(Boolean)
  if (parts.length >= 2 && TITLES.has(parts[0]!)) return parts[1]!
  return parts[0] ?? fullName
}

export function askAuthorLabel(question: {
  anonymous: boolean
  studentName: string
}) {
  return question.anonymous ? 'Anonymous' : question.studentName
}

export function formatAskDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Simple relevance for “already asked?” search over published (and optional) threads */
export function matchesAskSearch(
  question: { title: string; body: string; topic: string },
  query: string,
  topicLabels: Record<string, string>,
) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    question.title,
    question.body,
    topicLabels[question.topic] ?? question.topic,
  ]
    .join(' ')
    .toLowerCase()
  return q.split(/\s+/).every((token) => haystack.includes(token))
}

