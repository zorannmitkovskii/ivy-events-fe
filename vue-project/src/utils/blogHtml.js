import DOMPurify from 'dompurify'

/**
 * A blog post body, ready for `v-html` (IVY-906).
 *
 * Sanitized here although the backend already cleaned it on the way into the
 * database: the server is the lock, this is the second one. The allowed tags
 * are the editor toolbar's and the backend safelist's — one list, kept in step
 * with `ContentHtml.java`.
 *
 * Posts written before the WYSIWYG editor are plain text with no tags at all.
 * They render as they always did: a blank line starts a paragraph.
 */
const ALLOWED_TAGS = [
  'p', 'br', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote', 'a',
  // The 2026 design's blocks: tip, photo, photo strip. Told apart by class.
  'aside', 'figure', 'figcaption', 'img',
]
const ALLOWED_ATTR = ['href', 'rel', 'class', 'src', 'alt']
const LOOKS_LIKE_HTML = /<[a-z][\s\S]*>/i

export function renderPostBody(body) {
  if (!body) return ''
  if (!LOOKS_LIKE_HTML.test(body)) return plainTextToHtml(body)
  return DOMPurify.sanitize(body, { ALLOWED_TAGS, ALLOWED_ATTR })
}

/** Elements a reader sees as separate lines, so their words never run together. */
const BLOCK_ELEMENTS = 'p, h2, h3, li, blockquote, ul, ol, br, aside, figure, figcaption'

/**
 * What a reader actually reads, so length rules count words and not markup.
 *
 * A space goes after every block first: `textContent` joins `<h2>Сала</h2><p>две`
 * into "Саладве", one word where a reader sees two — and where the server,
 * which counts with jsoup, sees two as well.
 */
export function visibleText(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.body.querySelectorAll(BLOCK_ELEMENTS).forEach((element) => element.after(' '))
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim()
}

/** Words a reader reads — the unit the SEO checks count in (IVY-907). A dash or
 *  a lone emoji is not a word, the same as on the server. */
export function wordCount(html) {
  const text = visibleText(html)
  return text ? text.split(' ').filter((token) => /[\p{L}\p{N}]/u.test(token)).length : 0
}

function plainTextToHtml(text) {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
