import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * The admin payments list is an ordinary table.
 *
 * <p>It used to sit inside `.tbl-round` — the seating plan's round table,
 * `aspect-ratio: 1; border-radius: 50%` — and the browser drew every payment
 * inside a circle. The unit test proves the markup; only a browser proves the
 * shape: a wide, lightly rounded card, not a disc.
 */

const ADMIN = '11111111-1111-1111-1111-111111111111'

const payment = (id, status) => ({
  id,
  status,
  providerOrderRef: `ORD-${id}`,
  customerEmail: `${id}@ivy.test`,
  packageType: 'PREMIUM',
  amount: 1200,
  currency: 'MKD',
  createdAt: '2026-09-01T10:00:00Z',
})

async function stubApi(page) {
  await page.route('**/v1/api/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace('/v1/api', '')
    const respond = (body) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(body),
    })

    if (path === '/admin/payments') {
      return respond({ success: true, message: null, data: {
        content: [payment('a', 'SUCCESS'), payment('b', 'FAILED'), payment('c', 'PENDING')],
        totalElements: 3,
      } })
    }
    if (path.startsWith('/admin/users') || path.startsWith('/events')) return respond([])

    return respond({ success: true, message: null, data: null })
  })
}

test('payments render as a table in a card, one row per attempt, not in a circle', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN'] })
  await page.goto('/en/admin/payments')

  await expect(page.locator('.tbl-card table.tbl tbody tr')).toHaveCount(3)
  await expect(page.locator('.tbl-round')).toHaveCount(0)

  const card = page.locator('.tbl-card')
  const box = await card.boundingBox()
  expect(box.width).toBeGreaterThan(box.height * 1.5)

  const radius = await card.evaluate((element) => parseFloat(getComputedStyle(element).borderTopLeftRadius))
  expect(radius).toBeLessThan(box.height / 4)
})
