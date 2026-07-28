import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  assignHomework,
  getLearner,
  getTeacher,
  markSessionCompleted,
  previousCompletedSession,
  useSession,
} from '../mocks/store'
import { teacherGivenName } from '../lib/format'

type ShareMode = 'none' | 'screen' | 'pdf' | 'whiteboard'
type SidePanel = 'none' | 'prevHw' | 'assignHw'

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
  const location = useLocation()
  const isTeacherView = location.pathname.startsWith('/teacher/')
  const session = useSession(id)
  const teacher = session ? getTeacher(session.teacherId) : undefined
  const learner = session ? getLearner(session.learnerIds[0]!) : undefined
  const allLearners = session
    ? session.learnerIds.map((lid) => getLearner(lid)).filter(Boolean)
    : []
  const prevSession = id ? previousCompletedSession(id) : undefined

  const [shareMode, setShareMode] = useState<ShareMode>('none')
  const [chatOpen, setChatOpen] = useState(false)
  const [sidePanel, setSidePanel] = useState<SidePanel>('none')
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [chatDraft, setChatDraft] = useState('')
  const [hwText, setHwText] = useState('')
  const [hwLearner, setHwLearner] = useState('')
  const [messages, setMessages] = useState([
    { id: 'm1', from: 'teacher' as const, text: 'Assalamu alaikum — can you hear me clearly?' },
    { id: 'm2', from: 'you' as const, text: 'Wa alaikum assalam — yes, ready.' },
  ])

  const page = mushafPages[pageIndex]
  const isSharing = shareMode !== 'none'

  const title = useMemo(() => {
    if (!session || !teacher) return 'Classroom'
    return `${session.title} · ${teacherGivenName(teacher.name)}`
  }, [session, teacher])

  useEffect(() => {
    if (session?.learnerIds[0]) setHwLearner(session.learnerIds[0])
  }, [session?.learnerIds])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setChatOpen(false)
        setSidePanel('none')
      }
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
    navigate(isTeacherView ? `/teacher/sessions/${session!.id}` : `/sessions/${session!.id}`)
  }

  function endSession() {
    markSessionCompleted(session!.id)
    navigate(isTeacherView ? `/teacher/sessions/${session!.id}` : `/sessions/${session!.id}`)
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

  const learnersLabel = allLearners
    .map((l) => (l!.kind === 'self' ? 'You' : l!.name.split(' ')[0]))
    .join(', ')

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-brand-800 text-brand-50">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold tracking-tight text-white">{title}</p>
          <p className="truncate text-xs text-brand-200">
            {learnersLabel} · classroom shell
            {isTeacherView ? ' · teacher' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSidePanel((p) => (p === 'prevHw' ? 'none' : 'prevHw'))}
            className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/15"
          >
            Prev homework
          </button>
          {isTeacherView ? (
            <button
              type="button"
              onClick={() => setSidePanel((p) => (p === 'assignHw' ? 'none' : 'assignHw'))}
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/15"
            >
              Assign homework
            </button>
          ) : null}
          {isTeacherView ? (
            <button
              type="button"
              onClick={endSession}
              className="rounded-xl bg-brass px-3.5 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brass-soft"
            >
              End session
            </button>
          ) : (
            <button
              type="button"
              onClick={leave}
              className="rounded-xl bg-brass px-3.5 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brass-soft"
            >
              Leave
            </button>
          )}
        </div>
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
              <div className="flex shrink-0 gap-2 overflow-x-auto md:w-[190px] md:flex-col">
                <ParticipantTile
                  name={teacher.name}
                  initials={teacher.initials}
                  color={teacher.avatarColor}
                  subtitle="Teacher"
                  compact
                />
                {allLearners.map((l) => (
                  <ParticipantTile
                    key={l!.id}
                    name={l!.name}
                    initials={l!.initials}
                    color={l!.avatarColor}
                    subtitle="On device"
                    compact
                    muted={!micOn}
                    self
                    camOff={!camOn}
                  />
                ))}
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
                name={learner?.name ?? 'Family'}
                initials={learner?.initials ?? 'AR'}
                color={learner?.avatarColor ?? '#245544'}
                subtitle={`${learnersLabel} · same device`}
                muted={!micOn}
                self
                camOff={!camOn}
              />
            </div>
          )}
        </div>

        {sidePanel !== 'none' ? (
          <aside className="flex h-full w-full max-w-[340px] shrink-0 flex-col overflow-hidden border-l border-white/10 bg-brand-700/90">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-base font-bold text-white">
                {sidePanel === 'prevHw' ? 'Previous homework' : 'Assign homework'}
              </h2>
              <button
                type="button"
                onClick={() => setSidePanel('none')}
                className="grid h-8 w-8 place-items-center rounded-lg text-brand-100 hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
              {sidePanel === 'prevHw' ? (
                prevSession?.homework?.length ? (
                  prevSession.homework.map((h) => {
                    const l = getLearner(h.learnerId)
                    return (
                      <div
                        key={h.id}
                        className="rounded-xl bg-brand-800/60 px-3 py-2 ring-1 ring-white/10"
                      >
                        <p className="text-xs font-bold text-brass-soft">
                          {l?.name.split(' ')[0]}
                          {h.mark != null ? ` · ${h.mark}/10` : ''}
                          {h.done ? ' · done' : ' · open'}
                        </p>
                        <p className="mt-1 text-brand-50">{h.text}</p>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-brand-200">No previous homework for this engagement.</p>
                )
              ) : (
                <div className="space-y-3">
                  <select
                    className="w-full rounded-xl bg-brand-800 px-3 py-2 text-brand-50 ring-1 ring-white/15"
                    value={hwLearner}
                    onChange={(e) => setHwLearner(e.target.value)}
                  >
                    {session.learnerIds.map((lid) => (
                      <option key={lid} value={lid}>
                        {getLearner(lid)?.name ?? lid}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className="w-full rounded-xl bg-brand-800 px-3 py-2 text-brand-50 ring-1 ring-white/15"
                    rows={3}
                    value={hwText}
                    onChange={(e) => setHwText(e.target.value)}
                    placeholder="Homework for this learner"
                  />
                  <button
                    type="button"
                    className="w-full rounded-xl bg-brass py-2 text-sm font-semibold text-brand-900"
                    onClick={() => {
                      assignHomework(session.id, { learnerId: hwLearner, text: hwText })
                      setHwText('')
                      setSidePanel('none')
                    }}
                  >
                    Assign
                  </button>
                </div>
              )}
            </div>
          </aside>
        ) : null}

        {chatOpen ? (
          <aside className="flex h-full w-full max-w-[340px] shrink-0 flex-col overflow-hidden border-l border-white/10 bg-brand-700/80">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-base font-bold text-white">Session chat</h2>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-brand-100 hover:bg-white/10"
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
                  {m.text}
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 p-3">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  sendChat()
                }}
              >
                <input
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl bg-brand-800/80 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/15"
                  placeholder="Message…"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-brass px-3 text-xs font-semibold text-brand-900"
                >
                  Send
                </button>
              </form>
            </div>
          </aside>
        ) : null}
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-white/10 px-4 py-3">
        <ControlBtn label={micOn ? 'Mute' : 'Unmute'} onClick={() => setMicOn((v) => !v)} />
        <ControlBtn label={camOn ? 'Cam off' : 'Cam on'} onClick={() => setCamOn((v) => !v)} />
        <ControlBtn label="Chat" onClick={() => setChatOpen((v) => !v)} />
        <ControlBtn label="Screen" onClick={() => toggleShare('screen')} />
        <ControlBtn label="PDF" onClick={() => toggleShare('pdf')} />
        <ControlBtn label="Board" onClick={() => toggleShare('whiteboard')} />
        {!isTeacherView ? <ControlBtn label="Leave" onClick={leave} /> : null}
      </footer>
    </div>
  )
}

function ControlBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-white/10 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
    >
      {label}
    </button>
  )
}

