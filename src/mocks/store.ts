import { useSyncExternalStore } from 'react'
import type {
  AppNotification,
  AskQuestion,
  Course,
  HomeworkAudioComment,
  HomeworkItem,
  Invoice,
  LearnerProfile,
  LibraryResource,
  ReadingBookmark,
  Session,
  SubjectId,
  TeachingEngagement,
} from '../types'
import {
  INTRO_DURATION_MINUTES,
  PACKAGE_SESSION_COUNT,
  SUBJECT_LABELS,
} from '../types'
import {
  currentGuardian,
  currentStudent,
  learnerInitials,
  nextLearnerColor,
  seedAskQuestions,
  seedCourses,
  seedEngagements,
  seedInvoices,
  seedLearners,
  seedReadingBookmarks,
  seedSessions,
  teacherReviews,
  teachers,
} from './data'
import {
  buildIntroSession,
  buildRegularCalendar,
  hadFreeIntroForPair,
  slotsForEngagement,
} from './engagementHelpers'
import { nextOccurrence } from '../lib/schedule'
import { seedLibrary } from './library'

type Listener = () => void

let sessions: Session[] = structuredClone(seedSessions)
let engagements: TeachingEngagement[] = structuredClone(seedEngagements)
let invoices: Invoice[] = structuredClone(seedInvoices)
let askQuestions: AskQuestion[] = structuredClone(seedAskQuestions)
let learners: LearnerProfile[] = structuredClone(seedLearners)
let readingBookmarks: ReadingBookmark[] = structuredClone(seedReadingBookmarks)
let notifications: AppNotification[] = [
  {
    id: 'ntf_seed_1',
    kind: 'payment_due',
    title: 'Payment pending',
    body: 'Introductory session with Ustadha Fatima Noor is done. Pay for at least 4 sessions to continue.',
    createdAt: '2026-07-20T19:00:00.000Z',
    read: false,
    href: '/engagements/eng_3/checkout',
  },
]
/** Demo: which forum scholar is acting in private rooms */
let activeScholarId = 'tch_1'
/** Demo teacher portal actor */
let activeTeacherId = 'tch_1'

const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSessionsSnapshot() {
  return sessions
}

function getEngagementsSnapshot() {
  return engagements
}

function getInvoicesSnapshot() {
  return invoices
}

function getNotificationsSnapshot() {
  return notifications
}

function getAskQuestions() {
  return askQuestions
}

function getLearnersSnapshot() {
  return learners
}

function getReadingBookmarksSnapshot() {
  return readingBookmarks
}

function getActiveScholarId() {
  return activeScholarId
}

function getActiveTeacherId() {
  return activeTeacherId
}

export function sessionIncludesLearner(session: Session, learnerId: string) {
  return session.learnerIds.includes(learnerId)
}

export function useSessions(filter?: { learnerId?: string | null }) {
  const all = useSyncExternalStore(subscribe, getSessionsSnapshot, getSessionsSnapshot)
  if (filter?.learnerId === undefined) return all
  if (!filter.learnerId) return []
  return all.filter((s) => sessionIncludesLearner(s, filter.learnerId!))
}

export function useEngagements() {
  return useSyncExternalStore(subscribe, getEngagementsSnapshot, getEngagementsSnapshot)
}

export function useInvoices() {
  return useSyncExternalStore(subscribe, getInvoicesSnapshot, getInvoicesSnapshot)
}

export function useNotifications() {
  return useSyncExternalStore(
    subscribe,
    getNotificationsSnapshot,
    getNotificationsSnapshot,
  )
}

export function useAskQuestions() {
  return useSyncExternalStore(subscribe, getAskQuestions, getAskQuestions)
}

export function useAskQuestion(id: string | undefined) {
  const all = useAskQuestions()
  if (!id) return undefined
  return all.find((q) => q.id === id)
}

export function useLearners() {
  return useSyncExternalStore(subscribe, getLearnersSnapshot, getLearnersSnapshot)
}

export function useReadingBookmarks() {
  return useSyncExternalStore(
    subscribe,
    getReadingBookmarksSnapshot,
    getReadingBookmarksSnapshot,
  )
}

/** Kids only (excludes parent self) */
export function useKids() {
  return useLearners().filter((l) => l.kind === 'kid')
}

export function useActiveScholarId() {
  return useSyncExternalStore(subscribe, getActiveScholarId, getActiveScholarId)
}

export function useActiveTeacherId() {
  return useSyncExternalStore(subscribe, getActiveTeacherId, getActiveTeacherId)
}

export function setActiveTeacher(teacherId: string) {
  if (!teachers.some((t) => t.id === teacherId)) throw new Error('Teacher not found')
  activeTeacherId = teacherId
  emit()
}

