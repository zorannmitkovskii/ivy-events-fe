import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * IVY-1203 — the agency's own team screen.
 *
 * <p>Three things only a browser shows: that the dashboard no longer offers the
 * pipeline and does offer the team, that creating an organizer sends no
 * organization id anywhere (the server reads it from the token, and a body that
 * carried one would be a hole waiting for a server that trusts it), and that a
 * refused list ends up on the screen rather than as an empty table reading "you
 * have no team".
 */

const OWNER = '11111111-1111-1111-1111-111111111111'
const EVENT = 'aaaaaaaa-0000-0000-0000-000000000001'

const TEAM = [
  {
    id: 'u-1', username: 'ana@agency.mk', email: 'ana@agency.mk',
    firstName: 'Ana', lastName: 'Ivanova', enabled: true, emailVerified: true,
    roles: ['ORGANIZER'], eventIds: [], packages: [], orgId: 'org-1',
  },
]

const ANALYTICS = {
  totals: {
    eventCount: 3, guestCount: 120, childCount: 4, invitedCount: 100,
    confirmedCount: 60, respondedCount: 80, responseRate: 80, overdueTaskCount: 0,
  },
  statusBreakdown: { DRAFT: 1, PENDING: 0, ACTIVATED: 2 },
  upcoming: { next30: 1, next60: 2, next90: 3 },
  monthly: [{ month: '2026-08', count: 3 }],
  attention: { total: 0, overdueCount: 0, atRiskCount: 0, riskWindowDays: 30, limit: 25, items: [] },
  definitions: {},
}

let createCalls = []
let updateCalls = []

async function stubApi(page, { listFails = false } = {}) {
  createCalls = []
  updateCalls = []
  // The stub keeps state, so "the row appears" and "it is still there after a
  // refresh" are two different assertions rather than the same one twice.
  const team = TEAM.map((u) => ({ ...u }))

  await page.route('**/v1/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/v1/api', '')
    const method = route.request().method()

    // The analytics endpoints answer inside the ApiResponse envelope; users and
    // events answer with the bare body. Stubbing both the same way is how the
    // first run of this spec produced an empty table against a backend that
    // would have filled it.
    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })

    const bare = (data) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(data),
    })

    if (path === '/analytics/agency') return wrapped(ANALYTICS)
    if (path === '/crm/agency/risk-window') return wrapped({ riskWindowDays: 30, isDefault: true })
    if (path === '/events') return bare([{ id: EVENT, name: 'Ana & Marko', categoryType: 'WEDDING' }])

    if (path === '/admin/users' && method === 'GET') {
      if (listFails) {
        return route.fulfill({
          status: 403, contentType: 'application/json',
          body: JSON.stringify({
            success: false, message: 'Access denied',
            data: { status: 403, errorCode: 'AUTHZ_ACCESS_DENIED', type: 'authorization', detail: 'Access denied' },
          }),
        })
      }
      return bare(team)
    }

    if (path === '/admin/users' && method === 'POST') {
      const sent = JSON.parse(route.request().postData() || '{}')
      createCalls.push(sent)
      const created = {
        ...TEAM[0], id: 'u-2', email: sent.email,
        firstName: sent.firstName, lastName: sent.lastName,
        roles: sent.roles, eventIds: sent.eventIds || [],
      }
      team.push(created)
      return route.fulfill({
        status: 201, contentType: 'application/json', body: JSON.stringify(created),
      })
    }

    const single = path.match(/^\/admin\/users\/(.+)$/)
    if (single && method === 'GET') {
      const found = team.find((u) => u.id === single[1])
      return found ? bare(found) : route.fulfill({ status: 404, body: '{}' })
    }

    if (single && method === 'PUT') {
      const sent = JSON.parse(route.request().postData() || '{}')
      updateCalls.push({ id: single[1], body: sent })
      const target = team.find((u) => u.id === single[1])
      Object.assign(target, { roles: sent.roles, eventIds: sent.eventIds || [] })
      return bare(target)
    }

    return wrapped(null)
  })
}

