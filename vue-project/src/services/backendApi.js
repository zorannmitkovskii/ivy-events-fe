import axios from 'axios'
import { baseUrl } from './baseUrl'

// Centralized API client for all backend calls (no suffix; used for /public/* endpoints)
const api = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * Subscribe email for discount notifications
 * @param {string} email
 * @returns {Promise<import('axios').AxiosResponse<any>>}
 */
export function subscribeToDiscounts(email) {
  return api.post('/public/discounts/subscribe', { email })
}

export default api
