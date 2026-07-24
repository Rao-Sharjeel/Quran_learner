import { useSyncExternalStore } from 'react'
import type {
  AskQuestion,
  HomeworkAudioComment,
  HomeworkItem,
  LearnerProfile,
  LibraryResource,
  ReadingBookmark,
  Session,
  SubjectId,
} from '../types'
import {
  currentGuardian,
  currentStudent,
  learnerInitials,
  nextLearnerColor,
  seedAskQuestions,
  seedLearners,
  seedReadingBookmarks,
  seedSessions,
  teacherReviews,
  teachers,
} from './data'
import { seedLibrary } from './library'

type Listener = () => void

let sessions: Session[] = [...seedSessions]
let askQuestions: AskQuestion[] = structuredClone(seedAskQuestions)
let learners: LearnerProfile[] = structuredClone(seedLearners)
let readingBookmarks: ReadingBookmark[] = structuredClone(seedReadingBookmarks)
/** Demo: which forum scholar is acting in private rooms */
let activeScholarId = 'tch_1'

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

export function useSessions(filter?: { learnerId?: string | null }) {
  const all = useSyncExternalStore(subscribe, getSessionsSnapshot, getSessionsSnapshot)
  if (filter?.learnerId === undefined) return all
  if (!filter.learnerId) return []
  return all.filter((s) => s.learnerId === filter.learnerId)
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

export function getTeacher(id: string) {
  return teachers.find((t) => t.id === id)
}

export function listTeachers() {
  return teachers
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
      s.learnerId === id && (s.status === 'pending' || s.status === 'accepted'),
  )
  if (blocking) {
    return {
      ok: false,
      reason:
        'This kid has upcoming or pending sessions. Cancel or complete them before removing.',
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

export function createBookingRequest(input: {
  teacherId: string
  slotId: string
  subject: SubjectId
  studentNote?: string
  learnerId: string
}) {
  const teacher = getTeacher(input.teacherId)
  if (!teacher) throw new Error('Teacher not found')
  const slot = teacher.availability.find((s) => s.id === input.slotId)
  if (!slot) throw new Error('Slot not found')

  if (!learners.some((l) => l.id === input.learnerId)) {
    throw new Error('Select who this session is for')
  }

  const session: Session = {
    id: `ses_${Date.now()}`,
    learnerId: input.learnerId,
    teacherId: teacher.id,
    slotLabel: slot.label,
    startsAt: slot.startsAt,
    status: 'pending',
    subject: input.subject,
    studentNote: input.studentNote?.trim() || undefined,
  }
  sessions = [session, ...sessions]
  emit()
  return session
}

export function markSessionCompleted(id: string) {
  sessions = sessions.map((s) =>
    s.id === id ? { ...s, status: 'completed' as const } : s,
  )
  emit()
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
    .filter((s) => s.learnerId === learnerId && s.homework)
    .flatMap((s) => s.homework ?? [])
    .filter((h) => !h.done).length
}

export function underReviewAskCount(learnerId: string) {
  return askQuestions.filter(
    (q) => q.studentId === learnerId && q.status === 'under_review',
  ).length
}

export function joinableSessions() {
  return sessions
    .filter((s) => s.status === 'accepted')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
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
