// Central place to get the backend base URL (host + port), configured at RUNTIME via window.__ENV__
// Fallback to localhost for local development if not provided
const runtimeEnv = (typeof window !== 'undefined' && window.__ENV__) || {};
const baseUrl = (runtimeEnv.VITE_API_BASE_URL || 'http://localhost:8081').replace(/\/$/, '');

export { baseUrl };
export default baseUrl;
