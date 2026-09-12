import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Every message the new landing page asks for, in all three locales.
 *
 * <p>The home page rewrite brought five components whose copy is almost
 * entirely translated strings, several of them behind template literals —
 * `home.hero.slides.${slide.kind}.tag` and friends — which no editor, linter or
 * type checker can follow. A key added to `mk.json` and forgotten in `sq.json`
 * therefore fails in exactly one place: an Albanian visitor reading a raw dotted
 * path where a headline should be.
 *
 * <p>The keys are read out of the components rather than listed here, so adding
 * a `$t(...)` to one of them extends this test on its own. The dynamic segments
 * are the one thing that has to be written down: {@link EXPANSIONS} maps the
 * interpolated expression to the values it can take, and each is checked.
 */

const COMPONENTS = ['HeroCarousel', 'StatementStats', 'DemoShowcase', 'DemoModal', 'GuestExperience']
  .map((name) => `src/components/landingPage/${name}.vue`)
  .concat(['src/pages/HomePage.vue'])

/** What each interpolated expression in a `$t(\`...\`)` can resolve to. */
const EXPANSIONS = {
  'slide.kind': ['wedding', 'birthday', 'corporate', 'graduation', 'baby'],
  'demo.key': ['wedding', 'birthday', 'corporate'],
  'stat.key': ['cost', 'planning', 'hours'],
  'unit.key': ['days', 'hours', 'minutes'],
}

const LOCALES = ['mk', 'en', 'sq'].map((code) => [
  code,
  JSON.parse(readFileSync(resolve(process.cwd(), `src/i18n/locales/${code}.json`), 'utf8')),
])

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const lookup = (messages, key) => key.split('.').reduce((node, part) => (node == null ? node : node[part]), messages)

/** Every key a component asks for, with the dynamic ones expanded. */
function keysIn(source) {
  const keys = [...source.matchAll(/\$t\(\s*'([^']+)'/g)].map((m) => m[1])

  for (const [, template] of source.matchAll(/\$t\(\s*`([^`]+)`/g)) {
    const slot = Object.keys(EXPANSIONS).find((name) => template.includes('${' + name + '}'))
    if (!slot) {
      keys.push(template)
      continue
    }
    EXPANSIONS[slot].forEach((value) => keys.push(template.replace('${' + slot + '}', value)))
  }

  return keys
}

describe('the landing page’s messages', () => {
  for (const path of COMPONENTS) {
    const keys = keysIn(read(path))

    it(`${path.split('/').pop()} asks for keys that exist`, () => {
      expect(keys.length).toBeGreaterThan(0)

      const missing = []
      for (const key of keys) {
        for (const [code, messages] of LOCALES) {
          if (typeof lookup(messages, key) !== 'string') missing.push(`${code}: ${key}`)
        }
      }

      expect(missing).toEqual([])
    })
  }

  /*
    The mockup writes the accent word on a hero card inside an <em> and breaks
    the date off the town with a <br>. Both live in the template now; carried in
    a message they would need `v-html` on translated text, which is how a
    translation file becomes an injection point.
  */
  it('keeps markup out of the messages', () => {
    const withMarkup = []
    for (const [code, messages] of LOCALES) {
      const walk = (node, path) => {
        for (const [key, value] of Object.entries(node)) {
          const here = path ? `${path}.${key}` : key
          if (value && typeof value === 'object') walk(value, here)
          else if (typeof value === 'string' && /<[a-z/]/i.test(value)) withMarkup.push(`${code}: ${here}`)
        }
      }
      walk(messages.home, 'home')
    }

    expect(withMarkup).toEqual([])
  })
})
