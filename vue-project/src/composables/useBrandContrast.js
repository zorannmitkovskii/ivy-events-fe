/**
 * Whether a palette is readable (IVY-1004).
 *
 * <p>Checked here as well as on the server, and for a different reason: the
 * server refuses a saved palette, this tells somebody why while they are still
 * choosing it. A brand picker that only fails on save is a brand picker people
 * fight with.
 *
 * <p>WCAG 2.1 relative luminance and the 4.5:1 threshold for body text. Not a
 * house rule — the number is the one an accessibility audit will use.
 */

const AA_NORMAL_TEXT = 4.5

export function parseHex(hex) {
  if (typeof hex !== 'string') return null
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return null
  const value = parseInt(match[1], 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

/** Per WCAG: sRGB channels are linearised before they are weighted. */
export function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Null when either colour is not a six-digit hex — unknown, not "fine". */
export function contrastRatio(foreground, background) {
  const fg = parseHex(foreground)
  const bg = parseHex(background)
  if (!fg || !bg) return null

  const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg))
  const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg))
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * @returns {{ratio: number|null, passes: boolean}} `passes` is false when the
 *   ratio is unknown. Fail-closed: an unparseable colour is not a colour that
 *   has been checked.
 */
export function checkContrast(foreground, background) {
  const ratio = contrastRatio(foreground, background)
  return {
    ratio: ratio === null ? null : Math.round(ratio * 100) / 100,
    passes: ratio !== null && ratio >= AA_NORMAL_TEXT,
  }
}

export { AA_NORMAL_TEXT }
