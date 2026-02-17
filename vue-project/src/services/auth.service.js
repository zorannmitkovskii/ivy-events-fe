import apiPublic from "./backendApi";
import { getRuntimeEnv, detectDefaultEnvFromLocation, computeKeycloakBaseUrl } from '@/services/env';

export function isAuthenticated() {
  return !!localStorage.getItem("access_token");
}

// Parse the JWT payload and return a claim
function parseToken() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function getUserId() {
  return parseToken()?.sub || null;
}

export function getUsername() {
  return parseToken()?.preferred_username || null;
}

export function getEventId() {
  return parseToken()?.eventId || null;
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
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("onboarding_state_v1");
  sessionStorage.clear();
}

// Register new user via public endpoint
// payload: { email, password, firstName, lastName, ... }
export async function register(payload) {
  // BE expects CreateUserRequest at /public/users/register
  const res = await apiPublic.post("/public/users/register", payload);
  return res?.data || res; // backendApi returns AxiosResponse; normalize
}

// Verify email with code
export async function verifyEmail(code, email) {
  const body = { code, email };
  const res = await apiPublic.post("/public/auth/verify-email", body);
  return res?.data || res;
}

// Login via BE – BE calls Keycloak token endpoint on our behalf
export async function loginWithCredentials(username, password) {
  const res = await apiPublic.post("/public/users/login", { username, password });
  const data = res?.data || res;

  // Handle both snake_case (Keycloak) and camelCase (Spring) response fields
  const accessToken = data.access_token || data.accessToken;
  const refreshToken = data.refresh_token || data.refreshToken;

  if (accessToken) {
    localStorage.setItem('access_token', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }

  return data;
}

// Assign a role to a user by email (e.g. after Google OAuth registration)
export async function assignRole(email, role = "USER") {
  const res = await apiPublic.post("/public/users/assign-role", { email, role });
  return res?.data || res;
}

// Refresh tokens via Keycloak so the new role appears in the JWT
export async function refreshAccessToken() {
  const storedRefresh = localStorage.getItem("refresh_token");
  if (!storedRefresh) throw new Error("No refresh token");

  const env = getRuntimeEnv();
  const appEnv = (env.APP_ENV || detectDefaultEnvFromLocation()).toString().toLowerCase();
  const keycloakUrl = appEnv !== 'local'
    ? computeKeycloakBaseUrl(appEnv)
    : (env.VITE_KEYCLOAK_URL || computeKeycloakBaseUrl(appEnv));
  const realm = appEnv !== 'local' ? 'event-app' : (env.VITE_KEYCLOAK_REALM || 'event-app');
  const clientId = appEnv !== 'local' ? 'eventFE' : (env.VITE_KEYCLOAK_CLIENT_ID || 'eventFE');

  const tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;

  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', storedRefresh);
  params.append('client_id', clientId);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!response.ok) throw new Error('Token refresh failed');

  const data = await response.json();

  if (data.access_token) localStorage.setItem('access_token', data.access_token);
  if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);

  return data;
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

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!response.ok) {
    throw new Error('Token exchange failed');
  }

  const data = await response.json();

  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token);
  }
  if (data.refresh_token) {
    localStorage.setItem('refresh_token', data.refresh_token);
  }

  return data;
}
