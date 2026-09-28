import { getRuntimeEnv, detectDefaultEnvFromLocation, computeKeycloakBaseUrl } from '@/services/env'

/**
 * Signing in with Google, through Keycloak, with PKCE.
 *
 * <p>The eventFE client requires PKCE (the IAM manifest declares it). The
 * login and signup pages used to build the Keycloak URL by hand without a
 * code challenge; once IAM applied the manifest, Keycloak refused every one of
 * those requests before Google was ever shown — and the callback page, not
 * recognising the error, fell through to the email-code form with no address.
 *
 * <p>One place builds the URL now, so the two pages cannot drift apart again.
 * The verifier lives in sessionStorage between the redirect out and the
 * redirect back: it has to survive a full page load, and nothing else needs it.
 */

const VERIFIER_KEY = 'google_pkce_verifier'
const INTENT_KEY = 'google_oauth_intent'
const PENDING_KEY = 'google_oauth_pending'

/** RFC 7636 allows 43–128 characters; 32 random bytes encode to 43. */
const VERIFIER_BYTES = 32

const TOKEN_KEYS = ['access_token', 'refresh_token', 'id_token', 'onboarding_state_v1']

/** Where Keycloak sends the browser back to, in both directions of the flow. */
export function callbackUri(lang) {
  return `${window.location.origin}/${lang}/auth/verify-email`
}

/** The Keycloak realm and public client, fixed outside local development. */
export function keycloakClientConfig() {
  const env = getRuntimeEnv()
  const appEnv = (env.APP_ENV || detectDefaultEnvFromLocation()).toString().toLowerCase()
  const isLocal = appEnv === 'local'
  return {
    keycloakUrl: isLocal ? env.VITE_KEYCLOAK_URL || computeKeycloakBaseUrl(appEnv) : computeKeycloakBaseUrl(appEnv),
    realm: isLocal ? env.VITE_KEYCLOAK_REALM || 'event-app' : 'event-app',
    clientId: isLocal ? env.VITE_KEYCLOAK_CLIENT_ID || 'eventFE' : 'eventFE',
  }
}

function base64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function createCodeVerifier() {
  return base64Url(globalThis.crypto.getRandomValues(new Uint8Array(VERIFIER_BYTES)))
}

/** S256: the base64url SHA-256 of the verifier. */
export async function codeChallengeFor(verifier) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64Url(new Uint8Array(digest))
}

/**
 * The Keycloak authorize URL that goes straight to Google, with a fresh PKCE
 * pair. The verifier is stored for {@link takeCodeVerifier}.
 */
export async function googleAuthUrl(lang) {
  const { keycloakUrl, realm, clientId } = keycloakClientConfig()
  const verifier = createCodeVerifier()
  sessionStorage.setItem(VERIFIER_KEY, verifier)

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUri(lang),
    response_type: 'code',
    scope: 'openid',
    kc_idp_hint: 'google',
    code_challenge: await codeChallengeFor(verifier),
    code_challenge_method: 'S256',
  })
  return `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth?${params}`
}

/** The verifier for the code being exchanged — readable once, then gone. */
export function takeCodeVerifier() {
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)
  return verifier
}

/**
 * Starts the Google flow from the login or signup page.
 *
 * <p>With a Keycloak session already open, it is ended first by a full
 * redirect; the page it returns to picks the flow up again through
 * {@link resumePendingGoogleSignIn}. Otherwise the browser goes to Google now.
 *
 * @param intent 'login' lands on the dashboard afterwards, 'signup' on event creation
 * @param returnPath the page to come back to after signing out, e.g. 'auth/login'
 */
export async function startGoogleSignIn({ lang, intent, returnPath }) {
  const idToken = localStorage.getItem('id_token')
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key))
  sessionStorage.setItem(INTENT_KEY, intent)

  if (idToken) {
    const { keycloakUrl, realm } = keycloakClientConfig()
    sessionStorage.setItem(PENDING_KEY, '1')
    const params = new URLSearchParams({
      id_token_hint: idToken,
      post_logout_redirect_uri: `${window.location.origin}/${lang}/${returnPath}`,
    })
    window.location.href = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout?${params}`
    return
  }

  window.location.href = await googleAuthUrl(lang)
}

/** Continues a Google sign-in that had to sign out first. */
export function resumePendingGoogleSignIn(start) {
  if (!sessionStorage.getItem(PENDING_KEY)) return false
  sessionStorage.removeItem(PENDING_KEY)
  start()
  return true
}

/** 'login' or 'signup', read once when the flow returns. */
export function takeGoogleIntent() {
  const intent = sessionStorage.getItem(INTENT_KEY)
  sessionStorage.removeItem(INTENT_KEY)
  return intent
}
