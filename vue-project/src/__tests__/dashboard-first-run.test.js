import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AgencyOverviewPage from '@/pages/dashboard/AgencyOverviewPage.vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'

/**
 * The dashboard before anything has happened (IVY-1204).
 *
 * <p>Five zeros and three sentences explaining that there is nothing is an
 * accurate screen and a useless one. What is pinned here is the boundary: a
 * brand-new agency is offered the first thing to do, and an agency that has
 * *anything* — one event, one guest, one flagged item — keeps its dashboard.
 */

const { agencyMock } = vi.hoisted(() => ({ agencyMock: vi.fn() }))

vi.mock('@/services/analytics.service', () => ({
  analyticsService: { agency: agencyMock, admin: vi.fn() },
}))

vi.mock('@/services/agencyTeam.service', () => ({
  agencyTeamService: { workload: vi.fn().mockResolvedValue({ data: { rows: [], total: 0 } }) },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'mk' }, query: {} }),
  useRouter: () => ({ replace: vi.fn() }),
  RouterLink: { props: ['to'], template: '<a :href="String(to)"><slot /></a>' },
}))

const payload = (overrides = {}) => ({
  data: {
    totals: {
      eventCount: 0, guestCount: 0, childCount: 0, invitedCount: 0,
      confirmedCount: 0, respondedCount: 0, responseRate: null, overdueTaskCount: 0,
      ...overrides.totals,
    },
    statusBreakdown: { DRAFT: 0, PENDING: 0, ACTIVE: 0 },
    upcoming: { next30: 0, next60: 0, next90: 0 },
    monthly: [],
    attention: overrides.attention ?? { total: 0, overdueCount: 0, atRiskCount: 0, riskWindowDays: 30, limit: 25, items: [] },
    definitions: {},
  },
})

beforeEach(() => {
  agencyMock.mockReset().mockResolvedValue(payload())
})

async function render(locale = 'mk') {
  const i18n = createI18n({ legacy: false, locale, messages: { en, mk } })
  const wrapper = mount(AgencyOverviewPage, { global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper
}

describe('a brand-new agency', () => {
  it('is offered the first thing to do instead of five zeros', async () => {
    const wrapper = await render()

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('Сè уште нема настани')
    expect(wrapper.find('.cta').attributes('href')).toBe('/mk/event-category')
  })

  it('is not shown four cards that all read zero', async () => {
    const wrapper = await render()

    expect(wrapper.find('.cards').exists()).toBe(false)
    expect(wrapper.find('#charts').exists()).toBe(false)
    expect(wrapper.find('#attention').exists()).toBe(false)
  })

  it('carries an illustration that is not announced twice', async () => {
    const wrapper = await render()
    const art = wrapper.find('.empty-state svg')

    expect(art.exists()).toBe(true)
    expect(art.attributes('aria-hidden')).toBe('true')
  })

  it('says it in the reader\'s language', async () => {
    const wrapper = await render('en')

    expect(wrapper.text()).toContain('No events yet')
    expect(wrapper.text()).toContain('Create the first event')
  })
})

describe('an agency with a history keeps its dashboard', () => {
  it('when it has one event', async () => {
    agencyMock.mockResolvedValueOnce(payload({ totals: { eventCount: 1 } }))
    const wrapper = await render()

    expect(wrapper.find('.empty-state').exists()).toBe(false)
    expect(wrapper.find('.cards').exists()).toBe(true)
  })

  it('when it has guests but no events left on the books', async () => {
    agencyMock.mockResolvedValueOnce(payload({ totals: { guestCount: 120 } }))
    const wrapper = await render()

    expect(wrapper.find('.empty-state').exists()).toBe(false)
  })

  it('when something is already flagged', async () => {
    agencyMock.mockResolvedValueOnce(payload({
      attention: { total: 1, overdueCount: 1, atRiskCount: 0, riskWindowDays: 30, limit: 25, items: [] },
    }))
    const wrapper = await render()

    expect(wrapper.find('.empty-state').exists()).toBe(false)
  })
})
