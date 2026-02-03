export function can(user, permission) {
  if (!permission) return true
  const perms = (user && (user.permissions || user.roles)) || []
  return Array.isArray(perms) ? perms.includes(permission) : false
}

export function requireRole(user, role) {
  if (!role) return true
  const roles = (user && user.roles) || []
  return Array.isArray(roles) ? roles.includes(role) : false
}
