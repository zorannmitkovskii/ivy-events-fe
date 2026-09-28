import apiPublic from "./backendApi";
import iamApi from "./iamApi";
import { scheduleProactiveRefresh } from "./api";
import { getRuntimeEnv, detectDefaultEnvFromLocation, computeKeycloakBaseUrl } from '@/services/env';
import { claimOnboardingFor } from '@/store/onboarding.store';
import { decodeJwtPayload } from '@/services/jwt';
import { takeCodeVerifier } from '@/services/googleOAuth';
import { refreshTokens } from '@/services/tokenRefresh';

export function isAuthenticated() {
  return !!localStorage.getItem("access_token");
}

/** The access token's claims, or null when there is no usable token. */
function parseToken() {
  return decodeJwtPayload(localStorage.getItem("access_token"));
}

export function getUserId() {
  return parseToken()?.sub || null;
}

export function getUsername() {
  return parseToken()?.preferred_username || null;
}

// The eventIds claim was removed in IVY-101 — access is a row in event_access,
// not something the token carries. Which events a person can open now comes
// from the backend; see eventSelection.service.js.

export function getPackages() {
  const claims = parseToken();
  if (!claims) return [];
  const pkgs = claims.packages;
  if (Array.isArray(pkgs)) return pkgs;
  if (typeof pkgs === 'string') return [pkgs];
  return [];
}

export function getRoles() {
  const claims = parseToken();
  return claims?.realm_access?.roles || [];
}

export function hasRole(role) {
  return getRoles().includes(role);
}

export function getFullName() {
  const claims = parseToken();
  if (!claims) return null;
  const name = [claims.given_name, claims.family_name].filter(Boolean).join(" ");
  return name || claims.preferred_username || null;
}

export function logout() {
  // Silently end the Keycloak session via hidden iframe before clearing tokens
  silentKeycloakLogout();

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("id_token");
  localStorage.removeItem("onboarding_state_v1");
  // The marker too. Left behind, the next sign-in compares against a subject
  // whose state is already gone and skips a clear it no longer needs — harmless
  // today, and exactly the sort of half-cleared pair that stops being harmless.
  localStorage.removeItem("onboarding_owner_v1");
  sessionStorage.clear();

  // The check-in device holds a guest list and unsent arrivals in IndexedDB
  // (IVY-602). A venue tablet handed to the next shift must not still be
  // carrying the last event's names. Fire-and-forget: signing out cannot be
  // made to wait on a database that will not open, and a failure here must not
  // leave somebody signed in.
  clearCheckInDevice();
}

function clearCheckInDevice() {
  import("@/services/checkinQueue")
    .then(({ checkinQueue }) => checkinQueue.clearAll())
    // Nothing to clear, or no IndexedDB in this browser. Either way, signing
    // out has already happened and there is nothing to report.
    .catch(() => null);
}

/**
 * Silently ends the Keycloak SSO session using a hidden iframe.
 * The id_token_hint lets Keycloak skip the confirmation screen.
 */
function silentKeycloakLogout() {
  const idToken = localStorage.getItem("id_token");
  if (!idToken) return;

  const env = getRuntimeEnv();
  const appEnv = (env.APP_ENV || detectDefaultEnvFromLocation()).toString().toLowerCase();
  const keycloakUrl = appEnv !== 'local'
    ? computeKeycloakBaseUrl(appEnv)
    : (env.VITE_KEYCLOAK_URL || computeKeycloakBaseUrl(appEnv));
  const realm = appEnv !== 'local' ? 'event-app' : (env.VITE_KEYCLOAK_REALM || 'event-app');

  const logoutUrl =
    `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout` +
    `?id_token_hint=${encodeURIComponent(idToken)}`;

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = logoutUrl;
  document.body.appendChild(iframe);
  setTimeout(() => { try { iframe.remove(); } catch (_) {} }, 5000);
}

// Register new user via public endpoint
// payload: { email, password, firstName, lastName, ... }
export async function register(payload) {
  // BE expects CreateUserRequest at /public/users/register
  const res = await iamApi.post("/public/users/register", payload);
  return res?.data || res; // backendApi returns AxiosResponse; normalize
}

