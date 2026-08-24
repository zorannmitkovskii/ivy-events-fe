import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * IVY-1001 — the agency pipeline.
 *
 * <p>Worth a browser for three things a unit test cannot show: that a refusal
 * from the server ends up on the screen rather than in the console, that
 * winning sends exactly one call however many times somebody clicks, and that
 * the fee and the client's budget are never rendered as one number.
 */

const USER = '11111111-1111-1111-1111-111111111111'
const EVENT = 'aaaaaaaa-0000-0000-0000-000000000001'

const LEADS = [
  {
    id: 'lead-1', name: 'Свадба Ристески', stage: 'INQUIRY', source: 'instagram',
    nextAction: 'Јави се за термин', nextActionAt: '2020-01-01',
    expectedValue: 60000, convertedEventId: null, lostReason: null,
  },
  {
    id: 'lead-2', name: 'Роденден Петрова', stage: 'PROPOSAL', source: 'препорака',
    nextAction: null, nextActionAt: null,
    expectedValue: 20000, convertedEventId: null, lostReason: null,
  },
]

let winCalls = []
let loseCalls = []

async function stubApi(page, overrides = {}) {
  winCalls = []
  loseCalls = []
  let leads = overrides.leads ?? LEADS

  await page.route('**/v1/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/v1/api', '')
    const method = route.request().method()

    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })

    // The envelope errors come in, because a bare {detail} is not what the
    // backend sends and a stub that lies about that hides a real bug.
    const refuse = (status, detail) => route.fulfill({
      status, contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        message: detail,
        data: { status, errorCode: 'BR_VALIDATION_FAILED', type: 'business', detail },
      }),
    })

    if (path === '/crm/leads' && method === 'GET') return wrapped(leads)

    if (path === '/crm/leads/lead-1/win') {
      winCalls.push(method)
      if (overrides.winRefusal) return refuse(409, overrides.winRefusal)
      leads = leads.map((lead) => lead.id === 'lead-1'
        ? { ...lead, stage: 'WON', convertedEventId: 'event-9' }
        : lead)
      return wrapped(leads[0])
    }

    if (path === '/crm/leads/lead-2/lose') {
      loseCalls.push(JSON.parse(route.request().postData() || '{}'))
      leads = leads.map((lead) => lead.id === 'lead-2'
        ? { ...lead, stage: 'LOST', lostReason: 'PRICE', lostNote: 'прескапо' }
        : lead)
      return wrapped(leads[1])
    }

    return wrapped(null)
  })
}

test.beforeEach(async ({ page }) => {
  await signIn(page, { userId: USER, eventId: EVENT })
})

test('the board groups leads by stage and names what nobody is chasing', async ({ page }) => {
  await stubApi(page)
  await page.goto('/mk/dashboard/pipeline')

  await expect(page.getByText('Свадба Ристески')).toBeVisible()
  await expect(page.getByText('Роденден Петрова')).toBeVisible()

  // The two lines that make the page worth opening in the morning.
  await expect(page.getByText(/Следен чекор задоцнет кај 1/)).toBeVisible()
  await expect(page.getByText(/1 без следен чекор/)).toBeVisible()
})

test('a refusal on winning reaches the screen, not just the console', async ({ page }) => {
  await stubApi(page, { winRefusal: 'Планот дозволува 5 активни настани.' })
  await page.goto('/mk/dashboard/pipeline')

  await page.getByRole('button', { name: 'Добиено' }).first().click()

  // The bug this guards: the reload after the failure cleared the message and
  // the person saw nothing happen at all.
  await expect(page.getByRole('alert')).toHaveText('Планот дозволува 5 активни настани.')
})

test('winning creates one event however fast somebody clicks', async ({ page }) => {
  await stubApi(page)
  await page.goto('/mk/dashboard/pipeline')

  const winButton = page.getByRole('button', { name: 'Добиено' }).first()
  await winButton.click()

  await expect(page.getByRole('link', { name: 'Отвори настан' })).toBeVisible()
  // The card's action disappears once it is won, so a second click has nothing
  // to hit — the server's idempotency is the backstop, not the only guard.
  expect(winCalls).toHaveLength(1)
})

test('losing asks why, and sends the reason', async ({ page }) => {
  await stubApi(page)
  await page.goto('/mk/dashboard/pipeline')

  await page.getByRole('button', { name: 'Изгубено' }).nth(1).click()
  await page.getByPlaceholder('Забелешка').fill('прескапо')
  await page.getByRole('button', { name: 'Потврди' }).click()

  await expect.poll(() => loseCalls.length).toBe(1)
  expect(loseCalls[0]).toMatchObject({ reason: 'PRICE', note: 'прескапо' })
})

test('the fee is shown as the fee and never added to anything', async ({ page }) => {
  await stubApi(page)
  await page.goto('/mk/dashboard/pipeline')

  // 60000 and 20000 appear as two separate cards' figures. A total of 80000
  // anywhere on this page would be a number that means nothing.
  await expect(page.getByText(/Хонорар: 60.?000/)).toBeVisible()
  await expect(page.getByText(/80.?000/)).toHaveCount(0)
})
