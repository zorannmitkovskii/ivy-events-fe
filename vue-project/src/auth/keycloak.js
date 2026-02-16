import Keycloak from 'keycloak-js'
import { detectDefaultEnvFromLocation, getRuntimeEnv, computeKeycloakBaseUrl } from '@/services/env'

// Singleton Keycloak instance and init promise
let keycloakInstance = null
let initPromise = null

function resolveAppEnv() {
  const env = getRuntimeEnv()
  const raw = env.APP_ENV
  const val = (raw || detectDefaultEnvFromLocation()).toString().toLowerCase()
  return val
}

function resolveKeycloakUrl() {
  const env = getRuntimeEnv()
  const appEnv = resolveAppEnv()

  // In test/prod, always derive from hostname to prevent a prod URL
  // baked at build time from being used on test (or vice versa).
  if (appEnv !== 'local') {
    return computeKeycloakBaseUrl(appEnv)
  }

  const url = env.VITE_KEYCLOAK_URL
  if (typeof url === 'string' && url.trim() && !/\$\{[^}]+\}/.test(url)) {
    return url
  }
  return computeKeycloakBaseUrl(appEnv)
}

function resolveRealm() {
  const appEnv = resolveAppEnv()
  // Non-local envs always use the canonical realm — prevents Docker misconfiguration
  if (appEnv !== 'local') return 'event-app'
  const env = getRuntimeEnv()
  const realm = env.VITE_KEYCLOAK_REALM
  if (typeof realm === 'string' && realm.trim() && !/\$\{[^}]+\}/.test(realm)) return realm
  return 'event-app'
}

function resolveClientId() {
  const appEnv = resolveAppEnv()
  // Non-local envs always use the canonical clientId — prevents Docker misconfiguration
  if (appEnv !== 'local') return 'eventFE'
  const env = getRuntimeEnv()
  const cid = env.VITE_KEYCLOAK_CLIENT_ID
  if (typeof cid === 'string' && cid.trim() && !/\$\{[^}]+\}/.test(cid)) return cid
  return 'eventFE'
}


function createKeycloakInstance() {
  const url = resolveKeycloakUrl()
  const realm = resolveRealm()
  const clientId = resolveClientId()
  return new Keycloak({ url, realm, clientId })
}

function ensureKeycloakInstance() {
  if (!keycloakInstance) {
    keycloakInstance = createKeycloakInstance()
  }
  return keycloakInstance
}

export let keycloak = ensureKeycloakInstance()

function resetKeycloakInstance() {
  keycloakInstance = createKeycloakInstance()
  // Reassign exported binding so imports see the fresh instance
  keycloak = keycloakInstance
}

export async function initKeycloak(options = {}) {
  if (initPromise) return initPromise
  const defaults = {
    pkceMethod: 'S256',
    checkLoginIframe: false,
    enableLogging: true
  }
  const initOpts = { ...defaults, ...options }

  initPromise = keycloak.init(initOpts)
  try {
    await initPromise
  } catch (e) {
    // Reset so next call can retry if needed; do not attempt redirect-based or silent-SSO retries
    initPromise = null
    // eslint-disable-next-line no-console
    console.warn('[Keycloak] init error (non-fatal):', e?.message || e)
    throw e
  }
  return initPromise
}