export function getTeacher(id: string) {
  return teachers.find((t) => t.id === id)
}

export function listTeachers() {
  return teachers
}

export function listCourses() {
  return seedCourses
}

export function getCourse(id: string): Course | undefined {
  return seedCourses.find((c) => c.id === id)
}

export function listForumScholars() {
  return teachers.filter((t) => t.badges.includes('forum_scholar'))
}

export function getGuardian() {
  return currentGuardian
}

/** @deprecated Prefer getGuardian */
export function getStudent() {
  return currentStudent
}

export function getLearners() {
  return learners
}

export function getLearner(id: string) {
  return learners.find((l) => l.id === id)
}

/** @deprecated Prefer getLearner */
export function getKid(id: string) {
  return getLearner(id)
}

export function getKids() {
  return learners.filter((l) => l.kind === 'kid')
}

export function getSelfLearner() {
  return learners.find((l) => l.kind === 'self')
}

export function addKid(input: { name: string; age?: number }) {
  const name = input.name.trim()
  if (!name) throw new Error('Name is required')
  const kid: LearnerProfile = {
    id: `kid_${Date.now()}`,
    guardianId: currentGuardian.id,
    kind: 'kid',
    name,
    age: input.age,
    gradeLabel: input.age != null ? `Age ${input.age}` : undefined,
    avatarColor: nextLearnerColor(learners.length),
    initials: learnerInitials(name) || 'K',
    hifzSummary: 'Not started',
    readingMinutesWeek: 0,
    openAskCount: 0,
  }
  learners = [...learners, kid]
  emit()
  return kid
}

export function updateKid(
  id: string,
  input: { name: string; age?: number | '' },
) {
  const name = input.name.trim()
  if (!name) throw new Error('Name is required')
  const age =
    input.age === '' || input.age === undefined ? undefined : Number(input.age)
  if (age !== undefined && (Number.isNaN(age) || age < 1 || age > 18)) {
    throw new Error('Age must be between 1 and 18')
  }

  const target = learners.find((k) => k.id === id)
  if (!target || target.kind !== 'kid') throw new Error('Kid not found')

  learners = learners.map((k) =>
    k.id !== id
      ? k
      : {
          ...k,
          name,
          age,
          gradeLabel: age != null ? `Age ${age}` : undefined,
          initials: learnerInitials(name) || k.initials,
        },
  )
  emit()
  return learners.find((k) => k.id === id)!
}

export function removeKid(id: string): { ok: true } | { ok: false; reason: string } {
  const kid = learners.find((k) => k.id === id)
  if (!kid || kid.kind !== 'kid') return { ok: false, reason: 'Kid not found' }

  const blocking = sessions.some(
    (s) =>
      sessionIncludesLearner(s, id) &&
      s.status === 'scheduled' &&
      (s.paymentStatus === 'paid' || s.paymentStatus === 'free'),
  )
  if (blocking) {
    return {
      ok: false,
      reason:
        'This kid has upcoming paid or intro sessions. End those engagements or wait until they complete before removing.',
    }
  }

  learners = learners.filter((k) => k.id !== id)
  emit()
  return { ok: true }
}

export function listLibrary() {
  return seedLibrary
}

export function getLibraryResource(id: string): LibraryResource | undefined {
  return seedLibrary.find((r) => r.id === id)
}

export function listReadingBookmarks() {
  return readingBookmarks
}

export function getBookmarksForResource(resourceId: string) {
  return readingBookmarks.filter((b) => b.resourceId === resourceId)
}

export function getBookmark(resourceId: string, learnerId: string) {
  return readingBookmarks.find(
    (b) => b.resourceId === resourceId && b.learnerId === learnerId,
  )
}

/**
 * Save / update a per-learner bookmark with progress.
 * Also refreshes that learner’s last-read title and weekly minutes.
 */
export function upsertReadingBookmark(input: {
  resourceId: string
  learnerId: string
  progressPercent: number
  minutesSpent?: number
}) {
  const resource = getLibraryResource(input.resourceId)
  const learner = getLearner(input.learnerId)
  if (!resource || !learner) throw new Error('Invalid bookmark target')

  const progressPercent = Math.max(0, Math.min(100, Math.round(input.progressPercent)))
  const existing = getBookmark(input.resourceId, input.learnerId)
  const minutesSpent =
    input.minutesSpent ?? existing?.minutesSpent ?? Math.max(5, Math.round(progressPercent / 2))
  const updatedAt = new Date().toISOString()

  if (existing) {
    readingBookmarks = readingBookmarks.map((b) =>
      b.id === existing.id
        ? { ...b, progressPercent, minutesSpent, updatedAt }
        : b,
    )
  } else {
    readingBookmarks = [
      {
        id: `rb_${Date.now()}`,
        resourceId: input.resourceId,
        learnerId: input.learnerId,
        progressPercent,
        minutesSpent,
        updatedAt,
      },
      ...readingBookmarks,
    ]
  }

  learners = learners.map((l) =>
    l.id === input.learnerId
      ? {
          ...l,
          lastReadingTitle: resource.title,
          readingMinutesWeek: Math.max(l.readingMinutesWeek, minutesSpent),
        }
      : l,
  )
  emit()
  return getBookmark(input.resourceId, input.learnerId)!
}

