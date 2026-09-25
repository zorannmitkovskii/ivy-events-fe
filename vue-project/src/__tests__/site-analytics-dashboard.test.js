import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * The traffic dashboard's read path (IVY-906).
 *
 * <p>Regression cover for a crash that looked like a date bug and was not.
 * `siteAnalytics.service` was the one service in the app importing the default
 * export of `api.js` — the bare axios client — instead of the named `api`
 * wrapper. The page peels one layer off whatever it is handed, so with the raw
 * client it ended up holding the `ApiResponse` envelope rather than the report:
 * `from` was `undefined`, `new Date(undefined)` is an Invalid Date, and
 * `Intl.DateTimeFormat.format` answers that with `RangeError: Invalid time
 * value`.
 *
 * <p>So the assertions below are about the shape that comes back, not about
 * formatting. A test that only checked the date would have passed against a
 * stubbed service and missed the wiring entirely.
 */

const get = vi.fn()

vi.mock('axios', () => ({
  default: {
    create: () => ({
      get,
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }),
  },
}))

vi.mock('@/services/baseUrl', () => ({ baseUrl: 'http://api.test' }))
vi.mock('./baseUrl', () => ({ baseUrl: 'http://api.test' }))

const { siteAnalyticsService } = await import('@/services/siteAnalytics.service')

/** The report the server actually returns, inside its envelope. */
const REPORT = {
  period: 'THIS_MONTH',
  from: '2026-09-01T00:00:00Z',
  to: '2026-09-30T23:59:59Z',
  zone: 'Europe/Skopje',
  visitors: 412,
  pageViews: 1908,
  clicks: 233,
  purchases: 7,
  revenue: 84000,
  currency: 'MKD',
}

/** What `SiteAnalyticsPage` does with the result — one layer, no more. */
function unwrap(response) {
  return response?.data ?? response ?? null
}

beforeEach(() => {
  vi.clearAllMocks()
  get.mockResolvedValue({
    data: { success: true, message: null, data: REPORT },
    status: 200,
    headers: {},
    config: {},
  })
})

describe('site analytics service', () => {
  it('hands back the response body, not the axios response', async () => {
    const result = await siteAnalyticsService.stats('THIS_MONTH')

    expect(result).toEqual({ success: true, message: null, data: REPORT })
    expect(result.status).toBeUndefined()
    expect(result.headers).toBeUndefined()
  })

  it('asks for the period the caller chose', async () => {
    await siteAnalyticsService.stats('LAST_WEEK')

    expect(get).toHaveBeenCalledWith('/site-analytics/stats', {
      params: { period: 'LAST_WEEK' },
    })
  })

  it('leaves the page holding the report after its single unwrap', async () => {
    const report = unwrap(await siteAnalyticsService.stats('THIS_MONTH'))

    expect(report).toEqual(REPORT)
    expect(report.visitors).toBe(412)
  })
})

describe('the window label that used to throw', () => {
  it('formats a real date range instead of raising RangeError', async () => {
    const report = unwrap(await siteAnalyticsService.stats('THIS_MONTH'))

    const from = new Date(report.from)
    const to = new Date(report.to)
    expect(Number.isNaN(from.getTime())).toBe(false)
    expect(Number.isNaN(to.getTime())).toBe(false)

    const fmt = new Intl.DateTimeFormat('mk', { dateStyle: 'medium' })
    expect(() => `${fmt.format(from)} – ${fmt.format(to)} (${report.zone})`).not.toThrow()
  })
})
