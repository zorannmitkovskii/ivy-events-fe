import { describe, it, expect } from 'vitest'
import {
  checkContrast, contrastRatio, parseHex, relativeLuminance, AA_NORMAL_TEXT,
} from '@/composables/useBrandContrast'

/**
 * Palette readability (IVY-1004).
 *
 * <p>The numbers here are the ones WCAG defines, not ones this codebase chose,
 * so they are pinned: black on white is exactly 21:1 and a colour against
 * itself is exactly 1:1. If a refactor changes either, the formula is wrong and
 * every "this passes" the picker shows is wrong with it.
 */

describe('parsing', () => {
  it('reads six-digit hex in either case', () => {
    expect(parseHex('#ffffff')).toEqual([255, 255, 255])
    expect(parseHex('#FF8800')).toEqual([255, 136, 0])
  })

  it('refuses anything else rather than guessing', () => {
    // Three-digit shorthand, a named colour and a raw value all mean somebody
    // typed something the server will reject; treating them as valid here is
    // how a picker says "fine" and the save says "no".
    expect(parseHex('#fff')).toBeNull()
    expect(parseHex('white')).toBeNull()
    expect(parseHex('ffffff')).toBeNull()
    expect(parseHex(null)).toBeNull()
  })
})

describe('luminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance([0, 0, 0])).toBe(0)
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 10)
  })
})

describe('ratio', () => {
  it('is 21:1 for black on white, in both orders', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5)
  })

  it('is 1:1 for a colour against itself', () => {
    expect(contrastRatio('#5a7a52', '#5a7a52')).toBeCloseTo(1, 10)
  })

  it('is unknown, not zero, when a colour cannot be read', () => {
    // Zero would compare as "worse than anything" and quietly fail the check
    // for a reason that has nothing to do with contrast.
    expect(contrastRatio('#fff', '#ffffff')).toBeNull()
  })
})

describe('the check', () => {
  it('passes the default palette', () => {
    expect(checkContrast('#222222', '#ffffff').passes).toBe(true)
  })

  it('fails a pale grey on white, which is the mistake people actually make', () => {
    const result = checkContrast('#bbbbbb', '#ffffff')
    expect(result.passes).toBe(false)
    expect(result.ratio).toBeLessThan(AA_NORMAL_TEXT)
  })

  it('fails closed when a colour is unparseable', () => {
    // "Unknown" is not "acceptable". A palette that was never checked must not
    // read as a palette that passed.
    expect(checkContrast('nonsense', '#ffffff')).toEqual({ ratio: null, passes: false })
  })

  it('rounds the ratio for display without rounding a failure into a pass', () => {
    const result = checkContrast('#767676', '#ffffff')
    expect(result.ratio).toBeCloseTo(4.54, 2)
    expect(result.passes).toBe(true)
  })
})
