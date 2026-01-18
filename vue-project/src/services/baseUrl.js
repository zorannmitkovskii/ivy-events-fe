// Central place to get the backend base URL (host + port), configured at RUNTIME via window.__ENV__
// Fallbacks:
// - local: default to http://localhost:8081
// - test/prod: default to window.location.origin (same host serving FE)
import { detectDefaultEnvFromLocation } from './env'
const runtimeEnv = (typeof window !== 'undefined' && window.__ENV__) || {};

// Helper to determine if a value looks like an unresolved template placeholder (e.g., "${VITE_API_BASE_URL}")
function isUnresolvedTemplate(val) {
  return typeof val === 'string' && /\$\{[^}]+\}/.test(val);
}

// Determine app environment (default intelligently based on host)
const rawAppEnv = runtimeEnv.APP_ENV;
const appEnv = isUnresolvedTemplate(rawAppEnv)
  ? detectDefaultEnvFromLocation()
  : String(rawAppEnv || detectDefaultEnvFromLocation()).toLowerCase();
const isLocal = appEnv === 'local';

const runtimeUrl = runtimeEnv.VITE_API_BASE_URL;
let effectiveUrl;
if (!runtimeUrl || isUnresolvedTemplate(runtimeUrl)) {
  if (isLocal) {
    effectiveUrl = 'http://localhost:8081';
  } else {
    // In test/prod, fall back to same origin serving the FE to avoid localhost calls
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) || '';
    effectiveUrl = origin || 'http://localhost:8081'; // last resort
  }
} else {
  effectiveUrl = runtimeUrl;
}

const baseUrl = String(effectiveUrl).replace(/\/$/, '');

export { baseUrl };
export default baseUrl;
