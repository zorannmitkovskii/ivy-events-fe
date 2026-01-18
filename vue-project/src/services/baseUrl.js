// Central place to get the backend base URL (host + port), configured at RUNTIME via window.__ENV__
// Fallbacks:
// - local: default to http://localhost:8081
// - test/prod: default to same host but BE port 8081 (e.g., https://ivyevents.mk:8081) to avoid hitting FE Nginx
import { detectDefaultEnvFromLocation } from './env'
const runtimeEnv = (typeof window !== 'undefined' && window.__ENV__) || {};

// Helper to determine if a value looks like an unresolved template placeholder (e.g., "${VITE_API_BASE_URL}")
function isUnresolvedTemplate(val) {
  return typeof val === 'string' && /\$\{[^}]+\}/.test(val);
}

// Compute a safe default API base URL for non-local envs when not explicitly provided
function computeDefaultApiBaseUrl(env) {
  if (env === 'local') return 'http://localhost:8081';
  if (typeof window === 'undefined') return 'http://localhost:8081';
  const host = ((window.location && window.location.hostname) || '').toLowerCase();
  // Prefer dedicated public API domains to avoid hitting the FE Nginx and to keep HTTPS
  if (host === 'ivyevents.mk') return 'https://api.ivyevents.mk';
  if (host === 'test.ivyevents.mk') return 'https://api.test.ivyevents.mk';
  // Fallback: use same origin with backend port 8081 (may require CORS/SSL on that port)
  const { protocol, hostname } = window.location || {};
  const usedProtocol = protocol || 'https:';
  const usedHost = hostname || 'localhost';
  return `${usedProtocol}//${usedHost}:8081`;
}

const rawAppEnv = runtimeEnv.APP_ENV;
const appEnv = isUnresolvedTemplate(rawAppEnv)
  ? detectDefaultEnvFromLocation()
  : String(rawAppEnv || detectDefaultEnvFromLocation()).toLowerCase();
const isLocal = appEnv === 'local';

const runtimeUrl = runtimeEnv.VITE_API_BASE_URL;
let effectiveUrl;
if (!runtimeUrl || isUnresolvedTemplate(runtimeUrl)) {
  effectiveUrl = computeDefaultApiBaseUrl(appEnv);
} else {
  effectiveUrl = runtimeUrl;
}

const baseUrl = String(effectiveUrl).replace(/\/$/, '');

export { baseUrl };
export default baseUrl;