export function removeReadingBookmark(resourceId: string, learnerId: string) {
  readingBookmarks = readingBookmarks.filter(
    (b) => !(b.resourceId === resourceId && b.learnerId === learnerId),
  )
  emit()
}

export function getSession(id: string) {
  return sessions.find((s) => s.id === id)
}

export function getEngagement(id: string) {
  return engagements.find((e) => e.id === id)
}

export function listEngagements() {
  return engagements
}

export function getAskQuestion(id: string) {
  return askQuestions.find((q) => q.id === id)
}

export function listReviewsForTeacher(teacherId: string) {
  return teacherReviews.filter((r) => r.teacherId === teacherId)
}

export function setActiveScholar(scholarId: string) {
  if (!teachers.some((t) => t.id === scholarId && t.badges.includes('forum_scholar'))) {
    throw new Error('Not a forum scholar')
  }
  activeScholarId = scholarId
  emit()
}

function pushNotification(
  n: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & { id?: string },
) {
  notifications = [
    {
      id: n.id ?? `ntf_${Date.now()}`,
      kind: n.kind,
      title: n.title,
      body: n.body,
      href: n.href,
      createdAt: new Date().toISOString(),
      read: false,
    },
    ...notifications,
  ]
}

export function markNotificationRead(id: string) {
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n,
  )
  emit()
}

export function hadFreeIntro(guardianId: string, teacherId: string) {
  return hadFreeIntroForPair(engagements, guardianId, teacherId)
}

export function createEngagementRequest(input: {
  teacherId: string
  weeklySlotIds: string[]
  subject: SubjectId
  learnerIds: string[]
  titleSuggestion?: string
  studentNote?: string
}) {
  const teacher = getTeacher(input.teacherId)
  if (!teacher) throw new Error('Teacher not found')
  if (!teacher.subjects.includes(input.subject)) {
    throw new Error('Subject not offered by this teacher')
  }
  if (input.weeklySlotIds.length === 0) {
    throw new Error('Select at least one weekly time')
  }
  for (const slotId of input.weeklySlotIds) {
    if (!teacher.availability.some((s) => s.id === slotId)) {
      throw new Error('Invalid weekly slot')
    }
  }
  if (input.learnerIds.length === 0) {
    throw new Error('Select at least one learner')
  }
  for (const lid of input.learnerIds) {
    if (!learners.some((l) => l.id === lid)) throw new Error('Invalid learner')
  }

  const introUsed = hadFreeIntro(currentGuardian.id, teacher.id)
  const engagement: TeachingEngagement = {
    id: `eng_${Date.now()}`,
    guardianId: currentGuardian.id,
    teacherId: teacher.id,
    subject: input.subject,
    learnerIds: [...input.learnerIds],
    weeklySlotIds: [...input.weeklySlotIds],
    status: 'pending',
    titleSuggestion: input.titleSuggestion?.trim() || undefined,
    studentNote: input.studentNote?.trim() || undefined,
    introUsed,
    prepaidSessionCredits: 0,
    createdAt: new Date().toISOString(),
  }
  engagements = [engagement, ...engagements]
  emit()
  return engagement
}

export function teacherAcceptEngagement(engagementId: string) {
  const engagement = getEngagement(engagementId)
  if (!engagement || engagement.status !== 'pending') {
    throw new Error('Request not pending')
  }
  const teacher = getTeacher(engagement.teacherId)
  if (!teacher) throw new Error('Teacher not found')

  const slots = slotsForEngagement(teacher, engagement)
  const firstSlot = slots[0] ?? teacher.availability[0]
  if (!firstSlot) throw new Error('No availability')

  const introStarts = nextOccurrence(firstSlot, new Date())
  // Prefer soon intro: if first weekly slot is far, still use nextOccurrence

  if (!engagement.introUsed) {
    const intro = buildIntroSession({
      engagement,
      teacher,
      startsAt: introStarts,
    })
    sessions = [intro, ...sessions]
    engagements = engagements.map((e) =>
      e.id === engagementId
        ? { ...e, status: 'intro_scheduled' as const, introUsed: true }
        : e,
    )
    pushNotification({
      kind: 'engagement_accepted',
      title: 'Teacher accepted your request',
      body: `${teacher.name} scheduled a free introductory session (${INTRO_DURATION_MINUTES} min).`,
      href: `/sessions/${intro.id}`,
    })
  } else {
    // Restart — no free intro; go straight to awaiting payment
    engagements = engagements.map((e) =>
      e.id === engagementId
        ? { ...e, status: 'awaiting_payment' as const, introUsed: true }
        : e,
    )
    pushNotification({
      kind: 'payment_due',
      title: 'Teacher accepted — payment required',
      body: `${teacher.name} accepted. Pay for at least ${PACKAGE_SESSION_COUNT} sessions to start (no free intro on restart).`,
      href: `/engagements/${engagementId}/checkout`,
    })
  }
  emit()
  return getEngagement(engagementId)!
}

