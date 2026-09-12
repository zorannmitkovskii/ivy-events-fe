import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

/**
 * Light, dark, and the third state people forget (the 2026 redesign).
 *
 * <p>"System" is not a value the app computes — the stylesheet answers it with
 * `prefers-color-scheme`. What this file guards is that the app never writes it
 * down as though it were a choice, because an attribute of `light` on the root
 * pins a viewer to light forever, including the ones who only ever wanted their
 * OS to decide.
 */

/** A fresh module per test: the choice is module-level state on purpose. */
async function loadTheme() {
  vi.resetModules()
  return import('@/composables/useTheme')
}

function stubMatchMedia(dark) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: dark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
}

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme')
  localStorage.clear()
  stubMatchMedia(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('what the app starts on', () => {
  it('reads the attribute the inline script already applied, rather than the storage', async () => {
    // The <head> script runs before the bundle. Reading storage again here
    // would be a second source of truth for one fact.
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.setItem('ivy-theme', 'light')

    const { useTheme } = await loadTheme()

    expect(useTheme().theme.value).toBe('dark')
  })

  it('is "system" when nothing was chosen', async () => {
    const { useTheme } = await loadTheme()

    expect(useTheme().theme.value).toBe('system')
  })
})

describe('what the viewer is looking at', () => {
  it('follows the OS when the choice is "system"', async () => {
    stubMatchMedia(true)
    const { resolvedTheme } = await loadTheme()

    expect(resolvedTheme()).toBe('dark')
  })

  it('follows the choice over the OS, in both directions', async () => {
    stubMatchMedia(true)
    const { setTheme, resolvedTheme } = await loadTheme()

    setTheme('light')

    // The one that used to be wrong: choosing light while the OS is dark has
    // to actually get light, which needs the attribute and not just the absence
    // of one.
    expect(resolvedTheme()).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})

describe('toggling', () => {
  it('flips to the opposite of what is on screen, not of what was stored', async () => {
    stubMatchMedia(true)
    const { toggleTheme, resolvedTheme } = await loadTheme()

    toggleTheme()

    expect(resolvedTheme()).toBe('light')
  })

  it('remembers the choice', async () => {
    const { setTheme } = await loadTheme()

    setTheme('dark')

    expect(localStorage.getItem('ivy-theme')).toBe('dark')
  })

  it('handing the question back to the OS clears both the attribute and the store', async () => {
    const { setTheme } = await loadTheme()
    setTheme('dark')

    setTheme('system')

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    expect(localStorage.getItem('ivy-theme')).toBeNull()
  })
})

describe('when storage is not available', () => {
  it('still switches the theme, and simply does not remember it', async () => {
    // A private window, or a browser set to block site data. Refusing to
    // switch at all would be a worse answer than switching and forgetting.
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked')
    })

    const { setTheme, resolvedTheme } = await loadTheme()
    setTheme('dark')

    expect(resolvedTheme()).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    setItem.mockRestore()
  })
})
