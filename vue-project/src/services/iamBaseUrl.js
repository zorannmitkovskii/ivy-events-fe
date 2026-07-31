// Where the auth endpoints live.
//
// Separate from baseUrl on purpose. Registration, login, email verification and
// password reset are served by zm-iam-service; everything else — events,
// guests, tasks, budgets, media — is ivy-events-be. They are two services on
// two addresses, and pointing the whole app at either one breaks the other
// half: aim it all at IAM and every /v1/api call comes back 403, aim it all at
// the backend and login hits paths that no longer exist there.
import { detectDefaultEnvFromLocation, getRuntimeEnv } from './env'

const runtimeEnv = getRuntimeEnv()

function isUnresolvedTemplate(val) {
  return typeof val === 'string' && /\$\{[^}]+\}/.test(val)
}

function computeDefaultIamBaseUrl(env) {
  if (typeof window === 'undefined') return 'http://localhost:8282'

  const { protocol, hostname } = window.location || {}
  const usedProtocol = protocol || (env === 'local' ? 'http:' : 'https:')
  const usedHost = (hostname || 'localhost').toLowerCase()

  if (env === 'local') {
    // Current host rather than a literal "localhost", so a phone on the same
    // network can reach it too.
    return `${usedProtocol}//${usedHost}:8282`
  }
  if (usedHost === 'ivyevents.mk') return 'https://iam.ivyevents.mk'
  if (usedHost === 'test.ivyevents.mk') return 'https://iam.test.ivyevents.mk'
  return `${usedProtocol}//${usedHost}:8282`
}

const rawAppEnv = runtimeEnv.APP_ENV
const appEnv = isUnresolvedTemplate(rawAppEnv)
  ? detectDefaultEnvFromLocation()
  : String(rawAppEnv || detectDefaultEnvFromLocation()).toLowerCase()

const configured = runtimeEnv.VITE_IAM_BASE_URL
const effective =
  !configured || isUnresolvedTemplate(configured)
    ? computeDefaultIamBaseUrl(appEnv)
    : configured

export const iamBaseUrl = String(effective).replace(/\/$/, '')
export default iamBaseUrl
