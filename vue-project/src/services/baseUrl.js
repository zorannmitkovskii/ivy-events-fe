// Central place to get the backend base URL (host + port), configured at RUNTIME via window.__ENV__
// Fallbacks:
// - local: default to current host with port 8081 (e.g., http://localhost:8081 or http://<lan-ip>:8081) for real-device testing
// - test/prod: default to same host but BE port 8081 or dedicated public API domains to avoid hitting FE Nginx
import { detectDefaultEnvFromLocation, getRuntimeEnv } from './env'
const runtimeEnv = getRuntimeEnv();

// Helper to determine if a value looks like an unresolved template placeholder (e.g., "${VITE_API_BASE_URL}")
function isUnresolvedTemplate(val) {
  return typeof val === 'string' && /\$\{[^}]+\}/.test(val);
}

// Helper to detect localhost/loopback URLs
function isLocalhostUrl(url) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(String(url));
}

// Compute a safe default API base URL when not explicitly provided
function computeDefaultApiBaseUrl(env) {
  // Server-side rendering or unknown window
  if (typeof window === 'undefined') return 'http://localhost:8081';

  const { protocol, hostname } = window.location || {};
  const usedProtocol = protocol || (env === 'local' ? 'http:' : 'https:');
  const usedHost = (hostname || 'localhost').toLowerCase();
  if (env === 'local') {
    // Use the current host so mobile devices on the same LAN can reach the backend
    return `${usedProtocol}//${usedHost}:8081`;
  }

  // Prefer dedicated public API domains in known environments
  if (usedHost === 'ivyevents.mk')  {
    return 'https://api.ivyevents.mk'
  };
  if (usedHost === 'test.ivyevents.mk')  {
    return 'https://api.test.ivyevents.mk'
  };

  // Fallback: use same origin with backend port 8081 (may require CORS/SSL on that port)
  return `${usedProtocol}//${usedHost}:8081`;
}

const rawAppEnv = runtimeEnv.APP_ENV;
const appEnv = isUnresolvedTemplate(rawAppEnv)
  ? detectDefaultEnvFromLocation()
  : String(rawAppEnv || detectDefaultEnvFromLocation()).toLowerCase();

const runtimeUrl = runtimeEnv.VITE_API_BASE_URL;
let effectiveUrl;
if (appEnv !== 'local') {
  // In test/prod, always derive the API URL from the current hostname.
  // This prevents a prod URL baked at build time from being used on test.
  effectiveUrl = computeDefaultApiBaseUrl(appEnv);
} else if (!runtimeUrl || isUnresolvedTemplate(runtimeUrl)) {
  effectiveUrl = computeDefaultApiBaseUrl(appEnv);
} else if (typeof window !== 'undefined') {
  // Special handling for local dev when accessing the app via LAN IP/hostname.
  // If Vite provided a localhost URL but the current page host is not localhost,
  // prefer the current host so real devices can reach the backend.
  try {
    const { protocol, hostname } = window.location || {};
    const pageHost = (hostname || '').toLowerCase();
    const isLocalPageHost = pageHost === 'localhost' || pageHost === '127.0.0.1';
    if (!isLocalPageHost && isLocalhostUrl(runtimeUrl)) {
      const usedProtocol = protocol || 'http:';
      effectiveUrl = `${usedProtocol}//${pageHost}:8081`;
    } else {
      effectiveUrl = runtimeUrl;
    }
  } catch (_) {
    effectiveUrl = runtimeUrl;
  }
} else {
  effectiveUrl = runtimeUrl;
}

const baseUrl = String(effectiveUrl).replace(/\/$/, '');

export { baseUrl };
export default baseUrl;
