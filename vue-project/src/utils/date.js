export function formatDate(dateStr, locale = 'en-US', options) {
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    if (Number.isNaN(d?.getTime?.())) return ''
    return new Intl.DateTimeFormat(locale, options || { year: 'numeric', month: 'short', day: '2-digit' }).format(d)
  } catch (_) { return '' }
}

export function todayISO() {
  const d = new Date()
  d.setHours(0,0,0,0)
  return d.toISOString().slice(0,10)
}

/**
 * Returns a Date object 6 months from today.
 */
export function getFutureWeddingDate() {
  const d = new Date()
  d.setMonth(d.getMonth() + 6)
  return d
}

/**
 * Formats date as "September 1, 2026"
 */
export function formatWeddingDate(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/**
 * Formats date as "Saturday, September 1, 2026"
 */
export function formatWeddingDateFull(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

/**
 * Builds a local ISO string like "2026-09-01T16:00:00" (no TZ offset).
 */
export function toLocalISO(d, time = '16:00:00') {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}T${time}`
}

/**
 * Returns a formatted date 1 month before the given date.
 */
export function formatRsvpDeadline(weddingDate) {
  const d = new Date(weddingDate)
  d.setMonth(d.getMonth() - 1)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
