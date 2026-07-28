import type { LearnerProfile, ReadingBookmark, Session, SubjectId } from '../../types'
import { SUBJECT_LABELS } from '../../types'
import { teacherGivenName } from '../../lib/format'
import { getLearner } from '../../mocks/store'

export type OpenHomeworkRow = {
  id: string
  text: string
  done: boolean
  learnerId: string
  sessionId: string
  subject: SubjectId
  teacherId: string
  startsAt: string
  requiresAudio?: boolean
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function dayKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Yesterday + today + next 5 days */
export function windowDays(today: Date) {
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - 1))
}

export function formatHour(startsAt: string) {
  const date = new Date(startsAt)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function shortName(learner: LearnerProfile | undefined | null) {
  if (!learner) return 'Learner'
  return learner.kind === 'self' ? 'You' : learner.name.split(' ')[0]!
}

export function teacherGiven(fullName: string) {
  return teacherGivenName(fullName)
}

export function classTitle(learner: LearnerProfile | undefined, subject: SubjectId) {
  const who = shortName(learner)
  return `${who} · ${SUBJECT_LABELS[subject]}`
}

export function sessionLearnersLabel(session: Session) {
  return session.learnerIds
    .map((id) => shortName(getLearner(id)))
    .join(', ')
}

export function soonestJoinable(sessions: Session[]) {
  return [...sessions]
    .filter(
      (s) =>
        s.status === 'scheduled' &&
        (s.paymentStatus === 'paid' || s.paymentStatus === 'free'),
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]
}

/** @deprecated use soonestJoinable */
export function soonestAccepted(sessions: Session[]) {
  return soonestJoinable(sessions)
}

export function upcomingSchedule(sessions: Session[]) {
  return [...sessions]
    .filter((s) => s.status === 'scheduled')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 12)
}

export function collectOpenHomework(sessions: Session[]): OpenHomeworkRow[] {
  return sessions.flatMap((s) =>
    (s.homework ?? [])
      .filter((h) => !h.done)
      .map((h) => ({
        id: h.id,
        text: h.text,
        done: h.done,
        learnerId: h.learnerId,
        sessionId: s.id,
        subject: s.subject,
        teacherId: s.teacherId,
        startsAt: s.startsAt,
        requiresAudio: h.requiresAudio,
      })),
  )
}

export function latestBookmarkForLearner(
  bookmarks: ReadingBookmark[],
  learnerId: string,
) {
  return [...bookmarks]
    .filter((b) => b.learnerId === learnerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
}
