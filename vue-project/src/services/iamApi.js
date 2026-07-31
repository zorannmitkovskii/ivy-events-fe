import axios from 'axios'
import { iamBaseUrl } from './iamBaseUrl'
import { extractApiError } from './apiError'

// Client for zm-iam-service's public auth endpoints: register, login, verify
// email, change password, password reset.
//
// Not every /public/* path belongs here. The invitation page, guest table
// lookup and discount signup are also public and are served by ivy-events-be —
// they keep using backendApi. "Public" describes who may call it, not which
// service answers.
const iamApi = axios.create({
  baseURL: iamBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

iamApi.interceptors.response.use(
  (res) => res,
  (error) => {
    const apiErr = extractApiError(error)
    if (apiErr) return Promise.reject(apiErr)
    return Promise.reject(error)
  }
)

export default iamApi
