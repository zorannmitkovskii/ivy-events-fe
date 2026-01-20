// Shared environment utilities
// Detect default APP_ENV based on current location hostname when APP_ENV is missing/unresolved
// Mapping:
// - localhost/127.0.0.1 -> local
// - test.ivyevents.mk -> test
// - ivyevents.mk -> prod
// - any other host -> prod (sensible safe default)
export function detectDefaultEnvFromLocation() {
  if (typeof window === 'undefined') return 'local';
  const host = ((window.location && window.location.hostname) || '').toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') return 'local';
  if (host === 'test.ivyevents.mk') return 'test';
  if (host === 'ivyevents.mk') return 'prod';
  return 'prod';
}

// Helper to detect unresolved placeholders like ${VAR}
function isUnresolvedTemplate(val) {
  return typeof val === 'string' && /\$\{[^}]+\}/.test(val);
}

// Get runtime env object from window.__ENV__ with fallback to import.meta.env
export function getRuntimeEnv() {
  const winEnv = (typeof window !== 'undefined' && window.__ENV__) || {};
  // Normalize and fallback to import.meta.env when winEnv values are missing or placeholders
  const viteEnv = (typeof import.meta !== 'undefined' && import.meta && import.meta.env) || {};
  function pick(key) {
    const val = winEnv[key];
    if (val == null || isUnresolvedTemplate(val)) {
      return viteEnv[key];
    }
    return val;
  }
  return {
    APP_ENV: pick('APP_ENV'),
    VITE_API_BASE_URL: pick('VITE_API_BASE_URL'),
    VITE_KEYCLOAK_URL: pick('VITE_KEYCLOAK_URL'),
    VITE_KEYCLOAK_REALM: pick('VITE_KEYCLOAK_REALM'),
    VITE_KEYCLOAK_CLIENT_ID: pick('VITE_KEYCLOAK_CLIENT_ID')
  };
}

// Compute default public Keycloak base URL per environment
export function computeKeycloakBaseUrl(appEnv) {
  // Local development default
  if (appEnv === 'local') return 'http://localhost:8080';
  // Test & Prod defaults based on host
  if (typeof window !== 'undefined') {
    const host = ((window.location && window.location.hostname) || '').toLowerCase();
    if (host === 'test.ivyevents.mk') return 'https://auth.test.ivyevents.mk';
    if (host === 'ivyevents.mk') return 'https://auth.ivyevents.mk';
  }
  // Sensible fallback to prod public auth
  return 'https://auth.ivyevents.mk';
}
