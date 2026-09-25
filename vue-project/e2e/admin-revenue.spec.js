import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * IVY-1104 — revenue on the admin dashboard, in a browser: the card shows the
 * net figure, a package narrows it, and the dashboard's date range reaches it.
 */

const ADMIN = '11111111-1111-1111-1111-111111111111'

const ANALYTICS = {
  totals: {
    eventCount: 3, guestCount: 40, childCount: 0, invitedCount: 30,
    confirmedCount: 20, respondedCount: 25, responseRate: 83, overdueTaskCount: 0,
  },
  statusBreakdown: { DRAFT: 1, PENDING: 0, ACTIVATED: 2 },
  upcoming: { next30: 1, next60: 2, next90: 3 },
  monthly: [],
  attention: { total: 0, overdueCount: 0, atRiskCount: 0, riskWindowDays: 30, limit: 25, items: [] },
  definitions: {},
}

const PACKAGES = [
  { packageType: 'INV_BASIC', net: 0, payments: 0 },
  { packageType: 'INV_PRO', net: 4999, payments: 1 },
  { packageType: 'INV_PREMIUM', net: 7999, payments: 1 },
  { packageType: 'GALLERY_BASIC', net: 0, payments: 0 },
  { packageType: 'GALLERY_PREMIUM', net: 0, payments: 0 },
]

function backend() {
  const revenueRequests = []

  const handler = (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/v1/api', '')
    const ok = (data) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: null, data }),
    })

    if (path === '/analytics/admin/revenue') {
      const query = Object.fromEntries(url.searchParams)
      revenueRequests.push(query)
      const net = query.packageType === 'INV_PRO' ? 4999 : 12998
      return ok({
        currency: 'MKD', packageType: query.packageType || null, net, gross: net, refunded: 0,
        payments: query.packageType ? 1 : 2, byPackage: PACKAGES, definition: 'Successful payments less refunds.',
      })
    }
    if (path === '/analytics/admin') return ok(ANALYTICS)
    if (path.startsWith('/admin/users') || path.startsWith('/events')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }
    return ok(null)
  }

  return { handler, revenueRequests }
}

const denars = (amount) =>
  new Intl.NumberFormat('en', { style: 'currency', currency: 'MKD', maximumFractionDigits: 0 }).format(amount)

test('the admin dashboard shows revenue, narrowed by package and by the date range', async ({ page }) => {
  const api = backend()
  await page.route('**/v1/api/**', api.handler)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN'] })

  await page.goto('/en/admin/dashboard')
  const card = page.locator('.revenue-card')
  await expect(card.locator('.figure')).toHaveText(denars(12998))
  await expect(card.locator('.rows dt')).toHaveText(['Invitation Pro', 'Invitation Premium'])

  await card.getByLabel('Package').selectOption('INV_PRO')
  await expect(card.locator('.figure')).toHaveText(denars(4999))
  await expect(card.locator('.rows dt')).toHaveCount(2)

  const filters = page.locator('details.filters-fold')
  await filters.locator('summary').click()
  const [from, to] = [filters.locator('input[type="date"]').nth(0), filters.locator('input[type="date"]').nth(1)]
  await from.fill('2031-03-01')
  await to.fill('2031-03-31')
  await filters.getByRole('button', { name: 'Apply' }).click()

  await expect.poll(() => api.revenueRequests.at(-1))
    .toEqual({ from: '2031-03-01', to: '2031-03-31', packageType: 'INV_PRO' })
})

test('a revenue failure leaves the rest of the dashboard standing', async ({ page }) => {
  await page.route('**/v1/api/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace('/v1/api', '')
    if (path === '/analytics/admin/revenue') return route.fulfill({ status: 500, body: '{}' })
    if (path === '/analytics/admin') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: ANALYTICS }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) })
  })
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN'] })

  await page.goto('/en/admin/dashboard')

  await expect(page.locator('.revenue-card [role="alert"]')).toHaveText('Revenue could not be loaded.')
  await expect(page.locator('.cards .stat-card').first()).toContainText('3')
})
