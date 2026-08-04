import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  createInvoice,
  getEngagement,
  getLearner,
  getTeacher,
  payInvoice,
} from '../mocks/store'
import { PACKAGE_SESSION_COUNT, SUBJECT_LABELS } from '../types'
import { Button, ButtonLink } from '../components/Button'
import { useCurrency } from '../context/CurrencyContext'
import { MobileCheckout } from '../components/checkout/MobileCheckout'

export function PayEngagementRedirect() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const qty = search.get('qty')
  const to = qty
    ? `/engagements/${id}/checkout?qty=${qty}`
    : `/engagements/${id}/checkout`
  return <Navigate to={to} replace />
}

export function CheckoutPage() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const { formatUsd, currency, refreshRateForOrder } = useCurrency()
  const engagement = id ? getEngagement(id) : undefined
  const teacher = engagement ? getTeacher(engagement.teacherId) : undefined

  const initialQty = Math.max(
    PACKAGE_SESSION_COUNT,
    Number(search.get('qty') || PACKAGE_SESSION_COUNT) || PACKAGE_SESSION_COUNT,
  )
  const [qty, setQty] = useState(initialQty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const preview = useMemo(() => {
    if (!engagement) return null
    try {
      const count = Math.max(PACKAGE_SESSION_COUNT, qty)
      const unit = teacher?.rateUsd ?? 0
      return {
        sessionCount: count,
        unit,
        total: unit * count,
        line: `${SUBJECT_LABELS[engagement.subject]} sessions with ${teacher?.name ?? 'teacher'}`,
      }
    } catch {
      return null
    }
  }, [engagement, teacher, qty])

  if (!engagement || !teacher || !preview) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">Engagement not found</p>
        <ButtonLink to="/sessions" variant="secondary" className="mt-4">
          Back to sessions
        </ButtonLink>
      </div>
    )
  }

  const learners = engagement.learnerIds
    .map((lid) => getLearner(lid))
    .filter(Boolean)
    .map((l) => (l!.kind === 'self' ? `${l!.name.split(' ')[0]} (you)` : l!.name))
    .join(', ')

  function bump(delta: number) {
    setQty((q) => Math.max(PACKAGE_SESSION_COUNT, q + delta))
  }

  async function onPay() {
    setError('')
    setBusy(true)
    try {
      // Order time: one forced FX refresh (daily UI cache is not enough here).
      await refreshRateForOrder()
      const invoice = createInvoice(engagement!.id, qty)
      const paid = payInvoice(invoice.id)
      navigate(`/billing/invoices/${paid.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
      setBusy(false)
    }
  }

  const shared = {
    teacher,
    engagement,
    learners,
    qty,
    currency,
    formatUsd,
    error,
    busy,
    preview,
    onBump: bump,
    onQtyChange: setQty,
    onPay,
  }

  return (
    <>
      <MobileCheckout {...shared} />

      <div className="hidden animate-rise space-y-4 lg:block lg:space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <Link
              to="/sessions"
              className="text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              ← Sessions
            </Link>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Checkout
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Pay for at least {PACKAGE_SESSION_COUNT} sessions with {teacher.name}. Choose how many
              you want now.
            </p>
          </div>
          <Link
            to="/billing"
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Billing history →
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-5">
          <div className="panel space-y-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-bold text-white"
                style={{ background: teacher.avatarColor }}
              >
                {teacher.initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{teacher.name}</p>
                <p className="text-sm text-muted">
                  {SUBJECT_LABELS[engagement.subject]} · {teacher.durationMinutes} min
                </p>
                <p className="mt-0.5 text-sm text-muted">Learners: {learners}</p>
              </div>
            </div>

            <div className="border-t border-line pt-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <label className="text-sm font-semibold text-ink" htmlFor="session-qty">
                    Number of sessions
                  </label>
                  <p className="mt-0.5 text-xs text-muted">Minimum {PACKAGE_SESSION_COUNT}</p>
                </div>
                <p className="text-sm text-muted">{formatUsd(teacher.rateUsd)} each</p>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-canvas text-lg font-bold ring-1 ring-line disabled:opacity-40"
                  disabled={qty <= PACKAGE_SESSION_COUNT}
                  onClick={() => bump(-1)}
                  aria-label="Fewer sessions"
                >
                  −
                </button>
                <input
                  id="session-qty"
                  type="number"
                  min={PACKAGE_SESSION_COUNT}
                  value={qty}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    if (Number.isNaN(n)) return
                    setQty(Math.max(PACKAGE_SESSION_COUNT, Math.floor(n)))
                  }}
                  className="w-20 rounded-xl bg-surface px-3 py-2 text-center text-lg font-bold ring-1 ring-line"
                />
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-canvas text-lg font-bold ring-1 ring-line"
                  onClick={() => bump(1)}
                  aria-label="More sessions"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="panel space-y-3.5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Invoice</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">Preview</p>
              </div>
              <p className="text-xs text-muted">{currency}</p>
            </div>

            <div className="flex justify-between gap-4 border-t border-line pt-3.5 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-ink">{preview.line}</p>
                <p className="mt-0.5 text-muted">
                  {preview.sessionCount} × {formatUsd(preview.unit)}
                </p>
              </div>
              <p className="shrink-0 font-semibold text-ink">{formatUsd(preview.total)}</p>
            </div>

            <div className="flex justify-between border-t border-line pt-3.5 text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold text-ink">{formatUsd(preview.total)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-bold text-ink">Total due</span>
              <span className="text-2xl font-extrabold text-ink">{formatUsd(preview.total)}</span>
            </div>

            <div className="rounded-xl bg-canvas px-3 py-2.5 text-sm text-muted ring-1 ring-line">
              <p className="font-semibold text-ink">Payment method</p>
              <p className="mt-0.5">Visa •••• 4242 (demo)</p>
            </div>

            <p className="text-xs leading-relaxed text-muted">
              Marks the next {preview.sessionCount} scheduled sessions as paid on your calendar.
              {currency === 'PKR'
                ? ' Amounts shown in PKR using today’s FX rate; settlement may still be in USD.'
                : ''}
            </p>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <Button type="button" className="w-full" disabled={busy} onClick={onPay}>
              {busy ? 'Processing…' : `Pay ${formatUsd(preview.total)}`}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
