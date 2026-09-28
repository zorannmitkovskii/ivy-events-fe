import { keycloakClientConfig, tokenEndpoint } from '@/services/keycloakClient'

/**
 * Trading the refresh token for a new access token, straight with Keycloak.
 *
 * <p>The app used to post the refresh token to `/public/users/refresh-token`,
 * an endpoint that stopped existing when sign-in moved to zm-iam-service. Every
 * refresh failed, so every session ended when its first access token did —
 * five minutes in. eventFE is a public client, so the refresh grant needs no
 * secret and no service in between.
 *
 * <p>Deliberately free of the axios client: `api.js` imports this, and this
 * importing it back would be a cycle.
 */

/**
 * Keycloak refused the refresh token: the session is over (idle or maximum
 * lifespan reached, signed out elsewhere). The one failure that means "sign in
 * again" — a dropped connection does not.
 */
export class SessionExpiredError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SessionExpiredError'
  }
}

/** Keycloak answers a refused refresh token with 400 invalid_grant. */
const REFUSED = new Set([400, 401])

const STORED = ['access_token', 'refresh_token', 'id_token']

export async function refreshTokens() {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) throw new SessionExpiredError('No refresh token')

  const form = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: keycloakClientConfig().clientId,
  })

  const response = await fetch(tokenEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })

  if (REFUSED.has(response.status)) throw new SessionExpiredError(`Refresh token refused (${response.status})`)
  if (!response.ok) throw new Error(`Token refresh failed (${response.status})`)

  const data = await response.json()
  for (const key of STORED) {
    if (data[key]) localStorage.setItem(key, data[key])
  }
  return data
}
