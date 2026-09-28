import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The code-for-tokens exchange after Google. Keycloak refuses a PKCE code
 * without the verifier its challenge was made from, so it must travel — once.
 */

vi.mock('@/services/env', () => ({
  getRuntimeEnv: () => ({ APP_ENV: 'local', VITE_KEYCLOAK_URL: 'http://kc.test' }),
  detectDefaultEnvFromLocation: () => 'local',
  computeKeycloakBaseUrl: () => 'http://kc.test',
}))
vi.mock('@/services/backendApi', () => ({ default: { post: vi.fn(), get: vi.fn() } }))
vi.mock('@/services/iamApi', () => ({ default: { post: vi.fn(), get: vi.fn() } }))
vi.mock('@/services/api', () => ({ scheduleProactiveRefresh: vi.fn() }))

const { exchangeOAuthCode } = await import('@/services/auth.service')

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  sessionStorage.clear()
  localStorage.clear()
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ access_token: 'a', refresh_token: 'r', id_token: 'i' }) })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => vi.unstubAllGlobals())

const sentForm = () => new URLSearchParams(fetchMock.mock.calls[0][1].body)

describe('exchanging the Google code', () => {
  it('sends the PKCE verifier and forgets it', async () => {
    sessionStorage.setItem('google_pkce_verifier', 'the-verifier')

    await exchangeOAuthCode('the-code', 'http://localhost:5173/mk/auth/verify-email')

    expect(fetchMock.mock.calls[0][0]).toBe('http://kc.test/realms/event-app/protocol/openid-connect/token')
    expect(sentForm().get('code')).toBe('the-code')
    expect(sentForm().get('code_verifier')).toBe('the-verifier')
    expect(sessionStorage.getItem('google_pkce_verifier')).toBeNull()
    expect(localStorage.getItem('access_token')).toBe('a')
  })

  it('sends no verifier when the flow did not start with one', async () => {
    await exchangeOAuthCode('the-code', 'http://localhost:5173/mk/auth/verify-email')

    expect(sentForm().has('code_verifier')).toBe(false)
  })
})
