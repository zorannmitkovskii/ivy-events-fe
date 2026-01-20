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

function computeThirdPartyCookiesCheckUrl() {
  const base = resolveKeycloakUrl().replace(/\/$/, '')
  const realm = encodeURIComponent(resolveRealm())
  return `${base}/realms/${realm}/protocol/openid-connect/3p-cookies/step1.html`
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
      initOptions: initOpts,
      thirdPartyCookiesCheckUrl: computeThirdPartyCookiesCheckUrl()
    }
    // eslint-disable-next-line no-console
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Keycloak][diag] Failed to log diagnostics', e)
  }
}

async function preflightThirdPartyCookies(url, timeoutMs = 4000) {
  if (typeof document === 'undefined') return { status: 'skipped', reason: 'no-document' }
  return new Promise((resolve) => {
    const start = Date.now()
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = url
    const cleanup = (result) => {
      try { iframe.remove() } catch (_) {}
      resolve({ ...result, durationMs: Date.now() - start })
    }
    const timer = setTimeout(() => cleanup({ status: 'timeout' }), timeoutMs)
    iframe.onload = () => { clearTimeout(timer); cleanup({ status: 'loaded' }) }
    iframe.onerror = () => { clearTimeout(timer); cleanup({ status: 'error' }) }
    try {
      document.body.appendChild(iframe)
    } catch (e) {
      clearTimeout(timer)
      cleanup({ status: 'skipped', reason: 'append-failed', error: String(e) })
    }
  })
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
    silentCheckSsoRedirectUri: typeof window !== 'undefined' ? `${window.location.origin}/silent-check-sso.html` : undefined,
    silentCheckSsoFallback: false, // prevent redirect to auth when silent check cannot be performed
    enableLogging: true
  }
  const initOpts = { ...defaults, ...options }

  // Log diagnostics and attempt a non-invasive preflight of 3p cookies page for better error context
  logKcDiagnostics(initOpts)
  try {
    const tpUrl = computeThirdPartyCookiesCheckUrl()
    await preflightThirdPartyCookies(tpUrl, 3500)
    // eslint-disable-next-line no-console
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Keycloak][preflight] Probe failed', e)
  }

  initPromise = keycloak.init(initOpts)
  try {
    await initPromise
  } catch (e) {
    // eslint-disable-next-line no-console
    const msg = (e && (e.message || String(e))) || ''
    const is3pTimeout = /3rd party check iframe/i.test(msg)
    // Reset so next call can retry if needed
    initPromise = null
    if (is3pTimeout) {
      // Retry once WITHOUT silentCheckSso to avoid 3rd-party cookies probe
      const retryOpts = { ...initOpts, silentCheckSsoRedirectUri: undefined }
      // eslint-disable-next-line no-console
      console.info('[Keycloak] Retrying init without silentCheckSsoRedirectUri to bypass 3rd-party cookies probe...')
      try {
        // Create a fresh Keycloak instance because keycloak-js forbids init twice on the same instance
        resetKeycloakInstance()
        initPromise = keycloak.init(retryOpts)
        await initPromise
        // eslint-disable-next-line no-console
        console.info('[Keycloak] init succeeded on retry without silent SSO')
      } catch (err2) {
        initPromise = null
        // eslint-disable-next-line no-console
        console.error('[Keycloak] retry init error:', err2?.message || err2, err2)
        // Provide actionable hints
        // eslint-disable-next-line no-console
        console.warn('[Keycloak] Hints: Ensure https auth domain is used, that the auth domain allows to be iframed for 3p-cookies endpoint (no X-Frame-Options DENY), and that third-party cookies/IFRAME are not blocked by the browser or privacy extensions.')
        throw err2
      }
    } else {
      // Provide actionable hints and rethrow
      // eslint-disable-next-line no-console
      console.error('[Keycloak] init error:', e?.message || e, e)
      // eslint-disable-next-line no-console
      console.warn('[Keycloak] Hints: Ensure https auth domain is used, that the auth domain allows to be iframed for 3p-cookies endpoint (no X-Frame-Options DENY), and that third-party cookies/IFRAME are not blocked by the browser or privacy extensions.')
      throw e
    }
  }
  return initPromise
}
