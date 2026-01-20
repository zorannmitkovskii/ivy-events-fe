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
  return 'ivyeventsFE'
}

export function createKeycloakSingleton() {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak({
      url: resolveKeycloakUrl(),
      realm: resolveRealm(),
      clientId: resolveClientId()
    })
  }
  return keycloakInstance
}

export const keycloak = createKeycloakSingleton()

export async function initKeycloak(options = {}) {
  if (initPromise) return initPromise
  const defaults = {
    onLoad: 'login-required', // keep existing behavior from main.js
    pkceMethod: 'S256',
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    checkLoginIframe: false
  }
  const initOpts = { ...defaults, ...options }
  initPromise = keycloak.init(initOpts)
  try {
    await initPromise
  } catch (e) {
    // Reset so next call can retry if needed
    initPromise = null
    throw e
  }
  return initPromise
}
