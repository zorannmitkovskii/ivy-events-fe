import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * IVY-1202 — the agency dashboard, keyboard-first.
 *
 * <p>The nav grid and the KPI cards are the two things a reader navigates with,
 * and both are links. Whether a link is reachable, focusable and activatable by
 * keyboard is not something jsdom can answer.
 */

const OWNER = '11111111-1111-1111-1111-111111111111'

const ANALYTICS = {
  totals: {
    eventCount: 23, guestCount: 1840, childCount: 40, invitedCount: 1500,
    confirmedCount: 900, respondedCount: 1140, responseRate: 76, overdueTaskCount: 9,
  },
  statusBreakdown: { DRAFT: 4, PENDING: 2, ACTIVATED: 17 },
  upcoming: { next30: 5, next60: 11, next90: 16 },
  monthly: [{ month: '2026-08', count: 3 }],
  attention: { total: 0, overdueCount: 0, atRiskCount: 0, riskWindowDays: 30, limit: 25, items: [] },
  definitions: {},
}

const TEAM = {
  rows: [
    { id: 'u-1', firstName: 'Ana', lastName: 'Ivanova', activeEvents: 4, overdueTasks: 9 },
    { id: 'u-2', firstName: 'Boris', lastName: 'Petrov', activeEvents: 2, overdueTasks: 0 },
  ],
  total: 2, first: 0, max: 5, truncated: false, definitions: {},
}

let teamCalls = []

async function stubApi(page, { teamFails = false } = {}) {
  teamCalls = []
  await page.route('**/v1/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/v1/api', '')

    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })

    if (path === '/analytics/agency') return wrapped(ANALYTICS)
    if (path === '/agency/organizers') {
      teamCalls.push(Object.fromEntries(url.searchParams))
      if (teamFails) {
        return route.fulfill({
          status: 503, contentType: 'application/json',
          body: JSON.stringify({
            success: false, message: 'unavailable',
            data: {
              status: 503, errorCode: 'INTERNAL_SERVER_ERROR', type: 'internal',
              detail: 'Keycloak не е достапен',
            },
          }),
        })
      }
      return wrapped(TEAM)
    }
    if (path === '/admin/users') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }
    return wrapped(null)
  })
}

async function openDashboard(page) {
  await signIn(page, { userId: OWNER, eventId: 'none', lang: 'en', roles: ['ORG_ADMIN', 'USER'] })
  await page.goto('/en/org/dashboard')
  await expect(page.getByRole('heading', { name: 'Agency dashboard' })).toBeVisible()
}

test('the team panel names who is carrying the late work, and never sends an organization id', async ({ page }) => {
  await stubApi(page)
  await openDashboard(page)

  const panel = page.locator('.workload')
  await expect(panel).toContainText('Ana Ivanova')
  await expect(panel).toContainText('9 overdue')
  await expect(panel.locator('.late').first()).toBeVisible()

  expect(teamCalls).toHaveLength(1)
  expect(teamCalls[0]).not.toHaveProperty('orgId')
})

test('a team that cannot be read says so instead of looking empty', async ({ page }) => {
  await stubApi(page, { teamFails: true })
  await openDashboard(page)

  await expect(page.locator('.workload [role="alert"]')).toContainText('could not be loaded')
})

test('the panel leads to the roster', async ({ page }) => {
  await stubApi(page)
  await openDashboard(page)

  await page.locator('.workload a').first().click()
  await expect(page).toHaveURL(/\/en\/org\/users$/)
})

test('widening the at-risk window brings an event into the attention list', async ({ page }) => {
  // The window the agency has saved, and an event 45 days out with open work.
  // Which is exactly the case the window decides: inside 60, outside 30.
  let savedWindow = 30
  const nearlyDue = {
    eventId: 'a', name: 'Elena & Stefan', date: '2026-09-26', daysUntil: 45,
    overdueTaskCount: 0, openTaskCount: 6, riskWindowDays: 60, reason: 'AT_RISK',
  }

  await page.route('**/v1/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/v1/api', '')
    const method = route.request().method()
    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })

    if (path === '/crm/agency/risk-window' && method === 'PUT') {
      savedWindow = JSON.parse(route.request().postData() || '{}').riskWindowDays
      return wrapped({ riskWindowDays: savedWindow, isDefault: false })
    }
    if (path === '/crm/agency/risk-window') return wrapped({ riskWindowDays: savedWindow, isDefault: savedWindow === 30 })
    if (path === '/analytics/agency') {
      const items = savedWindow >= 45 ? [nearlyDue] : []
      return wrapped({
        ...ANALYTICS,
        attention: {
          total: items.length, overdueCount: 0, atRiskCount: items.length,
          riskWindowDays: savedWindow, limit: 25, items,
        },
      })
    }
    if (path === '/agency/organizers') return wrapped(TEAM)
    return wrapped(null)
  })

  await openDashboard(page)
  await expect(page.locator('#attention')).not.toContainText('Elena & Stefan')

  await page.goto('/en/org/settings')
  await page.locator('input[type="number"]').fill('60')
  await page.getByRole('button').filter({ hasText: /Save|Зачувај/ }).first().click()
  await expect(page.getByRole('status')).toBeVisible()

  await page.goto('/en/org/dashboard')
  await expect(page.locator('#attention')).toContainText('Elena & Stefan')
})

test('the nav grid and the KPI cards are reachable and activatable by keyboard', async ({ page }) => {
  await stubApi(page)
  await openDashboard(page)

  // The grid: focus the first tile, walk it, and activate the last one reached.
  await page.locator('.nav-card').first().focus()
  const gridOrder = []
  for (let i = 0; i < 3; i++) {
    gridOrder.push(await page.evaluate(() => document.activeElement.getAttribute('href')))
    await page.keyboard.press('Tab')
  }
  expect(gridOrder).toEqual(['/en/organizer', '/en/org/users', '/en/org/settings'])

  await page.locator('.nav-card').nth(2).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/en\/org\/settings$/)

  // A KPI card is a link too, so the same is true of it.
  await openDashboard(page)
  const card = page.locator('a.stat-card, .stat-card a').first()
  await card.focus()
  const outline = await card.evaluate((el) => getComputedStyle(el).outlineStyle)
  expect(outline).not.toBe('none')
  await page.keyboard.press('Enter')
  await expect(page).not.toHaveURL(/\/org\/dashboard$/)
})
