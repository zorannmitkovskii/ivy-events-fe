import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AgencyOverviewPage from '@/pages/dashboard/AgencyOverviewPage.vue'
import { setLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * Where the locale used to stop at the text (IVY-1204).
 *
 * <p>Three leaks, all of the same shape: a browser API asked for "the locale"
 * without being told which one, so a Macedonian dashboard printed 1:13 PM, Jun
 * Jul Aug, and a filter offering BABY_SHOWER.
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

const PAYLOAD = {
  data: {
    totals: {
      eventCount: 23, guestCount: 1840, childCount: 0, invitedCount: 500,
      confirmedCount: 900, respondedCount: 1140, responseRate: 76, overdueTaskCount: 2,
    },
    statusBreakdown: { DRAFT: 4, PENDING: 2, ACTIVATED: 17 },
    upcoming: { next30: 5, next60: 11, next90: 16 },
    monthly: [{ month: '2026-06', count: 4 }, { month: '2026-09', count: 9 }],
    attention: { total: 0, overdueCount: 0, atRiskCount: 0, riskWindowDays: 30, limit: 25, items: [] },
    definitions: {},
  },
}

beforeEach(() => {
  agencyMock.mockReset().mockResolvedValue(PAYLOAD)
})

async function render(locale) {
  const i18n = createI18n({ legacy: false, locale, messages: { en, mk, sq } })
  const wrapper = mount(AgencyOverviewPage, { global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper
}

describe('the event type filter', () => {
  it('offers words, not enum values, in every language', async () => {
    for (const locale of ['mk', 'en', 'sq']) {
      const wrapper = await render(locale)
      const options = wrapper.findAll('.filters select option').map((o) => o.text().trim())

      expect(options.length).toBeGreaterThan(1)
      expect(options.filter((label) => /^[A-Z][A-Z_]+$/.test(label)),
        `raw enum values leaked into the ${locale} filter`).toEqual([])
    }
  })

  it('keeps the enum as the value the API receives', async () => {
    const wrapper = await render('mk')
    const values = wrapper.findAll('.filters select option').map((o) => o.attributes('value'))

    expect(values).toContain('BABY_SHOWER')
    expect(wrapper.text()).toContain('Бејби шауер')
  })
})

describe('the last-updated stamp', () => {
  it('is written in the reader\'s language and to the minute', async () => {
    const wrapper = await render('mk')
    const stamp = wrapper.find('.stamp').text()

    expect(stamp).not.toMatch(/AM|PM/)
    // "13:07", not "13:07:42" — this says when, not how long.
    expect(stamp).not.toMatch(/\d{1,2}:\d{2}:\d{2}/)
    expect(stamp).toMatch(/\d{1,2}:\d{2}/)
  })
})

describe('the document itself', () => {
  it('says which language it is in, so a screen reader does not guess', () => {
    setLocale('en')
    expect(document.documentElement.lang).toBe('en')

    setLocale('mk')
    expect(document.documentElement.lang).toBe('mk')
  })
})
