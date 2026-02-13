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
  const url = env.VITE_KEYCLOAK_URL
  if (typeof url === 'string' && url.trim() && !/\$\{[^}]+\}/.test(url)) {
    return url
  }
  return computeKeycloakBaseUrl(appEnv)
} 

function resolveRealm() {
  const env = getRuntimeEnv()
  const realm = env.VITE_KEYCLOAK_REALM
  if (typeof realm === 'string' && realm.trim() && !/\$\{[^}]+\}/.test(realm)) return realm
  return 'event-app'
}

function resolveClientId() {
  const env = getRuntimeEnv()
  const cid = env.VITE_KEYCLOAK_CLIENT_ID
  if (typeof cid === 'string' && cid.trim() && !/\$\{[^}]+\}/.test(cid)) return cid
  return 'eventFE'
}


function logKcDiagnostics(initOpts) {
  try {
    const diag = {
      when: new Date().toISOString(),
      location: typeof window !== 'undefined' ? {
        origin: window.location.origin,
        href: window.location.href,
        userAgent: navigator.userAgent
      } : 'no-window',
      appEnv: resolveAppEnv(),
      keycloak: {
        url: resolveKeycloakUrl(),
        realm: resolveRealm(),
        clientId: resolveClientId()
      },
      initOptions: initOpts
    }
    // eslint-disable-next-line no-console
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Keycloak][diag] Failed to log diagnostics', e)
  }
}


function createKeycloakInstance() {
  return new Keycloak({
    url: resolveKeycloakUrl(),
    realm: resolveRealm(),
    clientId: resolveClientId()
  })
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

  // Log diagnostics (preflight removed per requirement)
  logKcDiagnostics(initOpts)

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
