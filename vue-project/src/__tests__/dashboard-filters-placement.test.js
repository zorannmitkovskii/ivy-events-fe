import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import DashboardOverview from '@/components/dashboard/DashboardOverview.vue'
import en from '@/i18n/locales/en.json'

/**
 * Where the dashboard's filters sit (2026-09-13).
 *
 * <p>Above everything but the heading, on every dashboard. It used to fold
 * away under the data on all but the platform screen; that reasoning held for
 * one screen and not for the rest, so there is one placement now and no prop
 * to choose it with.
 */

const { loader, replace } = vi.hoisted(() => ({ loader: vi.fn(), replace: vi.fn() }))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en' }, query: {} }),
  useRouter: () => ({ replace }),
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const PAYLOAD = {
  data: {
    totals: {
      eventCount: 3, guestCount: 40, childCount: 0, invitedCount: 30,
      confirmedCount: 20, respondedCount: 25, responseRate: 83, overdueTaskCount: 0,
    },
    statusBreakdown: { DRAFT: 1, PENDING: 0, ACTIVE: 2 },
    upcoming: { next30: 1, next60: 2, next90: 3 },
    monthly: [{ month: '2026-08', count: 3 }],
    attention: { total: 0, overdueCount: 0, atRiskCount: 0, riskWindowDays: 30, limit: 25, items: [] },
    definitions: {},
  },
}

const NAV_ITEMS = [{ key: 'events', icon: 'calendar', label: 'Events', to: '/en/admin/events' }]

async function render(extraProps = {}) {
  const wrapper = mount(DashboardOverview, {
    props: {
      title: 'Overview',
      subtitle: 'Numbers',
      loader,
      eventLink: (eventId) => `/events/${eventId}`,
      navItems: NAV_ITEMS,
      ...extraProps,
    },
    global: { plugins: [i18n] },
  })
  await flushPromises()
  return wrapper
}

/** The order the blocks appear in, as the reader scrolls. */
function order(wrapper) {
  const blocks = wrapper.findAll('.dashboard-overview > *')
  const indexOf = (selector) => blocks.findIndex((block) => block.element.matches(selector))
  return { filters: indexOf('.filters-fold'), nav: indexOf('.nav-grid, nav, .quick-nav'), cards: indexOf('.cards'), charts: indexOf('.charts') }
}

beforeEach(() => {
  replace.mockReset()
  loader.mockReset().mockResolvedValue(PAYLOAD)
})

describe('where the filters sit', () => {
  it('leads every dashboard, with no prop asked for', async () => {
    const wrapper = await render()
    const { filters, cards, charts } = order(wrapper)

    // One form, and it is the first thing under the heading — on the agency
    // screen as much as the platform one.
    expect(wrapper.findAll('.filters-fold')).toHaveLength(1)
    expect(filters).toBeLessThan(cards)
    expect(filters).toBeLessThan(charts)
  })

  it('comes before the quick links too', async () => {
    const wrapper = await render({ navFirst: true })
    const blocks = wrapper.findAll('.dashboard-overview > *').map((block) => block.element)
    const filtersAt = blocks.findIndex((element) => element.matches('.filters-fold'))
    const cardsAt = blocks.findIndex((element) => element.matches('.cards'))

    expect(wrapper.findAll('.filters-fold')).toHaveLength(1)
    // Only the page heading (and an error, when there is one) comes before it.
    expect(blocks.slice(0, filtersAt).every((element) => element.matches('header.page-head, .error'))).toBe(true)
    expect(filtersAt).toBeLessThan(cardsAt)
  })

  it('still filters from the top', async () => {
    const wrapper = await render()
    const [from, to] = wrapper.findAll('input[type="date"]')

    await from.setValue('2026-01-01')
    await to.setValue('2026-06-30')
    await wrapper.find('form.filters').trigger('submit')
    await flushPromises()

    expect(loader).toHaveBeenLastCalledWith(expect.objectContaining({ from: '2026-01-01', to: '2026-06-30' }))
    expect(wrapper.find('button.clear').exists()).toBe(true)
  })

  it('is not offered before there is anything to filter', async () => {
    loader.mockResolvedValue({ data: null })
    const wrapper = await render()

    expect(wrapper.find('.filters-fold').exists()).toBe(false)
  })
})
