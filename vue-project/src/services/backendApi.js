import axios from 'axios'
import { baseUrl } from './baseUrl'
import { extractApiError } from './apiError'

// Centralized API client for all backend calls (no suffix; used for /public/* endpoints)
const api = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Parse structured backend errors so callers receive ApiError instances
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const apiErr = extractApiError(error)
    if (apiErr) return Promise.reject(apiErr)
    return Promise.reject(error)
  }
)

/**
 * Subscribe to discount notifications
 * @param {{ name: string, email: string, phone?: string }} payload
 * @returns {Promise<import('axios').AxiosResponse<any>>}
 */
export function subscribeToDiscounts(payload) {
  return api.post('/public/discounts/subscribe', payload)
}

/**
 * Fetch table-info for guests (public endpoint)
 * @param {string} eventId
 * @returns {Promise<import('axios').AxiosResponse<Array<{name: string, tableNumber: string}>>>}
 */
export function getTableInfo(eventId) {
  return api.get('/public/guests/table-info', { params: { eventId } })
}

export default api
