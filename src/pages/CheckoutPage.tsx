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

  function onPay() {
    setError('')
    setBusy(true)
    try {
      const invoice = createInvoice(engagement!.id, qty)
      const paid = payInvoice(invoice.id)
      navigate(`/billing/invoices/${paid.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-rise">
      <Link to="/sessions" className="text-sm font-medium text-brand-700">
        ← Sessions
      </Link>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Checkout</h1>
        <p className="mt-2 text-muted">
          Pay for at least {PACKAGE_SESSION_COUNT} sessions with {teacher.name}. Choose how many
          you want now.
        </p>
      </div>

      <div className="panel space-y-4 p-6">
        <div>
          <p className="text-sm font-semibold text-ink">{teacher.name}</p>
          <p className="text-sm text-muted">
            {SUBJECT_LABELS[engagement.subject]} · {learners} · {teacher.durationMinutes} min
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink" htmlFor="session-qty">
            Number of sessions
          </label>
          <p className="mt-0.5 text-xs text-muted">Minimum {PACKAGE_SESSION_COUNT}</p>
          <div className="mt-2 flex items-center gap-3">
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
            <span className="text-sm text-muted">${teacher.rateUsd} each</span>
          </div>
        </div>
      </div>

      <div className="panel space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Invoice</p>
            <p className="mt-1 text-sm font-semibold text-ink">Preview</p>
          </div>
          <p className="text-xs text-muted">USD</p>
        </div>

        <div className="border-t border-line pt-4">
          <div className="flex justify-between gap-4 text-sm">
            <div>
              <p className="font-medium text-ink">{preview.line}</p>
              <p className="mt-0.5 text-muted">
                {preview.sessionCount} × ${preview.unit}
              </p>
            </div>
            <p className="font-semibold text-ink">${preview.total}</p>
          </div>
        </div>

        <div className="flex justify-between border-t border-line pt-4 text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="font-semibold text-ink">${preview.total}</span>
        </div>
        <div className="flex justify-between text-base">
          <span className="font-bold text-ink">Total due</span>
          <span className="text-2xl font-extrabold text-ink">${preview.total}</span>
        </div>

        <div className="rounded-xl bg-canvas px-3 py-3 text-sm text-muted ring-1 ring-line">
          <p className="font-semibold text-ink">Payment method</p>
          <p className="mt-1">Visa •••• 4242 (demo)</p>
        </div>

        <p className="text-xs text-muted">
          Marks the next {preview.sessionCount} scheduled sessions as paid on your calendar.
        </p>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <Button type="button" className="w-full" disabled={busy} onClick={onPay}>
          {busy ? 'Processing…' : `Pay $${preview.total}`}
        </Button>
      </div>

      <p className="text-center text-sm text-muted">
        <Link to="/billing" className="font-semibold text-brand-700">
          View billing history
        </Link>
      </p>
    </div>
  )
}
