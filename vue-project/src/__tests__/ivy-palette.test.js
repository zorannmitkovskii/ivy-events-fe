import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { contrastRatio, AA_NORMAL_TEXT } from '@/composables/useBrandContrast'

/**
 * The 2026 palette, measured rather than trusted.
 *
 * <p>The redesign ships two grounds — `--paper` light and `--paper` dark — and
 * every text colour has to clear AA on the one it sits on. A palette is the
 * kind of thing that is checked once by eye on the day it lands and never
 * again; this file is what makes changing a hex value a decision somebody has
 * to defend.
 *
 * <p>Read out of `tokens.css` rather than copied here, so a value edited there
 * and not here cannot pass.
 */

const TOKENS = readFileSync(resolve(process.cwd(), 'src/assets/styles/ivy/tokens.css'), 'utf8')

/**
 * The value of a custom property in a given block.
 *
 * @param blockStart a string that begins the block — `:root {` for the light
 *   palette, the dark attribute selector for the other one
 */
function tokenIn(blockStart, name) {
  const from = TOKENS.indexOf(blockStart)
  if (from === -1) throw new Error(`no block starting "${blockStart}"`)

  const body = TOKENS.slice(from + blockStart.length)
  const end = body.indexOf('\n}')
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(body.slice(0, end))
  if (!match) throw new Error(`no --${name} in "${blockStart}"`)
  return match[1].toLowerCase()
}

const light = (name) => tokenIn(':root {', name)
const dark = (name) => tokenIn(':root[data-theme="dark"] {', name)

describe('the light palette, on the light ground', () => {
  const paper = light('paper')
  const card = light('card')

  it.each([
    ['ink', 'the body copy'],
    ['ink-2', 'the secondary line under a heading'],
  ])('%s clears AA for normal text (%s)', (token) => {
    expect(contrastRatio(light(token), paper)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    expect(contrastRatio(light(token), card)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })

  it('ink-3 clears AA for normal text, which is what it is used for', () => {
    // It carries timestamps, counts and captions — small text, not decoration.
    expect(contrastRatio(light('ink-3'), paper)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })

  it('the primary action reads on the ground it sits on, and its label on it', () => {
    expect(contrastRatio(light('ivy'), paper)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    expect(contrastRatio(light('on-ivy'), light('ivy'))).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })

  it('gold text uses --gold-text, which clears AA — and --gold, which never could', () => {
    // `--gold` is a fill and a border, not a text colour: it measures 2.4:1 on
    // the paper and no darkening short of changing the colour would fix that.
    // `--gold-text` exists for exactly this reason, and the pair is only safe
    // while the difference between them is this large.
    expect(contrastRatio(light('gold-text'), paper)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    expect(contrastRatio(light('gold'), paper)).toBeLessThan(AA_NORMAL_TEXT)
  })

  it('gold-deep clears AA on the pale gold it is printed on', () => {
    // `.badge-gold-outline` and the "over budget" figure both set --gold-deep
    // on --gold-soft. The gold *border* around a recommended plan is not
    // checked here and does not need to be: what marks that plan is the pill
    // with words in it, so the ring is decoration under WCAG 1.4.11.
    expect(contrastRatio(light('gold-deep'), light('gold-soft'))).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    )
  })

  it('a gold badge reads: its label against the gold it is printed on', () => {
    expect(contrastRatio(light('on-gold'), light('gold'))).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })
})

describe('the dark palette, on the dark ground', () => {
  const paper = dark('paper')
  const card = dark('card')

  it.each([['ink'], ['ink-2'], ['ink-3']])('%s clears AA for normal text', (token) => {
    expect(contrastRatio(dark(token), paper)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    expect(contrastRatio(dark(token), card)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })

  it('the primary action inverts: light ink on the dark ground, dark label on it', () => {
    // `--ivy` is a light colour in dark mode and `--on-ivy` a dark one. Getting
    // this pair the wrong way round is the single most likely dark-mode bug,
    // and it produces a button nobody can read the label of.
    expect(contrastRatio(dark('ivy'), paper)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    expect(contrastRatio(dark('on-ivy'), dark('ivy'))).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })

  it('gold at text size goes lighter, not darker', () => {
    expect(contrastRatio(dark('gold-text'), paper)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })

  it('the sidebar keeps its own dark ground in both themes, and its text on it', () => {
    // `--ivy-deep` is the sidebar and the footer. It is dark in light mode and
    // darker in dark mode, so the white-ish text on it has to be checked twice.
    expect(contrastRatio('#ffffff', light('ivy-deep'))).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    expect(contrastRatio('#ffffff', dark('ivy-deep'))).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })
})
