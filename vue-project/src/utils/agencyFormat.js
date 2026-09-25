/**
 * Small formatters the agency screens share, so the dashboard and the event
 * list print the same date, the same percentage and the same amount.
 */

/** "3 окт 2026" in the page's language. */
export function formatDay(isoDate, locale, { withYear = true } = {}) {
  if (!isoDate) return ''
  const options = { day: 'numeric', month: 'short' }
  if (withYear) options.year = 'numeric'
  return new Date(`${String(isoDate).slice(0, 10)}T12:00:00`).toLocaleDateString(locale, options)
}

/** Whole-number percentage, or null when there is nothing to divide by. */
export function percent(part, whole) {
  if (!whole) return null
  return Math.round((Number(part) * 100) / Number(whole))
}

/** The agency's currency until its settings say otherwise. */
export const DEFAULT_CURRENCY = 'MKD'

/**
 * An amount in the agency's currency, with its symbol, grouped the way the
 * locale groups thousands.
 *
 * <p>Chrome ships no Macedonian locale data, and without it Intl prints US
 * grouping and "MKD" on a Macedonian page. The denar is then spelled out by
 * hand — the same fallback the vendor microsite uses.
 */
export function formatMoney(amount, currency = DEFAULT_CURRENCY, locale = 'mk') {
  const value = Number(amount) || 0
  const code = currency || DEFAULT_CURRENCY
  try {
    if (code === DEFAULT_CURRENCY && !Intl.NumberFormat.supportedLocalesOf([locale]).length) {
      return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(value)} ден.`
    }
    return new Intl.NumberFormat(locale, { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(value)
  } catch {
    return `${value} ${code}`
  }
}

/** "Марија & Филип" shown twice is noise: the client line is dropped when it repeats the name. */
export function clientLine(row) {
  if (!row?.client) return ''
  return row.client.trim() === (row.name || '').trim() ? '' : row.client
}

/** Initials for an avatar: the first letter of the first two words. */
export function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}
