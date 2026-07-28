import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  addHomeworkAudioComment,
  getGuardian,
  getHomeworkItem,
  getLearner,
  getTeacher,
  toggleHomeworkDone,
  uploadHomeworkAudio,
  useSession,
} from '../mocks/store'
import type { HomeworkAudioComment } from '../types'
import { Button, ButtonLink } from '../components/Button'

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const tenths = Math.floor((seconds % 1) * 10)
  return `${m}:${String(s).padStart(2, '0')}.${tenths}`
}

function groupComments(comments: HomeworkAudioComment[]) {
  const map = new Map<number, HomeworkAudioComment[]>()
  for (const c of [...comments].sort((a, b) => a.atSeconds - b.atSeconds)) {
    const key = Math.round(c.atSeconds * 10) / 10
    const list = map.get(key) ?? []
    list.push(c)
    map.set(key, list)
  }
  return [...map.entries()].map(([at, items]) => ({ at, items }))
}

/**
 * Homework audio practice: student uploads a recording;
 * teacher listens and leaves multiple text/audio notes on any timestamp.
 */
export function HomeworkAudioPage() {
  const { id: sessionId, hwId } = useParams()
  const [params, setParams] = useSearchParams()
  const session = useSession(sessionId)
  const item = sessionId && hwId ? getHomeworkItem(sessionId, hwId) : undefined
  const teacher = session ? getTeacher(session.teacherId) : undefined
  const hwItem = session && hwId ? getHomeworkItem(session.id, hwId) : undefined
  const learner = session
    ? getLearner(hwItem?.learnerId ?? session.learnerIds[0]!)
    : undefined
  const guardian = getGuardian()

  const mode = params.get('as') === 'teacher' ? 'teacher' : 'student'
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const commentRecorderRef = useRef<MediaRecorder | null>(null)
  const commentChunksRef = useRef<Blob[]>([])

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(item?.submission?.durationSeconds ?? 0)
  const [playing, setPlaying] = useState(false)
  const [pinTime, setPinTime] = useState<number | null>(null)
  const [textDraft, setTextDraft] = useState('')
  const [error, setError] = useState('')
  const [uploadBusy, setUploadBusy] = useState(false)
  const [recordingComment, setRecordingComment] = useState(false)
  const [commentAudioUrl, setCommentAudioUrl] = useState<string | null>(null)
  const [filterAt, setFilterAt] = useState<number | null>(null)

  const submission = item?.submission
  const comments = item?.comments ?? []
  const groups = useMemo(() => groupComments(comments), [comments])

  useEffect(() => {
    setDuration(submission?.durationSeconds ?? 0)
    setCurrentTime(0)
    setPlaying(false)
    setPinTime(null)
    setFilterAt(null)
  }, [submission?.id, submission?.durationSeconds])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTime = () => setCurrentTime(el.currentTime)
    const onMeta = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) setDuration(el.duration)
    }
    const onEnded = () => setPlaying(false)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('ended', onEnded)
    }
  }, [submission?.audioUrl])

  if (!session || !item || !teacher || !learner) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">Homework not found</p>
        <ButtonLink to="/sessions" variant="secondary" className="mt-4">
          Back to sessions
        </ButtonLink>
      </div>
    )
  }

  if (!item.requiresAudio) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">This task doesn’t use audio</p>
        <ButtonLink to={`/sessions/${session.id}`} variant="secondary" className="mt-4">
          Back to session
        </ButtonLink>
      </div>
    )
  }

  const activePin = pinTime ?? currentTime
  const visibleComments =
    filterAt == null
      ? comments
      : comments.filter((c) => Math.abs(c.atSeconds - filterAt) < 0.15)

  function setMode(next: 'student' | 'teacher') {
    const p = new URLSearchParams(params)
    if (next === 'teacher') p.set('as', 'teacher')
    else p.delete('as')
    setParams(p)
  }

  function seekTo(t: number) {
    const el = audioRef.current
    if (!el) return
    el.currentTime = t
    setCurrentTime(t)
  }

  function togglePlay() {
    const el = audioRef.current
    if (!el) return
    if (el.paused) {
      void el.play()
      setPlaying(true)
    } else {
      el.pause()
      setPlaying(false)
    }
  }

  async function onUploadFile(file: File | null) {
    if (!file || !sessionId || !hwId) return
    setError('')
    setUploadBusy(true)
    try {
      const url = URL.createObjectURL(file)
      const dur = await probeDuration(url)
      uploadHomeworkAudio(sessionId, hwId, {
        audioUrl: url,
        fileName: file.name,
        durationSeconds: dur || 60,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploadBusy(false)
    }
  }

  function pinHere() {
    setPinTime(Number(currentTime.toFixed(1)))
    setFilterAt(Number(currentTime.toFixed(1)))
  }

  function submitTextComment(e: FormEvent) {
    e.preventDefault()
    if (!sessionId || !hwId) return
    if (mode === 'teacher' && !teacher) {
      setError('Teacher not found')
      return
    }
    const authorId = mode === 'teacher' ? teacher!.id : guardian.id
    const authorName = mode === 'teacher' ? teacher!.name : guardian.name
    setError('')
    try {
      addHomeworkAudioComment(sessionId, hwId, {
        authorRole: mode === 'teacher' ? 'teacher' : 'student',
        authorId,
        authorName,
        atSeconds: activePin,
        kind: 'text',
        body: textDraft,
      })
      setTextDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add comment')
    }
  }

  async function startCommentRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      commentChunksRef.current = []
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) commentChunksRef.current.push(ev.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(commentChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setCommentAudioUrl(url)
      }
      commentRecorderRef.current = recorder
      recorder.start()
      setRecordingComment(true)
    } catch {
      setError('Microphone permission is needed for audio comments.')
    }
  }

  function stopCommentRecording() {
    commentRecorderRef.current?.stop()
    setRecordingComment(false)
  }

  function submitAudioComment() {
    if (!sessionId || !hwId || !commentAudioUrl) return
    if (mode === 'teacher' && !teacher) {
      setError('Teacher not found')
      return
    }
    const authorId = mode === 'teacher' ? teacher!.id : guardian.id
    const authorName = mode === 'teacher' ? teacher!.name : guardian.name
    setError('')
    try {
      addHomeworkAudioComment(sessionId, hwId, {
        authorRole: mode === 'teacher' ? 'teacher' : 'student',
        authorId,
        authorName,
        atSeconds: activePin,
        kind: 'audio',
        body: textDraft.trim() || undefined,
        audioUrl: commentAudioUrl,
        audioDurationSeconds: 6,
      })
      setCommentAudioUrl(null)
      setTextDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add audio comment')
    }
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="space-y-5 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/sessions/${session.id}`}
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          ← Session
        </Link>
        <div className="flex rounded-2xl bg-surface p-1 ring-1 ring-line">
          <button
            type="button"
            onClick={() => setMode('student')}
            className={[
              'rounded-xl px-3 py-1.5 text-xs font-bold transition',
              mode === 'student' ? 'bg-canvas text-ink shadow-sm' : 'text-muted',
            ].join(' ')}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setMode('teacher')}
            className={[
              'rounded-xl px-3 py-1.5 text-xs font-bold transition',
              mode === 'teacher' ? 'bg-brand-700 text-white shadow-sm' : 'text-muted',
            ].join(' ')}
          >
            Teacher review (demo)
          </button>
        </div>
      </div>

      <header className="panel p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          Audio homework · {learner.kind === 'self' ? 'You' : learner.name}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {item.text}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Teacher {teacher.name} can leave several notes on the same moment — text or spoken.
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.done}
            onChange={() => toggleHomeworkDone(session.id, item.id)}
            className="accent-brand-700"
          />
          <span className="font-medium text-ink">Mark homework done</span>
        </label>
      </header>

      {mode === 'student' ? (
        <section className="panel p-4 sm:p-5">
          <h2 className="text-sm font-bold tracking-tight text-ink">Upload recording</h2>
          <p className="mt-1 text-xs text-muted">
            Upload a recitation file (mp3, wav, m4a). Replacing it clears previous teacher notes.
          </p>
          <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-6 text-center transition hover:bg-brand-50">
            <span className="text-sm font-semibold text-brand-800">
              {uploadBusy ? 'Preparing…' : 'Choose audio file'}
            </span>
            <span className="mt-1 text-xs text-muted">Or drop a recording from your phone</span>
            <input
              type="file"
              accept="audio/*"
              className="sr-only"
              disabled={uploadBusy}
              onChange={(e) => void onUploadFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {submission ? (
            <p className="mt-3 text-xs text-muted">
              Current file: <span className="font-semibold text-ink">{submission.fileName}</span> ·{' '}
              {formatClock(submission.durationSeconds)}
            </p>
          ) : null}
        </section>
      ) : null}

      {!submission ? (
        <div className="rounded-2xl border border-dashed border-line bg-canvas/70 px-5 py-10 text-center">
          <p className="font-semibold text-ink">No recording yet</p>
          <p className="mt-1 text-sm text-muted">
            {mode === 'student'
              ? 'Upload audio above so your teacher can leave timestamped feedback.'
              : 'Waiting for the student to upload a recording.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="panel overflow-hidden p-4 sm:p-5">
            <audio ref={audioRef} src={submission.audioUrl} preload="metadata" />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-700 text-sm font-bold text-white shadow-md shadow-brand-700/25"
              >
                {playing ? '❚❚' : '▶'}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between text-xs font-semibold tabular-nums text-muted">
                  <span>{formatClock(currentTime)}</span>
                  <span>{formatClock(duration)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  value={Math.min(currentTime, duration || 0)}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="mt-1 w-full accent-brand-700"
                />
                {/* Comment markers */}
                <div className="relative mt-2 h-6">
                  <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface" />
                  <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-500/40"
                    style={{ width: `${progressPct}%` }}
                  />
                  {groups.map(({ at, items }) => (
                    <button
                      key={at}
                      type="button"
                      title={`${formatClock(at)} · ${items.length} note${items.length === 1 ? '' : 's'}`}
                      onClick={() => {
                        seekTo(at)
                        setFilterAt(at)
                        setPinTime(at)
                      }}
                      className={[
                        'absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-canvas transition',
                        filterAt != null && Math.abs(filterAt - at) < 0.15
                          ? 'bg-brass scale-125'
                          : items.length > 1
                            ? 'bg-brand-800'
                            : 'bg-brand-600',
                      ].join(' ')}
                      style={{ left: `${duration ? (at / duration) * 100 : 0}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {mode === 'teacher' || comments.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <Button type="button" variant="secondary" className="!py-1.5 !text-xs" onClick={pinHere}>
                  Pin at {formatClock(currentTime)}
                </Button>
                <span className="text-xs text-muted">
                  Active pin:{' '}
                  <span className="font-bold tabular-nums text-ink">{formatClock(activePin)}</span>
                </span>
                {filterAt != null ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-brand-700"
                    onClick={() => setFilterAt(null)}
                  >
                    Show all notes
                  </button>
                ) : null}
              </div>
            ) : null}

            {(mode === 'teacher' || mode === 'student') && submission ? (
              <div className="mt-4 space-y-3 rounded-2xl bg-surface/80 p-3 ring-1 ring-line">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  {mode === 'teacher' ? 'Add teacher note' : 'Add a reply'} at{' '}
                  <span className="tabular-nums text-ink">{formatClock(activePin)}</span>
                </p>
                <form onSubmit={submitTextComment} className="space-y-2">
                  <textarea
                    value={textDraft}
                    onChange={(e) => setTextDraft(e.target.value)}
                    rows={2}
                    placeholder="Written comment (you can add several on the same time)…"
                    className="w-full resize-y rounded-2xl bg-canvas px-3 py-2 text-sm outline-none ring-1 ring-line focus:ring-2 focus:ring-brand-500/30"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" className="!py-1.5 !text-xs">
                      Post text note
                    </Button>
                    {!recordingComment ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="!py-1.5 !text-xs"
                        onClick={() => void startCommentRecording()}
                      >
                        Record audio note
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        className="!py-1.5 !text-xs !text-red-700"
                        onClick={stopCommentRecording}
                      >
                        Stop recording
                      </Button>
                    )}
                    {commentAudioUrl ? (
                      <Button
                        type="button"
                        className="!bg-brass !py-1.5 !text-xs !text-brand-900 !shadow-none"
                        onClick={submitAudioComment}
                      >
                        Post audio note
                      </Button>
                    ) : null}
                  </div>
                </form>
                {commentAudioUrl ? (
                  <audio controls src={commentAudioUrl} className="w-full" />
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="panel flex max-h-[32rem] flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h2 className="text-sm font-bold tracking-tight text-ink">
                Notes
                {filterAt != null ? ` @ ${formatClock(filterAt)}` : ''}
              </h2>
              <span className="text-xs font-bold tabular-nums text-muted">
                {visibleComments.length}
              </span>
            </div>
            {visibleComments.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted">
                No notes here yet. Pin a moment while listening, then add text or audio.
              </p>
            ) : (
              <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {[...visibleComments]
                  .sort((a, b) => a.atSeconds - b.atSeconds || a.createdAt.localeCompare(b.createdAt))
                  .map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          seekTo(c.atSeconds)
                          setFilterAt(c.atSeconds)
                          setPinTime(c.atSeconds)
                        }}
                        className="w-full rounded-2xl bg-surface/90 px-3 py-2.5 text-left ring-1 ring-line transition hover:bg-brand-50/60"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
                            {formatClock(c.atSeconds)}
                          </span>
                          <span className="truncate text-[11px] text-muted">
                            {c.authorRole === 'teacher' ? 'Teacher' : 'Student'} · {c.authorName}
                          </span>
                        </div>
                        {c.body ? (
                          <p className="mt-1.5 text-sm leading-snug text-ink">{c.body}</p>
                        ) : null}
                        {c.kind === 'audio' && c.audioUrl ? (
                          <audio
                            controls
                            src={c.audioUrl}
                            className="mt-2 w-full"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : null}
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {error ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function probeDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.src = url
    const done = () => {
      const d = audio.duration
      resolve(Number.isFinite(d) && d > 0 ? d : 60)
    }
    audio.addEventListener('loadedmetadata', done, { once: true })
    audio.addEventListener('error', () => resolve(60), { once: true })
  })
}
