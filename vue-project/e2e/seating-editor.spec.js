import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * IVY-503 — the seating editor.
 *
 * <p>What is worth running a browser for: that the keyboard route does the same
 * thing dragging does, that a full table asks instead of assuming, and that
 * somebody else holding the lock leaves the plan readable. None of those can be
 * answered without rendering.
 */

const USER = '11111111-1111-1111-1111-111111111111'
const EVENT = 'aaaaaaaa-0000-0000-0000-000000000001'

const TABLES = [
  { id: 't-1', title: 'Маса 1', maxGuest: 4, elementType: 'TABLE', layoutVersion: 3, guests: [] },
  { id: 't-2', title: 'Маса 2', maxGuest: 2, elementType: 'TABLE', layoutVersion: 1, guests: [] },
  { id: 'e-1', title: 'Бина', elementType: 'STAGE', layoutVersion: 0, guests: [] },
]

const UNSEATED = [
  { id: 'g-1', name: 'Ана', numOfGuests: 1 },
  { id: 'g-2', name: 'Марко', numOfGuests: 3 },
  { id: 'g-3', name: 'Лила', numOfGuests: 1, householdKey: 'petrovski', householdName: 'Петровски' },
  { id: 'g-4', name: 'Оливер', numOfGuests: 1, householdKey: 'petrovski', householdName: 'Петровски' },
]

/** What the page actually sent — the household path is only proven by the call. */
let seatHouseholdCalls = []
let seatCalls = []

/** @param overrides lets one test change the lock or a response */
async function stubApi(page, overrides = {}) {
  seatHouseholdCalls = []
  seatCalls = []

  await page.route('**/v1/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/v1/api', '')
    const method = route.request().method()

    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })
    const bare = (data) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(data),
    })

    if (path.endsWith('/seating/tables')) return wrapped(overrides.tables ?? TABLES)
    if (path.endsWith('/seating/unseated')) return wrapped(overrides.unseated ?? UNSEATED)

    if (path.endsWith('/seating/lock')) {
      if (method === 'DELETE') return wrapped(null)
      return wrapped(overrides.lock ?? { granted: true, readOnly: false, lock: null })
    }

    if (path.endsWith('/seating/seat-household')) {
      if (overrides.householdFails) {
        return route.fulfill({
          status: 409, contentType: 'application/json',
          body: JSON.stringify({
            success: false, message: 'Conflict',
            data: {
              status: 409, errorCode: 'BR_VALIDATION_FAILED',
              type: 'BUSINESS', detail: overrides.householdFails,
            },
          }),
        })
      }
      seatHouseholdCalls.push(JSON.parse(route.request().postData() || '{}'))
      return wrapped(TABLES[0])
    }

    if (path.endsWith('/seating/seat')) {
      seatCalls.push(JSON.parse(route.request().postData() || '{}'))
      if (overrides.seatFails) {
        // The real shape: ApiResponse wrapping an ApiError. A flat {detail}
        // would be normalized to "HTTP 400" and the test would prove nothing.
        return route.fulfill({
          status: 400, contentType: 'application/json',
          body: JSON.stringify({
            success: false, message: 'Bad Request',
            data: {
              status: 400, errorCode: 'BR_VALIDATION_FAILED',
              type: 'BUSINESS', detail: overrides.seatFails,
            },
          }),
        })
      }
      return wrapped(TABLES[0])
    }

    // The dashboard shell asks for a few other things on the way in.
    const byId = path.match(/^\/events\/([0-9a-f-]+)$/i)
    if (byId) return bare({ id: EVENT, name: 'Свадба', categoryType: 'WEDDING', status: 'ACTIVATED' })
    if (path === '/events/workspace') return wrapped([])
    return bare([])
  })
}

async function openPlanView(page) {
  await page.goto('/mk/dashboard/events/tables')
  await page.getByRole('tab', { name: 'План на сала' }).click()
}

test.beforeEach(async ({ page }) => {
  await signIn(page, { userId: USER, eventId: EVENT })
})

test('the unassigned guests are visible, so the plan cannot look finished', async ({ page }) => {
  await stubApi(page)
  await openPlanView(page)

  await expect(page.getByRole('region', { name: 'Нераспоредени' })).toBeVisible()
  await expect(page.locator('[data-guest-id="g-1"]')).toContainText('Ана')
  await expect(page.locator('[data-guest-id="g-2"]')).toContainText('Марко')
  // The party size travels with the guest — three chairs, not one.
  await expect(page.locator('[data-guest-id="g-2"]')).toContainText('3')
})

test('a guest can be seated with the keyboard alone', async ({ page }) => {
  await stubApi(page)
  await openPlanView(page)

  // Select by keyboard, exactly as dragging would select.
  await page.locator('[data-guest-id="g-1"]').focus()
  await page.keyboard.press('Enter')

  await expect(page.getByText('Избрани: 1')).toBeVisible()

  await page.selectOption('#move-target', 't-1')
  await page.getByRole('button', { name: 'Премести' }).click()

  await expect(page.locator('#move-target')).toHaveCount(0)
})

