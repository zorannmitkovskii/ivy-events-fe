import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * The agency task board in a real browser: a card dragged into another column
 * is saved there, every card names who has it, and a member cannot reassign.
 * jsdom cannot drag; this is the only place the gesture itself is tested.
 */

const OWNER = '11111111-1111-1111-1111-111111111111'
const IVANA = { id: '22222222-2222-2222-2222-222222222222', name: 'Ивана' }
const MAJA = { id: '44444444-4444-4444-4444-444444444444', name: 'Маја' }

const BOARD = {
  viewer: 'OWNER',
  tasks: [
    { id: 't-1', eventId: 'e-1', eventName: 'Марија & Филип', title: 'Потврди кетеринг', status: 'PENDING', dueAt: '2020-01-01T12:00:00', overdue: true, sortOrder: 1, assignee: IVANA },
    { id: 't-2', eventId: 'e-2', eventName: 'Ivy Annual Forum', title: 'Сала', status: 'IN_PROGRESS', dueAt: '2099-01-01T12:00:00', overdue: false, sortOrder: 1, assignee: MAJA },
  ],
  team: [IVANA, MAJA],
  events: [{ eventId: 'e-1', name: 'Марија & Филип' }, { eventId: 'e-2', name: 'Ivy Annual Forum' }],
}

const OWNER_PRIVILEGES = [{ type: 'AGENCY', owner: true, privileges: [
  'agency:dashboard', 'agency:events', 'agency:crm', 'agency:calendar', 'agency:tasks',
  'agency:team', 'agency:vendors', 'agency:reports', 'agency:settings',
] }]

let moves = []

async function stubApi(page, { privileges = OWNER_PRIVILEGES, viewer = 'OWNER', tasks = BOARD.tasks } = {}) {
  moves = []
  await page.route('**/v1/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/v1/api', '')
    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })
    if (path === '/analytics/agency/tasks') return wrapped({ ...BOARD, tasks, viewer })
    if (/\/task-board\/tasks\/[^/]+\/move$/.test(path)) {
      moves.push({ path, body: request.postDataJSON() })
      return wrapped({})
    }
    if (path === '/me/privileges') return wrapped(privileges)
    return wrapped(null)
  })
}

test('dragging a card into another column saves the new status', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: OWNER, eventId: 'none', lang: 'en', roles: ['AGENCY', 'USER'] })
  await page.goto('/en/agency/tasks')

  // None of these are the owner's own, so they show under All.
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await page.getByRole('button', { name: 'Board' }).click()
  const card = page.locator('.task-card[data-task="t-1"]')
  await expect(card).toContainText('Марија & Филип')
  await expect(card.locator('select')).toHaveValue(IVANA.id)

  await card.dragTo(page.locator('.lane[data-status="DONE"]'))

  await expect(page.locator('.lane[data-status="DONE"]')).toContainText('Потврди кетеринг')
  await expect.poll(() => moves.length).toBe(1)
  expect(moves[0].path).toBe('/events/e-1/task-board/tasks/t-1/move')
  expect(moves[0].body).toMatchObject({ status: 'DONE' })
})

test('a member sees who has each task but cannot reassign', async ({ page }) => {
  await stubApi(page, { privileges: [], viewer: 'MEMBER' })
  await signIn(page, { userId: IVANA.id, eventId: 'none', lang: 'en', roles: ['AGENCY_MEMBER', 'USER'] })
  await page.goto('/en/agency/tasks')

  await page.getByRole('button', { name: 'All', exact: true }).click()
  await page.getByRole('button', { name: 'Board' }).click()

  await expect(page.locator('.task-card[data-task="t-2"]')).toContainText('Маја')
  await expect(page.locator('.task-card select')).toHaveCount(0)
})

test('an owner opens on their own tasks, widens to the team, and finds finished work at the bottom', async ({ page }) => {
  await stubApi(page, { tasks: [
    { id: 't-9', eventId: 'e-1', eventName: 'Марија & Филип', title: 'Беџови', status: 'DONE', dueAt: '2019-01-01T12:00:00', overdue: false, sortOrder: 0, assignee: { id: OWNER, name: 'Сопственик' } },
    { id: 't-8', eventId: 'e-1', eventName: 'Марија & Филип', title: 'Музика', status: 'PENDING', dueAt: '2099-01-01T12:00:00', overdue: false, sortOrder: 1, assignee: { id: OWNER, name: 'Сопственик' } },
    ...BOARD.tasks,
  ] })
  await signIn(page, { userId: OWNER, eventId: 'none', lang: 'en', roles: ['AGENCY', 'USER'] })
  await page.goto('/en/agency/tasks')

  const titles = page.locator('tbody tr[data-task] b')
  await expect(titles).toHaveText(['Музика', 'Беџови'])

  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(titles).toHaveText(['Музика', 'Потврди кетеринг', 'Сала', 'Беџови'])
})
