import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * IVY-1203 — the agency's own team screen.
 *
 * <p>Three things only a browser shows: that the sidebar leads to the team
 * screen, that creating an organizer sends no
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

const HOME = {
  viewer: 'OWNER', today: '2026-09-24', rangeDays: 7, riskWindowDays: 30,
  kpis: { activeEvents: 1, activeEventsSoon: 1, overdueTasks: 0, myOverdueTasks: null, awaitingRsvp: 0, vendorsAwaiting: 0, vendorsAwaitingEvents: 0, overBudgetEvents: 0 },
  attention: [], deadlines: [], events: [], vendorDecisions: [],
  team: { members: [], unassignedOverdue: 0 }, budget: { planned: 0, spent: 0, overBudgetEvents: 0, events: [] },
}

const OWNER_PRIVILEGES = [{ type: 'AGENCY', owner: true, privileges: [
  'agency:dashboard', 'agency:events', 'agency:crm', 'agency:calendar', 'agency:tasks',
  'agency:team', 'agency:vendors', 'agency:reports', 'agency:settings',
] }]

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
    if (path === '/analytics/agency/home') return wrapped(HOME)
    // An owner holds every agency screen, as the server answers for one.
    if (path === '/me/privileges') return wrapped(OWNER_PRIVILEGES)
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
  await signIn(page, { userId: OWNER, eventId: EVENT, lang: 'en', roles: ['AGENCY', 'USER'] })
  await page.goto('/en/agency/dashboard')
  await expect(page.locator('.snav')).toBeVisible()
}

test('the sidebar leads from the dashboard to the team', async ({ page }) => {
  await stubApi(page)
  await openDashboard(page)

  // The tiles that once did this job are gone (IVY-1401); the sidebar is the way.
  const teamLink = page.locator('.snav a[href="/en/agency/users"]').first()
  await expect(teamLink).toBeVisible()

  await teamLink.click()
  await expect(page).toHaveURL(/\/en\/agency\/users$/)
  await expect(page.getByText('ana@agency.mk')).toBeVisible()
})

test('creating an organizer sends the roles and no organization id', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: OWNER, eventId: EVENT, lang: 'en', roles: ['AGENCY', 'USER'] })
  await page.goto('/en/agency/users')

  await page.getByRole('button', { name: 'Create User' }).click()
  await page.getByPlaceholder('Jane', { exact: true }).fill('Nov')
  await page.getByPlaceholder('Smith', { exact: true }).fill('Organizator')
  await page.getByPlaceholder('jane@example.com').fill('nov@agency.mk')
  await page.getByRole('button', { name: 'Create', exact: true }).click()

  await expect.poll(() => createCalls.length).toBe(1)
  // AGENCY_MEMBER is what an agency hires; ORGANIZER was its name before the role rename.
  expect(createCalls[0].roles).toEqual(['AGENCY_MEMBER'])
  expect(createCalls[0]).not.toHaveProperty('orgId')

  // The row is there without a reload having been asked for.
  await expect(page.getByText('nov@agency.mk')).toBeVisible()
})

test('an event granted to an organizer survives a refresh', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: OWNER, eventId: EVENT, lang: 'en', roles: ['AGENCY', 'USER'] })
  await page.goto('/en/agency/users')

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

test('an agency owner is offered neither ADMIN nor a second owner role', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: OWNER, eventId: EVENT, lang: 'en', roles: ['AGENCY', 'USER'] })
  await page.goto('/en/agency/users')

  await page.getByRole('button', { name: 'Create User' }).click()
  await expect(page.locator('.dialog')).toBeVisible()

  const labels = await page.locator('.dialog .check-label span').allInnerTexts()

  expect(labels).toContain('AGENCY_MEMBER')
  expect(labels).toContain('USER')
  expect(labels).not.toContain('ADMIN')
  expect(labels).not.toContain('AGENCY')
})

test('a refused list is stated, not rendered as an empty team', async ({ page }) => {
  await stubApi(page, { listFails: true })
  await signIn(page, { userId: OWNER, eventId: EVENT, lang: 'en', roles: ['AGENCY', 'USER'] })
  await page.goto('/en/agency/users')

  await expect(page.getByRole('alert')).toContainText('could not be loaded')
  await expect(page.locator('table')).toHaveCount(0)
})

test('someone who is not an agency owner never reaches the screen', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: OWNER, eventId: EVENT, lang: 'en', roles: ['ORGANIZER'] })
  await page.goto('/en/agency/users')

  await expect(page).not.toHaveURL(/\/org\/users$/)
})
