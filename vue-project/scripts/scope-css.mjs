/**
 * Scope a flat stylesheet under a single class, so a design's own class names
 * can be kept verbatim without restyling the rest of the app.
 *
 * The 2026 redesign in `ivyevents-site/` is written for a standalone static
 * site, so it claims names as generic as `.card`, `.row`, `.top` and `.main`.
 * Keeping those names is deliberate — a component carrying `.ev-hero` can be
 * diffed against the mockup directly — but they only stay safe inside a scope.
 *
 * Usage: node scripts/scope-css.mjs <input.css> <.scope> [--drop-until=<n>]
 * Prints the scoped sheet on stdout. `--drop-until` skips n leading lines,
 * which is how the token block is kept out (it lives in `tokens.css`).
 *
 * Selectors matching KEEP_GLOBAL are emitted untouched: they carry the reset,
 * which has to reach the whole document.
 */
import { readFileSync } from 'node:fs'

const KEEP_GLOBAL = /^(:root|html|body|\*|@font-face|@keyframes)/

const [, , file, scope, ...rest] = process.argv
if (!file || !scope) {
  console.error('usage: scope-css.mjs <input.css> <.scope> [--drop-until=n]')
  process.exit(1)
}

const dropUntil = Number((rest.find((a) => a.startsWith('--drop-until=')) || '=0').split('=')[1])

const source = readFileSync(file, 'utf8').split('\n').slice(dropUntil).join('\n')

/** Split a stylesheet body into brace-balanced `{ prelude, body }` blocks. */
function blocks(css) {
  const out = []
  let depth = 0
  let start = 0
  let preludeEnd = -1
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (c === '{') {
      if (depth === 0) preludeEnd = i
      depth++
    } else if (c === '}') {
      depth--
      if (depth === 0) {
        out.push({
          prelude: css.slice(start, preludeEnd),
          body: css.slice(preludeEnd + 1, i),
          raw: css.slice(start, i + 1),
        })
        start = i + 1
        preludeEnd = -1
      }
    }
  }
  const tail = css.slice(start).trim()
  if (tail) out.push({ prelude: tail, body: null, raw: tail })
  return out
}

/** Peel leading comments off a prelude, so a section header is not scoped. */
function splitComments(prelude) {
  let rest = prelude
  const lead = []
  for (;;) {
    const m = /^\s*\/\*[\s\S]*?\*\//.exec(rest)
    if (!m) break
    lead.push(m[0].trim())
    rest = rest.slice(m[0].length)
  }
  return { lead, selector: rest.trim() }
}

/** Prefix every selector in a comma-separated list with the scope. */
function scopeSelector(selector) {
  return selector
    .split(',')
    .map((sel) => {
      const s = sel.trim()
      // The design never styles its own root, so a descendant combinator is
      // always the right join.
      return s ? `${scope} ${s}` : s
    })
    .join(',\n')
}

function render(css, indent = '') {
  return blocks(css)
    .map(({ prelude, body, raw }) => {
      if (body === null) return indent + raw
      const { lead, selector } = splitComments(prelude)
      const before = lead.map((c) => `\n${indent}${c}\n`).join('')
      if (selector.startsWith('@media') || selector.startsWith('@supports')) {
        return `${before}${indent}${selector} {\n${render(body, indent + '  ')}\n${indent}}`
      }
      if (KEEP_GLOBAL.test(selector)) return `${before}${indent}${selector} {${body}}`
      return `${before}${indent}${scopeSelector(selector)} {${body}}`
    })
    .join('\n')
}

process.stdout.write(render(source).trim() + '\n')
