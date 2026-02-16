export function formatCurrency(amount, currency = 'EUR', locale = 'en-US') {
  try {
    const n = Number(amount || 0)
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n)
  } catch (_) {
    return `$${Number(amount || 0).toFixed(2)}`
  }
}
