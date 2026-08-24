/**
 * Puts the server's computed SEO onto the page (IVY-902).
 *
 * <p>The values are not recomputed here. The server already decided the title,
 * the description, the canonical and whether the page is indexable, and a
 * second implementation in the browser would eventually disagree with the one
 * that fed the sitemap — at which point the tag on the page and the entry in
 * the sitemap describe different pages and nobody can tell which is wrong.
 *
 * <p>What this does is set tags and, just as importantly, remove the ones a
 * previous page left behind. A single-page app that only ever adds tags carries
 * the last article's canonical onto the next one.
 */

const MANAGED = 'data-ivy-seo'

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
 * @param seo the ContentSeo the API returned. `noindex` is honoured as sent —
 *   an archived post that keeps being indexed is the reason the field exists.
 */
export function applySeo(seo) {
  if (!seo || typeof document === 'undefined') return

  if (seo.title) document.title = seo.title

  setMeta('name', 'description', seo.description)
  setMeta('name', 'robots', seo.noindex ? 'noindex, follow' : null)

  setMeta('property', 'og:title', seo.title)
  setMeta('property', 'og:description', seo.description)
  setMeta('property', 'og:image', seo.imageUrl)
  setMeta('property', 'og:type', 'article')
  setMeta('property', 'og:url', seo.canonicalUrl)

  setMeta('name', 'twitter:card', seo.imageUrl ? 'summary_large_image' : 'summary')
  setMeta('name', 'twitter:title', seo.title)
  setMeta('name', 'twitter:description', seo.description)
  setMeta('name', 'twitter:image', seo.imageUrl)

  setLink('canonical', seo.canonicalUrl)
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
