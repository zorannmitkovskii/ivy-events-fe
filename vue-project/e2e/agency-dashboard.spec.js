import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * The agency workspace for its two people (2026 design, "agency dashboard" and
 * "events by role").
 *
 * <p>The owner and a member sign in to the same routes and must see two
 * different workspaces: the owner the agency with its team and money, the
 * member their own events and work. The API is stubbed per role exactly as the
 * server answers — a member's response has no team or budget — so what these
 * specs guard is that the browser draws each answer for the right person, and
 * that the sidebar, the rows and the filters work by keyboard and click.
 */

const OWNER = '11111111-1111-1111-1111-111111111111'
const IVANA = '22222222-2222-2222-2222-222222222222'

const row = (overrides = {}) => ({
  eventId: 'e-1', name: 'Марија & Филип', categoryType: 'WEDDING', status: 'ACTIVE', date: '2026-10-03',
  daysUntil: 9, location: 'Скопје', client: 'Марија & Филип', lead: { id: IVANA, name: 'Ивана' }, myRole: null,
  tasksTotal: 11, tasksDone: 3, overdueTasks: 8, myOverdueTasks: null, guestCount: 30, confirmedCount: 21,
  declinedCount: 4, awaitingCount: 5, responseRate: 83, plannedBudget: 520000, spentBudget: 375440,
  vendorsAwaiting: 1, nextStep: { title: 'Потврди го кетерингот', dueAt: '2026-09-21T12:00:00' }, ...overrides,
})

const ownerHome = {
  viewer: 'OWNER', today: '2026-09-24', rangeDays: 7, riskWindowDays: 30,
  kpis: { activeEvents: 1, activeEventsSoon: 1, overdueTasks: 8, myOverdueTasks: null, awaitingRsvp: 5, vendorsAwaiting: 1, vendorsAwaitingEvents: 1, overBudgetEvents: 0 },
  attention: [{ eventId: 'e-1', eventName: 'Марија & Филип', kind: 'TASKS', count: 8, daysUntil: 9, lead: { id: IVANA, name: 'Ивана' }, subjects: [] }],
  deadlines: [{ date: '2026-10-03', kind: 'EVENT_DAY', title: 'Марија & Филип', eventId: 'e-1', eventName: 'Марија & Филип', assignee: null }],
  events: [row()],
  vendorDecisions: [{ bookingId: 'b-1', vendorName: 'Кетеринг Вардар', title: 'Вечера', stage: 'TENTATIVE', eventId: 'e-1', eventName: 'Марија & Филип', eventDate: '2026-10-03' }],
  team: { members: [{ id: IVANA, name: 'Ивана', activeEvents: 2, tasksThisWeek: 0, overdueTasks: 6 }], unassignedOverdue: 2 },
  budget: { planned: 520000, spent: 375440, overBudgetEvents: 0, events: [{ eventId: 'e-1', name: 'Марија & Филип', planned: 520000, spent: 375440 }] },
}

const memberHome = {
  ...ownerHome,
  viewer: 'MEMBER',
  kpis: { ...ownerHome.kpis, myOverdueTasks: 3, overBudgetEvents: null },
  events: [row({ myRole: 'LEAD', myOverdueTasks: 3, plannedBudget: null, spentBudget: null })],
  team: null,
  budget: null,
}

let eventCalls = []

/** What `/me/privileges` answers: an owner holds every agency screen, a member none by default. */
const OWNER_PRIVILEGES = [{ type: 'AGENCY', owner: true, privileges: [
  'agency:dashboard', 'agency:events', 'agency:crm', 'agency:calendar', 'agency:tasks',
  'agency:team', 'agency:vendors', 'agency:reports', 'agency:settings',
] }]

async function stubApi(page, { home, events, privileges = [] }) {
  eventCalls = []
  await page.route('**/v1/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/v1/api', '')
    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })

    if (path === '/analytics/agency/home') return wrapped(home)
    if (path === '/analytics/agency/events') {
      eventCalls.push(Object.fromEntries(url.searchParams))
      return wrapped(events)
    }
    if (path === '/me/privileges') return wrapped(privileges)
    return wrapped(null)
  })
}

test('the owner sees the agency: its team, its budget and who leads each event', async ({ page }) => {
  await stubApi(page, { home: ownerHome, privileges: OWNER_PRIVILEGES })
  await signIn(page, { userId: OWNER, eventId: 'none', lang: 'en', roles: ['AGENCY', 'USER'] })
  await page.goto('/en/agency/dashboard')

  await expect(page.getByRole('heading', { name: 'Team workload' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Event budgets' })).toBeVisible()
  await expect(page.locator('.agency-events thead')).toContainText('Lead organizer')
  await expect(page.locator('.snav')).toContainText('Team permissions')
})

test('a member lands in their own workspace, with none of the owner\'s panels', async ({ page }) => {
  await stubApi(page, { home: memberHome })
  await signIn(page, { userId: IVANA, eventId: 'none', lang: 'en', roles: ['AGENCY_MEMBER', 'USER'] })
  await page.goto('/en/agency/dashboard')

  await expect(page.getByRole('heading', { name: 'My next step' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Team workload' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Event budgets' })).toHaveCount(0)
  await expect(page.locator('.snav')).toContainText('My tasks')
  await expect(page.locator('.snav')).not.toContainText('Team permissions')
  await expect(page.getByRole('link', { name: '+ New task' })).toBeVisible()
})

test('an event row opens by keyboard', async ({ page }) => {
  await stubApi(page, { home: ownerHome, privileges: OWNER_PRIVILEGES })
  await signIn(page, { userId: OWNER, eventId: 'none', lang: 'en', roles: ['AGENCY', 'USER'] })
  await page.goto('/en/agency/dashboard')

  await page.getByRole('row', { name: 'Open Марија & Филип' }).focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/en\/dashboard\/events\/overview$/)
})

test('a member filters their events by their own role, and the server is asked', async ({ page }) => {
  await stubApi(page, {
    home: memberHome,
    events: { viewer: 'MEMBER', available: 1, rows: memberHome.events, organizers: null },
  })
  await signIn(page, { userId: IVANA, eventId: 'none', lang: 'en', roles: ['AGENCY_MEMBER', 'USER'] })
  await page.goto('/en/agency/events')

  await expect(page.getByRole('heading', { name: 'My events' })).toBeVisible()
  await page.getByLabel('My role').selectOption('ASSISTANT')

  await expect.poll(() => eventCalls.at(-1)).toMatchObject({ myRole: 'ASSISTANT' })
  expect(eventCalls.every((call) => !('leadId' in call))).toBe(true)
})
