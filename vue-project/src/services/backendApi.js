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
 * A guest's table, looked up by the name they type (public endpoint).
 * Only the guests whose name contains it come back — never the whole list.
 * @param {string} eventId
 * @param {string} name at least 3 letters
 * @returns {Promise<import('axios').AxiosResponse<Array<{name: string, tableNumber: string|null}>>>}
 */
export function getTableInfo(eventId, name) {
  return api.get('/public/guests/table-info', { params: { eventId, name } })
}

export default api
