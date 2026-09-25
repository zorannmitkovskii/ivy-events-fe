import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AdminBlogListPage from '@/pages/adminDashboard/blog/AdminBlogListPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The admin blog list (IVY-906, IVY-907).
 *
 * <p>What it pins: the filters come from the URL, every written language shows
 * its own state, each post says where it stands for SEO, and typing in the
 * search does not send a request per key.
 */

const { listMock, replace } = vi.hoisted(() => ({ listMock: vi.fn(), replace: vi.fn() }))

vi.mock('@/services/content.service', () => ({
  contentService: { list: listMock },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en' }, query: { tag: 'сала' } }),
  useRouter: () => ({ replace }),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const row = (overrides = {}) => ({
  id: 'p-1',
  slug: 'how-to-pick-a-venue',
  title: 'How to pick a venue',
  category: 'VENUE',
  tags: ['сала'],
  authorName: 'Ivy',
  archived: false,
  updatedAt: '2026-09-01T10:00:00Z',
  statuses: { en: 'PUBLISHED', mk: 'DRAFT' },
  seoErrors: 0,
  seoWarnings: 0,
  ...overrides,
})

async function render(rows = [row()]) {
  listMock.mockResolvedValue({ data: { content: rows, totalElements: rows.length } })
  const wrapper = mount(AdminBlogListPage, {
    global: {
      plugins: [i18n],
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        PageHead: { template: '<div><slot name="actions" /></div>' },
      },
    },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  listMock.mockReset()
  replace.mockReset()
})

afterEach(() => vi.useRealTimers())

describe('the admin blog list', () => {
  it('asks for the filters that are in the URL', async () => {
    await render()

    expect(listMock).toHaveBeenCalledWith({ tag: 'сала', page: 0, size: 20 })
  })

  it('shows every written language with its own state', async () => {
    const wrapper = await render()
    const text = wrapper.find('tbody').text()

    expect(text).toContain('How to pick a venue')
    expect(text).toContain(`EN · ${en.adminBlog.status.PUBLISHED}`)
    expect(text).toContain(`MK · ${en.adminBlog.status.DRAFT}`)
    expect(text).toContain('сала')
  })

  it('says for each post how many SEO errors and tips it has, or that it is clean', async () => {
    const wrapper = await render([
      row({ id: 'p-1', seoErrors: 2, seoWarnings: 3 }),
      row({ id: 'p-2', slug: 'clean' }),
    ])
    const [broken, clean] = wrapper.findAll('tbody tr').map((tr) => tr.find('td.seo').text())

    expect(broken).toContain('2 errors')
    expect(broken).toContain('3 tips')
    expect(clean).toBe(en.adminBlog.list.seoClean)
  })

  it('offers only posts with SEO errors as a filter', async () => {
    const wrapper = await render()
    const options = wrapper.find('select.seo-filter').findAll('option').map((option) => option.attributes('value'))

    expect(options).toEqual(['', 'ERRORS', 'CLEAN'])
  })

  it('marks a post taken down as a whole', async () => {
    const wrapper = await render([row({ archived: true })])

    expect(wrapper.find('tbody').text()).toContain(en.adminBlog.list.archived)
  })

  it('says the filters match nothing rather than that there are no posts', async () => {
    const wrapper = await render([])

    expect(wrapper.text()).toContain(en.adminBlog.list.empty)
  })

  it('waits for typing to stop before asking again', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const wrapper = await render()
    listMock.mockClear()

    await wrapper.find('input.search').setValue('в')
    await wrapper.find('input.search').setValue('ве')
    expect(listMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    await flushPromises()

    expect(listMock).toHaveBeenCalledTimes(1)
    expect(listMock).toHaveBeenLastCalledWith({ q: 'ве', tag: 'сала', page: 0, size: 20 })
    expect(replace).toHaveBeenLastCalledWith({ query: { q: 'ве', tag: 'сала' } })
  })
})
