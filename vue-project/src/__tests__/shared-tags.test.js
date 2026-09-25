import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'

/**
 * The shared tags on the screens that use them: an admin adds one, a vendor
 * picks up to eight, and a visitor reads a tag's page.
 */

const content = vi.hoisted(() => ({ tags: vi.fn(), renameTag: vi.fn(), removeTag: vi.fn(), createTag: vi.fn() }))
const tagsApi = vi.hoisted(() => ({ catalog: vi.fn(), hub: vi.fn(), mine: vi.fn(), setMine: vi.fn() }))
const route = vi.hoisted(() => ({ params: { lang: 'en', slug: 'сала' }, query: {} }))

vi.mock('@/services/content.service', () => ({ contentService: content }))
vi.mock('@/services/tags.service', () => ({ tagsService: tagsApi }))
vi.mock('vue-router', () => ({ useRoute: () => route }))

const { default: AdminBlogTagsPage } = await import('@/pages/adminDashboard/blog/AdminBlogTagsPage.vue')
const { default: VendorTagPicker } = await import('@/components/vendor/VendorTagPicker.vue')
const { default: TagPage } = await import('@/pages/TagPage.vue')

const i18n = createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en, mk } })

const stubs = {
  RouterLink: { props: ['to'], template: '<a :data-to="JSON.stringify(to)"><slot /></a>' },
  PageHead: true,
  SitePage: { template: '<div class="ivy-site"><slot /></div>' },
  PageHero: { props: ['title', 'eyebrow', 'subtitle'], template: '<h1>{{ title }}</h1>' },
}

const mountWith = (component, options = {}) =>
  mount(component, { ...options, global: { plugins: [i18n], stubs } })

beforeEach(() => {
  for (const mock of [...Object.values(content), ...Object.values(tagsApi)]) mock.mockReset()
  document.head.innerHTML = ''
})

describe('adding a tag on the admin page', () => {
  it('sends the names and lists the new tag with no vendors yet', async () => {
    content.tags.mockResolvedValue({ data: [] })
    content.createTag.mockResolvedValue({
      data: { id: 't-9', slug: 'сала', names: { mk: 'Сала', en: 'Venue' }, postCount: 0, vendorCount: 0, missingLocales: ['sq'] },
    })
    const wrapper = mountWith(AdminBlogTagsPage)
    await flushPromises()

    const inputs = wrapper.find('[data-testid="new-tag"]').findAll('input')
    await inputs[0].setValue('Сала')
    await inputs[1].setValue('Venue')
    await wrapper.find('[data-testid="new-tag"]').trigger('submit')
    await flushPromises()

    expect(content.createTag).toHaveBeenCalledWith({ names: { mk: 'Сала', en: 'Venue', sq: '' } })
    expect(wrapper.find('tr[data-slug="сала"] .vendors').text()).toBe('0')
    expect(inputs[0].element.value).toBe('')
  })

  it('cannot add a tag without a Macedonian name', async () => {
    content.tags.mockResolvedValue({ data: [] })
    const wrapper = mountWith(AdminBlogTagsPage)
    await flushPromises()

    expect(wrapper.find('[data-testid="new-tag"] button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})

describe('the vendor tag picker', () => {
  const catalog = Array.from({ length: 10 }, (_, i) => ({ slug: `t${i}`, name: `Tag ${i}`, postCount: 0, vendorCount: 0 }))

  async function picker(modelValue) {
    tagsApi.catalog.mockResolvedValue({ data: catalog })
    const wrapper = mountWith(VendorTagPicker, { props: { modelValue } })
    await flushPromises()
    return wrapper
  }

  it('picks a tag by clicking it', async () => {
    const wrapper = await picker([])

    await wrapper.findAll('.chips button')[2].trigger('click')

    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([['t2']])
  })

  it('unpicks a picked tag', async () => {
    const wrapper = await picker(['t1', 't2'])

    await wrapper.findAll('.chips button')[1].trigger('click')

    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([['t2']])
  })

  it('offers no ninth tag once eight are picked', async () => {
    const eight = catalog.slice(0, 8).map((tag) => tag.slug)
    const wrapper = await picker(eight)

    const ninth = wrapper.findAll('.chips button')[8]
    expect(ninth.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('8 of 8')
  })
})

describe('a tag page', () => {
  it('lists the articles and vendors under the tag and names the page after it', async () => {
    tagsApi.hub.mockResolvedValue({
      data: {
        slug: 'сала',
        name: 'venue',
        posts: [{ slug: 'deset-idei', title: 'Ten ideas', excerpt: 'Short.', coverImage: null }],
        vendors: [{ slug: 'studio', name: 'Studio', type: 'VENUE', city: 'Skopje' }],
        agencies: [],
      },
    })
    const wrapper = mountWith(TagPage)
    await flushPromises()

    expect(tagsApi.hub).toHaveBeenCalledWith('сала', 'en')
    expect(wrapper.find('h1').text()).toBe('#venue')
    expect(wrapper.find('[data-testid="tag-posts"]').text()).toContain('Ten ideas')
    expect(wrapper.find('[data-testid="tag-vendors"] a').attributes('data-to')).toContain('/en/vendors/venue/studio')
    expect(document.title).toBe('#venue | Ivy Events')
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
  })

  it('lists the agencies under the tag, linked to their own sites, and is indexable on them alone', async () => {
    tagsApi.hub.mockResolvedValue({
      data: { slug: 'gala', name: 'gala', posts: [], vendors: [], agencies: [{ slug: 'ivena', name: 'Ivena', city: 'Skopje' }] },
    })
    const wrapper = mountWith(TagPage)
    await flushPromises()

    const agency = wrapper.find('[data-testid="tag-agencies"] a')
    expect(agency.text()).toContain('Ivena')
    expect(agency.attributes('data-to')).toContain('/en/a/ivena')
    expect(wrapper.text()).not.toContain(en.tags.page.empty)
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
  })

  it('says so for a tag that does not exist', async () => {
    tagsApi.hub.mockRejectedValue({ status: 404 })
    const wrapper = mountWith(TagPage)
    await flushPromises()

    expect(wrapper.text()).toContain(en.tags.page.notFound)
  })

  it('keeps an empty tag page out of the index', async () => {
    tagsApi.hub.mockResolvedValue({ data: { slug: 'x', name: 'x', posts: [], vendors: [], agencies: [] } })
    const wrapper = mountWith(TagPage)
    await flushPromises()

    expect(wrapper.text()).toContain(en.tags.page.empty)
    expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toBe('noindex, follow')
  })
})
