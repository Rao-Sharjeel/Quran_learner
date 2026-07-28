export type BadgeId = 'interviewed' | 'ijazah' | 'institution' | 'forum_scholar'

export type SubjectId =
  | 'quran_reading'
  | 'tajweed'
  | 'hifz'
  | 'tafsir'
  | 'hadith'
  | 'aqidah'
  | 'fiqh'
  | 'arabic'
  | 'seerah'

export interface Teacher {
  id: string
  name: string
  headline: string
  bio: string
  subjects: SubjectId[]
  languages: string[]
  rateUsd: number
  /** Regular session length in minutes */
  durationMinutes: number
  timezone: string
  rating: number
  reviewCount: number
  badges: BadgeId[]
  avatarColor: string
  initials: string
  /** Recurring weekly availability (not one-off dates) */
  availability: WeeklyAvailabilitySlot[]
}

/** Curated group / self-paced style courses (Phase 1 mock) */
export interface Course {
  id: string
  title: string
  subject: SubjectId
  teacherId: string
  level: 'beginner' | 'intermediate' | 'advanced'
  weeks: number
  students: number
  /** Highlight on home “New” slide */
  isNew?: boolean
  /** Highlight on home “Popular” slide */
  isPopular?: boolean
  accentColor: string
}

/** Recurring weekly slot on a teacher's calendar (0 = Sunday) */
export interface WeeklyAvailabilitySlot {
  id: string
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Local time HH:mm (24h) */
  startTime: string
  label: string
}

/** @deprecated Use WeeklyAvailabilitySlot */
export type AvailabilitySlot = WeeklyAvailabilitySlot

export type EngagementStatus =
  | 'pending'
  | 'intro_scheduled'
  | 'awaiting_payment'
  | 'active'
  | 'ended'
  | 'declined'
  /** Guardian chose not to continue after intro / before paying */
  | 'not_hired'

/** Guardian ↔ teacher relationship with recurring weekly slots */
export interface TeachingEngagement {
  id: string
  guardianId: string
  teacherId: string
  subject: SubjectId
  learnerIds: string[]
  weeklySlotIds: string[]
  status: EngagementStatus
  /** Topic suggestion from guardian at request time */
  titleSuggestion?: string
  studentNote?: string
  teacherMessage?: string
  /** Free intro already consumed for this guardian+teacher (incl. prior ended engagements) */
  introUsed: boolean
  prepaidSessionCredits: number
  endedAt?: string
  createdAt: string
}

export type SessionKind = 'intro' | 'regular'
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'
export type PaymentStatus = 'free' | 'paid' | 'unpaid' | 'pending_payment'

export interface HomeworkItem {
  id: string
  learnerId: string
  text: string
  done: boolean
  /** 0–10 teacher mark */
  mark?: number
  /** Student should upload a recording for this task */
  requiresAudio?: boolean
  submission?: HomeworkAudioSubmission
  /** Teacher (and student reply) comments anchored to the recording timeline */
  comments?: HomeworkAudioComment[]
}

export type NotificationKind =
  | 'engagement_accepted'
  | 'payment_due'
  | 'session_reminder'
  | 'hire_success'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  createdAt: string
  read: boolean
  href?: string
}

export type HomeworkCommentKind = 'text' | 'audio'

export interface HomeworkAudioSubmission {
  id: string
  uploadedAt: string
  fileName: string
  /** Object URL or demo CDN URL */
  audioUrl: string
  durationSeconds: number
}

export interface HomeworkAudioComment {
  id: string
  authorRole: 'teacher' | 'student'
  authorId: string
  authorName: string
  /** Seconds into the student recording */
  atSeconds: number
  kind: HomeworkCommentKind
  body?: string
  audioUrl?: string
  audioDurationSeconds?: number
  createdAt: string
}

/** Readable mock transcript section (Warm-up / Lesson / Closing, etc.) */
export interface SessionTranscriptSection {
  heading: string
  body: string
}

export interface Session {
  id: string
  engagementId: string
  teacherId: string
  /** One or more family learners on the same device */
  learnerIds: string[]
  title: string
  subject: SubjectId
  startsAt: string
  durationMinutes: number
  kind: SessionKind
  status: SessionStatus
  paymentStatus: PaymentStatus
  /** Weekly slot id this occurrence came from (if any) */
  weeklySlotId?: string
  studentNote?: string
  sharedNotes?: string
  privateNotesGuardian?: string
  privateNotesTeacher?: string
  homework?: HomeworkItem[]
  transcript?: SessionTranscriptSection[]
  reviewSubmitted?: boolean
}

export interface TeacherReview {
  id: string
  teacherId: string
  studentName: string
  rating: number
  body: string
  dateLabel: string
}

/** Adult account holder — can also learn as themselves */
export interface GuardianProfile {
  id: string
  name: string
  email: string
}

/** @deprecated Prefer GuardianProfile */
export type StudentProfile = GuardianProfile

/**
 * Anyone who takes lessons: the parent (`self`) or a child (`kid`).
 * Sessions / Ask / progress attach to a learner id.
 */
export interface LearnerProfile {
  id: string
  guardianId: string
  kind: 'self' | 'kid'
  name: string
  age?: number
  gradeLabel?: string
  avatarColor: string
  initials: string
  hifzSummary: string
  readingMinutesWeek: number
  lastReadingTitle?: string
  openAskCount: number
}

/** @deprecated Prefer LearnerProfile */
export type KidProfile = LearnerProfile

export type AskStatus = 'under_review' | 'published'

export interface AskPrivateMessage {
  id: string
  scholarId: string
  body: string
  createdAt: string
}

