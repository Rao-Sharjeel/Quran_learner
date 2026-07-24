import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getLearner, getTeacher, markSessionCompleted, useSession } from '../mocks/store'
import { SUBJECT_LABELS } from '../types'
import { teacherGivenName } from '../lib/format'

type ShareMode = 'none' | 'screen' | 'pdf' | 'whiteboard'

const mushafPages = [
  {
    title: 'Surah Al-Mulk · 1–3',
    arabic: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    note: 'Focus: madd tabiee on يَدِهِ',
  },
  {
    title: 'Surah Al-Mulk · 4–6',
    arabic: 'الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا',
    note: 'Focus: qalqalah on قَدِير and pause at ayah end',
  },
  {
    title: 'Surah Al-Mulk · 7–9',
    arabic: 'وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ',
    note: 'Focus: shaddah clarity on زَيَّنَّا',
  },
]

export function ClassroomRoomPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const session = useSession(id)
  const teacher = session ? getTeacher(session.teacherId) : undefined
  const learner = session ? getLearner(session.learnerId) : undefined

  const [shareMode, setShareMode] = useState<ShareMode>('none')
  const [chatOpen, setChatOpen] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [chatDraft, setChatDraft] = useState('')
  const [messages, setMessages] = useState([
    { id: 'm1', from: 'teacher' as const, text: 'Assalamu alaikum — can you hear me clearly?' },
    { id: 'm2', from: 'you' as const, text: 'Wa alaikum assalam — yes, ready.' },
  ])

  const page = mushafPages[pageIndex]
  const isSharing = shareMode !== 'none'

  const title = useMemo(() => {
    if (!session || !teacher) return 'Classroom'
    const who = learner
      ? learner.kind === 'self'
        ? `${learner.name.split(' ')[0]} · `
        : `${learner.name.split(' ')[0]} · `
      : ''
    return `${who}${SUBJECT_LABELS[session.subject]} with ${teacherGivenName(teacher.name)}`
  }, [session, teacher, learner])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setChatOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!session || !teacher) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-800 px-4 text-brand-50">
        <div className="rounded-2xl border border-white/10 bg-brand-700/60 p-8 text-center">
          <p className="font-semibold">Session not found</p>
          <Link to="/sessions" className="mt-3 inline-block text-sm font-semibold text-brass-soft">
            Back to sessions
          </Link>
        </div>
      </div>
    )
  }

  function leave() {
    navigate(`/sessions/${session!.id}`)
  }

  function endSession() {
    markSessionCompleted(session!.id)
    navigate(`/sessions/${session!.id}`)
  }

  function sendChat() {
    const text = chatDraft.trim()
    if (!text) return
    setMessages((prev) => [...prev, { id: `m_${Date.now()}`, from: 'you', text }])
    setChatDraft('')
  }

  function toggleShare(mode: Exclude<ShareMode, 'none'>) {
    setShareMode((current) => (current === mode ? 'none' : mode))
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-brand-800 text-brand-50">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold tracking-tight text-white">{title}</p>
          <p className="text-xs text-brand-200">Classroom shell · placeholders only</p>
        </div>
        <button
          type="button"
          onClick={endSession}
          className="rounded-xl bg-brass px-3.5 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brass-soft"
        >
          End session
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
          {isSharing ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
              <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-3xl bg-black/30 ring-1 ring-white/10">
                {shareMode === 'screen' ? <ScreenShareStage /> : null}
                {shareMode === 'pdf' ? (
                  <PdfStage
                    page={page}
                    pageIndex={pageIndex}
                    pageCount={mushafPages.length}
                    onPrev={() => setPageIndex((i) => Math.max(0, i - 1))}
                    onNext={() =>
                      setPageIndex((i) => Math.min(mushafPages.length - 1, i + 1))
                    }
                  />
                ) : null}
                {shareMode === 'whiteboard' ? <WhiteboardStage /> : null}
              </div>

              <div className="flex shrink-0 gap-2 overflow-x-auto md:w-[190px] md:flex-col md:overflow-y-auto md:overflow-x-hidden">
                <ParticipantTile
                  name={teacher.name}
                  initials={teacher.initials}
                  color={teacher.avatarColor}
                  subtitle="Teacher"
                  compact
                />
                <ParticipantTile
                  name={learner?.name ?? 'You'}
                  initials={learner?.initials ?? 'AR'}
                  color={learner?.avatarColor ?? '#245544'}
                  subtitle={camOn ? 'Camera on' : 'Camera off'}
                  compact
                  muted={!micOn}
                  self
                  camOff={!camOn}
                />
              </div>
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 gap-3 sm:grid-cols-2">
              <ParticipantTile
                name={teacher.name}
                initials={teacher.initials}
                color={teacher.avatarColor}
                subtitle="Teacher"
              />
              <ParticipantTile
                name={learner?.name ?? 'You'}
                initials={learner?.initials ?? 'AR'}
                color={learner?.avatarColor ?? '#245544'}
                subtitle={camOn ? 'Camera on' : 'Camera off'}
                muted={!micOn}
                self
                camOff={!camOn}
              />
            </div>
          )}
        </div>

        {chatOpen ? (
          <aside className="flex h-full w-full max-w-[340px] shrink-0 flex-col overflow-hidden border-l border-white/10 bg-brand-700/80">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <h2 className="text-base font-bold tracking-tight text-white">Session chat</h2>
                <p className="text-xs text-brand-200">Local mock — not synced yet</p>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-brand-100 transition hover:bg-white/10 hover:text-white"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={[
                    'max-w-[90%] rounded-2xl px-3.5 py-2 text-sm',
                    m.from === 'you'
                      ? 'ml-auto bg-brass text-brand-800'
                      : 'bg-brand-800/70 text-brand-50',
                  ].join(' ')}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                    {m.from === 'you' ? 'You' : teacherGivenName(teacher.name)}
                  </p>
                  <p className="mt-0.5">{m.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-white/10 p-3">
              <input
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    sendChat()
                  }
                }}
                placeholder="Write a message"
                className="w-full rounded-xl border border-white/10 bg-brand-800/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-brand-200 focus:border-brass/50 focus:ring-2 focus:ring-brass/30"
              />
              <button
                type="button"
                onClick={sendChat}
                className="rounded-xl bg-brass px-4 text-sm font-semibold text-brand-800 transition hover:bg-brass-soft"
              >
                Send
              </button>
            </div>
          </aside>
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-white/10 px-3 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2">
          <ControlButton
            active={micOn}
            danger={!micOn}
            label={micOn ? 'Mute' : 'Unmute'}
            onClick={() => setMicOn((v) => !v)}
          >
            {micOn ? 'Mic' : 'Mic off'}
          </ControlButton>
          <ControlButton
            active={camOn}
            danger={!camOn}
            label={camOn ? 'Turn off camera' : 'Turn on camera'}
            onClick={() => setCamOn((v) => !v)}
          >
            {camOn ? 'Cam' : 'Cam off'}
          </ControlButton>

          <span className="mx-1 hidden h-6 w-px bg-white/15 sm:block" aria-hidden="true" />

          <ControlButton
            active={shareMode === 'screen'}
            label="Share screen"
            onClick={() => toggleShare('screen')}
          >
            Share
          </ControlButton>
          <ControlButton
            active={shareMode === 'pdf'}
            label="Present mushaf PDF"
            onClick={() => toggleShare('pdf')}
          >
            PDF
          </ControlButton>
          <ControlButton
            active={shareMode === 'whiteboard'}
            label="Open whiteboard"
            onClick={() => toggleShare('whiteboard')}
          >
            Board
          </ControlButton>
          <ControlButton
            active={chatOpen}
            label="Toggle chat"
            onClick={() => setChatOpen((v) => !v)}
          >
            Chat
          </ControlButton>

          <span className="mx-1 hidden h-6 w-px bg-white/15 sm:block" aria-hidden="true" />

          <button
            type="button"
            onClick={leave}
            className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Leave
          </button>
        </div>
      </footer>
    </div>
  )
}