async function openDashboard(page) {
  await signIn(page, { userId: OWNER, eventId: EVENT, lang: 'en', roles: ['ORG_ADMIN', 'USER'] })
  await page.goto('/en/org/dashboard')
  await expect(page.getByRole('heading', { name: 'Agency dashboard' })).toBeVisible()
}

test('the dashboard offers the team and no longer offers the pipeline', async ({ page }) => {
  await stubApi(page)
  await openDashboard(page)

  await expect(page.locator('.nav-card[href="/en/org/users"]')).toBeVisible()
  await expect(page.locator('.nav-card[href*="pipeline"]')).toHaveCount(0)

  await page.locator('.nav-card[href="/en/org/users"]').click()
  await expect(page).toHaveURL(/\/en\/org\/users$/)
  await expect(page.getByText('ana@agency.mk')).toBeVisible()
})

test('creating an organizer sends the roles and no organization id', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: OWNER, eventId: EVENT, lang: 'en', roles: ['ORG_ADMIN', 'USER'] })
  await page.goto('/en/org/users')

  await page.getByRole('button', { name: 'Create User' }).click()
  await page.getByPlaceholder('John', { exact: true }).fill('Nov')
  await page.getByPlaceholder('Doe', { exact: true }).fill('Organizator')
  await page.getByPlaceholder('john@example.com').fill('nov@agency.mk')
  await page.getByRole('button', { name: 'Create', exact: true }).click()

  await expect.poll(() => createCalls.length).toBe(1)
  expect(createCalls[0].roles).toEqual(['ORGANIZER'])
  expect(createCalls[0]).not.toHaveProperty('orgId')

  // The row is there without a reload having been asked for.
  await expect(page.getByText('nov@agency.mk')).toBeVisible()
})

test('an event granted to an organizer survives a refresh', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: OWNER, eventId: EVENT, lang: 'en', roles: ['ORG_ADMIN', 'USER'] })
  await page.goto('/en/org/users')

  await page.locator('tbody tr').first().hover()
  await page.locator('.action-btn--edit').first().click()
  await page.locator('.dialog').getByText('Ana & Marko').click()
  await page.getByRole('button', { name: 'Update', exact: true }).click()

  await expect.poll(() => updateCalls.length).toBe(1)
  expect(updateCalls[0].body.eventIds).toEqual([EVENT])

  await page.reload()
  await page.locator('tbody tr').first().hover()
  await page.locator('.action-btn--edit').first().click()

  await expect(page.locator(`.dialog input[value="${EVENT}"]`)).toBeChecked()
})

test('an agency owner is offered neither ADMIN nor ORG_ADMIN', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: OWNER, eventId: EVENT, lang: 'en', roles: ['ORG_ADMIN', 'USER'] })
  await page.goto('/en/org/users')

  await page.getByRole('button', { name: 'Create User' }).click()
  await expect(page.locator('.dialog')).toBeVisible()

  const labels = await page.locator('.dialog .check-label span').allInnerTexts()

  expect(labels).toContain('ORGANIZER')
  expect(labels).toContain('USER')
  expect(labels).not.toContain('ADMIN')
  expect(labels).not.toContain('ORG_ADMIN')
})

test('a refused list is stated, not rendered as an empty team', async ({ page }) => {
  await stubApi(page, { listFails: true })
  await signIn(page, { userId: OWNER, eventId: EVENT, lang: 'en', roles: ['ORG_ADMIN', 'USER'] })
  await page.goto('/en/org/users')

  await expect(page.getByRole('alert')).toContainText('could not be loaded')
  await expect(page.locator('table')).toHaveCount(0)
})

test('someone who is not an agency owner never reaches the screen', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: OWNER, eventId: EVENT, lang: 'en', roles: ['ORGANIZER'] })
  await page.goto('/en/org/users')

  await expect(page).not.toHaveURL(/\/org\/users$/)
})
