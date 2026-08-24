import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AgencyOverviewPage from '@/pages/dashboard/AgencyOverviewPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The agency dashboard (IVY-1201, IVY-1202).
 *
 * <p>What is pinned here is scope, not layout. This page must call the agency
 * endpoint — the one that reads the organization from the token — and never the
 * platform one, because the difference between them is the entire tenant
 * boundary. The at-risk window moved to the settings page and is tested there.
 */

const { agencyMock } = vi.hoisted(() => ({ agencyMock: vi.fn() }))

vi.mock('@/services/analytics.service', () => ({
  analyticsService: {
    agency: agencyMock,
    // Present so a mistaken call is a visible assertion failure rather than a
    // TypeError that reads like a wiring problem.
    admin: vi.fn()
  }
}))

vi.mock('@/services/agencyTeam.service', () => ({
  agencyTeamService: { workload: vi.fn().mockResolvedValue({ data: { rows: [], total: 0 } }) }
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en' }, query: {} }),
  useRouter: () => ({ replace: vi.fn() }),
  RouterLink: { props: ['to'], template: '<a :href="String(to)"><slot /></a>' }
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const PAYLOAD = {
  data: {
    totals: {
      eventCount: 23, guestCount: 1840, childCount: 40, invitedCount: 1500,
      confirmedCount: 900, respondedCount: 1140, responseRate: 76, overdueTaskCount: 9
    },
    statusBreakdown: { DRAFT: 4, PENDING: 2, ACTIVATED: 17 },
    upcoming: { next30: 5, next60: 11, next90: 16 },
    monthly: [{ month: '2026-08', count: 3 }, { month: '2026-09', count: 0 }],
    attention: {
      total: 2, overdueCount: 1, atRiskCount: 1, riskWindowDays: 30, limit: 25,
      items: [
        {
          eventId: 'a', name: 'Ana & Marko', date: '2026-08-22', daysUntil: 14,
          overdueTaskCount: 5, openTaskCount: 11, riskWindowDays: 30, reason: 'OVERDUE_TASKS'
        },
        {
          eventId: 'b', name: 'Acme Kickoff', date: '2026-08-30', daysUntil: 22,
          overdueTaskCount: 0, openTaskCount: 4, riskWindowDays: 30, reason: 'AT_RISK'
        }
      ]
    },
    definitions: {}
  }
}

beforeEach(() => {
  agencyMock.mockReset().mockResolvedValue(PAYLOAD)
})

async function render() {
  const wrapper = mount(AgencyOverviewPage, { global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper
}

describe('scope', () => {
  it('reads the agency endpoint, never the platform one', async () => {
    const { analyticsService } = await import('@/services/analytics.service')
    await render()

    expect(agencyMock).toHaveBeenCalledTimes(1)
    expect(analyticsService.admin).not.toHaveBeenCalled()
  })

  it('sends no organization id — the server reads it from the token', async () => {
    await render()

    const [filters] = agencyMock.mock.calls[0]
    expect(filters).not.toHaveProperty('orgId')
  })
})

describe('the attention banner', () => {
  it('states the window it judged against instead of offering a form', async () => {
    const wrapper = await render()

    expect(wrapper.text()).toContain('within 30 days')
    // The form left; the link to where it went stayed.
    expect(wrapper.find('input[type="number"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Change the window')
  })
})

describe('quick navigation', () => {
  /**
   * The destinations did not go away, they moved (IVY-1401). Until this screen
   * had a shell, its tiles were the only way between the agency screens; the
   * guarantee that all three are reachable now belongs to AgencySidebarNav,
   * where agency-sidebar.test.js keeps it.
   */
  it('no longer carries navigation, now that the console has a sidebar', async () => {
    const wrapper = await render()

    expect(wrapper.findAll('.nav-card')).toHaveLength(0)
  })

  it('no longer offers the pipeline (removed 2026-08-12)', async () => {
    const wrapper = await render()
    const hrefs = wrapper.findAll('.nav-card').map((card) => card.attributes('href'))

    expect(hrefs.some((href) => href.includes('pipeline'))).toBe(false)
  })
})

describe('the shared block renders the agency numbers', () => {
  it('shows the totals and the RSVP rate', async () => {
    const wrapper = await render()
    const text = wrapper.text()

    expect(text).toContain('23')
    expect(text).toContain('76%')
  })
})
