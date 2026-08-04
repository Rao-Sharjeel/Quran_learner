import { Link } from 'react-router-dom'
import { getTeacher, useInvoices } from '../mocks/store'
import { INVOICE_STATUS_LABELS } from '../types'
import { ButtonLink } from '../components/Button'
import { formatAskDate } from '../lib/format'
import { useCurrency } from '../context/CurrencyContext'

export function BillingPage() {
  const invoices = [...useInvoices()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
  const open = invoices.filter((i) => i.status === 'open' || i.status === 'draft')
  const paid = invoices.filter((i) => i.status === 'paid')

  return (
    <div className="space-y-8 animate-rise">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Billing
        </h1>
        <p className="mt-2 text-muted">
          Invoices for session packages. Pay open balances or review past receipts.
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-canvas/70 px-5 py-10 text-center">
          <p className="font-semibold text-ink">No invoices yet</p>
          <p className="mt-1 text-sm text-muted">
            When you pay for sessions from Sessions, invoices appear here.
          </p>
          <ButtonLink to="/sessions" className="mt-4">
            Go to Sessions
          </ButtonLink>
        </div>
      ) : (
        <>
          {open.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                Open
              </h2>
              <ul className="space-y-3">
                {open.map((inv) => (
                  <InvoiceRow key={inv.id} invoiceId={inv.id} />
                ))}
              </ul>
            </section>
          ) : null}

          {paid.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                Paid
              </h2>
              <ul className="space-y-3">
                {paid.map((inv) => (
                  <InvoiceRow key={inv.id} invoiceId={inv.id} />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}

function InvoiceRow({ invoiceId }: { invoiceId: string }) {
  const { formatUsd } = useCurrency()
  const invoices = useInvoices()
  const inv = invoices.find((i) => i.id === invoiceId)
  if (!inv) return null
  const teacher = getTeacher(inv.teacherId)

  return (
    <li>
      <Link
        to={`/billing/invoices/${inv.id}`}
        className="flex flex-col gap-2 panel p-4 transition hover:bg-brand-50/50 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="font-semibold text-ink">
            {inv.invoiceNumber}
            <span className="ml-2 text-xs font-bold uppercase tracking-wide text-muted">
              {INVOICE_STATUS_LABELS[inv.status]}
            </span>
          </p>
          <p className="text-sm text-muted">
            {teacher?.name ?? 'Teacher'} · {inv.sessionCount} sessions ·{' '}
            {formatAskDate(inv.createdAt)}
          </p>
        </div>
        <p className="text-lg font-extrabold text-ink">{formatUsd(inv.totalUsd)}</p>
      </Link>
    </li>
  )
}
