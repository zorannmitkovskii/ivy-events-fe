import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'

/**
 * Staying signed in.
 *
 * <p>The refresh used to go to `/public/users/refresh-token`, which no longer
 * exists — so every session ended with its first access token, five minutes
 * in. It now goes to Keycloak, and only a refused refresh token signs anybody
 * out: a dropped connection does not.
 */

vi.mock('@/services/env', () => ({
  getRuntimeEnv: () => ({ APP_ENV: 'local', VITE_KEYCLOAK_URL: 'http://kc.test', VITE_KEYCLOAK_REALM: 'event-app', VITE_KEYCLOAK_CLIENT_ID: 'eventFE' }),
  detectDefaultEnvFromLocation: () => 'local',
  computeKeycloakBaseUrl: () => 'http://kc.test',
}))
vi.mock('@/services/baseUrl', () => ({ baseUrl: 'http://api.test' }))

const { refreshTokens, SessionExpiredError } = await import('@/services/tokenRefresh')
const apiClient = (await import('@/services/api')).default

const fetchMock = vi.fn()
let location

const TOKEN_URL = 'http://kc.test/realms/event-app/protocol/openid-connect/token'

/** A JWT whose only claim that matters here is its expiry. */
function jwt(expSecondsFromNow) {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }))
  return `h.${payload}.s`
}

function keycloakAnswers(status, body = {}) {
  fetchMock.mockResolvedValueOnce({ ok: status >= 200 && status < 300, status, json: async () => body })
}

beforeEach(() => {
  localStorage.clear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  location = { href: 'http://localhost/en/dashboard', pathname: '/en/dashboard' }
  vi.stubGlobal('location', location)
})

afterEach(() => {
  vi.unstubAllGlobals()
  apiClient.defaults.adapter = undefined
})

describe('refreshing with Keycloak', () => {
  it('trades the refresh token for new tokens and keeps them', async () => {
    localStorage.setItem('refresh_token', 'old-refresh')
    keycloakAnswers(200, { access_token: 'new-access', refresh_token: 'new-refresh', id_token: 'new-id' })

    await refreshTokens()

    const [url, init] = fetchMock.mock.calls[0]
    const form = new URLSearchParams(init.body)
    expect(url).toBe(TOKEN_URL)
    expect(form.get('grant_type')).toBe('refresh_token')
    expect(form.get('refresh_token')).toBe('old-refresh')
    expect(form.get('client_id')).toBe('eventFE')
    expect(localStorage.getItem('access_token')).toBe('new-access')
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh')
  })

  it('calls a refused refresh token the end of the session', async () => {
    localStorage.setItem('refresh_token', 'expired')
    keycloakAnswers(400, { error: 'invalid_grant' })

    await expect(refreshTokens()).rejects.toBeInstanceOf(SessionExpiredError)
  })

  it('does not call a server hiccup the end of the session', async () => {
    localStorage.setItem('refresh_token', 'fine')
    keycloakAnswers(503)

    const failure = await refreshTokens().catch((e) => e)
    expect(failure).not.toBeInstanceOf(SessionExpiredError)
  })

  it('treats having no refresh token as a finished session', async () => {
    await expect(refreshTokens()).rejects.toBeInstanceOf(SessionExpiredError)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('an API call whose access token has expired', () => {
  /** Answers 401 until the request carries the new token. */
  function backendAcceptingOnly(token) {
    apiClient.defaults.adapter = vi.fn(async (config) => {
      if (config.headers.Authorization === `Bearer ${token}`) {
        return { status: 200, statusText: 'OK', data: { ok: true }, headers: {}, config }
      }
      // A custom adapter settles the status itself: axios only checks it inside its own.
      const response = { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config }
      throw new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, null, response)
    })
  }

  it('refreshes with Keycloak and retries, without signing out', async () => {
    localStorage.setItem('access_token', jwt(-10))
    localStorage.setItem('refresh_token', 'r1')
    const fresh = jwt(300)
    keycloakAnswers(200, { access_token: fresh, refresh_token: 'r2' })
    backendAcceptingOnly(fresh)

    const response = await apiClient.get('/events')

    expect(response.data).toEqual({ ok: true })
    expect(fetchMock.mock.calls[0][0]).toBe(TOKEN_URL)
    expect(localStorage.getItem('refresh_token')).toBe('r2')
    expect(location.href).toBe('http://localhost/en/dashboard')
  })

  it('signs out only when Keycloak refuses the refresh token', async () => {
    localStorage.setItem('access_token', jwt(-10))
    localStorage.setItem('refresh_token', 'expired')
    keycloakAnswers(400, { error: 'invalid_grant' })
    backendAcceptingOnly('never')

    apiClient.get('/events')
    await vi.waitFor(() => expect(location.href).toBe('/en/auth/login'))
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('stays signed in when the refresh fails for another reason', async () => {
    localStorage.setItem('access_token', jwt(-10))
    localStorage.setItem('refresh_token', 'fine')
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    backendAcceptingOnly('never')

    await expect(apiClient.get('/events')).rejects.toBeTruthy()
    expect(localStorage.getItem('refresh_token')).toBe('fine')
    expect(location.href).toBe('http://localhost/en/dashboard')
  })
})