export function teacherDeclineEngagement(engagementId: string, message?: string) {
  const engagement = getEngagement(engagementId)
  if (!engagement || engagement.status !== 'pending') {
    throw new Error('Request not pending')
  }
  engagements = engagements.map((e) =>
    e.id === engagementId
      ? {
          ...e,
          status: 'declined' as const,
          teacherMessage: message?.trim() || e.teacherMessage,
        }
      : e,
  )
  emit()
}

export function teacherRescheduleMessage(engagementId: string, message: string) {
  const text = message.trim()
  if (!text) throw new Error('Write a message')
  const engagement = getEngagement(engagementId)
  if (!engagement || engagement.status !== 'pending') {
    throw new Error('Request not pending')
  }
  engagements = engagements.map((e) =>
    e.id === engagementId ? { ...e, teacherMessage: text } : e,
  )
  emit()
}

/** Mark intro complete → awaiting payment (or activate if somehow already paid). */
export function completeIntro(sessionId: string) {
  const session = getSession(sessionId)
  if (!session || session.kind !== 'intro') throw new Error('Not an intro session')
  sessions = sessions.map((s) =>
    s.id === sessionId ? { ...s, status: 'completed' as const } : s,
  )
  const eng = getEngagement(session.engagementId)
  if (eng && (eng.status === 'intro_scheduled' || eng.status === 'pending')) {
    engagements = engagements.map((e) =>
      e.id === eng.id ? { ...e, status: 'awaiting_payment' as const } : e,
    )
    const teacher = getTeacher(eng.teacherId)
    pushNotification({
      kind: 'payment_due',
      title: 'Payment pending',
      body: `Intro with ${teacher?.name ?? 'your teacher'} is done. Pay for at least ${PACKAGE_SESSION_COUNT} sessions to continue.`,
      href: `/engagements/${eng.id}/checkout`,
    })
  }
  emit()
}

