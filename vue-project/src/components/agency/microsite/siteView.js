/**
 * Small readers shared by the four agency layouts.
 *
 * <p>The API sends images as storage keys plus one `imageUrls` map, so a
 * layout looks a key up here rather than each one knowing the shape.
 */

/** How many placeholder tints the stylesheet defines (`am-tint-0` …). */
export const TINTS = 6

export function imageOf(site, key) {
  if (!key) return null
  return site?.imageUrls?.[key] ?? null
}

export function firstPhoto(project) {
  return project?.media?.[0]?.url ?? null
}

/** 1 → "01", as the designs number services and steps. */
export function pad(index) {
  return String(index + 1).padStart(2, '0')
}

/** "Конференција · Скопје" — what a project card says under its title. */
export function projectMeta(project) {
  return [project?.eventType, project?.city].filter(Boolean).join(' · ')
}

/**
 * Scrolls to a section of the page.
 *
 * <p>Not a plain `href="#…"`: the router would see the hash change as a
 * navigation and its scroll behaviour would put the page back at the top.
 */
export function jumpTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
