// Central place to get the backend base URL (host + port), configured at RUNTIME via window.__ENV__
// Fallback to localhost for local development if not provided
const runtimeEnv = (typeof window !== 'undefined' && window.__ENV__) || {};

// Helper to determine if a value looks like an unresolved template placeholder (e.g., "${VITE_API_BASE_URL}")
function isUnresolvedTemplate(val) {
  return typeof val === 'string' && /\$\{[^}]+\}/.test(val);
}

const runtimeUrl = runtimeEnv.VITE_API_BASE_URL;
const effectiveUrl = !runtimeUrl || isUnresolvedTemplate(runtimeUrl)
  ? 'http://localhost:8081'
  : runtimeUrl;

const baseUrl = effectiveUrl.replace(/\/$/, '');

export { baseUrl };
export default baseUrl;
