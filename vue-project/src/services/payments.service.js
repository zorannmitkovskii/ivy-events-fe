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
   */
  list({ status, page = 0, size = 25 } = {}) {
    const params = { page, size }
    if (status) params.status = status
    return api.get('/admin/payments', { params })
  },
}
