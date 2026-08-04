import { Link, useParams } from 'react-router-dom'
import { getEngagement, getTeacher, useInvoice } from '../mocks/store'
import { INVOICE_STATUS_LABELS, SUBJECT_LABELS } from '../types'
import { ButtonLink } from '../components/Button'
import { formatAskDate } from '../lib/format'
import { useCurrency } from '../context/CurrencyContext'

export function InvoiceDetailPage() {
  const { id } = useParams()
  const { formatUsd } = useCurrency()
  const invoice = useInvoice(id)
  const teacher = invoice ? getTeacher(invoice.teacherId) : undefined
  const engagement = invoice ? getEngagement(invoice.engagementId) : undefined

  if (!invoice || !teacher) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">Invoice not found</p>
        <ButtonLink to="/billing" variant="secondary" className="mt-4">
          Back to billing
        </ButtonLink>
      </div>
    )
  }

  const isOpen = invoice.status === 'open' || invoice.status === 'draft'

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-rise">
      <Link to="/billing" className="text-sm font-medium text-brand-700">
        ← Billing
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
            {INVOICE_STATUS_LABELS[invoice.status]}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink">
            {invoice.invoiceNumber}
          </h1>
          <p className="mt-2 text-muted">
            {teacher.name}
            {engagement ? ` · ${SUBJECT_LABELS[engagement.subject]}` : ''}
          </p>
        </div>
        {isOpen ? (
          <ButtonLink
            to={`/engagements/${invoice.engagementId}/checkout?qty=${invoice.sessionCount}`}
          >
            Pay now
          </ButtonLink>
        ) : null}
      </div>

      <div className="panel space-y-4 p-6">
        <div className="flex justify-between text-sm text-muted">
          <span>Issued {formatAskDate(invoice.createdAt)}</span>
          {invoice.paidAt ? <span>Paid {formatAskDate(invoice.paidAt)}</span> : null}
        </div>

        <ul className="space-y-3 border-t border-line pt-4">
          {invoice.lines.map((line, idx) => (
            <li key={idx} className="flex justify-between gap-4 text-sm">
              <div>
                <p className="font-medium text-ink">{line.description}</p>
                <p className="text-muted">
                  {line.quantity} × {formatUsd(line.unitAmountUsd)}
                </p>
              </div>
              <p className="font-semibold text-ink">
                {formatUsd(line.quantity * line.unitAmountUsd)}
              </p>
            </li>
          ))}
        </ul>

        <div className="flex justify-between border-t border-line pt-4 text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="font-semibold">{formatUsd(invoice.subtotalUsd)}</span>
        </div>
        <div className="flex justify-between text-base">
          <span className="font-bold text-ink">Total</span>
          <span className="text-2xl font-extrabold text-ink">
            {formatUsd(invoice.totalUsd)}
          </span>
        </div>

        {invoice.status === 'paid' ? (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
            Receipt — payment recorded (demo).
          </p>
        ) : null}
      </div>
    </div>
  )
}
