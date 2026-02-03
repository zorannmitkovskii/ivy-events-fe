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