// Verify email with code
export async function verifyEmail(code, email) {
  const body = { code, email };
  const res = await iamApi.post("/public/auth/verify-email", body);
  return res?.data || res;
}

// Login via BE – BE calls Keycloak token endpoint on our behalf
export async function loginWithCredentials(email, password) {
  const res = await iamApi.post("/public/users/login", { username: email, password });
  const data = res?.data || res;

  // Handle both snake_case (Keycloak) and camelCase (Spring) response fields
  const accessToken = data.access_token || data.accessToken;
  const refreshToken = data.refresh_token || data.refreshToken;
  const idToken = data.id_token || data.idToken;

  if (accessToken) localStorage.setItem('access_token', accessToken);
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
  if (idToken) localStorage.setItem('id_token', idToken);

  // After the token is stored, so the subject read here is the one that just
  // signed in. Signing out was the only thing that cleared onboarding before,
  // so any session ending another way — an expired token, a closed browser, a
  // second account on the same machine — handed the next person the previous
  // one's eventId, and their first save went to somebody else's event.
  claimOnboardingFor(getUserId());

  scheduleProactiveRefresh();
  return data;
}

export async function changePassword(email, currentPassword, newPassword) {
  const res = await iamApi.post("/public/users/change-password", {
    email, currentPassword, newPassword
  });
  return res?.data || res;
}

// Assign a role to a user by email (e.g. after Google OAuth registration)
export async function assignRole(email, role = "USER") {
  const res = await apiPublic.post("/public/users/assign-role", { email, role });
  return res?.data || res;
}

// Refresh tokens via Keycloak so the new role appears in the JWT
export async function refreshAccessToken() {
  const data = await refreshTokens();
  scheduleProactiveRefresh();
  return data;
}

// Request password reset code
export async function requestPasswordReset(email) {
  const res = await iamApi.post("/public/auth/password-reset/request", { email });
  return res?.data || res;
}

// Confirm password reset with code + new password
export async function confirmPasswordReset(email, code, newPassword) {
  const res = await iamApi.post("/public/auth/password-reset/confirm", { email, code, newPassword });
  return res?.data || res;
}

// Exchange Keycloak authorization code for tokens (Google OAuth callback)
export async function exchangeOAuthCode(code, redirectUri) {
  const env = getRuntimeEnv();
  const rawAppEnv = env.APP_ENV;
  const appEnv = (rawAppEnv || detectDefaultEnvFromLocation()).toString().toLowerCase();

  // Resolve Keycloak URL using hostname-based logic (same as keycloak.js)
  let keycloakUrl;
  if (appEnv !== 'local') {
    keycloakUrl = computeKeycloakBaseUrl(appEnv);
  } else {
    const url = env.VITE_KEYCLOAK_URL;
    if (typeof url === 'string' && url.trim() && !/\$\{[^}]+\}/.test(url)) {
      keycloakUrl = url;
    } else {
      keycloakUrl = computeKeycloakBaseUrl(appEnv);
    }
  }

  // Non-local envs always use canonical realm/clientId — prevents Docker misconfiguration
  const realm = appEnv !== 'local' ? 'event-app' : (env.VITE_KEYCLOAK_REALM || 'event-app');
  const clientId = appEnv !== 'local' ? 'eventFE' : (env.VITE_KEYCLOAK_CLIENT_ID || 'eventFE');

  const tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('client_id', clientId);
  params.append('redirect_uri', redirectUri);
  // PKCE: the client requires it, and Keycloak refuses the code without the
  // verifier its challenge was made from.
  const verifier = takeCodeVerifier();
  if (verifier) params.append('code_verifier', verifier);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!response.ok) {
    throw new Error('Token exchange failed');
  }

  const data = await response.json();

  if (data.access_token) localStorage.setItem('access_token', data.access_token);
  if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
  if (data.id_token) localStorage.setItem('id_token', data.id_token);

  scheduleProactiveRefresh();
  return data;
}
