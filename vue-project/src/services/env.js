// Shared environment utilities

/**
 * Each environment: where its backends live (`api.`/`iam.`/`auth.` + root) and
 * the domain its sites are served one label under.
 *
 * Production serves both from ivyevents.mk; test serves its app, backends and
 * sites from test.ivyevents.mk (`<label>.test.ivyevents.mk`).
 * Test comes first: its names also end in `.ivyevents.mk`.
 */
const ENVIRONMENTS = [
  { root: 'test.ivyevents.mk', sites: 'test.ivyevents.mk' },
  { root: 'ivyevents.mk', sites: 'ivyevents.mk' },
];

/** Names directly under ivyevents.mk that are environments, never somebody's site. */
const ENVIRONMENT_LABELS = new Set(['test', 'dev']);

/** A label one level under `domain`, or null. */
function labelUnder(host, domain) {
  if (!host.endsWith(`.${domain}`)) return null;
  const label = host.slice(0, -(domain.length + 1));
  return label && !label.includes('.') ? label : null;
}

function environmentOf(host) {
  const h = String(host || '').toLowerCase();
  for (const env of ENVIRONMENTS) {
    if (h === env.root || h === env.sites) return env;
    const siteLabel = labelUnder(h, env.sites);
    if (siteLabel && !(env.sites === 'ivyevents.mk' && ENVIRONMENT_LABELS.has(siteLabel))) return env;
  }
  return null;
}

/**
 * The root whose `api.`/`iam.`/`auth.` hosts serve this page, whether it is the
 * app itself or one of the sites. Without it a page on `ana-marko.ivyevents.mk`
 * asked `https://ana-marko.ivyevents.mk:8282` for its data.
 *
 * @returns 'test.ivyevents.mk' | 'ivyevents.mk' | null
 */
export function platformRootOf(host) {
  return environmentOf(host)?.root ?? null;
}

/**
 * The domain sites are served under in the environment this page belongs to.
 *
 * @returns 'test.ivyevents.mk' | 'ivyevents.mk' | null
 */
export function siteDomainOf(host) {
  return environmentOf(host)?.sites ?? null;
}

// Detect default APP_ENV based on current location hostname when APP_ENV is missing/unresolved
// Mapping:
// - localhost/127.0.0.1/::1, private LAN IPs (10.x, 172.16-31.x, 192.168.x), 0.0.0.0, and *.local -> local
// - test.ivyevents.mk -> test
// - ivyevents.mk -> prod
// - any other host -> prod (sensible safe default)
export function detectDefaultEnvFromLocation() {
  if (typeof window === 'undefined') return 'local';
  const host = ((window.location && window.location.hostname) || '').toLowerCase();
  if (!host) return 'local';
  const isLocalName = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1' || host.endsWith('.local');
  const isPrivateIPv4 = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host);
  if (isLocalName || isPrivateIPv4) return 'local';
  if (platformRootOf(host) === 'test.ivyevents.mk') return 'test';
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
    VITE_KEYCLOAK_CLIENT_ID: pick('VITE_KEYCLOAK_CLIENT_ID'),
    // Read by vendorHost.platformDomain(); left out, an explicit setting was ignored.
    VITE_PLATFORM_DOMAIN: pick('VITE_PLATFORM_DOMAIN')
  };
}

// Compute default public Keycloak base URL per environment
export function computeKeycloakBaseUrl(appEnv) {
  // Local development default
  if (appEnv === 'local') return 'http://localhost:8181';
  // Test & Prod defaults based on host
  if (typeof window !== 'undefined') {
    const host = ((window.location && window.location.hostname) || '').toLowerCase();
    const root = platformRootOf(host);
    if (root) return `https://auth.${root}`;
  }
  // Sensible fallback to prod public auth
  return 'https://auth.ivyevents.mk';
}
