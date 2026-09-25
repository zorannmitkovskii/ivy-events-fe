import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import RevenueCard from '@/components/dashboard/RevenueCard.vue'
import en from '@/i18n/locales/en.json'

/**
 * The revenue card on the admin dashboard (IVY-1104): the net figure for the
 * dashboard's range, narrowed by package, with the breakdown kept on screen.
 */

const { adminRevenue } = vi.hoisted(() => ({ adminRevenue: vi.fn() }))

vi.mock('@/services/analytics.service', () => ({ analyticsService: { adminRevenue } }))

vi.mock('vue-router', () => ({ RouterLink: { template: '<a><slot /></a>' } }))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const denars = (amount) =>
  new Intl.NumberFormat('en', { style: 'currency', currency: 'MKD', maximumFractionDigits: 0 }).format(amount)

const byPackage = [
  { packageType: 'INV_BASIC', net: 0, gross: 0, refunded: 0, payments: 0 },
  { packageType: 'INV_PRO', net: 4999, gross: 4999, refunded: 0, payments: 1 },
  { packageType: 'INV_PREMIUM', net: 7999, gross: 8999, refunded: 1000, payments: 1 },
  { packageType: 'GALLERY_BASIC', net: 0, gross: 0, refunded: 0, payments: 0 },
  { packageType: 'GALLERY_PREMIUM', net: 0, gross: 0, refunded: 0, payments: 0 },
]

const answer = (overrides = {}) => ({
  data: {
    currency: 'MKD', packageType: null, net: 12998, gross: 13998, refunded: 1000, payments: 2,
    byPackage, definition: 'Successful payments less refunds.', ...overrides,
  },
})

async function render(props = { from: '2031-03-01', to: '2031-03-31' }) {
  const wrapper = mount(RevenueCard, {
    props,
    global: { plugins: [i18n], stubs: { InfoHint: true } },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  adminRevenue.mockReset().mockResolvedValue(answer())
})

describe('the revenue card', () => {
  it('shows the net revenue for the dashboard\'s range, with the packages that earned', async () => {
    const wrapper = await render()

    expect(adminRevenue).toHaveBeenCalledWith({ from: '2031-03-01', to: '2031-03-31', packageType: '' })
    expect(wrapper.find('.figure').text()).toBe(denars(12998))
    expect(wrapper.findAll('.rows dt').map((dt) => dt.text())).toEqual(['Invitation Pro', 'Invitation Premium'])
    expect(wrapper.findAll('.rows dd').map((dd) => dd.text())).toEqual([denars(4999), denars(7999)])
    expect(wrapper.find('.revenue-meta').text()).toContain('2 payments')
    expect(wrapper.find('.revenue-meta').text()).toContain(`${denars(1000)} refunded`)
  })

  it('narrows the figure to one package and keeps the breakdown', async () => {
    const wrapper = await render()
    adminRevenue.mockResolvedValue(answer({ packageType: 'INV_PRO', net: 4999, gross: 4999, refunded: 0, payments: 1 }))

    await wrapper.find('select').setValue('INV_PRO')
    await flushPromises()

    expect(adminRevenue).toHaveBeenLastCalledWith({ from: '2031-03-01', to: '2031-03-31', packageType: 'INV_PRO' })
    expect(wrapper.find('.figure').text()).toBe(denars(4999))
    expect(wrapper.findAll('.rows dt')).toHaveLength(2)
    expect(wrapper.find('.revenue-meta').text()).not.toContain('refunded')
  })

  it('reloads when the dashboard applies another range', async () => {
    const wrapper = await render()

    await wrapper.setProps({ from: '2031-04-01', to: '2031-04-30' })
    await flushPromises()

    expect(adminRevenue).toHaveBeenLastCalledWith({ from: '2031-04-01', to: '2031-04-30', packageType: '' })
  })

  it('shows only the newest answer when an older one arrives late', async () => {
    let answerSlowly
    adminRevenue.mockReturnValueOnce(new Promise((resolve) => { answerSlowly = resolve }))
    const wrapper = await render()
    adminRevenue.mockResolvedValue(answer({ net: 4999 }))

    await wrapper.find('select').setValue('INV_PRO')
    await flushPromises()
    answerSlowly(answer({ net: 99999 }))
    await flushPromises()

    expect(wrapper.find('.figure').text()).toBe(denars(4999))
  })

  it('says it could not load, without a figure', async () => {
    adminRevenue.mockRejectedValue(new Error('boom'))
    const wrapper = await render()

    expect(wrapper.find('.figure').text()).toBe('—')
    expect(wrapper.find('[role="alert"]').text()).toBe('Revenue could not be loaded.')
  })
})
