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
