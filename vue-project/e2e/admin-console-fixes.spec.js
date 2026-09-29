import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * Admin console screens that were there but could not be used:
 * Подесувања showed its title and nothing else, Извештаи did nothing,
 * lists stopped at ten rows, and three lists had no way to create.
 */

const ADMIN = '11111111-1111-1111-1111-111111111111'

const ANALYTICS = {
  totals: {
    eventCount: 76, guestCount: 1200, childCount: 20, invitedCount: 900,
    confirmedCount: 600, respondedCount: 700, responseRate: 78, overdueTaskCount: 4,
  },
  statusBreakdown: { DRAFT: 5, PENDING: 2, ACTIVATED: 76 },
  upcoming: { next30: 4, next60: 9, next90: 14 },
  monthly: [{ month: '2026-08', count: 6 }, { month: '2026-09', count: 9 }],
  attention: { total: 0, overdueCount: 0, atRiskCount: 0, riskWindowDays: null, limit: 25, items: [] },
  definitions: {},
}

const PACKAGES = Array.from({ length: 12 }, (_, i) => ({
  id: `p${i + 1}`, name: `Package ${i + 1}`, price: 100 + i, currency: 'MKD',
  packageCategory: 'WEDDING', packageType: 'INV_PRO', features: [],
}))

async function stubApi(page) {
  await page.route('**/v1/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/v1/api', '')
    const wrapped = (data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: null, data }) })
    const bare = (data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })

    if (path === '/analytics/admin') return wrapped(ANALYTICS)
    if (path === '/admin/organizers') return wrapped({ rows: [], total: 0, first: 0, max: 20, truncated: false, definitions: {} })
    if (path === '/packages') return bare(PACKAGES)
    if (path.startsWith('/faq')) return bare([])
    if (path.startsWith('/admin/users') || path.startsWith('/events')) return bare([])
    return wrapped(null)
  })
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  await stubApi(page)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN'] })
})

test('the settings page shows its links and the risk window form', async ({ page }) => {
  await page.goto('/en/admin/settings')

  const links = page.locator('.config-link')
  await expect(links).toHaveCount(4)
  await expect(links.first()).toBeVisible()
  await expect(page.locator('.risk-form')).toBeVisible()

  await page.locator('.config-link', { hasText: 'Packages' }).click()
  await expect(page).toHaveURL(/\/en\/admin\/packages$/)
})

test('the Reports tile scrolls the dashboard to its charts', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 })
  await page.goto('/en/admin/dashboard')
  await expect(page.locator('.nav-card').first()).toBeVisible()

  await page.locator('.nav-card', { hasText: 'Reports' }).click()

  await expect(page).toHaveURL(/#charts$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await expect(page.locator('#charts')).toBeInViewport()
})

test('a list with more than ten rows can be paged through', async ({ page }) => {
  await page.goto('/en/admin/packages')
  await expect(page.locator('tbody tr')).toHaveCount(10)

  await page.getByRole('button', { name: '2', exact: true }).click()

  await expect(page.locator('tbody tr')).toHaveCount(2)
  await expect(page.locator('tbody')).toContainText('Package 12')
})

test('the FAQ list has a create button that opens its dialog', async ({ page }) => {
  await page.goto('/en/admin/faq')

  await page.getByTestId('create').click()

  await expect(page.getByRole('dialog')).toBeVisible()
})
