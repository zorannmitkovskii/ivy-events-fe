import { describe, it, expect, beforeEach } from 'vitest'
import { applySeo, clearSeo } from '@/composables/useDocumentSeo'

/**
 * The tags a crawler reads (IVY-902, IVY-907).
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
const hreflangs = () => [...head().querySelectorAll('link[rel="alternate"]')].map((link) => link.getAttribute('hreflang'))

const seo = (overrides = {}) => ({
  title: 'Десет идеи за свадба',
  description: 'Кратко за тоа што работи и што не.',
  canonicalUrl: 'https://ivy.mk/mk/blog/deset-idei',
  imageUrl: 'https://cdn.ivy.mk/hero.jpg',
  noindex: false,
  locale: 'mk',
  alternates: [
    { locale: 'mk', url: 'https://ivy.mk/mk/blog/deset-idei' },
    { locale: 'en', url: 'https://ivy.mk/en/blog/deset-idei' },
    { locale: 'x-default', url: 'https://ivy.mk/mk/blog/deset-idei' },
  ],
  publishedAt: '2026-09-01T10:00:00Z',
  modifiedAt: '2026-09-05T10:00:00Z',
  tags: ['свадба', 'сала'],
  structuredData: { '@context': 'https://schema.org', '@graph': [{ '@type': 'Article' }, { '@type': 'BreadcrumbList' }] },
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
    expect(JSON.parse(script.textContent)['@graph'].map((node) => node['@type'])).toEqual(['Article', 'BreadcrumbList'])
  })

  it('emits a robots tag only when the page is not to be indexed', () => {
    applySeo(seo())
    expect(head().querySelector('meta[name="robots"]')).toBeNull()

    applySeo(seo({ noindex: true }))
    expect(content('meta[name="robots"]')).toBe('noindex, follow')
  })

  it('names each language the article exists in, and x-default', () => {
    applySeo(seo())

    expect(hreflangs()).toEqual(['mk', 'en', 'x-default'])
    expect(head().querySelector('link[hreflang="en"]').getAttribute('href')).toBe('https://ivy.mk/en/blog/deset-idei')
  })

  it('writes the locale, the dates and one article:tag per tag', () => {
    applySeo(seo())

    expect(content('meta[property="og:locale"]')).toBe('mk_MK')
    expect(content('meta[property="article:published_time"]')).toBe('2026-09-01T10:00:00Z')
    expect(content('meta[property="article:modified_time"]')).toBe('2026-09-05T10:00:00Z')
    expect([...head().querySelectorAll('meta[property="article:tag"]')].map((tag) => tag.getAttribute('content')))
      .toEqual(['свадба', 'сала'])
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

  it('does not keep the previous article\'s languages or tags when the next has fewer', () => {
    applySeo(seo())
    applySeo(seo({ alternates: [{ locale: 'mk', url: 'https://ivy.mk/mk/blog/vtor' }], tags: [] }))

    expect(hreflangs()).toEqual(['mk'])
    expect(head().querySelectorAll('meta[property="article:tag"]')).toHaveLength(0)
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
    expect(head().querySelectorAll('link[rel="alternate"]')).toHaveLength(0)
    // The app's own tags are not ours to remove.
    expect(content('meta[name="viewport"]')).toBe('width=device-width')
  })
})

describe('og:type', () => {
  it('is an article unless the caller says otherwise', () => {
    applySeo(seo())
    expect(content('meta[property="og:type"]')).toBe('article')

    applySeo(seo({ type: 'website' }))
    expect(content('meta[property="og:type"]')).toBe('website')
  })
})
