import {
  PAYMENT_STATUS_LABELS,
  SESSION_STATUS_LABELS,
  type PaymentStatus,
  type SessionStatus,
} from '../types'

const sessionStyles: Record<SessionStatus, string> = {
  scheduled: 'bg-brand-100 text-brand-800',
  completed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-800',
}

const paymentStyles: Record<PaymentStatus, string> = {
  free: 'bg-emerald-100 text-emerald-900',
  paid: 'bg-brand-100 text-brand-800',
  unpaid: 'bg-amber-100 text-amber-950',
  pending_payment: 'bg-amber-100 text-amber-950',
}

export function StatusPill({ status }: { status: SessionStatus }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${sessionStyles[status]}`}
    >
      {SESSION_STATUS_LABELS[status]}
    </span>
  )
}

export function PaymentPill({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${paymentStyles[status]}`}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  )
}
