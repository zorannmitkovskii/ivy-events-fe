import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * IVY-908 — each role in its own panel; IVY-912 — the admin console in tabs.
 *
 * <p>The router guard and the top bar together, in a browser: an administrator
 * typing an event or agency URL lands on the admin console, and the top bar
 * there offers the console's tabs and nothing else. Each tab has a short
 * sidebar of its own. An agency owner's panel offers no "My event".
 */

const USER_ID = '11111111-1111-1111-1111-111111111111'

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

async function stubApi(page) {
  await page.route('**/v1/api/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace('/v1/api', '')
    const respond = (body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })

    if (path === '/analytics/admin' || path === '/analytics/agency') return respond({ success: true, message: null, data: ANALYTICS })
    if (path === '/content/posts') return respond({ success: true, message: null, data: { content: [], totalElements: 0 } })
    if (path.startsWith('/admin/users') || path.startsWith('/events')) return respond([])
    return respond({ success: true, message: null, data: null })
  })
}

const signInAsAdmin = (page) => signIn(page, { userId: USER_ID, eventId: 'none', lang: 'en', roles: ['ADMIN', 'USER'] })

for (const path of ['/en/dashboard/events/overview', '/en/organizer', '/en/org/dashboard']) {
  test(`an administrator opening ${path} lands on the admin console`, async ({ page }) => {
    await stubApi(page)
    await signInAsAdmin(page)

    await page.goto(path)

    await expect(page).toHaveURL(/\/en\/admin\/dashboard$/)
  })
}

test('the administrator top bar offers the console tabs, each with its own sidebar', async ({ page }) => {
  await stubApi(page)
  await signInAsAdmin(page)

  await page.goto('/en/admin/dashboard')
  const tabs = page.locator('header.top .roles a')
  const sidebar = page.locator('nav.snav a')
  await expect(tabs).toHaveText(['Admin', 'Users', 'Events', 'Content', 'Messages'])
  await expect(sidebar).toHaveText(['Dashboard', 'Settings'])

  await tabs.filter({ hasText: 'Users' }).click()

  await expect(page).toHaveURL(/\/en\/admin\/users$/)
  await expect(page.locator('header.top .roles a[aria-current="page"]')).toHaveText('Users')
  await expect(sidebar).toHaveText(['Users', 'Organizers', 'Professional queue', 'Reviews'])
})

test('the content tab opens the blog and stays marked while a post is being written', async ({ page }) => {
  await stubApi(page)
  await signInAsAdmin(page)

  await page.goto('/en/admin/dashboard')
  await page.locator('header.top .roles a').filter({ hasText: 'Content' }).click()
  await expect(page).toHaveURL(/\/en\/admin\/blog$/)

  await page.goto('/en/admin/blog/new')

  await expect(page.locator('header.top .roles a[aria-current="page"]')).toHaveText('Content')
  await expect(page.locator('nav.snav a')).toHaveText(['Blog', 'Tags', 'Conversions', 'FAQ'])
  await expect(page.locator('nav.snav a[aria-current="page"]')).toHaveText('Blog')
})

test('the admin dashboard opens with the filters and date range on top', async ({ page }) => {
  await stubApi(page)
  await signInAsAdmin(page)

  await page.goto('/en/admin/dashboard')
  const filters = page.locator('.dashboard-overview > details.filters-fold')
  await expect(filters).toBeVisible()

  const filtersTop = (await filters.boundingBox()).y
  const firstCard = await page.locator('.dashboard-overview .cards').boundingBox()
  expect(filtersTop).toBeLessThan(firstCard.y)
  await expect(page.locator('.dashboard-overview > *').nth(1)).toHaveClass(/filters-fold/)

  await filters.locator('summary').click()
  await expect(filters.locator('input[type="date"]').first()).toBeVisible()
})

test('the name and sign-out sit at the bottom of a short sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await stubApi(page)
  await signInAsAdmin(page)

  await page.goto('/en/admin/dashboard')
  const side = await page.locator('aside.side').boundingBox()
  const footer = await page.locator('aside.side .me').boundingBox()
  const lastRow = await page.locator('nav.snav a').last().boundingBox()

  // Two rows of navigation leave most of the column empty; the footer belongs
  // at its foot, not under the second row.
  expect(side.y + side.height - (footer.y + footer.height)).toBeLessThan(40)
  expect(footer.y - (lastRow.y + lastRow.height)).toBeGreaterThan(300)
  await expect(page.locator('aside.side .side-signout')).toBeVisible()
})

test('on a phone the console tabs are in the menu', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 })
  await stubApi(page)
  await signInAsAdmin(page)

  await page.goto('/en/admin/dashboard')
  await page.locator('header.top .mtop .icon-btn').click()
  await page.locator('.side-tabs a').filter({ hasText: 'Messages' }).click()

  await expect(page).toHaveURL(/\/en\/admin\/contacts$/)
})

test('an agency owner\'s panel offers no "My event"', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: USER_ID, eventId: 'none', lang: 'en', roles: ['ORG_ADMIN', 'USER'] })

  await page.goto('/en/org/dashboard')

  await expect(page.locator('header.top')).toBeVisible()
  await expect(page.locator('header.top .roles')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'My event', exact: true })).toHaveCount(0)
})
