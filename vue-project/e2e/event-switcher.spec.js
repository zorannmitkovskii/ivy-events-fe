import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * IVY-104 — switching events must not leave the previous event's data on screen.
 *
 * <p>This is the one acceptance criterion a unit test cannot answer. The
 * dashboard routes carry no event id: the current event lives in a store and
 * every page reads it once, on mount. So changing the store changes nothing
 * visible unless the page under it is remounted, and the only way to see that
 * is to run it.
 */

const USER = '11111111-1111-1111-1111-111111111111'
const WEDDING = 'aaaaaaaa-0000-0000-0000-000000000001'
const BIRTHDAY = 'aaaaaaaa-0000-0000-0000-000000000002'

const EVENTS = {
  [WEDDING]: { id: WEDDING, name: 'Ана и Марко', categoryType: 'WEDDING', status: 'ACTIVATED', date: '2026-09-12' },
  [BIRTHDAY]: { id: BIRTHDAY, name: 'Роденден на Лука', categoryType: 'BIRTHDAY', status: 'ACTIVATED', date: '2026-10-03' },
}

const GUESTS = {
  [WEDDING]: [{ id: 'g-1', name: 'Свадбен гостин', email: 'w@example.com', inviteStatus: 'CONFIRMED', numOfGuests: 1 }],
  [BIRTHDAY]: [{ id: 'g-2', name: 'Роденденски гостин', email: 'b@example.com', inviteStatus: 'CONFIRMED', numOfGuests: 1 }],
}

/** Everything the dashboard asks for, answered from the fixtures above. */
async function stubApi(page) {
  await page.route('**/v1/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/v1/api', '')
    const eventId = url.searchParams.get('eventId')

    const send = (body) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })

    // Two shapes live in this API: the ApiResponse envelope, and bare payloads
    // from the endpoints that extend BaseController. The stub has to match, or
    // the page fails on the shape rather than on what is being tested.
    const wrapped = (data) => send({ success: true, message: null, data })
    const bare = (data) => send(data)

    if (path === '/events/workspace') {
      return wrapped([
        { event: EVENTS[BIRTHDAY], pinned: true },
        { event: EVENTS[WEDDING], pinned: false },
      ])
    }
    if (path === '/events') {
      return bare(Object.values(EVENTS))
    }
    if (path === '/guests') {
      return bare(GUESTS[eventId] ?? [])
    }
    if (path === '/guests/count') {
      return bare({ total: (GUESTS[eventId] ?? []).length, adults: 1, children: 0 })
    }
    if (path === '/guests/status') {
      return bare({ confirmed: 1, awaitingReply: 0, declined: 0, notInvited: 0 })
    }

    const byId = path.match(/^\/events\/([0-9a-f-]+)$/i)
    if (byId) {
      return bare(EVENTS[byId[1]] ?? EVENTS[WEDDING])
    }

    // Anything else this screen happens to ask for is not what is under test.
    return bare([])
  })
}

test.beforeEach(async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: USER, eventId: WEDDING })
})

test('switching events replaces the guest list instead of leaving the old one', async ({ page }) => {
  await page.goto('/mk/dashboard/events/guests')

  await expect(page.getByText('Свадбен гостин')).toBeVisible()

  await page.getByRole('button', { name: /Промени настан/i }).click()
  await page.getByRole('button', { name: 'Роденден на Лука' }).click()

  await expect(page.getByText('Роденденски гостин')).toBeVisible()
  await expect(page.getByText('Свадбен гостин'))
    .toBeHidden({ timeout: 5000 })
})

test('switching stays on the section you were looking at', async ({ page }) => {
  await page.goto('/mk/dashboard/events/guests')

  await page.getByRole('button', { name: /Промени настан/i }).click()
  await page.getByRole('button', { name: 'Роденден на Лука' }).click()

  await expect(page).toHaveURL(/\/dashboard\/events\/guests$/)
})

test('pinned events lead the switcher', async ({ page }) => {
  await page.goto('/mk/dashboard/events/guests')

  await page.getByRole('button', { name: /Промени настан/i }).click()

  const items = page.locator('.switch-item')
  await expect(items.first()).toHaveText('Роденден на Лука')
})