export function payPackage(engagementId: string, count = PACKAGE_SESSION_COUNT) {
  const engagement = getEngagement(engagementId)
  if (!engagement) throw new Error('Engagement not found')
  if (
    engagement.status !== 'awaiting_payment' &&
    engagement.status !== 'active' &&
    engagement.status !== 'intro_scheduled'
  ) {
    throw new Error('Nothing to pay for on this engagement')
  }
  const teacher = getTeacher(engagement.teacherId)
  if (!teacher) throw new Error('Teacher not found')

  const wasHiring =
    engagement.status === 'awaiting_payment' ||
    engagement.status === 'intro_scheduled'

  const paidCredits = Math.max(PACKAGE_SESSION_COUNT, Math.floor(count))

  const unpaid = sessions
    .filter(
      (s) =>
        s.engagementId === engagementId &&
        s.status === 'scheduled' &&
        s.kind === 'regular' &&
        (s.paymentStatus === 'unpaid' || s.paymentStatus === 'pending_payment'),
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  let remaining = paidCredits
  const markIds = new Set<string>()
  for (const s of unpaid) {
    if (remaining <= 0) break
    markIds.add(s.id)
    remaining -= 1
  }

  if (markIds.size > 0) {
    sessions = sessions.map((s) =>
      markIds.has(s.id) ? { ...s, paymentStatus: 'paid' as const } : s,
    )
  }

  if (remaining > 0) {
    const from = new Date()
    const existingStarts = new Set(
      sessions
        .filter((s) => s.engagementId === engagementId && s.status !== 'cancelled')
        .map((s) => s.startsAt),
    )
    const generated = buildRegularCalendar({
      engagement,
      teacher,
      from,
      paidCount: remaining + 8,
      titleBase: engagement.titleSuggestion ?? SUBJECT_LABELS[engagement.subject],
    }).filter((s) => !existingStarts.has(s.startsAt))

    const paidNew = generated.slice(0, remaining).map((s) => ({
      ...s,
      paymentStatus: 'paid' as const,
    }))
    const unpaidNew = generated.slice(remaining).map((s) => ({
      ...s,
      paymentStatus: 'unpaid' as const,
    }))
    sessions = [...paidNew, ...unpaidNew, ...sessions]
  }

  engagements = engagements.map((e) =>
    e.id === engagementId
      ? {
          ...e,
          status: 'active' as const,
          prepaidSessionCredits: e.prepaidSessionCredits + paidCredits,
        }
      : e,
  )

  if (wasHiring) {
    notifications = notifications.map((n) =>
      n.kind === 'payment_due' && n.href?.includes(engagementId)
        ? { ...n, read: true }
        : n,
    )
    pushNotification({
      kind: 'hire_success',
      title: 'Teacher hired',
      body: `You’ve hired ${teacher.name}. Happy learning!`,
      href: '/sessions',
    })
  }

  emit()
  return getEngagement(engagementId)!
}

export function getInvoice(id: string) {
  return invoices.find((i) => i.id === id)
}

export function listInvoices() {
  return invoices
}

export function useInvoice(id: string | undefined) {
  const all = useInvoices()
  if (!id) return undefined
  return all.find((i) => i.id === id)
}

function nextInvoiceNumber() {
  const nums = invoices
    .map((i) => Number(i.invoiceNumber.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 1000) + 1
  return `INV-${next}`
}

export function buildInvoicePreview(
  engagementId: string,
  sessionCount: number,
): Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber' | 'status' | 'paidAt'> {
  const count = Math.max(PACKAGE_SESSION_COUNT, Math.floor(sessionCount))
  const engagement = getEngagement(engagementId)
  if (!engagement) throw new Error('Engagement not found')
  const teacher = getTeacher(engagement.teacherId)
  if (!teacher) throw new Error('Teacher not found')

  const unit = teacher.rateUsd
  const lines = [
    {
      description: `${SUBJECT_LABELS[engagement.subject]} sessions with ${teacher.name}`,
      quantity: count,
      unitAmountUsd: unit,
    },
  ]
  const subtotalUsd = unit * count
  return {
    engagementId,
    teacherId: teacher.id,
    sessionCount: count,
    lines,
    subtotalUsd,
    totalUsd: subtotalUsd,
    currency: 'USD' as const,
  }
}

/** Create or refresh an open invoice for checkout (qty >= 4). */
export function createInvoice(engagementId: string, sessionCount: number) {
  const count = Math.max(PACKAGE_SESSION_COUNT, Math.floor(sessionCount))
  const preview = buildInvoicePreview(engagementId, count)

  const existingOpen = invoices.find(
    (i) => i.engagementId === engagementId && i.status === 'open',
  )
  if (existingOpen) {
    invoices = invoices.map((i) =>
      i.id === existingOpen.id
        ? {
            ...i,
            ...preview,
            status: 'open' as const,
          }
        : i,
    )
    emit()
    return getInvoice(existingOpen.id)!
  }

  const invoice: Invoice = {
    id: `inv_${Date.now()}`,
    ...preview,
    status: 'open',
    createdAt: new Date().toISOString(),
    invoiceNumber: nextInvoiceNumber(),
  }
  invoices = [invoice, ...invoices]
  emit()
  return invoice
}

export function payInvoice(invoiceId: string) {
  const invoice = getInvoice(invoiceId)
  if (!invoice) throw new Error('Invoice not found')
  if (invoice.status === 'paid') return invoice
  if (invoice.status !== 'open' && invoice.status !== 'draft') {
    throw new Error('Invoice cannot be paid')
  }

  payPackage(invoice.engagementId, invoice.sessionCount)

  invoices = invoices.map((i) =>
    i.id === invoiceId
      ? { ...i, status: 'paid' as const, paidAt: new Date().toISOString() }
      : i,
  )
  emit()
  return getInvoice(invoiceId)!
}

export function endEngagement(engagementId: string) {
  const engagement = getEngagement(engagementId)
  if (!engagement) throw new Error('Engagement not found')
  if (engagement.status === 'ended') return engagement

  sessions = sessions.map((s) => {
    if (s.engagementId !== engagementId) return s
    if (s.status !== 'scheduled') return s
    if (s.paymentStatus === 'paid' || s.paymentStatus === 'free') return s
    return { ...s, status: 'cancelled' as const }
  })

  engagements = engagements.map((e) =>
    e.id === engagementId
      ? {
          ...e,
          status: 'ended' as const,
          endedAt: new Date().toISOString(),
        }
      : e,
  )
  emit()
  return getEngagement(engagementId)!
}

/** Guardian declines to hire after intro — cancels unpaid future sessions */
export function markNotHired(engagementId: string) {
  const engagement = getEngagement(engagementId)
  if (!engagement) throw new Error('Engagement not found')
  if (engagement.status === 'not_hired' || engagement.status === 'ended') {
    return engagement
  }

  sessions = sessions.map((s) => {
    if (s.engagementId !== engagementId) return s
    if (s.status !== 'scheduled') return s
    if (s.paymentStatus === 'paid' || s.paymentStatus === 'free') return s
    return { ...s, status: 'cancelled' as const }
  })

  engagements = engagements.map((e) =>
    e.id === engagementId
      ? {
          ...e,
          status: 'not_hired' as const,
          endedAt: new Date().toISOString(),
        }
      : e,
  )
  emit()
  return getEngagement(engagementId)!
}

export function updateSessionTitle(sessionId: string, title: string) {
  const text = title.trim()
  if (!text) throw new Error('Title required')
  sessions = sessions.map((s) => (s.id === sessionId ? { ...s, title: text } : s))
  emit()
}

export function updateSessionNotes(
  sessionId: string,
  patch: {
    sharedNotes?: string
    privateNotesGuardian?: string
    privateNotesTeacher?: string
  },
) {
  sessions = sessions.map((s) => {
    if (s.id !== sessionId) return s
    return {
      ...s,
      sharedNotes:
        patch.sharedNotes !== undefined ? patch.sharedNotes : s.sharedNotes,
      privateNotesGuardian:
        patch.privateNotesGuardian !== undefined
          ? patch.privateNotesGuardian
          : s.privateNotesGuardian,
      privateNotesTeacher:
        patch.privateNotesTeacher !== undefined
          ? patch.privateNotesTeacher
          : s.privateNotesTeacher,
    }
  })
  emit()
}

export function assignHomework(
  sessionId: string,
  input: { learnerId: string; text: string; requiresAudio?: boolean },
) {
  const session = getSession(sessionId)
  if (!session) throw new Error('Session not found')
  if (!session.learnerIds.includes(input.learnerId)) {
    throw new Error('Learner not on this session')
  }
  const text = input.text.trim()
  if (!text) throw new Error('Homework text required')
  const item: HomeworkItem = {
    id: `hw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    learnerId: input.learnerId,
    text,
    done: false,
    requiresAudio: input.requiresAudio,
  }
  sessions = sessions.map((s) =>
    s.id === sessionId
      ? { ...s, homework: [...(s.homework ?? []), item] }
      : s,
  )
  emit()
  return item
}

export function setHomeworkMark(
  sessionId: string,
  homeworkId: string,
  mark: number,
) {
  const value = Math.max(0, Math.min(10, Math.round(mark)))
  patchHomework(sessionId, homeworkId, (h) => ({ ...h, mark: value }))
}

export function markSessionCompleted(id: string) {
  const session = getSession(id)
  sessions = sessions.map((s) =>
    s.id === id ? { ...s, status: 'completed' as const } : s,
  )
  if (session?.kind === 'intro') {
    // Mirror completeIntro side effects without double-emit issues
    const eng = getEngagement(session.engagementId)
    if (eng && eng.status === 'intro_scheduled') {
      engagements = engagements.map((e) =>
        e.id === eng.id ? { ...e, status: 'awaiting_payment' as const } : e,
      )
      const teacher = getTeacher(eng.teacherId)
      pushNotification({
        kind: 'payment_due',
        title: 'Payment pending',
        body: `Intro with ${teacher?.name ?? 'your teacher'} is done. Pay for at least ${PACKAGE_SESSION_COUNT} sessions to continue.`,
        href: `/engagements/${eng.id}/checkout`,
      })
    }
  }
  emit()
}

/** @deprecated Use createEngagementRequest */
export function createBookingRequest(_input: unknown): never {
  throw new Error('Use createEngagementRequest — one-off booking is retired')
}

export function toggleHomeworkDone(sessionId: string, homeworkId: string) {
  sessions = sessions.map((s) => {
    if (s.id !== sessionId || !s.homework) return s
    return {
      ...s,
      homework: s.homework.map((h) =>
        h.id === homeworkId ? { ...h, done: !h.done } : h,
      ),
    }
  })
  emit()
}

function patchHomework(
  sessionId: string,
  homeworkId: string,
  patch: (item: HomeworkItem) => HomeworkItem,
) {
  sessions = sessions.map((s) => {
    if (s.id !== sessionId || !s.homework) return s
    return {
      ...s,
      homework: s.homework.map((h) => (h.id === homeworkId ? patch(h) : h)),
    }
  })
  emit()
}

export function getHomeworkItem(sessionId: string, homeworkId: string) {
  return getSession(sessionId)?.homework?.find((h) => h.id === homeworkId)
}

/** Student uploads / replaces a homework recording (object URL or remote URL). */
export function uploadHomeworkAudio(
  sessionId: string,
  homeworkId: string,
  input: { audioUrl: string; fileName: string; durationSeconds: number },
) {
  const item = getHomeworkItem(sessionId, homeworkId)
  if (!item?.requiresAudio) throw new Error('This homework does not accept audio')

  patchHomework(sessionId, homeworkId, (h) => ({
    ...h,
    done: false,
    submission: {
      id: `sub_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      fileName: input.fileName,
      audioUrl: input.audioUrl,
      durationSeconds: Math.max(1, Math.round(input.durationSeconds)),
    },
    // New recording clears old timeline comments
    comments: [],
  }))
}

