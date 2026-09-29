import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import mk from '@/i18n/locales/mk.json'
import ListPager from '@/components/ui/ListPager.vue'

/**
 * The admin lists past their first ten rows.
 *
 * <p>Every list sliced its rows ten at a time, and only the FAQ drew buttons
 * to reach the rest. The users list also stopped at the twenty accounts the
 * endpoint returns by default. And three lists had a working create dialog
 * with no button to open it.
 */

const packages = vi.hoisted(() => ({ list: vi.fn() }))
const faq = vi.hoisted(() => ({ listAll: vi.fn() }))
const apiGet = vi.hoisted(() => vi.fn())

vi.mock('@/services/package.service', () => ({ packageService: packages }))
vi.mock('@/services/faq.service', () => ({ faqService: faq }))
vi.mock('@/services/api', () => ({ api: { get: apiGet } }))
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => ({ params: { lang: 'mk' }, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}))

const i18n = createI18n({ legacy: false, locale: 'mk', messages: { mk } })
const plugins = { global: { plugins: [i18n], stubs: { teleport: true } } }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('the pager', () => {
  const render = (props) => mount(ListPager, { props, ...plugins })

  it('says which rows are shown and moves one page on', async () => {
    const wrapper = render({ page: 1, totalPages: 3, from: 1, to: 10, total: 25 })

    expect(wrapper.text()).toContain('Прикажани 1–10 од 25')
    await wrapper.findAll('button').at(-1).trigger('click')
    expect(wrapper.emitted('update:page')).toEqual([[2]])
  })

  it('cuts a long run of pages around the current one', () => {
    const wrapper = render({ page: 10, totalPages: 20, from: 91, to: 100, total: 200 })

    const numbers = wrapper.findAll('button').map((b) => b.text()).filter((t) => /^\d+$/.test(t))
    expect(numbers).toEqual(['1', '8', '9', '10', '11', '12', '20'])
    expect(wrapper.findAll('.pg-gap')).toHaveLength(2)
    expect(wrapper.find('[aria-current="page"]').text()).toBe('10')
  })

  it('draws no buttons for a single page, only the count', () => {
    const wrapper = render({ page: 1, totalPages: 1, from: 1, to: 3, total: 3 })

    expect(wrapper.find('nav').exists()).toBe(false)
    expect(wrapper.text()).toContain('од 3')
  })
})

describe('the packages list', () => {
  const row = (n) => ({ id: `p${n}`, name: `Package ${n}`, price: n, currency: 'MKD', packageCategory: 'WEDDING', packageType: 'INV_PRO' })

  it('reaches rows past the first ten', async () => {
    packages.list.mockResolvedValue(Array.from({ length: 12 }, (_, i) => row(i + 1)))
    const AdminPackagesPage = (await import('@/pages/adminDashboard/AdminPackagesPage.vue')).default
    const wrapper = mount(AdminPackagesPage, plugins)
    await flushPromises()

    expect(wrapper.findAll('tbody tr')).toHaveLength(10)
    expect(wrapper.text()).toContain('Прикажани 1–10 од 12')

    await wrapper.findAll('.pg-btn').find((b) => b.text() === '2').trigger('click')

    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.text()).toContain('Package 12')
  })
})

describe('creating from the lists that had no button', () => {
  it('opens the FAQ create dialog from the header', async () => {
    faq.listAll.mockResolvedValue([])
    const AdminFaqPage = (await import('@/pages/adminDashboard/AdminFaqPage.vue')).default
    const wrapper = mount(AdminFaqPage, plugins)
    await flushPromises()

    const create = wrapper.find('[data-testid="create"]')
    expect(create.text()).toContain(mk.admin.faq.addBtn)
    await create.trigger('click')

    expect(wrapper.text()).toContain(mk.admin.faq.createTitle)
  })
})

describe('loading every user', () => {
  it('follows the pages until the server says there are no more', async () => {
    const { getAllAdminUsers } = await import('@/services/userService')
    apiGet
      .mockResolvedValueOnce({ items: [{ id: 'a' }], nextFirst: 100, hasMore: true })
      .mockResolvedValueOnce({ items: [], nextFirst: 200, hasMore: true })
      .mockResolvedValueOnce({ items: [{ id: 'b' }], nextFirst: 250, hasMore: false })

    const users = await getAllAdminUsers({ packageType: 'INV_PRO' })

    expect(users.map((u) => u.id)).toEqual(['a', 'b'])
    expect(apiGet).toHaveBeenCalledTimes(3)
    expect(apiGet.mock.calls[1]).toEqual(['/admin/users/page', { params: { packageType: 'INV_PRO', first: 100, max: 100 } }])
    expect(apiGet.mock.calls[2][1].params.first).toBe(200)
  })
})
