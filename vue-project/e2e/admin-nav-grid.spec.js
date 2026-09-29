import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * IVY-1103 — the admin quick-navigation grid.
 *
 * <p>Everything here needs a browser: focus order, Enter and Space, middle
 * click, and whether the grid reflows at 360px without pushing the page
 * sideways. A unit test can prove the hrefs are right and nothing more.
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

async function stubApi(page) {
  await page.route('**/v1/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/v1/api', '')

    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })
    const bare = (data) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(data),
    })

    if (path === '/analytics/admin') return wrapped(ANALYTICS)
    if (path === '/admin/organizers') {
      return wrapped({ rows: [{
        id: 'u-1', firstName: 'Ana', lastName: 'Ivanova', email: 'ana@agency.mk',
        status: 'ACTIVE', orgId: 'org-1', roles: ['ORGANIZER'], activeEvents: 2, overdueTasks: 0,
      }], total: 1, first: 0, max: 20, truncated: false, definitions: {} })
    }
    if (path.startsWith('/admin/settings/risk-window')) {
      return wrapped({ riskWindowDays: 45, isDefault: false })
    }
    if (path.startsWith('/admin/users') || path.startsWith('/events')) return bare([])
    if (path.startsWith('/vendors') || path.startsWith('/public/vendors')) return wrapped({ content: [], totalElements: 0 })

    return wrapped(null)
  })
}

async function openDashboard(page) {
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN'] })
  await page.goto('/en/admin/dashboard')
  await expect(page.locator('.nav-card').first()).toBeVisible()
}

test('the grid offers five cards and each one lands somewhere real', async ({ page }) => {
  await stubApi(page)
  await openDashboard(page)

  const cards = page.locator('.nav-card')
  await expect(cards).toHaveCount(5)

  for (const [index, expected] of [
    [0, /\/en\/admin\/events$/],
    [1, /\/en\/admin\/organizers$/],
    [2, /\/en\/admin\/vendor-queue$/],
    [4, /\/en\/admin\/settings$/],
  ]) {
    await openDashboard(page)
    await page.locator('.nav-card').nth(index).click()
    await expect(page).toHaveURL(expected)
    // Not a blank view: every destination renders a heading of its own.
    await expect(page.locator('h1, h2').first()).toBeVisible()
  }
})

// Overdue work per event and guest numbers are an agency's concern, not the
// platform's (decided 2026-09-13): the payload still carries them, the screen
// leaves them out, and the tiles lead.
test('the platform dashboard leads with the tiles and leaves out task health and guest numbers', async ({ page }) => {
  await page.route('**/v1/api/**', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ success: true, message: null, data: {
      ...ANALYTICS,
      attention: {
        total: 1, overdueCount: 1, atRiskCount: 0, riskWindowDays: null, limit: 25,
        items: [{
          eventId: 'a', name: 'Ana & Marko', date: '2026-08-22', daysUntil: 14,
          overdueTaskCount: 5, openTaskCount: 11, riskWindowDays: 30, reason: 'OVERDUE_TASKS',
        }],
      },
    } }),
  }))
  await openDashboard(page)

  // Two event cards plus the revenue card the admin page adds through the cards slot.
  await expect(page.locator('.cards article, .cards a')).toHaveCount(3)
  await expect(page.locator('.cards')).toContainText('76')     // total events
  await expect(page.getByText('78%')).toHaveCount(0)            // no RSVP rate anywhere
  await expect(page.locator('#attention')).toHaveCount(0)
  await expect(page.getByText('Ana & Marko')).toHaveCount(0)

  const tiles = await page.locator('.nav-card').first().boundingBox()
  const cards = await page.locator('.cards').boundingBox()
  expect(tiles.y).toBeLessThan(cards.y)
})

test('an agency owner typing the admin URL is sent to their own dashboard', async ({ page }) => {
  await stubApi(page)
  // AGENCY, not the retired ORG_ADMIN; and the agency shell moved from /org to /agency.
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['AGENCY', 'USER'] })
  await page.goto('/en/admin/dashboard')

  await expect(page).toHaveURL(/\/en\/agency\/dashboard$/)
})

test('the Reports card brings the charts into view rather than leaving the page', async ({ page }) => {
  await stubApi(page)
  await openDashboard(page)

  await page.locator('.nav-card').nth(3).click()

  await expect(page).toHaveURL(/#charts$/)
  await expect(page.locator('#charts')).toBeVisible()
})

test('focus order follows the visual order, and every card shows a focus ring', async ({ page }) => {
  await stubApi(page)
  await openDashboard(page)

  await page.locator('.nav-card').first().focus()
  const seen = []
  for (let i = 0; i < 5; i++) {
    seen.push(await page.evaluate(() => document.activeElement.getAttribute('href')))
    await page.keyboard.press('Tab')
  }

  expect(seen).toEqual([
    '/en/admin/events',
    '/en/admin/organizers',
    '/en/admin/vendor-queue',
    // The router resolves the hash against the current route, so the rendered
    // href is absolute even though the card only asked for an anchor.
    '/en/admin/dashboard#charts',
    '/en/admin/settings',
  ])

  await page.locator('.nav-card').first().focus()
  const outline = await page.locator('.nav-card').first().evaluate(
    (el) => getComputedStyle(el).outlineStyle)
  expect(outline).not.toBe('none')
})

test('Enter and Space both activate a card', async ({ page }) => {
  await stubApi(page)

  await openDashboard(page)
  await page.locator('.nav-card').nth(1).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/en\/admin\/organizers$/)
  await expect(page.getByText('ana@agency.mk')).toBeVisible()

  await openDashboard(page)
  await page.locator('.nav-card').nth(1).focus()
  await page.keyboard.press('Space')
  await expect(page).toHaveURL(/\/en\/admin\/organizers$/)
})

test('a card is a real link, so middle-click opens a tab', async ({ page, context }) => {
  await stubApi(page)
  await openDashboard(page)

  const opened = context.waitForEvent('page')
  await page.locator('.nav-card').first().click({ button: 'middle' })
  const tab = await opened

  // Waited for rather than sampled: a new tab starts at about:blank and
  // navigates a moment later, which under a loaded worker is long enough to
  // read the wrong URL.
  await tab.waitForURL(/\/en\/admin\/events$/)
})

test('the grid reflows down to 360px with no sideways scroll', async ({ page }) => {
  await stubApi(page)

  for (const width of [1440, 768, 360]) {
    await page.setViewportSize({ width, height: 900 })
    await openDashboard(page)

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `no horizontal scroll at ${width}px`).toBeLessThanOrEqual(0)
  }
})

test('the settings page reads and saves an organization window', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN'] })
  await page.goto('/en/admin/settings')

  await expect(page.getByRole('heading', { name: 'System settings' })).toBeVisible()
  await expect(page.locator('.config-link')).toHaveCount(4)

  await page.locator('input[list="known-organizations"]').fill('org-1')
  await page.getByRole('button', { name: 'Load current' }).click()
  await expect(page.locator('input[type="number"]')).toHaveValue('45')

  await page.locator('input[type="number"]').fill('60')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Saved')
})
