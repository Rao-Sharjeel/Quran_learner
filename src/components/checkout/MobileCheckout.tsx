import { Link } from 'react-router-dom'
import type { Teacher, TeachingEngagement } from '../../types'
import { PACKAGE_SESSION_COUNT, SUBJECT_LABELS } from '../../types'
import { Button } from '../Button'
import type { AppCurrency } from '../../lib/currency'

export type CheckoutPreview = {
  sessionCount: number
  unit: number
  total: number
  line: string
}

type Props = {
  teacher: Teacher
  engagement: TeachingEngagement
  learners: string
  qty: number
  currency: AppCurrency
  formatUsd: (usd: number) => string
  error: string
  busy: boolean
  preview: CheckoutPreview
  onBump: (delta: number) => void
  onQtyChange: (n: number) => void
  onPay: () => void
}

/**
 * Mobile checkout — compact teacher row, qty stepper, sticky pay bar.
 * Desktop tree stays in CheckoutPage (lg+).
 */
export function MobileCheckout({
  teacher,
  engagement,
  learners,
  qty,
  currency,
  formatUsd,
  error,
  busy,
  preview,
  onBump,
  onQtyChange,
  onPay,
}: Props) {
  return (
    <div className="flex flex-col gap-2.5 animate-rise pb-24 lg:hidden">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div>
          <Link
            to="/sessions"
            className="text-xs font-medium text-brand-700 hover:text-brand-800"
          >
            ← Sessions
          </Link>
          <h1 className="mt-0.5 text-lg font-extrabold tracking-tight text-ink">Checkout</h1>
        </div>
        <Link
          to="/billing"
          className="shrink-0 text-[11px] font-bold text-brand-700"
        >
          Billing →
        </Link>
      </div>

      <div className="rounded-2xl border border-line bg-surface px-3 py-3">
        <div className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
            style={{ background: teacher.avatarColor }}
          >
            {teacher.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{teacher.name}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted">
              {SUBJECT_LABELS[engagement.subject]} · {teacher.durationMinutes} min · {learners}
            </p>
          </div>
          <p className="shrink-0 text-xs font-bold tabular-nums text-ink">
            {formatUsd(teacher.rateUsd)}
            <span className="font-medium text-muted">/ea</span>
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
          <div>
            <p className="text-xs font-semibold text-ink">Sessions</p>
            <p className="text-[10px] text-muted">Min {PACKAGE_SESSION_COUNT}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg bg-canvas text-base font-bold ring-1 ring-line disabled:opacity-40"
              disabled={qty <= PACKAGE_SESSION_COUNT}
              onClick={() => onBump(-1)}
              aria-label="Fewer sessions"
            >
              −
            </button>
            <input
              id="session-qty-mobile"
              type="number"
              min={PACKAGE_SESSION_COUNT}
              value={qty}
              onChange={(e) => {
                const n = Number(e.target.value)
                if (Number.isNaN(n)) return
                onQtyChange(Math.max(PACKAGE_SESSION_COUNT, Math.floor(n)))
              }}
              className="w-14 rounded-lg bg-surface px-2 py-1.5 text-center text-base font-bold ring-1 ring-line"
            />
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg bg-canvas text-base font-bold ring-1 ring-line"
              onClick={() => onBump(1)}
              aria-label="More sessions"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Invoice · {currency}
          </p>
        </div>
        <div className="mt-2 flex justify-between gap-3 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{preview.line}</p>
            <p className="mt-0.5 text-xs text-muted">
              {preview.sessionCount} × {formatUsd(preview.unit)}
            </p>
          </div>
          <p className="shrink-0 font-semibold text-ink">{formatUsd(preview.total)}</p>
        </div>
        <div className="mt-2.5 flex items-baseline justify-between border-t border-line pt-2.5">
          <span className="text-sm font-bold text-ink">Total due</span>
          <span className="text-xl font-extrabold tabular-nums text-ink">
            {formatUsd(preview.total)}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-muted">Visa •••• 4242 (demo)</p>
        <p className="mt-1 text-[10px] leading-snug text-muted">
          Pays the next {preview.sessionCount} sessions on your calendar.
          {currency === 'PKR' ? ' Shown in PKR at today’s rate.' : ''}
        </p>
        {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      </div>

      {/* Sticky pay — clears bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 px-4 pt-2.5 backdrop-blur-xl pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:hidden">
        <Button type="button" className="w-full !py-3" disabled={busy} onClick={onPay}>
          {busy ? 'Processing…' : `Pay ${formatUsd(preview.total)}`}
        </Button>
      </div>
    </div>
  )
}
