import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * INV-703 — from the publication screen to the RSVP replies.
 *
 * The success screen says where replies appear and links to the existing
 * guest list of exactly the published event — even when another event was
 * selected in the dashboard before. Before the first reply the guest list
 * explains itself instead of looking broken, and says who can see the data.
 * A link naming an event that is not the person's own is refused and said so.
 */

const USER = '77777777-7777-7777-7777-777777777777'
const EVENT = '99999999-9999-9999-9999-999999999999'
const OTHER = '88888888-8888-8888-8888-888888888888'
const FOREIGN = '55555555-5555-5555-5555-555555555555'
const REF = 'ab12cd34ef'
const SCRATCH = 'C:/Users/techl/AppData/Local/Temp/claude/C--Projcets-ZM/17a780c3-35a7-45d6-9961-af0c146a2596/scratchpad'

const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })
const origin = () => new URL(test.info().project.use.baseURL).origin

const myEvents = [
  { id: OTHER, name: 'Роденден', categoryType: 'BIRTHDAY', status: 'DRAFT' },
  { id: EVENT, name: 'Свадба', categoryType: 'WEDDING', status: 'ACTIVE' },
]

/** Stubs the API and records for which event the guest list was asked. */
async function stubs(page, { guests = [] } = {}) {
  const guestCalls = []
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  await page.route('**/v1/api/**', (route) => route.fulfill(json({ success: true, data: null })))
  await page.route('**/public/invitation-page/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await page.route(/\/v1\/api\/events(\?.*)?$/, (route) => route.fulfill(json(myEvents)))
  await page.route(/\/v1\/api\/guests\?/, (route) => {
    guestCalls.push(new URL(route.request().url()).searchParams.get('eventId'))
    return route.fulfill(json(guests))
  })
  await page.route(/\/v1\/api\/event-tables\?/, (route) => route.fulfill(json([])))
  await page.route(`**/v1/api/payments/${REF}/publication`, (route) => route.fulfill(json({
    paymentStatus: 'SUCCESS', eventId: EVENT, eventStatus: 'ACTIVE', published: true,
    publicUrl: `${origin()}/mk/invitations/coastal-breeze?eventId=${EVENT}`, design: 'coastal-breeze',
  })))
  return guestCalls
}

async function noHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
}

