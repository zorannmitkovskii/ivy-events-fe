import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Google sign-in through Keycloak, with PKCE.
 *
 * <p>The eventFE client requires a code challenge. Without one Keycloak turned
 * every Google sign-in away with "Missing parameter: code_challenge_method",
 * before Google was ever shown — which is what these guard against.
 */

vi.mock('@/services/env', () => ({
  getRuntimeEnv: () => ({ APP_ENV: 'local', VITE_KEYCLOAK_URL: 'http://kc.test', VITE_KEYCLOAK_REALM: 'event-app', VITE_KEYCLOAK_CLIENT_ID: 'eventFE' }),
  detectDefaultEnvFromLocation: () => 'local',
  computeKeycloakBaseUrl: () => 'http://kc.test',
}))

const {
  codeChallengeFor,
  createCodeVerifier,
  googleAuthUrl,
  resumePendingGoogleSignIn,
  startGoogleSignIn,
  takeCodeVerifier,
  takeGoogleIntent,
} = await import('@/services/googleOAuth')

let location

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
  location = { href: '', origin: 'http://localhost:5173' }
  vi.stubGlobal('location', location)
})

afterEach(() => vi.unstubAllGlobals())

describe('the PKCE pair', () => {
  it('derives the S256 challenge the way RFC 7636 does', async () => {
    // The worked example from RFC 7636, appendix B.
    expect(await codeChallengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'))
      .toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })

  it('makes a fresh, URL-safe verifier of the minimum length each time', () => {
    const first = createCodeVerifier()
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(createCodeVerifier()).not.toBe(first)
  })
})

describe('the authorize URL', () => {
  it('goes to Google through the eventFE client with a challenge Keycloak can check', async () => {
    const url = new URL(await googleAuthUrl('mk'))
    const params = url.searchParams

    expect(url.origin + url.pathname).toBe('http://kc.test/realms/event-app/protocol/openid-connect/auth')
    expect(params.get('client_id')).toBe('eventFE')
    expect(params.get('redirect_uri')).toBe('http://localhost:5173/mk/auth/verify-email')
    expect(params.get('kc_idp_hint')).toBe('google')
    expect(params.get('code_challenge_method')).toBe('S256')
    expect(params.get('code_challenge')).toBe(await codeChallengeFor(sessionStorage.getItem('google_pkce_verifier')))
  })

  it('hands the verifier over once, for the one exchange it belongs to', async () => {
    await googleAuthUrl('mk')
    const verifier = sessionStorage.getItem('google_pkce_verifier')

    expect(takeCodeVerifier()).toBe(verifier)
    expect(takeCodeVerifier()).toBeNull()
  })
})

describe('starting the flow', () => {
  it('goes straight to Google when nobody is signed in, remembering why', async () => {
    await startGoogleSignIn({ lang: 'mk', intent: 'signup', returnPath: 'auth/signup' })

    expect(location.href).toContain('kc_idp_hint=google')
    expect(location.href).toContain('code_challenge=')
    expect(takeGoogleIntent()).toBe('signup')
  })

  it('signs an open Keycloak session out first, and resumes afterwards', async () => {
    localStorage.setItem('id_token', 'old.id.token')
    localStorage.setItem('access_token', 'old')

    await startGoogleSignIn({ lang: 'en', intent: 'login', returnPath: 'auth/login' })

    const logout = new URL(location.href)
    expect(logout.pathname).toBe('/realms/event-app/protocol/openid-connect/logout')
    expect(logout.searchParams.get('post_logout_redirect_uri')).toBe('http://localhost:5173/en/auth/login')
    expect(localStorage.getItem('access_token')).toBeNull()

    const start = vi.fn()
    expect(resumePendingGoogleSignIn(start)).toBe(true)
    expect(start).toHaveBeenCalledOnce()
    expect(resumePendingGoogleSignIn(start)).toBe(false)
  })
})
