import { readonly, ref } from 'vue'

/**
 * Light / dark, as the 2026 redesign defines it.
 *
 * Three states, not two. "system" is the default and is not a value the app
 * computes — the stylesheet answers it with `prefers-color-scheme`, so nothing
 * here has to know what the OS is set to. Only an explicit choice is stored,
 * as `data-theme` on <html>, which the stylesheet lets win in both directions.
 *
 * The same read runs inline in `index.html` before the first paint. This module
 * does not repeat it on load: by the time the bundle executes the attribute is
 * already on the element, and re-applying it from here would be a second source
 * of truth for the same fact. It reads the attribute back instead.
 */

const STORAGE_KEY = 'ivy-theme'

/** Module-level, so every toggle on the page agrees without a store. */
const choice = ref(readStoredChoice())

function readStoredChoice() {
  const attr = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')
  return attr === 'dark' || attr === 'light' ? attr : 'system'
}

/**
 * The OS answer, kept in a ref rather than read on demand, so a viewer on
 * "system" who flips their OS theme sees the label on the toggle follow. A
 * plain `matchMedia().matches` read would be correct once and stale after.
 */
const systemDark = ref(false)

if (typeof window !== 'undefined' && window.matchMedia) {
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  systemDark.value = query.matches
  query.addEventListener('change', (e) => {
    systemDark.value = e.matches
  })
}

/**
 * What the viewer is actually looking at — the choice, or the system answer
 * when there is no choice. A toggle needs this, not the choice: "Dark theme"
 * is the wrong label on a page that is already dark because the OS is.
 */
export function resolvedTheme() {
  return choice.value === 'system' ? (systemDark.value ? 'dark' : 'light') : choice.value
}

/** Set an explicit theme, or pass `'system'` to hand the question back. */
export function setTheme(value) {
  const next = value === 'dark' || value === 'light' ? value : 'system'
  choice.value = next

  if (typeof document !== 'undefined') {
    if (next === 'system') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', next)
  }

  try {
    if (next === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Private mode, or storage blocked. The attribute is already applied, so
    // the theme is right for this page view and simply will not be remembered
    // — which is a better outcome than refusing to switch at all.
  }
}

/** Flip to the opposite of what is on screen now. */
export function toggleTheme() {
  setTheme(resolvedTheme() === 'dark' ? 'light' : 'dark')
}

export function useTheme() {
  return { theme: readonly(choice), resolvedTheme, setTheme, toggleTheme }
}