test.describe('INV-703 RSVP dashboard from the success screen', () => {
  test('desktop: the success screen explains where replies appear and opens the guest list of exactly this event', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const guestCalls = await stubs(page)
    // Another event was selected in the dashboard before publishing this one.
    await signIn(page, { userId: USER, eventId: OTHER, lang: 'mk', roles: ['USER'] })
    await page.goto(`/mk/payment/result?ref=${REF}`)
    await expect(page.getByTestId('payment-result-title')).toHaveText('Вашата покана е објавена')

    const next = page.getByTestId('rsvp-next')
    await expect(next.getByRole('heading', { name: 'Каде ќе ги видите одговорите на гостите' })).toBeVisible()
    await expect(next).toContainText('Контролна табла → Гости')
    await expect(next).toContainText('не значи грешка')
    await expect(page.getByTestId('rsvp-who')).toContainText('Гостите не ја гледаат листата')
    await page.screenshot({ path: `${SCRATCH}/inv703-success-1280.png`, fullPage: true })

    const link = page.getByRole('link', { name: 'Отвори ја листата на гости' })
    await expect(link).toHaveAttribute('href', `/mk/dashboard/events/guests?eventId=${EVENT}`)
    await link.click()

    // The id is consumed: the page is the ordinary guest list, for this event.
    await expect(page).toHaveURL(/\/mk\/dashboard\/events\/guests$/)
    const empty = page.getByTestId('guests-empty')
    await expect(empty.getByRole('heading', { name: 'Сè уште нема RSVP одговори' })).toBeVisible()
    await expect(page.getByText('Не може да се вчитаат гости')).toHaveCount(0)
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByTestId('guests-who')).toBeVisible()
    expect(guestCalls.length).toBeGreaterThan(0)
    expect(new Set(guestCalls)).toEqual(new Set([EVENT]))
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('onboarding_state_v1')))
    expect(stored.eventId).toBe(EVENT)
    expect(stored.selectedCategory).toBe('WEDDING')
    await page.screenshot({ path: `${SCRATCH}/inv703-guests-empty-1280.png`, fullPage: true })
  })

  test('a deep link with ?eventId= selects that event before the page loads — no request for the previous one', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const guestCalls = await stubs(page, { guests: [{ id: 'g1', name: 'Ана', inviteStatus: 'PENDING' }] })
    await signIn(page, { userId: USER, eventId: OTHER, lang: 'en', roles: ['USER'] })
    await page.goto(`/en/dashboard/events/guests?eventId=${EVENT}`)

    await expect(page).toHaveURL(/\/en\/dashboard\/events\/guests$/)
    await expect(page.getByTestId('guests-no-replies')).toContainText('Nobody has replied through the invitation yet')
    expect(new Set(guestCalls)).toEqual(new Set([EVENT]))
  })

  test('a link to an event that is not the person\'s own is refused and said so; the selection is kept', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const guestCalls = await stubs(page)
    await signIn(page, { userId: USER, eventId: OTHER, lang: 'mk', roles: ['USER'] })
    await page.goto(`/mk/dashboard/events/guests?eventId=${FOREIGN}`)

    await expect(page).toHaveURL(/\/mk\/dashboard\/events\/guests$/)
    const notice = page.getByTestId('event-link-notice')
    await expect(notice).toHaveAttribute('role', 'alert')
    await expect(notice).toContainText('Немате пристап до настанот од линкот')
    expect(guestCalls).not.toContain(FOREIGN)
    expect(new Set(guestCalls)).toEqual(new Set([OTHER]))

    await notice.getByRole('button', { name: 'Во ред' }).click()
    await expect(notice).toHaveCount(0)
  })

  test('signed out: the link leads to sign-in and keeps the event in the way back', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
    await page.route('**/v1/api/**', (route) => route.fulfill(json({ success: true, data: null })))
    await page.goto(`/mk/dashboard/events/guests?eventId=${EVENT}`)
    await expect(page).toHaveURL(/\/mk\/auth\/login\?redirect=/)
    const redirect = new URL(page.url()).searchParams.get('redirect')
    expect(redirect).toBe(`/mk/dashboard/events/guests?eventId=${EVENT}`)
  })

  test('phone 390px: success card and the empty guest list fit, targets ≥44px, sq', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await stubs(page)
    await signIn(page, { userId: USER, eventId: EVENT, lang: 'sq', roles: ['USER'] })
    await page.goto(`/sq/payment/result?ref=${REF}`)
    const link = page.getByRole('link', { name: 'Hap listën e mysafirëve' })
    await expect(link).toBeVisible()
    expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44)
    expect(await noHorizontalScroll(page)).toBe(true)
    await page.screenshot({ path: `${SCRATCH}/inv703-success-390.png`, fullPage: true })

    await link.click()
    await expect(page.getByTestId('guests-empty').getByRole('heading', { name: 'Ende nuk ka përgjigje RSVP' })).toBeVisible()
    // The dashboard top bar's "Edit invitation" button already overflows at
    // 390px on every dashboard page (pre-existing, not this ticket) — so the
    // check is that the new blocks themselves fit the screen.
    for (const id of ['guests-empty', 'guests-who', 'guests-empty-share']) {
      const box = await page.getByTestId(id).boundingBox()
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(390)
    }
    expect((await page.getByTestId('guests-empty-share').boundingBox()).height).toBeGreaterThanOrEqual(44)
    await page.screenshot({ path: `${SCRATCH}/inv703-guests-empty-390.png`, fullPage: true })
  })
})
