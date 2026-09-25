import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import BlogPage from '@/pages/BlogPage.vue'
import BlogPostPage from '@/pages/BlogPostPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The public blog in the 2026 design: the listing (lead story, category chips,
 * search) and the three article layouts.
 */

const service = vi.hoisted(() => ({ published: vi.fn(), read: vi.fn() }))
const route = vi.hoisted(() => ({ params: { lang: 'en', slug: 'plan' }, query: {} }))
const replace = vi.hoisted(() => vi.fn())

vi.mock('@/services/content.service', () => ({ contentService: service }))
vi.mock('@/composables/useContentJourney', () => ({ track: vi.fn() }))
vi.mock('@/composables/useDocumentSeo', () => ({ applySeo: vi.fn() }))
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ replace }) }))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const stubs = {
  SitePage: { template: '<div class="ivy-site"><slot /></div>' },
  NewsletterSignup: true,
  PostGlyph: true,
  RouterLink: RouterLinkStub,
}

const summary = (slug, overrides = {}) => ({
  slug, title: `Title ${slug}`, excerpt: `About ${slug}`, category: 'PLANNING', tags: [],
  coverImage: null, locale: 'en', publishedAt: '2026-09-01T10:00:00Z', layout: 'GUIDE', featured: false,
  readingMinutes: 3, ...overrides,
})

function mountPage(component) {
  const wrapper = mount(component, { global: { plugins: [i18n], stubs } })
  return flushPromises().then(() => wrapper)
}

beforeEach(() => {
  service.published.mockReset()
  service.read.mockReset()
  replace.mockReset()
  route.query = {}
})

describe('the blog listing', () => {
  afterEach(() => vi.useRealTimers())

  it('opens with the featured post and lists the others under it', async () => {
    service.published.mockResolvedValue({ data: [summary('a'), summary('b', { featured: true }), summary('c')] })
    const wrapper = await mountPage(BlogPage)

    expect(wrapper.find('.bl-featured h1').text()).toBe('Title b')
    expect(wrapper.findAll('.bl-card h3').map((title) => title.text())).toEqual(['Title a', 'Title c'])
  })

  it('leads with the newest post when none is featured', async () => {
    service.published.mockResolvedValue({ data: [summary('newest'), summary('older')] })
    const wrapper = await mountPage(BlogPage)

    expect(wrapper.find('.bl-featured h1').text()).toBe('Title newest')
  })

  it('offers only the categories that have posts, and asks the server when one is picked', async () => {
    service.published.mockResolvedValueOnce({ data: [summary('a', { category: 'VENUE' }), summary('b')] })
    const wrapper = await mountPage(BlogPage)
    const chips = wrapper.findAll('.filters button').map((chip) => chip.text())
    expect(chips).toEqual([en.blog.all, en.blog.categoryPLANNING, en.blog.categoryVENUE])

    service.published.mockResolvedValueOnce({ data: [summary('a', { category: 'VENUE' })] })
    await wrapper.findAll('.filters button')[2].trigger('click')
    await flushPromises()

    expect(service.published).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'VENUE', locale: 'en' }))
    // Filtering is the reader asking for results; the lead story steps aside.
    expect(wrapper.find('.bl-featured').exists()).toBe(false)
    expect(wrapper.findAll('.bl-card')).toHaveLength(1)
  })

  it('searches once the reader pauses, not on every letter', async () => {
    vi.useFakeTimers()
    service.published.mockResolvedValue({ data: [summary('a')] })
    const wrapper = await mountPage(BlogPage)
    service.published.mockClear()
    service.published.mockResolvedValue({ data: [] })

    await wrapper.find('.bl-search').setValue('r')
    await wrapper.find('.bl-search').setValue('rsvp')
    vi.advanceTimersByTime(299)
    expect(service.published).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await flushPromises()
    expect(service.published).toHaveBeenCalledTimes(1)
    expect(service.published).toHaveBeenCalledWith(expect.objectContaining({ q: 'rsvp' }))
    expect(replace).toHaveBeenCalledWith({ query: { q: 'rsvp' } })
    expect(wrapper.find('.empty').text()).toBe(en.blog.noResults)
  })
})

