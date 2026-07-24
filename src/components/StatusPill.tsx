import { SESSION_STATUS_LABELS, type SessionStatus } from '../types'

const styles: Record<SessionStatus, string> = {
  pending: 'bg-amber-100 text-amber-950',
  accepted: 'bg-brand-100 text-brand-800',
  completed: 'bg-slate-100 text-slate-700',
  declined: 'bg-red-100 text-red-800',
}

export function StatusPill({ status }: { status: SessionStatus }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${styles[status]}`}
    >
      {SESSION_STATUS_LABELS[status]}
    </span>
  )
}
