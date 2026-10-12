/**
 * Weekly reconciliation of the payment list with the CPay merchant portal.
 *
 * Real CPay data showed that OK and FAIL returns sign the same fields, so the
 * backend refuses a cPayPaymentRef that another payment already has — and an
 * admin compares, once a week, the SUCCESS payments of a period with the
 * portal. These helpers turn the filtered admin list into the few columns the
 * comparison needs: our reference (Details2), the CPay transaction reference
 * (cPayPaymentRef), amount, currency and when it was paid. Nothing else (no
 * e-mail, no user id) goes into the copy or the file.
 */

export const RECONCILIATION_COLUMNS = ['reference', 'cPayPaymentRef', 'amount', 'currency', 'paidAt']

/** One admin payment view → the reconciliation row (strings, '' when missing). */
export function reconciliationRow(payment) {
  return [
    payment?.providerOrderRef ?? '',
    payment?.providerTransactionRef ?? '',
    payment?.amount == null ? '' : String(payment.amount),
    payment?.currency ?? '',
    payment?.paidAt ?? '',
  ]
}

/**
 * A spreadsheet must not run a value as a formula (CSV injection): a cell that
 * starts with = + - @ or a tab/CR is prefixed with a quote. References and
 * ISO dates never do, but the portal reference is typed by an admin.
 */
function neutralise(value) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

function csvCell(value) {
  const safe = neutralise(String(value ?? ''))
  return /[",\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/** RFC 4180 CSV with a header row; CRLF line ends (what spreadsheets expect). */
export function toReconciliationCsv(payments) {
  const lines = [RECONCILIATION_COLUMNS.join(',')]
  for (const payment of payments || []) {
    lines.push(reconciliationRow(payment).map(csvCell).join(','))
  }
  return lines.join('\r\n') + '\r\n'
}

/** Tab-separated, with the header — pastes into a spreadsheet as columns. */
export function toReconciliationTsv(payments) {
  const clean = (value) => neutralise(String(value ?? '').replace(/[\t\r\n]+/g, ' '))
  const lines = [RECONCILIATION_COLUMNS.join('\t')]
  for (const payment of payments || []) {
    lines.push(reconciliationRow(payment).map(clean).join('\t'))
  }
  return lines.join('\n')
}

/** `cpay-payments-<status>-<from>_<to>.csv`, the parts that are set. */
export function reconciliationFileName({ status, from, to } = {}) {
  const parts = ['cpay-payments', (status || 'all').toLowerCase()]
  if (from || to) parts.push(`${from || 'start'}_${to || 'today'}`)
  return `${parts.join('-')}.csv`
}

/** Offers `content` as a file download (UTF-8 with BOM, so Excel reads Cyrillic). */
export function downloadCsv(content, filename) {
  const blob = new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