export function addHomeworkAudioComment(
  sessionId: string,
  homeworkId: string,
  input: {
    authorRole: 'teacher' | 'student'
    authorId: string
    authorName: string
    atSeconds: number
    kind: 'text' | 'audio'
    body?: string
    audioUrl?: string
    audioDurationSeconds?: number
  },
) {
  const item = getHomeworkItem(sessionId, homeworkId)
  if (!item?.submission) throw new Error('Upload a recording before commenting')
  if (input.kind === 'text' && !input.body?.trim()) {
    throw new Error('Write a comment')
  }
  if (input.kind === 'audio' && !input.audioUrl) {
    throw new Error('Record or attach an audio comment')
  }

  const atSeconds = Math.max(
    0,
    Math.min(item.submission.durationSeconds, Number(input.atSeconds.toFixed(1))),
  )

  const comment: HomeworkAudioComment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    authorRole: input.authorRole,
    authorId: input.authorId,
    authorName: input.authorName,
    atSeconds,
    kind: input.kind,
    body: input.body?.trim() || undefined,
    audioUrl: input.audioUrl,
    audioDurationSeconds: input.audioDurationSeconds,
    createdAt: new Date().toISOString(),
  }

  patchHomework(sessionId, homeworkId, (h) => ({
    ...h,
    comments: [...(h.comments ?? []), comment],
  }))
  return comment
}