test('a full table asks rather than assuming', async ({ page }) => {
  await stubApi(page, {
    seatFails: 'Масата „Маса 2" има 2 места, зафатени се 2, а гостинот носи 3.',
  })
  await openPlanView(page)

  await page.locator('[data-guest-id="g-2"]').click()
  await page.selectOption('#move-target', 't-2')
  await page.getByRole('button', { name: 'Премести' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('2 места')
  await expect(dialog.getByRole('button', { name: 'Сепак смести' })).toBeVisible()
})

test('somebody else holding the lock leaves the plan readable', async ({ page }) => {
  await stubApi(page, {
    lock: {
      granted: false, readOnly: true,
      lock: { holderName: 'Марко', expiresAt: new Date(Date.now() + 90_000).toISOString() },
    },
  })
  await openPlanView(page)

  await expect(page.getByRole('status')).toContainText('Марко')
  await expect(page.getByRole('status')).toContainText('го уредува распоредот')

  // Read-only, not blank: the plan is still worth looking at.
  await expect(page.getByRole('heading', { name: 'Маса 1' })).toBeVisible()
  await expect(page.locator('[data-guest-id="g-1"]')).toBeVisible()
  // And not editable — no move bar to reach for.
  await expect(page.locator('#move-target')).toHaveCount(0)
})

test('fixed elements are shown apart from the tables — a stage is not somewhere to sit', async ({ page }) => {
  await stubApi(page)
  await openPlanView(page)

  await expect(page.getByText('Фиксни елементи')).toBeVisible()
  await expect(page.getByText('Бина')).toBeVisible()
  // And not offered as a destination.
  await page.locator('[data-guest-id="g-1"]').click()
  await expect(page.locator('#move-target option')).toHaveCount(3) // placeholder + two tables
})

test('a household moves as one call, not two', async ({ page }) => {
  await stubApi(page)
  await openPlanView(page)

  // One click on the household badge picks the whole family.
  await page.locator('[data-guest-id="g-3"] [data-household-key="petrovski"]').click()
  await expect(page.getByText('Избрани: 2')).toBeVisible()
  await expect(page.getByText('како домаќинство')).toBeVisible()

  await page.selectOption('#move-target', 't-1')
  await page.getByRole('button', { name: 'Премести' }).click()
  await expect(page.locator('#move-target')).toHaveCount(0)

  // The point: one atomic call the backend can refuse whole, not per-guest
  // seating that leaves the last member wherever the table ran out.
  expect(seatHouseholdCalls).toHaveLength(1)
  expect(seatHouseholdCalls[0].householdKey).toBe('petrovski')
  expect(seatCalls).toHaveLength(0)
})

test('a household member can still be moved alone', async ({ page }) => {
  await stubApi(page)
  await openPlanView(page)

  // Selecting one member of a family is not selecting the family.
  await page.locator('[data-guest-id="g-3"]').click()
  await expect(page.getByText('Избрани: 1')).toBeVisible()
  await expect(page.getByText('како домаќинство')).toHaveCount(0)

  await page.selectOption('#move-target', 't-1')
  await page.getByRole('button', { name: 'Премести' }).click()

  expect(seatCalls).toHaveLength(1)
  expect(seatHouseholdCalls).toHaveLength(0)
})

test('a plan edited underneath is refused, not silently overwritten', async ({ page }) => {
  await stubApi(page, {
    seatFails: 'Распоредот беше сменет од друг корисник. Освежи и обиди се повторно.',
  })
  await openPlanView(page)

  await page.locator('[data-guest-id="g-1"]').click()
  await page.selectOption('#move-target', 't-1')
  await page.getByRole('button', { name: 'Премести' }).click()

  // A conflict is not an overflow — it gets the banner, not the "seat anyway"
  // question. Offering to force a stale write is how the other person's work
  // disappears.
  await expect(page.getByRole('alert')).toContainText('сменет од друг корисник')
  await expect(page.getByRole('alertdialog')).toHaveCount(0)

  // The version the editor sent is the one it was showing — that is what lets
  // the backend notice the race at all.
  expect(seatCalls[0].expectedVersion).toBe(3)
})

test('search narrows the list and says what it is hiding', async ({ page }) => {
  await stubApi(page)
  await openPlanView(page)

  await page.getByPlaceholder('Барај гостин…').fill('Ана')

  await expect(page.locator('[data-guest-id="g-1"]')).toBeVisible()
  await expect(page.locator('[data-guest-id="g-2"]')).toHaveCount(0)
  // The count of what is hidden is the point — a filtered list must not read
  // as a finished one.
  await expect(page.getByText('3 скриени од пребарувањето')).toBeVisible()
})
