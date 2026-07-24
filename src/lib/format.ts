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

