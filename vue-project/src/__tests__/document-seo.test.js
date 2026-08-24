import { describe, it, expect, beforeEach } from 'vitest'
import { applySeo, clearSeo } from '@/composables/useDocumentSeo'

/**
 * The tags a crawler reads (IVY-902).
 *
 * <p>The failure worth testing is the one a single-page app makes and a
 * server-rendered site cannot: tags left behind. A canonical from the previous
 * article, still in the head on the next one, tells a search engine two
 * different pages are the same page — and it is invisible to anybody clicking
 * through the site.
 */

const head = () => document.head

function content(selector) {
  return head().querySelector(selector)?.getAttribute('content') ?? null
}

const canonical = () => head().querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null

const seo = (overrides = {}) => ({
  title: 'Десет идеи за свадба',
  description: 'Кратко за тоа што работи и што не.',
  canonicalUrl: 'https://ivy.mk/mk/blog/deset-idei',
  imageUrl: 'https://cdn.ivy.mk/hero.jpg',
  noindex: false,
  structuredData: { '@type': 'Article', headline: 'Десет идеи за свадба' },
  warnings: [],
  ...overrides,
})

beforeEach(() => {
  head().innerHTML = ''
  document.title = ''
})

describe('applying', () => {
  it('sets the title, description, canonical and social tags', () => {
    applySeo(seo())

    expect(document.title).toBe('Десет идеи за свадба')
    expect(content('meta[name="description"]')).toBe('Кратко за тоа што работи и што не.')
    expect(canonical()).toBe('https://ivy.mk/mk/blog/deset-idei')
    expect(content('meta[property="og:title"]')).toBe('Десет идеи за свадба')
    expect(content('meta[property="og:image"]')).toBe('https://cdn.ivy.mk/hero.jpg')
  })

  it('uses the large card only when there is an image to put in it', () => {
    applySeo(seo())
    expect(content('meta[name="twitter:card"]')).toBe('summary_large_image')

    head().innerHTML = ''
    applySeo(seo({ imageUrl: null }))
    expect(content('meta[name="twitter:card"]')).toBe('summary')
  })

  it('writes the structured data the server computed, not one built here', () => {
    applySeo(seo())

    const script = head().querySelector('script[type="application/ld+json"]')
    expect(JSON.parse(script.textContent)['@type']).toBe('Article')
  })

  it('emits a robots tag only when the page is not to be indexed', () => {
    applySeo(seo())
    expect(head().querySelector('meta[name="robots"]')).toBeNull()

    applySeo(seo({ noindex: true }))
    expect(content('meta[name="robots"]')).toBe('noindex, follow')
  })

  it('adds nothing at all when there is no SEO to apply', () => {
    applySeo(null)
    expect(head().querySelectorAll('[data-ivy-seo]')).toHaveLength(0)
  })
})

describe('not leaving the last page behind', () => {
  it('replaces the canonical rather than adding a second one', () => {
    applySeo(seo())
    applySeo(seo({ canonicalUrl: 'https://ivy.mk/mk/blog/vtor-tekst' }))

    expect(head().querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    expect(canonical()).toBe('https://ivy.mk/mk/blog/vtor-tekst')
  })

  it('removes a tag whose new value is absent instead of keeping the old one', () => {
    applySeo(seo())
    applySeo(seo({ imageUrl: null }))

    // Kept, this would hand the next article the previous one's picture.
    expect(head().querySelector('meta[property="og:image"]')).toBeNull()
  })

  it('drops the robots tag when the next page is indexable again', () => {
    applySeo(seo({ noindex: true }))
    applySeo(seo({ noindex: false }))

    expect(head().querySelector('meta[name="robots"]')).toBeNull()
  })

  it('clears everything it added and nothing it did not', () => {
    const theirs = document.createElement('meta')
    theirs.setAttribute('name', 'viewport')
    theirs.setAttribute('content', 'width=device-width')
    head().appendChild(theirs)

    applySeo(seo())
    clearSeo()

    expect(head().querySelector('link[rel="canonical"]')).toBeNull()
    expect(head().querySelector('meta[name="description"]')).toBeNull()
    // The app's own tags are not ours to remove.
    expect(content('meta[name="viewport"]')).toBe('width=device-width')
  })
})
