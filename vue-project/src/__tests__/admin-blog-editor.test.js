import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AdminBlogEditorPage from '@/pages/adminDashboard/blog/AdminBlogEditorPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The admin blog post editor (IVY-906, IVY-907).
 *
 * <p>What it pins: the server's SEO findings are shown beside the fields and
 * stop publishing while they stand, only languages that changed are written,
 * publishing saves first and re-reads the findings, a taken address is reported
 * beside the address, and deleting takes two clicks. The rich text editor is
 * stubbed — it has its own test.
 */

const service = vi.hoisted(() => ({
  get: vi.fn(),
  auditLinks: vi.fn(),
  list: vi.fn(),
  updatePost: vi.fn(),
  writeVariant: vi.fn(),
  moveStatus: vi.fn(),
  archive: vi.fn(),
  remove: vi.fn(),
  createPost: vi.fn(),
  removeLink: vi.fn(),
}))
const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }))

vi.mock('@/services/content.service', () => ({ contentService: service }))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en', id: 'p-1' }, query: {} }),
  useRouter: () => ({ push, replace }),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const LONG_BODY = `<p>${'Планирање свадба чекор по чекор. '.repeat(10)}</p>`

const thin = { code: 'CONTENT_TOO_THIN', severity: 'ERROR', field: 'body', params: { words: 12, min: 300 }, message: 'Текстот е кус.' }
const noTags = { code: 'NO_TAGS', severity: 'WARNING', field: 'tags', params: {}, message: 'Нема тагови.' }

const entry = (locale, overrides = {}, issues = []) => ({
  variant: {
    id: `v-${locale}`,
    locale,
    status: 'DRAFT',
    title: 'Сала',
    excerpt: null,
    body: LONG_BODY,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    socialImageKey: null,
    focusKeyword: null,
    ...overrides,
  },
  seo: { title: 'Сала', description: 'Опис', canonicalUrl: 'https://ivyevents.mk/mk/blog/sala' },
  issues,
})

const detail = (variants, post = {}) => ({
  data: {
    post: {
      id: 'p-1', slug: 'sala', category: 'VENUE', tags: ['сала'], heroImageKey: null, coverImage: null,
      firstPublishedAt: null, archivedAt: null, ...post,
    },
    variants,
  },
})

const RichTextStub = {
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  template: `<textarea class="rte-stub" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`,
}

