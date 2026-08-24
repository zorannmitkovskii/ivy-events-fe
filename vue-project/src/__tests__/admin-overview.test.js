import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AdminOverviewPage from '@/pages/adminDashboard/AdminOverviewPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The admin dashboard (IVY-1101).
 *
 * <p>What is worth pinning here is the reading, not the rendering. Three of
 * these assertions are about a number that must not be shown as something it
 * is not: an unasked RSVP rate is not 0%, an empty attention list is not a
 * missing section, and a capped list must still admit how many there are.
 * All three are ways a dashboard lies while looking like it works.
 */

const { adminMock } = vi.hoisted(() => ({ adminMock: vi.fn() }))

vi.mock('@/services/analytics.service', () => ({
  analyticsService: { admin: adminMock }
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en' }, query: {} }),
  useRouter: () => ({ replace: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' }
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function payload(overrides = {}) {
  return {
    data: {
      totals: {
        eventCount: 0,
        guestCount: 0,
        childCount: 0,
        invitedCount: 0,
        confirmedCount: 0,
        respondedCount: 0,
        responseRate: null,
        overdueTaskCount: 0,
        ...overrides.totals
      },
      statusBreakdown: overrides.statusBreakdown ?? { DRAFT: 0, PENDING: 0, ACTIVATED: 0 },
      upcoming: overrides.upcoming ?? { next30: 0, next60: 0, next90: 0 },
      attention: overrides.attention ?? { total: 0, limit: 25, items: [] },
      definitions: {}
    }
  }
}

async function render(overrides) {
  adminMock.mockResolvedValue(payload(overrides))
  const wrapper = mount(AdminOverviewPage, { global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper
}

// Every test sets its own resolved value; the counter is cleared so the
// one-request assertion measures this mount and not the ones before it.
beforeEach(() => adminMock.mockClear())

describe('the whole page is one request', () => {
  it('fetches once on mount, not once per card', async () => {
    await render()
    expect(adminMock).toHaveBeenCalledTimes(1)
  })
})

describe('numbers that must not be misread', () => {
  it('shows an em dash, not 0%, when nobody has been invited', async () => {
    const wrapper = await render({ totals: { responseRate: null } })
    expect(wrapper.text()).toContain('—')
    expect(wrapper.text()).not.toContain('0%')
  })

  it('shows the percentage once there is one', async () => {
    const wrapper = await render({ totals: { eventCount: 3, guestCount: 40, responseRate: 80 } })
    expect(wrapper.text()).toContain('80%')
  })

  it('renders every status in the breakdown, including the zeroes', async () => {
    const wrapper = await render({
      totals: { eventCount: 9 },
      statusBreakdown: { DRAFT: 0, PENDING: 2, ACTIVATED: 7 }
    })
    const text = wrapper.text()
    expect(text).toContain('Draft')
    expect(text).toContain('Pending')
    expect(text).toContain('Active')
  })
})

describe('the attention section', () => {
  it('says nothing needs attention rather than disappearing', async () => {
    // An agency with events and nothing flagged — the all-zero case belongs to
    // the first-run screen now (IVY-1204).
    const wrapper = await render({ totals: { eventCount: 4 } })
    expect(wrapper.text()).toContain('Nothing needs attention')
  })

  it('labels why each event is listed', async () => {
    const wrapper = await render({
      attention: {
        total: 2,
        limit: 25,
        items: [
          {
            eventId: 'a', name: 'Ana & Marko', date: '2026-08-22', daysUntil: 14,
            overdueTaskCount: 5, openTaskCount: 11, riskWindowDays: 30,
            reason: 'OVERDUE_TASKS'
          },
          {
            eventId: 'b', name: 'Acme Kickoff', date: '2026-08-30', daysUntil: 22,
            overdueTaskCount: 0, openTaskCount: 4, riskWindowDays: 30,
            reason: 'AT_RISK'
          }
        ]
      }
    })
    const text = wrapper.text()
    expect(text).toContain('Ana & Marko')
    expect(text).toContain('Overdue')
    expect(text).toContain('At risk')
  })

  it('admits the true count when the list is capped', async () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      eventId: `e${i}`, name: `Event ${i}`, date: '2026-08-22', daysUntil: 10,
      overdueTaskCount: 1, openTaskCount: 1, riskWindowDays: 30, reason: 'OVERDUE_TASKS'
    }))
    const wrapper = await render({ attention: { total: 32, limit: 25, items } })

    expect(wrapper.text()).toContain('Showing 25 of 32')
  })
})

