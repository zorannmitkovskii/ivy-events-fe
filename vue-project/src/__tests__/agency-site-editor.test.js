import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import AgencySiteEditorPage from '@/pages/dashboard/AgencySiteEditorPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The owner's editor for the agency's public site: five tabs, each saving to
 * its own endpoint, and a preview drawn by the same component visitors see.
 */

const service = vi.hoisted(() => ({
  view: vi.fn(),
  setModel: vi.fn(),
  saveContent: vi.fn(),
  saveSettings: vi.fn(),
  publish: vi.fn(),
  setTags: vi.fn(),
  tagCatalog: vi.fn(),
  uploadImage: vi.fn(),
  createProject: vi.fn(),
}))
vi.mock('@/services/agencySite.service', () => ({ agencySiteService: service }))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const saved = (overrides = {}) => ({
  saved: true,
  slug: 'ivena',
  name: 'Ivena Agency',
  model: 'CLASSIC',
  published: false,
  content: { hero: { title: 'Events with', titleAccent: 'a clear plan.' }, keywords: ['Conferences'] },
  imageUrls: {},
  tags: [{ slug: 'konferencii', name: 'Conferences' }],
  projects: [],
  host: 'ivena.ivyevents.mk',
  ...overrides,
})

async function render() {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:lang/agency/site', component: AgencySiteEditorPage }, { path: '/:p(.*)*', component: { template: '<div />' } }] })
  await router.push('/en/agency/site')
  const wrapper = mount(AgencySiteEditorPage, { global: { plugins: [i18n, router], stubs: { PageHead: { template: '<header><slot name="actions" /></header>' } } } })
  await flushPromises()
  return wrapper
}

const tab = (wrapper, name) => wrapper.findAll('.se-tabs button').find((b) => b.text() === name)

beforeEach(() => {
  Object.values(service).forEach((fn) => fn.mockReset())
  service.view.mockResolvedValue(saved())
  service.tagCatalog.mockResolvedValue([{ slug: 'konferencii', name: 'Conferences' }, { slug: 'svadbi', name: 'Weddings' }])
})

describe('the agency site editor', () => {
  it('opens on the saved site, with a live preview in its layout', async () => {
    const wrapper = await render()

    expect(wrapper.findAll('.se-tabs button').map((b) => b.text())).toEqual(['Layout', 'Content', 'Projects', 'Tags', 'SEO & publishing'])
    expect(wrapper.find('.se-preview .agency-site').classes()).toContain('am-classic')
    expect(wrapper.find('.se-preview').text()).toContain('a clear plan.')
  })

  it('says so when the site has never been saved', async () => {
    service.view.mockResolvedValue(saved({ saved: false, slug: null, name: null }))

    expect((await render()).find('.se-note').exists()).toBe(true)
  })

  it('switches the layout and saves it', async () => {
    service.setModel.mockResolvedValue(saved({ model: 'CORPORATE' }))
    const wrapper = await render()

    await wrapper.findAll('.se-model')[3].trigger('click')
    await flushPromises()

    expect(service.setModel).toHaveBeenCalledWith('CORPORATE')
    expect(wrapper.find('.se-preview .agency-site').classes()).toContain('am-corporate')
  })

  it('previews an edit before it is saved, then saves the whole document', async () => {
    service.saveContent.mockImplementation(async (content) => saved({ content }))
    const wrapper = await render()
    await tab(wrapper, 'Content').trigger('click')

    const title = wrapper.findAll('.se-section input').find((input) => input.element.value === 'Events with')
    await title.setValue('Conferences with')
    expect(wrapper.find('.se-preview h1').text()).toContain('Conferences with')

    await wrapper.find('.se-actions .btn-primary').trigger('click')
    await flushPromises()

    expect(service.saveContent).toHaveBeenCalledWith(expect.objectContaining({
      hero: expect.objectContaining({ title: 'Conferences with' }),
      keywords: ['Conferences'],
      serviceItems: [],
    }))
  })

  it('shows only the sections the chosen layout draws', async () => {
    const wrapper = await render()
    await tab(wrapper, 'Content').trigger('click')

    const sections = wrapper.findAll('.se-section summary').map((s) => s.text())
    expect(sections).toContain('Services')
    expect(sections).not.toContain('Chapters')
    expect(sections).not.toContain('Formats')
  })

  it('picks tags from the shared list only', async () => {
    service.setTags.mockResolvedValue(saved({ tags: [{ slug: 'konferencii', name: 'Conferences' }, { slug: 'svadbi', name: 'Weddings' }] }))
    const wrapper = await render()
    await tab(wrapper, 'Tags').trigger('click')
    await flushPromises()

    const chips = wrapper.findAll('.se-chip')
    expect(chips.map((c) => c.text())).toEqual(['Conferences', 'Weddings'])
    await chips[1].trigger('click')
    await wrapper.find('.se-tags .btn-primary').trigger('click')
    await flushPromises()

    expect(service.setTags).toHaveBeenCalledWith(['konferencii', 'svadbi'])
  })

  it('publishes, and then links to the live site', async () => {
    service.publish.mockResolvedValue(saved({ published: true }))
    const wrapper = await render()
    await tab(wrapper, 'SEO & publishing').trigger('click')

    await wrapper.find('.se-status button').trigger('click')
    await flushPromises()

    expect(service.publish).toHaveBeenCalledWith(true)
    expect(wrapper.find('.se-status').text()).toContain('/en/a/ivena')
  })

  it('shows the server refusal, such as a taken address', async () => {
    service.saveSettings.mockRejectedValue({ status: 409, message: 'The address is taken.' })
    const wrapper = await render()
    await tab(wrapper, 'SEO & publishing').trigger('click')

    await wrapper.find('.se-publish form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.se-pane .se-error').exists()).toBe(true)
  })
})
