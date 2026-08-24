import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AdminOverviewPage from '@/pages/adminDashboard/AdminOverviewPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * Filters and refresh on the shared dashboard block (IVY-1101).
 *
 * <p>One request fills the whole screen, so the property worth pinning is that
 * the cards, the charts and the attention list can never describe different
 * sets of events: they change together because there is only ever one call.
 */

const { adminMock, replace } = vi.hoisted(() => ({ adminMock: vi.fn(), replace: vi.fn() }))

vi.mock('@/services/analytics.service', () => ({
  analyticsService: { admin: adminMock, agency: vi.fn() },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en' }, query: {} }),
  useRouter: () => ({ replace }),
  RouterLink: {
    props: ['to'],
    template: '<a :href="typeof to === \'string\' ? to : to.hash"><slot /></a>',
  },
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const payload = (eventCount, attentionItems = []) => ({
  data: {
    totals: {
      eventCount, guestCount: 100, childCount: 0, invitedCount: 50,
      confirmedCount: 25, respondedCount: 40, responseRate: 80,
      overdueTaskCount: attentionItems.length,
    },
    statusBreakdown: { DRAFT: 0, PENDING: 0, ACTIVATED: eventCount },
    upcoming: { next30: 1, next60: 2, next90: 3 },
    monthly: [{ month: '2026-08', count: eventCount }],
    attention: {
      total: attentionItems.length, overdueCount: attentionItems.length, atRiskCount: 0,
      riskWindowDays: 30, limit: 25, items: attentionItems,
    },
    definitions: {},
  },
})

const ITEM = {
  eventId: 'a', name: 'Ana & Marko', date: '2026-08-22', daysUntil: 14,
  overdueTaskCount: 5, openTaskCount: 11, riskWindowDays: 30, reason: 'OVERDUE_TASKS',
}

beforeEach(() => {
  replace.mockReset()
  adminMock.mockReset().mockResolvedValue(payload(76, [ITEM]))
})

async function render() {
  const wrapper = mount(AdminOverviewPage, { global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper
}

describe('filters', () => {
  it('sends the range and the type, and moves the cards and the attention list together', async () => {
    const wrapper = await render()
    expect(wrapper.text()).toContain('Ana & Marko')

    adminMock.mockResolvedValueOnce(payload(4, []))
    const [from, to] = wrapper.findAll('input[type="date"]')
    await from.setValue('2026-09-01')
    await to.setValue('2026-09-30')
    await wrapper.find('select').setValue('BIRTHDAY')
    await wrapper.find('form.filters').trigger('submit')
    await flushPromises()

    expect(adminMock).toHaveBeenCalledTimes(2)
    expect(adminMock.mock.calls[1][0]).toMatchObject({
      from: '2026-09-01', to: '2026-09-30', categoryType: 'BIRTHDAY',
    })
    // One response, so both halves of the screen moved with it.
    expect(wrapper.text()).toContain('4')
    expect(wrapper.text()).not.toContain('Ana & Marko')
  })

  it('puts the filters in the URL so the view can be linked and reloaded', async () => {
    const wrapper = await render()

    const [from] = wrapper.findAll('input[type="date"]')
    await from.setValue('2026-09-01')
    await wrapper.find('form.filters').trigger('submit')
    await flushPromises()

    expect(replace).toHaveBeenCalled()
    const [{ query }] = replace.mock.calls.at(-1)
    expect(query).toMatchObject({ from: '2026-09-01' })
  })
})

describe('refresh', () => {
  it('asks once more, disables the button while in flight and moves the stamp on', async () => {
    const wrapper = await render()
    const stampBefore = wrapper.find('.stamp').text()

    let resolve
    adminMock.mockReturnValueOnce(new Promise((r) => { resolve = r }))
    await wrapper.find('.refresh-btn').trigger('click')

    expect(wrapper.find('.refresh-btn').attributes('disabled')).toBeDefined()

    resolve(payload(76, [ITEM]))
    await flushPromises()
    await new Promise((r) => setTimeout(r, 1100))
    await wrapper.vm.$nextTick()

    expect(adminMock).toHaveBeenCalledTimes(2)
    expect(wrapper.find('.refresh-btn').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.stamp').exists()).toBe(true)
    expect(stampBefore).toBeTruthy()
  })
})