async function render(variants = [entry('mk')], post = {}) {
  service.get.mockResolvedValue(detail(variants, post))
  service.auditLinks.mockResolvedValue({ data: [] })
  service.list.mockResolvedValue({ data: { content: [], totalElements: 0 } })
  const wrapper = mount(AdminBlogEditorPage, {
    global: {
      plugins: [i18n],
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        PageHead: { props: ['title'], template: '<div><h1>{{ title }}</h1><slot name="actions" /></div>' },
        RichTextEditor: RichTextStub,
        TagInput: true,
        CoverImageField: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

const button = (wrapper, text) => wrapper.findAll('button').find((candidate) => candidate.text() === text)
const titleInput = (wrapper) => wrapper.findAll('.editor-main input[type="text"]')[0]
const keywordInput = (wrapper) => wrapper.findAll('.editor-main input[type="text"]')[1]

beforeEach(() => {
  Object.values(service).forEach((mock) => mock.mockReset())
  push.mockReset()
  replace.mockReset()
})

describe('the blog post editor', () => {
  it('loads every language and says which ones are not written', async () => {
    const wrapper = await render()

    expect(titleInput(wrapper).element.value).toBe('Сала')
    const tabs = wrapper.findAll('.locale-tab').map((tab) => tab.text())
    expect(tabs[0]).toContain(en.adminBlog.status.DRAFT)
    expect(tabs[1]).toContain(en.adminBlog.editorPage.notWritten)
    expect(tabs[2]).toContain(en.adminBlog.editorPage.notWritten)
  })

  it('shows each finding beside its field, in the editor\'s language', async () => {
    const wrapper = await render([entry('mk', {}, [thin, noTags])])

    expect(wrapper.text()).toContain('The text has 12 words')
    expect(wrapper.text()).toContain(en.adminBlog.issues.NO_TAGS)
    expect(wrapper.findAll('.locale-tab')[0].text()).toContain('1 errors')
  })

  it('does not offer publishing while the saved language has SEO errors, and says how many', async () => {
    const wrapper = await render([entry('mk', {}, [thin])])

    expect(button(wrapper, en.adminBlog.publish.move.PUBLISHED).attributes('disabled')).toBeDefined()
    expect(wrapper.find('.blocker').text()).toContain('Fix the SEO errors (1)')
  })

  it('offers publishing again as soon as the language is edited, since saving checks again', async () => {
    const wrapper = await render([entry('mk', {}, [thin])])

    await titleInput(wrapper).setValue('Сала, изменета')

    expect(button(wrapper, en.adminBlog.publish.move.PUBLISHED).attributes('disabled')).toBeUndefined()
  })

  it('stops after saving when what was saved still has errors', async () => {
    service.get
      .mockResolvedValueOnce(detail([entry('mk')]))
      .mockResolvedValue(detail([entry('mk', { title: 'Сала, изменета' }, [thin])]))
    service.auditLinks.mockResolvedValue({ data: [] })
    service.list.mockResolvedValue({ data: { content: [], totalElements: 0 } })
    service.updatePost.mockResolvedValue({ data: {} })
    service.writeVariant.mockResolvedValue({ data: {} })
    const wrapper = mount(AdminBlogEditorPage, {
      global: {
        plugins: [i18n],
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          PageHead: { template: '<div><slot name="actions" /></div>' },
          RichTextEditor: RichTextStub,
          TagInput: true,
          CoverImageField: true,
        },
      },
    })
    await flushPromises()

    await titleInput(wrapper).setValue('Сала, изменета')
    await button(wrapper, en.adminBlog.publish.move.PUBLISHED).trigger('click')
    await flushPromises()

    expect(service.writeVariant).toHaveBeenCalled()
    expect(service.moveStatus).not.toHaveBeenCalled()
    expect(wrapper.find('.notice.bad').text()).toContain('Fix the SEO errors (1)')
  })

  it('saves the post and only the languages that changed, with the focus keyword', async () => {
    service.updatePost.mockResolvedValue({ data: {} })
    service.writeVariant.mockResolvedValue({ data: {} })
    const wrapper = await render([entry('mk'), entry('en', { title: 'Venue' })])

    await titleInput(wrapper).setValue('Нова сала')
    await keywordInput(wrapper).setValue('свадбена сала')
    await button(wrapper, en.adminBlog.editorPage.save).trigger('click')
    await flushPromises()

    expect(service.updatePost).toHaveBeenCalledWith('p-1', {
      slug: 'sala', category: 'VENUE', tags: ['сала'], heroImageKey: null, tagLocale: 'mk',
      layout: 'GUIDE', featured: false,
    })
    expect(service.writeVariant).toHaveBeenCalledTimes(1)
    expect(service.writeVariant).toHaveBeenCalledWith('p-1', 'mk',
      expect.objectContaining({ title: 'Нова сала', focusKeyword: 'свадбена сала' }))
  })

  it('saves the article layout, the featured flag and the photo caption (2026 design)', async () => {
    service.updatePost.mockResolvedValue({ data: {} })
    service.writeVariant.mockResolvedValue({ data: {} })
    const wrapper = await render([entry('mk')], { layout: 'GUIDE', featured: false })

    await wrapper.find('[data-testid="layout-select"]').setValue('INSPIRATION')
    await wrapper.find('[data-testid="featured-toggle"]').setValue(true)
    await wrapper.findAll('.editor-main input[type="text"]')[2].setValue('Салата навечер.')
    await button(wrapper, en.adminBlog.editorPage.save).trigger('click')
    await flushPromises()

    expect(service.updatePost).toHaveBeenCalledWith('p-1', expect.objectContaining({ layout: 'INSPIRATION', featured: true }))
    expect(service.writeVariant).toHaveBeenCalledWith('p-1', 'mk', expect.objectContaining({ heroCaption: 'Салата навечер.' }))
  })

  it('does not ask for a photo caption on a product article, which has no photo', async () => {
    const wrapper = await render([entry('mk')], { layout: 'PRODUCT' })

    expect(wrapper.text()).not.toContain(en.adminBlog.fields.heroCaption)
  })

  it('reports a taken address beside the address field', async () => {
    service.updatePost.mockRejectedValue(Object.assign(new Error('Адресата „sala“ ја користи друг пост.'), { status: 409 }))
    const wrapper = await render()

    await button(wrapper, en.adminBlog.editorPage.save).trigger('click')
    await flushPromises()

    expect(wrapper.find('.field-error').text()).toContain('ја користи друг пост')
    expect(wrapper.find('.notice.bad').exists()).toBe(false)
  })

  it('saves before publishing, so what goes live is what is on screen', async () => {
    service.updatePost.mockResolvedValue({ data: {} })
    service.writeVariant.mockResolvedValue({ data: {} })
    service.moveStatus.mockResolvedValue({ data: {} })
    const wrapper = await render()

    await titleInput(wrapper).setValue('Сала, изменета')
    await button(wrapper, en.adminBlog.publish.move.PUBLISHED).trigger('click')
    await flushPromises()

    expect(service.moveStatus).toHaveBeenCalledWith('v-mk', 'PUBLISHED', null)
    expect(service.writeVariant.mock.invocationCallOrder[0]).toBeLessThan(service.moveStatus.mock.invocationCallOrder[0])
  })

  it('deletes only on the second click, then returns to the list', async () => {
    service.remove.mockResolvedValue({ data: null })
    const wrapper = await render()

    await button(wrapper, en.adminBlog.takeDown.delete).trigger('click')
    expect(service.remove).not.toHaveBeenCalled()

    await button(wrapper, en.adminBlog.takeDown.confirmDelete).trigger('click')
    await flushPromises()

    expect(service.remove).toHaveBeenCalledWith('p-1')
    expect(push).toHaveBeenCalledWith({ name: 'admin.blog', params: { lang: 'en' } })
  })

  it('offers archiving, not deleting, for a post that was ever published', async () => {
    const wrapper = await render([entry('mk', { status: 'PUBLISHED' })], { firstPublishedAt: '2026-09-01T10:00:00Z' })

    expect(button(wrapper, en.adminBlog.takeDown.delete)).toBeUndefined()
    expect(button(wrapper, en.adminBlog.takeDown.archive)).toBeDefined()
  })
})