export interface AskDraft {
  id: string
  body: string
  authorId: string
  agreeIds: string[]
  createdAt: string
}

export interface AskPublicComment {
  id: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
}

/** Scholar asks the student for more context while the thread is under review */
export interface AskClarification {
  id: string
  scholarId: string
  body: string
  createdAt: string
  studentReply?: string
  repliedAt?: string
}

export interface AskQuestion {
  id: string
  title: string
  body: string
  topic: SubjectId
  studentId: string
  studentName: string
  /** When true, public UI hides the student’s name */
  anonymous: boolean
  status: AskStatus
  createdAt: string
  privateMessages: AskPrivateMessage[]
  clarifications: AskClarification[]
  draft?: AskDraft
  /** Set when published — the endorsed answer shown publicly */
  publishedAnswer?: string
  publishedByIds?: string[]
  publishedAt?: string
  /** Student follow-ups on the public thread (published only) */
  comments: AskPublicComment[]
}

export const SUBJECT_LABELS: Record<SubjectId, string> = {
  quran_reading: 'Quran reading',
  tajweed: 'Tajweed',
  hifz: 'Hifz',
  tafsir: 'Tafsir',
  hadith: 'Hadith',
  aqidah: 'Aqidah',
  fiqh: 'Fiqh',
  arabic: 'Arabic',
  seerah: 'Seerah',
}

export const BADGE_LABELS: Record<BadgeId, string> = {
  interviewed: 'Interviewed',
  ijazah: 'Ijazah',
  institution: 'Institution',
  forum_scholar: 'Forum scholar',
}

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  free: 'Free intro',
  paid: 'Paid',
  unpaid: 'Unpaid',
  pending_payment: 'Payment pending',
}

export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, string> = {
  pending: 'Pending review',
  intro_scheduled: 'Intro scheduled',
  awaiting_payment: 'Awaiting payment',
  active: 'Active',
  ended: 'Ended',
  declined: 'Declined',
  not_hired: 'Not hired',
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export const INTRO_DURATION_MINUTES = 15
/** Minimum sessions in a prepaid package */
export const PACKAGE_SESSION_COUNT = 4
export const CALENDAR_HORIZON_DAYS = 60

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void'

export interface InvoiceLine {
  description: string
  quantity: number
  unitAmountUsd: number
}

export interface Invoice {
  id: string
  engagementId: string
  teacherId: string
  status: InvoiceStatus
  /** Sessions purchased — always >= PACKAGE_SESSION_COUNT */
  sessionCount: number
  lines: InvoiceLine[]
  subtotalUsd: number
  totalUsd: number
  currency: 'USD'
  createdAt: string
  paidAt?: string
  invoiceNumber: string
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  paid: 'Paid',
  void: 'Void',
}

export const ASK_STATUS_LABELS: Record<AskStatus, string> = {
  under_review: 'Under review',
  published: 'Published',
}

export type LibraryKind = 'book' | 'article' | 'essay' | 'reference'

export type LibraryTopic =
  | SubjectId
  | 'adab'
  | 'spirituality'
  | 'general'

export type LibraryFormat = 'text' | 'pdf'

export interface LibraryPage {
  heading?: string
  body: string
}

/** Scanned / PDF books — usually Internet Archive BookReader embeds */
export interface LibraryPdfSource {
  provider: 'archive' | 'url'
  /** Internet Archive item id, e.g. MaktubatRabbaniUrdu */
  archiveId?: string
  /** File within the item, e.g. Maktubat-Rabbani-1 */
  archiveFile?: string
  /** Leaf index as on archive.org (/page/n43) */
  startPage?: number
  mode?: '1up' | '2up'
  pageProgression?: 'ltr' | 'rtl'
  pageCount?: number
  /** Direct PDF URL when not using Archive */
  pdfUrl?: string
  /** Public details page for attribution / open externally */
  sourceUrl?: string
}

export interface LibraryResource {
  id: string
  title: string
  author: string
  kind: LibraryKind
  topic: LibraryTopic
  summary: string
  language: string
  readingMinutes: number
  coverColor: string
  /** Optional cover art under /public (falls back to coverColor) */
  coverImage?: string
  format: LibraryFormat
  /** Short text materials */
  pages?: LibraryPage[]
  /** PDF / scanned book reader */
  pdf?: LibraryPdfSource
}

/** Per-learner bookmark — who is reading what, and how far */
export interface ReadingBookmark {
  id: string
  resourceId: string
  learnerId: string
  /** 0–100 through the material */
  progressPercent: number
  minutesSpent: number
  updatedAt: string
}

export const LIBRARY_KIND_LABELS: Record<LibraryKind, string> = {
  book: 'Book',
  article: 'Article',
  essay: 'Essay',
  reference: 'Reference',
}

export const LIBRARY_TOPIC_LABELS: Record<LibraryTopic, string> = {
  ...SUBJECT_LABELS,
  adab: 'Adab',
  spirituality: 'Spirituality',
  general: 'General',
}

export function libraryEmbedUrl(pdf: LibraryPdfSource): string | undefined {
  if (pdf.provider === 'url' && pdf.pdfUrl) return pdf.pdfUrl
  if (pdf.provider === 'archive' && pdf.archiveId) {
    const file = pdf.archiveFile ? `/${pdf.archiveFile}` : ''
    const page = pdf.startPage != null ? `n${pdf.startPage}` : 'n0'
    const mode = pdf.mode ?? '2up'
    return `https://archive.org/embed/${pdf.archiveId}${file}#page/${page}/mode/${mode}`
  }
  return undefined
}
