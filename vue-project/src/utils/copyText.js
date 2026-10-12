/**
 * Copies `text` to the clipboard. Resolves `true` when it was copied.
 *
 * Uses the async Clipboard API when the page may use it (secure context), and
 * otherwise — or when it is refused (permissions, an older/in-app browser) —
 * falls back to selecting a hidden textarea and `document.execCommand('copy')`.
 * Focus goes back to where it was, so a keyboard or screen-reader user stays
 * on the button they pressed. Never throws.
 */
export async function copyText(text) {
  if (typeof text !== 'string' || !text) return false
  const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : null
  if (clipboard && typeof clipboard.writeText === 'function' && window.isSecureContext !== false) {
    try {
      await clipboard.writeText(text)
      return true
    } catch {
      // Refused or unavailable — try the legacy way below.
    }
  }
  return legacyCopy(text)
}

function legacyCopy(text) {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') return false
  const active = document.activeElement
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.setAttribute('aria-hidden', 'true')
  area.style.position = 'fixed'
  area.style.top = '0'
  area.style.left = '0'
  area.style.opacity = '0'
  document.body.appendChild(area)
  let ok = false
  try {
    area.focus({ preventScroll: true })
    area.select()
    area.setSelectionRange(0, text.length)
    ok = document.execCommand('copy') === true
  } catch {
    ok = false
  } finally {
    area.remove()
    if (active && typeof active.focus === 'function') active.focus()
  }
  return ok
}
