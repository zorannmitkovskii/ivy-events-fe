import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import DashboardOverview from '@/components/dashboard/DashboardOverview.vue'
import en from '@/i18n/locales/en.json'

/**
 * The shared dashboard block with its defaults — what the agency screen shows
 * (IVY-1101).
 *
 * <p>Moved here from {@code admin-overview.test.js} when the platform screen
 * stopped showing task health and guest numbers (2026-09-13). The readings
 * still matter wherever they render: an unasked RSVP rate is not 0%, an empty
 * attention list is not a missing section, and a capped list must still admit
 * how many there are. All three are ways a dashboard lies while looking like it
 * works.
 */

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
        eventCount: 4,
        guestCount: 0,
        childCount: 0,
        invitedCount: 0,
        confirmedCount: 0,
        respondedCount: 0,
        responseRate: null,
        overdueTaskCount: 0,
        ...overrides.totals
      },
      statusBreakdown: { DRAFT: 0, PENDING: 0, ACTIVE: 4 },
      upcoming: { next30: 0, next60: 0, next90: 0 },
      attention: overrides.attention ?? { total: 0, limit: 25, items: [] },
      definitions: {}
    }
  }
}

async function render(overrides) {
  const wrapper = mount(DashboardOverview, {
    props: {
      title: 'Overview',
      subtitle: 'Numbers',
      loader: vi.fn().mockResolvedValue(payload(overrides)),
      eventLink: (eventId) => `/events/${eventId}`
    },
    global: { plugins: [i18n] }
  })
  await flushPromises()
  return wrapper
}

describe('guest numbers', () => {
  it('shows an em dash, not 0%, when nobody has been invited', async () => {
    const wrapper = await render({ totals: { responseRate: null } })
    expect(wrapper.text()).toContain(en.adminOverview.guests)
    expect(wrapper.text()).toContain('—')
    expect(wrapper.text()).not.toContain('0%')
  })

  it('shows the percentage once there is one', async () => {
    const wrapper = await render({ totals: { guestCount: 40, responseRate: 80 } })
    expect(wrapper.text()).toContain('80%')
  })
})

describe('the attention section', () => {
  it('says nothing needs attention rather than disappearing', async () => {
    const wrapper = await render()
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
