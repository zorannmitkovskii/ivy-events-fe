import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AdminOverviewPage from '@/pages/adminDashboard/AdminOverviewPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The admin dashboard (IVY-1101).
 *
 * <p>The numbers that must not be misread — an unasked RSVP rate, an empty or
 * capped attention list — belong to the shared block and are pinned in
 * {@code dashboard-overview.test.js}, where the agency screen still shows them.
 * What is this screen's own: one request, the status breakdown, and what it
 * leaves out (decided 2026-09-13). Overdue work per event and guest numbers are
 * an agency's concern; on the platform screen the quick-nav tiles lead instead.
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
      statusBreakdown: overrides.statusBreakdown ?? { DRAFT: 0, PENDING: 0, ACTIVE: 0 },
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

describe('the status breakdown', () => {
  it('renders every status, including the zeroes', async () => {
    const wrapper = await render({
      totals: { eventCount: 9 },
      statusBreakdown: { DRAFT: 0, PENDING: 2, ACTIVE: 7 }
    })
    const text = wrapper.text()
    expect(text).toContain('Draft')
    expect(text).toContain('Pending')
    expect(text).toContain('Active')
  })
})

describe('what the platform screen leaves out', () => {
  const busyPlatform = {
    totals: { eventCount: 4, guestCount: 40, invitedCount: 30, responseRate: 80, overdueTaskCount: 3 },
    attention: {
      total: 1,
      overdueCount: 1,
      limit: 25,
      items: [
        {
          eventId: 'a', name: 'Ana & Marko', date: '2026-08-22', daysUntil: 14,
          overdueTaskCount: 3, openTaskCount: 5, riskWindowDays: 30, reason: 'OVERDUE_TASKS'
        }
      ]
    }
  }

  it('shows no attention list, even when events have overdue work', async () => {
    const wrapper = await render(busyPlatform)
    expect(wrapper.find('#attention').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Ana & Marko')
  })

  it('shows no delayed-tasks card, no guests card and no RSVP chart', async () => {
    const wrapper = await render(busyPlatform)
    const text = wrapper.text()
    expect(text).not.toContain(en.adminOverview.delayedTasks)
    expect(text).not.toContain(en.adminOverview.guests)
    expect(text).not.toContain('80%')
  })

  it('puts the quick-nav tiles before the cards', async () => {
    const wrapper = await render(busyPlatform)
    const tile = wrapper.find('.nav-card').element
    const cards = wrapper.find('.cards').element
    expect(tile.compareDocumentPosition(cards) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