const detail = (overrides = {}) => ({
  data: {
    slug: 'plan', title: 'A clear plan', excerpt: 'Start with the goal.', heroCaption: null,
    body: '<h2>Goal</h2><p>a</p><h2>Budget</h2><p>b</p>', layout: 'GUIDE', readingMinutes: 4,
    category: 'PLANNING', tags: [{ slug: 'budget', name: 'budget' }], authorName: 'Ana Ivy', coverImage: null,
    locale: 'en', otherLocales: [], publishedAt: '2026-09-01T10:00:00Z', seo: null, related: [],
    relatedPosts: [], relatedVendors: [], ...overrides,
  },
})

describe('an article', () => {
  it('lays out a guide: photo with caption, numbered contents from its own headings', async () => {
    service.read.mockResolvedValue(detail({ heroCaption: 'The hall at night.' }))
    const wrapper = await mountPage(BlogPostPage)

    expect(wrapper.find('.bl-article').classes()).toContain('bl-guide')
    expect(wrapper.find('.bl-caption').text()).toBe('The hall at night.')
    expect(wrapper.find('.bl-toc strong').text()).toBe(en.blog.toc.GUIDE)
    expect(wrapper.findAll('.bl-toc a').map((a) => a.text())).toEqual(['1. Goal', '2. Budget'])
    expect(wrapper.findAll('.bl-toc a')[0].attributes('href')).toBe('#goal')
    expect(wrapper.find('.bl-prose h2').attributes('id')).toBe('goal')
    expect(wrapper.find('.bl-meta').text()).toContain('4 min read')
  })

  it('lays out a product article with the drawing of the app instead of a photo', async () => {
    service.read.mockResolvedValue(detail({ layout: 'PRODUCT' }))
    const wrapper = await mountPage(BlogPostPage)

    expect(wrapper.find('.bl-product-hero .bl-mock').exists()).toBe(true)
    expect(wrapper.find('.bl-hero').exists()).toBe(false)
    expect(wrapper.find('.bl-toc strong').text()).toBe(en.blog.toc.PRODUCT)
  })

  it('lays out an inspiration piece, and treats an unknown layout as a guide', async () => {
    service.read.mockResolvedValueOnce(detail({ layout: 'INSPIRATION' }))
    const inspiration = await mountPage(BlogPostPage)
    expect(inspiration.find('.bl-article').classes()).toContain('bl-inspiration')
    expect(inspiration.find('.bl-toc strong').text()).toBe(en.blog.toc.INSPIRATION)

    service.read.mockResolvedValueOnce(detail({ layout: 'MAGAZINE' }))
    const unknown = await mountPage(BlogPostPage)
    expect(unknown.find('.bl-article').classes()).toContain('bl-guide')
  })

  it('links each tag to everything filed under it, and shows related posts and vendors', async () => {
    service.read.mockResolvedValue(detail({
      relatedPosts: [{ slug: 'rsvp', title: 'RSVP', excerpt: 'Replies', category: 'PLANNING' }],
      relatedVendors: [{ slug: 'studio-lumiere', name: 'Studio Lumière', type: 'PHOTOGRAPHY', city: 'Skopje' }],
    }))
    const wrapper = await mountPage(BlogPostPage)

    const tag = wrapper.findAllComponents(RouterLinkStub).find((link) => link.text() === '#budget')
    expect(tag.props('to')).toBe('/en/tags/budget')
    expect(wrapper.find('.bl-related h2').text()).toBe(en.blog.relatedTitle.GUIDE)
    expect(wrapper.find('.bl-related-card h3').text()).toBe('RSVP')
    expect(wrapper.find('.bl-vendor-card').attributes('href')).toBe('/en/vendors/photography/studio-lumiere')
  })

  it('shows neither related section when there is nothing related', async () => {
    service.read.mockResolvedValue(detail({ relatedPosts: undefined, relatedVendors: undefined }))
    const wrapper = await mountPage(BlogPostPage)

    expect(wrapper.find('.bl-related').exists()).toBe(false)
    expect(wrapper.find('.bl-vendors').exists()).toBe(false)
  })

  it('lets a reader tick a checklist item', async () => {
    service.read.mockResolvedValue(detail({ body: '<h2>Check</h2><ul class="checklist"><li>Goal written</li></ul>' }))
    const wrapper = await mountPage(BlogPostPage)
    const item = wrapper.find('.bl-prose li')

    await item.trigger('click')
    expect(item.attributes('aria-checked')).toBe('true')
    await item.trigger('keydown', { key: ' ' })
    expect(item.attributes('aria-checked')).toBe('false')
  })
})
