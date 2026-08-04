import { useCurrency } from '../context/CurrencyContext'
import type { AppCurrency } from '../lib/currency'

/**
 * Global USD | PKR toggle. Rates come from a free FX API; amounts stay USD in data.
 */
export function CurrencySelector({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md'
  className?: string
}) {
  const { currency, setCurrency } = useCurrency()

  const pad = size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'

  return (
    <div
      role="group"
      aria-label="Display currency"
      className={['inline-flex rounded-xl bg-surface p-0.5 ring-1 ring-line', className].join(' ')}
    >
      {(['PKR', 'USD'] as AppCurrency[]).map((code) => {
        const active = currency === code
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => setCurrency(code)}
            className={[
              'rounded-[0.65rem] font-bold tracking-tight transition',
              pad,
              active
                ? 'bg-brand-700 text-white shadow-sm'
                : 'text-muted hover:text-ink',
            ].join(' ')}
          >
            {code}
          </button>
        )
      })}
    </div>
  )
}