export function submitSessionReview(sessionId: string) {
  sessions = sessions.map((s) =>
    s.id === sessionId ? { ...s, reviewSubmitted: true } : s,
  )
  emit()
}

export function useSession(id: string | undefined) {
  const all = useSessions()
  if (!id) return undefined
  return all.find((s) => s.id === id)
}

export function openHomeworkCount(learnerId: string) {
  return sessions
    .filter((s) => sessionIncludesLearner(s, learnerId) && s.homework)
    .flatMap((s) => s.homework ?? [])
    .filter((h) => h.learnerId === learnerId && !h.done).length
}

export function underReviewAskCount(learnerId: string) {
  return askQuestions.filter(
    (q) => q.studentId === learnerId && q.status === 'under_review',
  ).length
}

/** Joinable: scheduled + (free or paid) — unpaid cannot join until paid */
export function joinableSessions() {
  return sessions
    .filter(
      (s) =>
        s.status === 'scheduled' &&
        (s.paymentStatus === 'paid' || s.paymentStatus === 'free'),
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}

export function previousCompletedSession(sessionId: string) {
  const current = getSession(sessionId)
  if (!current) return undefined
  return sessions
    .filter(
      (s) =>
        s.engagementId === current.engagementId &&
        s.status === 'completed' &&
        s.startsAt < current.startsAt,
    )
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))[0]
}

export function createAskQuestion(input: {
  title: string
  body: string
  topic: SubjectId
  anonymous?: boolean
  learnerId: string
}) {
  const learner = getLearner(input.learnerId)
  if (!learner) throw new Error('Select who is asking')

  const question: AskQuestion = {
    id: `ask_${Date.now()}`,
    title: input.title.trim(),
    body: input.body.trim(),
    topic: input.topic,
    studentId: learner.id,
    studentName: learner.name,
    anonymous: Boolean(input.anonymous),
    status: 'under_review',
    createdAt: new Date().toISOString(),
    privateMessages: [],
    clarifications: [],
    comments: [],
  }
  askQuestions = [question, ...askQuestions]
  learners = learners.map((k) =>
    k.id === learner.id ? { ...k, openAskCount: k.openAskCount + 1 } : k,
  )
  emit()
  return question
}

export function addScholarMessage(askId: string, body: string) {
  const text = body.trim()
  if (!text) throw new Error('Message required')
  const question = askQuestions.find((q) => q.id === askId)
  if (!question || question.status !== 'under_review') {
    throw new Error('This question is not open for discussion.')
  }
  const scholarId = activeScholarId

  askQuestions = askQuestions.map((q) => {
    if (q.id !== askId) return q
    return {
      ...q,
      privateMessages: [
        ...q.privateMessages,
        {
          id: `pm_${Date.now()}`,
          scholarId,
          body: text,
          createdAt: new Date().toISOString(),
        },
      ],
    }
  })
  emit()
}

