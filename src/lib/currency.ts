export type AppCurrency = 'USD' | 'PKR'

export const CURRENCY_STORAGE_KEY = 'ilm_currency'
export const FX_CACHE_STORAGE_KEY = 'ilm_usd_pkr_fx'
/** Pakistan launch default */
export const DEFAULT_CURRENCY: AppCurrency = 'PKR'

/** Used when the live FX API is unreachable */
export const FALLBACK_USD_TO_PKR = 278

const RATE_PRIMARY =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json'
const RATE_FALLBACK =
  'https://latest.currency-api.pages.dev/v1/currencies/usd.min.json'

export type FxCache = {
  rate: number
  /** ISO date from the API when available */
  date?: string
  /** When we last successfully fetched (ms) */
  fetchedAt: number
}

type UsdRatesPayload = {
  date?: string
  usd?: { pkr?: number }
}

export function isAppCurrency(value: string | null | undefined): value is AppCurrency {
  return value === 'USD' || value === 'PKR'
}

export function readStoredCurrency(): AppCurrency {
  try {
    const raw = localStorage.getItem(CURRENCY_STORAGE_KEY)
    if (isAppCurrency(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_CURRENCY
}

export function writeStoredCurrency(currency: AppCurrency) {
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency)
  } catch {
    /* ignore */
  }
}

export function readFxCache(): FxCache | null {
  try {
    const raw = localStorage.getItem(FX_CACHE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FxCache
    if (
      typeof parsed?.rate !== 'number' ||
      !Number.isFinite(parsed.rate) ||
      parsed.rate <= 0 ||
      typeof parsed.fetchedAt !== 'number'
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeFxCache(cache: FxCache) {
  try {
    localStorage.setItem(FX_CACHE_STORAGE_KEY, JSON.stringify(cache))
  } catch {
    /* ignore */
  }
}

/** True if we already fetched today (local calendar day). */
export function isFxCacheFresh(cache: FxCache, now = Date.now()): boolean {
  const fetched = new Date(cache.fetchedAt)
  const today = new Date(now)
  return (
    fetched.getFullYear() === today.getFullYear() &&
    fetched.getMonth() === today.getMonth() &&
    fetched.getDate() === today.getDate()
  )
}

async function fetchUsdJson(url: string): Promise<UsdRatesPayload> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FX ${res.status}`)
  return res.json() as Promise<UsdRatesPayload>
}

/** Network call — prefer ensureUsdToPkrRate() so we don't over-fetch. */
export async function fetchUsdToPkrRate(): Promise<{ rate: number; date?: string }> {
  let payload: UsdRatesPayload
  try {
    payload = await fetchUsdJson(RATE_PRIMARY)
  } catch {
    payload = await fetchUsdJson(RATE_FALLBACK)
  }
  const rate = payload.usd?.pkr
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('Invalid PKR rate')
  }
  return { rate, date: payload.date }
}

/**
 * Returns USD→PKR.
 * - force=false (default UI): reuse today's cache; fetch at most once per local day
 * - force=true (checkout/order): always hit the API and refresh the cache
 */
export async function ensureUsdToPkrRate(options?: {
  force?: boolean
}): Promise<{ rate: number; date?: string; fromCache: boolean; error?: boolean }> {
  const force = options?.force === true
  const cached = readFxCache()

  if (!force && cached && isFxCacheFresh(cached)) {
    return { rate: cached.rate, date: cached.date, fromCache: true }
  }

  try {
    const { rate, date } = await fetchUsdToPkrRate()
    writeFxCache({ rate, date, fetchedAt: Date.now() })
    return { rate, date, fromCache: false }
  } catch {
    if (cached) {
      return { rate: cached.rate, date: cached.date, fromCache: true, error: true }
    }
    return {
      rate: FALLBACK_USD_TO_PKR,
      fromCache: false,
      error: true,
    }
  }
}

export function convertUsd(
  amountUsd: number,
  currency: AppCurrency,
  usdToPkr: number,
): number {
  if (currency === 'USD') return amountUsd
  return amountUsd * usdToPkr
}

export function formatMoney(
  amountUsd: number,
  currency: AppCurrency,
  usdToPkr: number,
): string {
  const amount = convertUsd(amountUsd, currency, usdToPkr)
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount)
  }
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
}
