/**
 * Prepares a sanitized article body for the page (2026 blog design).
 *
 * The table of contents is built here, from the body's own h2 headings, rather
 * than stored: a TOC saved next to the text is a second copy that goes stale
 * the first time an editor renames a section. Each h2 gets an id derived from
 * its words, so an anchor link keeps working as long as the heading does.
 *
 * Checklist items become toggles a reader can tick off while planning. The
 * state is theirs, on the page only — nothing is saved.
 *
 * Input must already be sanitized (`renderPostBody`); this adds attributes to
 * elements it parsed, and never parses anything a reader wrote.
 */

const MAX_ID_LENGTH = 60

export function outlineArticle(html) {
  if (!html || typeof DOMParser === 'undefined') return { html: html || '', headings: [] }

  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html')
  const root = doc.getElementById('root')
  const used = new Set()

  const headings = [...root.querySelectorAll('h2')].map((heading, index) => {
    const text = heading.textContent.replace(/\s+/g, ' ').trim()
    const id = uniqueId(slugify(text) || `section-${index + 1}`, used)
    heading.id = id
    return { id, text }
  })

  root.querySelectorAll('ul.checklist > li').forEach((item) => {
    item.setAttribute('role', 'checkbox')
    item.setAttribute('aria-checked', 'false')
    item.setAttribute('tabindex', '0')
  })

  root.querySelectorAll('img').forEach((image) => image.setAttribute('loading', 'lazy'))

  return { html: root.innerHTML, headings }
}

/** Letters of any script are kept, so a Macedonian heading keeps a readable anchor. */
export function slugify(text) {
  return text
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .slice(0, MAX_ID_LENGTH)
    .replace(/-+$/, '')
}

function uniqueId(base, used) {
  let candidate = base
  let suffix = 2
  while (used.has(candidate)) candidate = `${base}-${suffix++}`
  used.add(candidate)
  return candidate
}

/** Ticks or unticks a checklist item; true when the event was one. */
export function toggleChecklistItem(target) {
  const item = target?.closest?.('ul.checklist > li')
  if (!item) return false
  const done = item.getAttribute('aria-checked') !== 'true'
  item.setAttribute('aria-checked', String(done))
  item.classList.toggle('done', done)
  return true
}