export function createAskDraft(askId: string, body: string) {
  const text = body.trim()
  if (!text) throw new Error('Draft required')
  const question = askQuestions.find((q) => q.id === askId)
  if (!question || question.status !== 'under_review') {
    throw new Error('This question is not open for drafting.')
  }
  if (question.draft) throw new Error('A draft already exists')
  const scholarId = activeScholarId

  askQuestions = askQuestions.map((q) => {
    if (q.id !== askId) return q
    return {
      ...q,
      draft: {
        id: `dr_${Date.now()}`,
        body: text,
        authorId: scholarId,
        agreeIds: [],
        createdAt: new Date().toISOString(),
      },
    }
  })
  emit()
}

export function agreeAskDraft(askId: string) {
  const scholarId = activeScholarId
  const question = askQuestions.find((q) => q.id === askId)
  if (!question?.draft || question.status !== 'under_review') {
    throw new Error('No draft to agree on.')
  }
  if (question.draft.authorId === scholarId) {
    throw new Error('The drafter cannot agree on their own draft.')
  }
  if (question.draft.agreeIds.includes(scholarId)) {
    throw new Error('You already agreed.')
  }

  const agreeIds = [...question.draft.agreeIds, scholarId]
  const draft = { ...question.draft, agreeIds }
  const ready = agreeIds.length >= 1

  askQuestions = askQuestions.map((q) => {
    if (q.id !== askId || !q.draft) return q
    if (!ready) return { ...q, draft }
    return {
      ...q,
      draft,
      status: 'published' as const,
      publishedAnswer: draft.body,
      publishedByIds: [draft.authorId, ...agreeIds],
      publishedAt: new Date().toISOString(),
      comments: q.comments ?? [],
    }
  })

  if (ready) {
    const learnerId = question.studentId
    learners = learners.map((k) =>
      k.id === learnerId
        ? { ...k, openAskCount: Math.max(0, k.openAskCount - 1) }
        : k,
    )
  }
  emit()
}

export function addAskComment(askId: string, body: string, asLearnerId?: string) {
  const text = body.trim()
  if (!text) throw new Error('Write a comment to continue.')
  const question = askQuestions.find((q) => q.id === askId)
  if (!question || question.status !== 'published') {
    throw new Error('Comments open after the answer is published.')
  }

  const asLearner = asLearnerId ? getLearner(asLearnerId) : undefined
  const authorId = asLearner?.id ?? getGuardian().id
  const authorName = asLearner?.name ?? getGuardian().name

  askQuestions = askQuestions.map((q) => {
    if (q.id !== askId) return q
    return {
      ...q,
      comments: [
        ...(q.comments ?? []),
        {
          id: `cmt_${Date.now()}`,
          authorId,
          authorName,
          body: text,
          createdAt: new Date().toISOString(),
        },
      ],
    }
  })
  emit()
}

export function askStudentClarification(askId: string, body: string) {
  const text = body.trim()
  if (!text) throw new Error('Write a question for the student.')
  const question = askQuestions.find((q) => q.id === askId)
  if (!question || question.status !== 'under_review') {
    throw new Error('Clarifications are only for questions under review.')
  }
  const scholarId = activeScholarId

  askQuestions = askQuestions.map((q) => {
    if (q.id !== askId) return q
    return {
      ...q,
      clarifications: [
        ...(q.clarifications ?? []),
        {
          id: `cl_${Date.now()}`,
          scholarId,
          body: text,
          createdAt: new Date().toISOString(),
        },
      ],
    }
  })
  emit()
}

export function replyToClarification(
  askId: string,
  clarificationId: string,
  reply: string,
) {
  const text = reply.trim()
  if (!text) throw new Error('Write a reply to continue.')
  const question = askQuestions.find((q) => q.id === askId)
  if (!question || question.status !== 'under_review') {
    throw new Error('This question is not open for replies.')
  }
  const learner = getLearner(question.studentId)
  if (!learner || learner.guardianId !== currentGuardian.id) {
    throw new Error('Only this family’s guardian can reply to clarifications.')
  }
  const item = question.clarifications.find((c) => c.id === clarificationId)
  if (!item) throw new Error('Clarification not found.')
  if (item.studentReply) throw new Error('You already replied to this question.')

  askQuestions = askQuestions.map((q) => {
    if (q.id !== askId) return q
    return {
      ...q,
      clarifications: q.clarifications.map((c) =>
        c.id === clarificationId
          ? { ...c, studentReply: text, repliedAt: new Date().toISOString() }
          : c,
      ),
    }
  })
  emit()
}
