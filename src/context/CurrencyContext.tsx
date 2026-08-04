import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  type AppCurrency,
  DEFAULT_CURRENCY,
  FALLBACK_USD_TO_PKR,
  ensureUsdToPkrRate,
  formatMoney,
  readFxCache,
  readStoredCurrency,
  writeStoredCurrency,
} from '../lib/currency'

type CurrencyContextValue = {
  currency: AppCurrency
  setCurrency: (c: AppCurrency) => void
  usdToPkr: number
  rateDate?: string
  rateReady: boolean
  rateError: boolean
  formatUsd: (amountUsd: number) => string
  /** Fresh FX for checkout — hits the API once, then updates the daily cache. */
  refreshRateForOrder: () => Promise<number>
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

function initialFromCache() {
  const cached = typeof window !== 'undefined' ? readFxCache() : null
  return {
    rate: cached?.rate ?? FALLBACK_USD_TO_PKR,
    date: cached?.date,
    /** Cached value is usable immediately; network may refine later. */
    ready: Boolean(cached),
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const boot = initialFromCache()
  const [currency, setCurrencyState] = useState<AppCurrency>(() => {
    if (typeof window === 'undefined') return DEFAULT_CURRENCY
    return readStoredCurrency()
  })
  const [usdToPkr, setUsdToPkr] = useState(boot.rate)
  const [rateDate, setRateDate] = useState<string | undefined>(boot.date)
  const [rateReady, setRateReady] = useState(boot.ready)
  const [rateError, setRateError] = useState(false)

  const setCurrency = useCallback((next: AppCurrency) => {
    setCurrencyState(next)
    writeStoredCurrency(next)
  }, [])

  /** App open: use cache; network only if we haven't fetched today. */
  useEffect(() => {
    let cancelled = false
    ensureUsdToPkrRate({ force: false }).then((result) => {
      if (cancelled) return
      setUsdToPkr(result.rate)
      setRateDate(result.date)
      setRateError(Boolean(result.error))
      setRateReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const refreshRateForOrder = useCallback(async () => {
    const result = await ensureUsdToPkrRate({ force: true })
    setUsdToPkr(result.rate)
    setRateDate(result.date)
    setRateError(Boolean(result.error))
    setRateReady(true)
    return result.rate
  }, [])

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      usdToPkr,
      rateDate,
      rateReady,
      rateError,
      formatUsd: (amountUsd: number) => formatMoney(amountUsd, currency, usdToPkr),
      refreshRateForOrder,
    }),
    [currency, setCurrency, usdToPkr, rateDate, rateReady, rateError, refreshRateForOrder],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
