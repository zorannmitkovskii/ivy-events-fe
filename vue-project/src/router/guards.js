// Optional route guards (auth / role)
// Wire these in router.beforeEach if/when you add real auth state

export function requiresAuth(to) {
  return Boolean(to.meta && to.meta.requiresAuth)
}

export function guestOnly(to) {
  return Boolean(to.meta && to.meta.guestOnly)
}

export function hasRole(userRoles = [], required) {
  if (!required) return true
  if (!Array.isArray(userRoles)) return false
  return userRoles.includes(required)
}
