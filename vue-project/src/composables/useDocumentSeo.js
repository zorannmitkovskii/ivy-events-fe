/**
 * Puts the server's computed SEO onto the page (IVY-902, IVY-907).
 *
 * <p>The values are not recomputed here. The server already decided the title,
 * the description, the canonical, the languages and whether the page is
 * indexable, and a second implementation in the browser would eventually
 * disagree with the one that fed the sitemap — at which point the tag on the
 * page and the entry in the sitemap describe different pages and nobody can
 * tell which is wrong.
 *
 * <p>What this does is set tags and, just as importantly, remove the ones a
 * previous page left behind. A single-page app that only ever adds tags carries
 * the last article's canonical — or its languages, or its tags — onto the next.
 */

const MANAGED = 'data-ivy-seo'
const GROUP = 'data-ivy-seo-group'

/** Open Graph wants a territory as well as a language. */
const OG_LOCALES = { mk: 'mk_MK', en: 'en_US', sq: 'sq_AL' }

function setMeta(selectorAttr, name, content) {
  const selector = `meta[${selectorAttr}="${name}"]`
  let tag = document.head.querySelector(selector)
  if (!content) {
    if (tag?.hasAttribute(MANAGED)) tag.remove()
    return
  }
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(selectorAttr, name)
    tag.setAttribute(MANAGED, '')
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setLink(rel, href) {
  const selector = `link[rel="${rel}"]`
  let tag = document.head.querySelector(selector)
  if (!href) {
    if (tag?.hasAttribute(MANAGED)) tag.remove()
    return
  }
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    tag.setAttribute(MANAGED, '')
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

/**
 * Tags that come several at a time — one hreflang link per language, one
 * article:tag per tag — replaced as a set, so a shorter list on the next page
 * does not leave the previous page's extras behind.
 */
function replaceGroup(group, tags) {
  document.head.querySelectorAll(`[${GROUP}="${group}"]`).forEach((tag) => tag.remove())
  for (const tag of tags) {
    tag.setAttribute(MANAGED, '')
    tag.setAttribute(GROUP, group)
    document.head.appendChild(tag)
  }
}

function element(name, attributes) {
  const tag = document.createElement(name)
  for (const [key, value] of Object.entries(attributes)) tag.setAttribute(key, value)
  return tag
}

function setStructuredData(data) {
  const existing = document.head.querySelector(`script[${MANAGED}]`)
  if (existing) existing.remove()
  if (!data) return

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.setAttribute(MANAGED, '')
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

/**
 * @param seo the ContentSeo the API returned. `type` is the og:type, `article` unless
 *   the caller says otherwise — a marketing page is a `website`. `noindex` is honoured as sent —
 *   an archived post that keeps being indexed is the reason the field exists.
 *   `alternates`, `locale`, `publishedAt`, `modifiedAt` and `tags` are optional:
 *   pages without them simply carry none of those tags.
 */
export function applySeo(seo) {
  if (!seo || typeof document === 'undefined') return

  if (seo.title) document.title = seo.title

  setMeta('name', 'description', seo.description)
  setMeta('name', 'robots', seo.noindex ? 'noindex, follow' : null)

  setMeta('property', 'og:title', seo.title)
  setMeta('property', 'og:description', seo.description)
  setMeta('property', 'og:image', seo.imageUrl)
  setMeta('property', 'og:type', seo.type || 'article')
  setMeta('property', 'og:url', seo.canonicalUrl)
  setMeta('property', 'og:locale', OG_LOCALES[seo.locale] || null)

  setMeta('property', 'article:published_time', seo.publishedAt)
  setMeta('property', 'article:modified_time', seo.modifiedAt)

  setMeta('name', 'twitter:card', seo.imageUrl ? 'summary_large_image' : 'summary')
  setMeta('name', 'twitter:title', seo.title)
  setMeta('name', 'twitter:description', seo.description)
  setMeta('name', 'twitter:image', seo.imageUrl)

  setLink('canonical', seo.canonicalUrl)
  replaceGroup('hreflang', (seo.alternates || []).map((alternate) =>
    element('link', { rel: 'alternate', hreflang: alternate.locale, href: alternate.url })))
  replaceGroup('article-tag', (seo.tags || []).map((tag) =>
    element('meta', { property: 'article:tag', content: tag })))
  setStructuredData(seo.structuredData)
}

/** Called when leaving a page that set tags, so the next one starts clean. */
export function clearSeo() {
  if (typeof document === 'undefined') return
  document.head.querySelectorAll(`[${MANAGED}]`).forEach((tag) => tag.remove())
}

export default function useDocumentSeo() {
  return { applySeo, clearSeo }
}