function ControlButton({
  children,
  label,
  active,
  danger,
  onClick,
}: {
  children: string
  label: string
  active?: boolean
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={[
        'rounded-xl px-4 py-2.5 text-sm font-medium transition',
        danger
          ? 'bg-red-700/90 text-white hover:bg-red-600'
          : active
            ? 'bg-brass text-brand-800 hover:bg-brass-soft'
            : 'bg-white/10 text-brand-50 hover:bg-white/15',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function ParticipantTile({
  name,
  initials,
  color,
  subtitle,
  compact = false,
  muted = false,
  self = false,
  camOff = false,
}: {
  name: string
  initials: string
  color: string
  subtitle: string
  compact?: boolean
  muted?: boolean
  self?: boolean
  camOff?: boolean
}) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-3xl bg-black/35 ring-1 ring-white/10',
        compact
          ? 'h-[110px] w-[150px] shrink-0 md:aspect-[4/3] md:h-auto md:w-full'
          : 'min-h-[220px]',
      ].join(' ')}
    >
      <div className="absolute inset-0 login-pattern opacity-35" />
      <div className="relative grid h-full place-items-center p-4">
        {camOff && self ? (
          <div className="text-center">
            <div
              className="mx-auto grid place-items-center rounded-2xl font-semibold text-white"
              style={{
                background: color,
                width: compact ? 48 : 80,
                height: compact ? 48 : 80,
                fontSize: compact ? 14 : 24,
              }}
            >
              {initials}
            </div>
            {!compact ? <p className="mt-3 text-sm text-brand-100">Camera is off</p> : null}
          </div>
        ) : (
          <div
            className="grid place-items-center rounded-2xl font-semibold text-white"
            style={{
              background: color,
              width: compact ? 52 : 88,
              height: compact ? 52 : 88,
              fontSize: compact ? 16 : 28,
            }}
          >
            {initials}
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-brand-800/90 to-transparent p-3">
        <div className="min-w-0">
          <p className={`truncate font-medium text-white ${compact ? 'text-xs' : 'text-sm'}`}>
            {name}
          </p>
          {!compact ? <p className="text-xs text-brand-200">{subtitle}</p> : null}
        </div>
        {muted ? (
          <span className="rounded-lg bg-red-700/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            Muted
          </span>
        ) : null}
      </div>
    </div>
  )
}

function ScreenShareStage() {
  return (
    <div className="flex h-full min-h-[280px] flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-xs text-brand-200">
        <span>Presenting · Screen</span>
        <span className="rounded-lg bg-brass/20 px-2 py-0.5 text-brass-soft">Demo share</span>
      </div>
      <div className="relative flex flex-1 items-center justify-center bg-brand-800/80 p-6">
        <div className="w-full max-w-3xl panel text-ink shadow-xl">
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
            <span className="font-semibold text-brand-800">Ilm</span>
            <span className="text-xs text-muted">mushaf-notes · shared window</span>
          </div>
          <div className="space-y-3 p-6 sm:p-8">
            <p className="text-xl font-bold tracking-tight text-ink">Tajweed notes</p>
            <p className="text-sm leading-relaxed text-muted">
              Screen-share placeholder. The shared window fills this stage; participant videos stay
              in the filmstrip beside it.
            </p>
            <div className="h-2 w-2/3 rounded bg-brand-100" />
            <div className="h-2 w-1/2 rounded bg-brand-100" />
            <div className="h-2 w-3/4 rounded bg-brand-100" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PdfStage({
  page,
  pageIndex,
  pageCount,
  onPrev,
  onNext,
}: {
  page: (typeof mushafPages)[number]
  pageIndex: number
  pageCount: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex h-full min-h-[280px] flex-col bg-canvas text-ink">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Mushaf PDF</p>
          <p className="text-lg font-bold tracking-tight">{page.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pageIndex === 0}
            onClick={onPrev}
            className="rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-muted">
            {pageIndex + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={pageIndex === pageCount - 1}
            onClick={onNext}
            className="rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center bg-brand-50/50 px-6 py-8 text-center">
        <p
          className="max-w-2xl font-arabic text-3xl leading-loose text-brand-800 sm:text-4xl"
          dir="rtl"
          lang="ar"
        >
          {page.arabic}
        </p>
        <p className="mt-6 rounded-xl bg-brass-soft/80 px-3 py-2 text-sm text-brand-800">
          Highlight · {page.note}
        </p>
      </div>
    </div>
  )
}

function WhiteboardStage() {
  return (
    <div className="relative flex h-full min-h-[280px] flex-col bg-[#f3efe6] text-ink">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgb(19 32 28 / 0.06) 1px, transparent 1px), linear-gradient(90deg, rgb(19 32 28 / 0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="relative flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="text-2xl font-extrabold tracking-tight text-brand-800">Whiteboard</p>
        <p className="mt-2 max-w-md text-sm text-muted">
          Drawing tools arrive in Phase 2. Videos stay in the filmstrip while this is presented.
        </p>
        <svg
          className="mt-8 h-24 w-48 text-brand-600"
          viewBox="0 0 200 100"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 70 C40 20, 80 20, 110 55 S170 90, 190 40"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}
