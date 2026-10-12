import { api } from '@/services/api'

/**
 * Payment attempts, as the admin console reads them.
 *
 * <p>Distinct from `cpay.service.js`, which starts a payment and polls one
 * order's status after the redirect. This is the record: every attempt, what
 * became of it, and who it was for.
 */
export const paymentsService = {
  /**
   * @param status one of SUCCESS / PENDING / FAILED / REFUNDED, or omitted for
   *   all of them. Omitted rather than sent blank — an empty enum parameter
   *   reaches Spring as a 400, so clearing the filter would look like a server
   *   error.
   * @param from / to ISO dates (YYYY-MM-DD), both included, of the payment
   *   date (paidAt, else createdAt) — the weekly reconciliation with the CPay
   *   portal. Omitted when empty. 422 when from is after to.
   */
  list({ status, from, to, page = 0, size = 25 } = {}) {
    const params = { page, size }
    if (status) params.status = status
    if (from) params.from = from
    if (to) params.to = to
    return api.get('/admin/payments', { params })
  },

  /**
   * CPay round 2 (5): CPay payments still PENDING or EXPIRED (flagged "needs
   * confirmation" ones included), with why each waits — `reason`
   * (NO_BANK_RESPONSE, NEEDS_CONFIRMATION, CPAY_MISMATCH, …) and `reasonDetail`.
   */
  awaitingConfirmation({ page = 0, size = 25 } = {}) {
    return api.get('/admin/payments/awaiting-confirmation', { params: { page, size } })
  },

  /**
   * CPay round 2 (5): mark paid and activate — the server settles it exactly as
   * a successful CPay callback would. 409 CONFLICT_PAYMENT_ALREADY_SETTLED when
   * it no longer waits (double click, another admin, the bank first).
   */
  markPaid(paymentId, { providerReference, note }) {
    return api.post(`/admin/payments/${encodeURIComponent(paymentId)}/mark-paid`, { providerReference, note })
  },

  /** CPay round 2 (5): mark failed, with a note. 409 as above. */
  markFailed(paymentId, { note }) {
    return api.post(`/admin/payments/${encodeURIComponent(paymentId)}/mark-failed`, { note })
  },
}
