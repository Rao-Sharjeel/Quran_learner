import {
  CALENDAR_HORIZON_DAYS,
  INTRO_DURATION_MINUTES,
  PACKAGE_SESSION_COUNT,
  SUBJECT_LABELS,
  type Session,
  type SubjectId,
  type Teacher,
  type TeachingEngagement,
  type WeeklyAvailabilitySlot,
} from '../types'
import { generateOccurrences } from '../lib/schedule'

export function hadFreeIntroForPair(
  engagements: TeachingEngagement[],
  guardianId: string,
  teacherId: string,
) {
  return engagements.some(
    (e) =>
      e.guardianId === guardianId &&
      e.teacherId === teacherId &&
      e.introUsed,
  )
}

export function slotsForEngagement(
  teacher: Teacher,
  engagement: TeachingEngagement,
): WeeklyAvailabilitySlot[] {
  return teacher.availability.filter((s) =>
    engagement.weeklySlotIds.includes(s.id),
  )
}

/** Latest future paid (scheduled) session — how far payment coverage extends. */
export function lastFuturePaidSession(
  sessions: Session[],
  engagementId: string,
  now = new Date(),
): Session | null {
  const nowMs = now.getTime()
  let latest: Session | null = null
  for (const s of sessions) {
    if (s.engagementId !== engagementId) continue
    if (s.paymentStatus !== 'paid') continue
    if (s.status !== 'scheduled') continue
    const t = new Date(s.startsAt).getTime()
    if (Number.isNaN(t) || t < nowMs) continue
    if (!latest || t > new Date(latest.startsAt).getTime()) latest = s
  }
  return latest
}

/** Build intro session when teacher accepts (if free intro still available). */
export function buildIntroSession(input: {
  engagement: TeachingEngagement
  teacher: Teacher
  startsAt: Date
}): Session {
  const { engagement, teacher, startsAt } = input
  return {
    id: `ses_intro_${engagement.id}_${startsAt.getTime()}`,
    engagementId: engagement.id,
    teacherId: teacher.id,
    learnerIds: [...engagement.learnerIds],
    title: `Introductory meeting — ${SUBJECT_LABELS[engagement.subject]}`,
    subject: engagement.subject,
    startsAt: startsAt.toISOString(),
    durationMinutes: INTRO_DURATION_MINUTES,
    kind: 'intro',
    status: 'scheduled',
    paymentStatus: 'free',
    weeklySlotId: engagement.weeklySlotIds[0],
    studentNote: engagement.studentNote,
  }
}

/**
 * Generate ~2 months of regular sessions from weekly slots.
 * First `paidCount` future regulars get paymentStatus paid; rest unpaid.
 */
export function buildRegularCalendar(input: {
  engagement: TeachingEngagement
  teacher: Teacher
  from: Date
  paidCount: number
  titleBase?: string
}): Session[] {
  const { engagement, teacher, from, paidCount } = input
  const slots = slotsForEngagement(teacher, engagement)
  if (slots.length === 0) return []

  const until = new Date(from)
  until.setDate(until.getDate() + CALENDAR_HORIZON_DAYS)

  const occurrences = generateOccurrences(slots, from, until)
  const titleBase =
    input.titleBase ??
    engagement.titleSuggestion ??
    SUBJECT_LABELS[engagement.subject]

  return occurrences.map((occ, index) => {
    const paid = index < paidCount
    return {
      id: `ses_${engagement.id}_${occ.startsAt.getTime()}`,
      engagementId: engagement.id,
      teacherId: teacher.id,
      learnerIds: [...engagement.learnerIds],
      title: index === 0 ? titleBase : `${titleBase} · session ${index + 1}`,
      subject: engagement.subject as SubjectId,
      startsAt: occ.startsAt.toISOString(),
      durationMinutes: teacher.durationMinutes,
      kind: 'regular' as const,
      status: 'scheduled' as const,
      paymentStatus: paid ? ('paid' as const) : ('unpaid' as const),
      weeklySlotId: occ.slot.id,
      studentNote: engagement.studentNote,
    }
  })
}

export { PACKAGE_SESSION_COUNT }