function ParticipantTile({
  name,
  initials,
  color,
  subtitle,
  compact,
  muted,
  self,
  camOff,
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
        'relative overflow-hidden rounded-3xl bg-black/25 ring-1 ring-white/10',
        compact ? 'h-[88px] w-[160px] shrink-0 md:aspect-video md:h-auto md:w-full' : 'min-h-0',
      ].join(' ')}
    >
      <div className="absolute inset-0 grid place-items-center">
        <div
          className="grid h-16 w-16 place-items-center rounded-2xl text-lg font-bold text-white"
          style={{ background: color }}
        >
          {initials}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
        <p className="truncate text-sm font-semibold text-white">
          {name}
          {self ? ' (you)' : ''}
          {muted ? ' · muted' : ''}
          {camOff ? ' · cam off' : ''}
        </p>
        <p className="truncate text-[11px] text-brand-200">{subtitle}</p>
      </div>
    </div>
  )
}

function ScreenShareStage() {
  return (
    <div className="grid h-full place-items-center bg-canvas p-6 text-center text-ink">
      <div>
        <p className="text-xl font-bold tracking-tight">Tajweed notes</p>
        <p className="mt-2 text-sm text-muted">mushaf-notes · shared window</p>
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
  page: (typeof mushafPages)[number] | undefined
  pageIndex: number
  pageCount: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-canvas text-ink">
      <div className="flex items-center justify-between border-b border-line px-4 py-2 text-sm">
        <button type="button" onClick={onPrev} className="font-semibold text-brand-700">
          Prev
        </button>
        <span className="text-muted">
          {pageIndex + 1} / {pageCount}
        </span>
        <button type="button" onClick={onNext} className="font-semibold text-brand-700">
          Next
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm font-semibold text-muted">{page?.title}</p>
        <p className="font-arabic text-2xl leading-loose" dir="rtl" lang="ar">
          {page?.arabic}
        </p>
        <p className="max-w-md text-sm text-muted">{page?.note}</p>
      </div>
    </div>
  )
}

function WhiteboardStage() {
  return (
    <div className="grid h-full place-items-center bg-[#f7f3ea] text-ink">
      <p className="text-sm font-semibold text-muted">Whiteboard placeholder</p>
    </div>
  )
}
