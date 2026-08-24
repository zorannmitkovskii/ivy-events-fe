import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * IVY-1102 — the organizer directory.
 *
 * <p>Three things a unit test cannot show: that the sidebar actually reaches
 * the screen, that a column header sends the sort to the server rather than
 * reordering what is already on the page, and that a refused status change
 * lands in front of the administrator instead of in the console.
 */

const ADMIN = '11111111-1111-1111-1111-111111111111'

const ROWS = [
  {
    id: 'u-1', firstName: 'Ana', lastName: 'Ivanova', email: 'ana@agency.mk',
    status: 'ACTIVE', orgId: 'org-1', roles: ['ORGANIZER'], activeEvents: 4, overdueTasks: 9,
  },
  {
    id: 'u-2', firstName: 'Boris', lastName: 'Petrov', email: 'boris@agency.mk',
    status: 'ACTIVE', orgId: 'org-2', roles: ['ORGANIZER'], activeEvents: 1, overdueTasks: 0,
  },
]

let listCalls = []
let statusCalls = []

async function stubApi(page, { statusFails = false } = {}) {
  listCalls = []
  statusCalls = []

  await page.route('**/v1/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/v1/api', '')
    const method = route.request().method()

    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })

    if (path === '/admin/organizers' && method === 'GET') {
      listCalls.push(Object.fromEntries(url.searchParams))
      return wrapped({
        rows: ROWS, total: ROWS.length, first: 0, max: 20, truncated: false,
        definitions: {
          activeEvents: 'ACTIVATED events the organizer was granted — not events they created.',
          overdueTasks: 'Past due and not DONE or CANCELED, on their events.',
          status: 'ACTIVE or DISABLED, from Keycloak.',
        },
      })
    }

    if (path.endsWith('/status') && method === 'PUT') {
      statusCalls.push(JSON.parse(route.request().postData() || '{}'))
      if (statusFails) {
        return route.fulfill({
          status: 409, contentType: 'application/json',
          body: JSON.stringify({
            success: false, message: 'conflict',
            data: {
              status: 409, errorCode: 'CONFLICT_OBJECT_ALREADY_EXISTS', type: 'conflict',
              detail: 'Организацијата мора да има барем еден ORG_ADMIN',
            },
          }),
        })
      }
      return wrapped({ id: 'u-1', enabled: false })
    }

    if (path.endsWith('/workload') && method === 'GET') {
      return wrapped({
        totals: { eventCount: 2, overdueTaskCount: 9 },
        events: [{
          eventId: 'e-1', name: 'Ana & Marko', status: 'ACTIVATED', date: '2026-09-01',
          overdueTaskCount: 5, openTaskCount: 7,
        }],
        definitions: {},
      })
    }

    return wrapped(null)
  })
}

async function openDirectory(page) {
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN'] })
  await page.goto('/en/admin/organizers')
  await expect(page.getByRole('heading', { name: 'Organizers' })).toBeVisible()
}

test('the sidebar reaches the directory and the rows carry their workload', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN'] })
  await page.goto('/en/admin/dashboard')

  // The sidebar entry specifically — since IVY-1103 the dashboard's nav grid
  // offers the same destination, and this test is about the sidebar.
  await page.locator('.nav-item[href="/en/admin/organizers"]').click()
  await expect(page).toHaveURL(/\/en\/admin\/organizers$/)

  const firstRow = page.locator('tbody tr').first()
  await expect(firstRow).toContainText('Ana')
  await expect(firstRow).toContainText('9')
  await expect(page.locator('.col-note').first()).toContainText('not events they created')
})

test('a column header sorts on the server, not in the page', async ({ page }) => {
  await stubApi(page)
  await openDirectory(page)

  expect(listCalls[0]).toMatchObject({ sort: 'OVERDUE_TASKS', direction: 'DESC' })

  await page.getByRole('button', { name: /Assigned active events/ }).click()
  await expect.poll(() => listCalls.length).toBe(2)
  expect(listCalls[1]).toMatchObject({ sort: 'ACTIVE_EVENTS', direction: 'DESC' })
})

test('search reaches the server once the typing stops', async ({ page }) => {
  await stubApi(page)
  await openDirectory(page)

  await page.getByPlaceholder('Search by name or email...').fill('ana')

  await expect.poll(() => listCalls.length).toBe(2)
  expect(listCalls[1]).toMatchObject({ search: 'ana', first: '0' })
})

test('a refused status change is shown, and the row keeps its real state', async ({ page }) => {
  await stubApi(page, { statusFails: true })
  await openDirectory(page)

  await page.locator('.action').first().click()

  await expect(page.getByRole('alert')).toContainText('ORG_ADMIN')
  await expect(page.locator('tbody tr').first()).toContainText('Active')
  expect(statusCalls).toEqual([{ enabled: false }])
})

test('a name opens that organizer\'s own events', async ({ page }) => {
  await stubApi(page)
  await openDirectory(page)

  await page.locator('.name-link').first().click()

  await expect(page.locator('.dialog')).toContainText('Ana & Marko')
  await expect(page.locator('.dialog')).toContainText('5 overdue / 7 open')
})

test('an organizer never reaches the admin directory', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ORGANIZER'] })
  await page.goto('/en/admin/organizers')

  await expect(page).not.toHaveURL(/\/admin\/organizers$/)
})
