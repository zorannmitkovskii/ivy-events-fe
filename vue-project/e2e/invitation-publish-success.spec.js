import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * INV-701 — the success screen after publishing.
 *
 * Publishing is paying in CPay. The bank sends the browser back through the
 * payment callback, which redirects to the dashboard overview with
 * `?ref=…` (CPay round 2 removed `status=`). That redirect proves nothing: the page shows
 * "published" only when the server says the payment SUCCEEDED and the event
 * is ACTIVE; before that it says it is confirming. The public link opens
 * without an organizer session.
 */

const USER = '77777777-7777-7777-7777-777777777777'
const EVENT = '99999999-9999-9999-9999-999999999999'
const REF = 'ab12cd34ef'
const SCRATCH = 'C:/Users/techl/AppData/Local/Temp/claude/C--Projcets-ZM/17a780c3-35a7-45d6-9961-af0c146a2596/scratchpad'

const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

const pending = { paymentStatus: 'PENDING', eventId: EVENT, eventStatus: 'PENDING', published: false, publicUrl: null, design: 'coastal-breeze' }

async function baseStubs(page) {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  await page.route('**/v1/api/**', (route) => route.fulfill(json({ success: true, data: null })))
  await page.route('**/public/invitation-page/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
}

async function noHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
}

test.describe('INV-701 publish success screen', () => {
  test('back from CPay: "confirming" until the server confirms, then link, Open invitation and Continue editing', async ({ page, browser }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await baseStubs(page)
    await page.route('**/public/packages/category/**', (route) => route.fulfill(json([
      { id: 'p1', packageType: 'INV_PRO', name: 'Pro', price: 1500, currency: 'MKD', features: [] },
    ])))

    let initAuth = null
    await page.route('**/api/cpay/init', (route) => {
      initAuth = route.request().headers().authorization || null
      return route.fulfill(json({ paymentUrl: 'https://cpay.test/pay', fields: { Details2: REF } }))
    })
    // The bank's page, then the callback's redirect back (what /api/cpay/ok answers).
    await page.route('https://cpay.test/**', (route) => {
      const origin = new URL(route.request().headers().referer || 'http://localhost').origin
      const back = `${origin}/mk/dashboard/events/overview?ref=${REF}`
      return route.fulfill({ status: 200, contentType: 'text/html', body: `<meta http-equiv="refresh" content="0;url=${back}">` })
    })

    let publicationCalls = 0
    let publicUrl = ''
    await page.route(`**/v1/api/payments/${REF}/publication`, (route) => {
      publicationCalls += 1
      if (publicationCalls < 3) return route.fulfill(json(pending))
      return route.fulfill(json({ ...pending, paymentStatus: 'SUCCESS', eventStatus: 'ACTIVE', published: true, publicUrl }))
    })

    await signIn(page, { userId: USER, eventId: EVENT, lang: 'mk', roles: ['USER'] })
    await page.goto('/mk/dashboard/events/packages')
    publicUrl = `${new URL(page.url()).origin}/mk/invitations/coastal-breeze?eventId=${EVENT}`

    await page.locator('.add-cart-btn').first().click()
    await page.locator('.cart-checkout-btn').click()

    // Returned through the dashboard address, shown on the result page.
    await expect(page).toHaveURL(new RegExp(`/mk/payment/result\\?ref=${REF}$`))
    expect(initAuth).toMatch(/^Bearer /)

    // The redirect said "success"; the server has not confirmed yet.
    const title = page.getByTestId('payment-result-title')
    await expect(title).toHaveText('Се потврдува објавата')
    await expect(page.getByRole('status')).toContainText('Чекаме нашиот сервер')
    await expect(page.getByTestId('publish-success')).toHaveCount(0)
    await expect(page.getByTestId('public-url')).toHaveCount(0)

    // Confirmed on a later check.
    await expect(title).toHaveText('Вашата покана е објавена', { timeout: 15000 })
    expect(publicationCalls).toBeGreaterThanOrEqual(3)
    await expect(title).toBeFocused()
    await expect(page.getByTestId('publish-status')).toContainText('Објавена')
    await expect(page.getByLabel('Јавен линк до поканата')).toHaveValue(publicUrl)
    const open = page.getByTestId('open-invitation')
    await expect(open).toHaveAttribute('href', publicUrl)
    await expect(open).toHaveAttribute('target', '_blank')
    await page.screenshot({ path: `${SCRATCH}/inv701-success-1280.png` })

    // Open invitation: a new tab with the guest link.
    const [popup] = await Promise.all([page.waitForEvent('popup'), open.click()])
    await expect(popup).toHaveURL(publicUrl)
    await popup.close()

    // The same link with no organizer session at all.
    const guest = await browser.newContext()
    const guestPage = await guest.newPage()
    await guestPage.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
    await guestPage.route('**/public/invitation-page/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
    await guestPage.goto(publicUrl)
    await expect(guestPage.getByText(/Допрете за отворање/)).toBeVisible()
    await expect(guestPage).toHaveURL(publicUrl)
    expect(await guestPage.evaluate(() => localStorage.getItem('access_token'))).toBeNull()
    await guest.close()

    // Continue editing → the editor of this event.
    await page.getByTestId('continue-editing').click()
    await expect(page).toHaveURL(new RegExp(`/mk/invitations/coastal-breeze\\?edit=true&eventId=${EVENT}$`))
  })

  test('phone, failed payment: not published, draft kept, retry leads to this event\'s packages', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await baseStubs(page)
    await page.route(`**/v1/api/payments/${REF}/publication`, (route) =>
      route.fulfill(json({ ...pending, paymentStatus: 'FAILED', eventStatus: 'DRAFT' })))
    await signIn(page, { userId: USER, eventId: EVENT, lang: 'mk', roles: ['USER'] })

    await page.goto(`/mk/dashboard/events/overview?ref=${REF}`)
    await expect(page).toHaveURL(new RegExp(`/mk/payment/result\\?ref=${REF}$`))
    await expect(page.getByTestId('payment-result-title')).toHaveText('Поканата не е објавена')
    await expect(page.getByTestId('payment-result-desc')).toContainText('Плаќањето не помина. Поканата е зачувана')
    await expect(page.getByTestId('payment-result-desc')).toContainText('зачувана')
    await expect(page.getByTestId('publish-success')).toHaveCount(0)
    await expect(page.getByTestId('failed-continue-editing')).toHaveAttribute('href', `/mk/invitations/coastal-breeze?edit=true&eventId=${EVENT}`)
    expect(await noHorizontalScroll(page)).toBe(true)
    const retry = page.getByTestId('retry-payment')
    expect((await retry.boundingBox()).height).toBeGreaterThanOrEqual(44)
    await page.screenshot({ path: `${SCRATCH}/inv701-failed-390.png` })

    await retry.click()
    await expect(page).toHaveURL(/\/mk\/dashboard\/events\/packages/)
  })

  test('phone, confirmation late: "still waiting" with a manual check — never a fake success', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.clock.install()
    await baseStubs(page)
    let confirmed = false
    const PUBLIC = `/mk/invitations/coastal-breeze?eventId=${EVENT}`
    await page.route(`**/v1/api/payments/${REF}/publication`, (route) => route.fulfill(json(confirmed
      ? { ...pending, paymentStatus: 'SUCCESS', eventStatus: 'ACTIVE', published: true, publicUrl: PUBLIC }
      : pending)))
    await signIn(page, { userId: USER, eventId: EVENT, lang: 'mk', roles: ['USER'] })

    await page.goto(`/mk/payment/result?ref=${REF}`)
    const title = page.getByTestId('payment-result-title')
    await expect(title).toHaveText('Се потврдува објавата')
    // Each check waits for its answer before the next is timed, so the clock
    // is moved one wait at a time (the longest is 8 s).
    await expect(async () => {
      await page.clock.runFor(8000)
      await expect(title).toHaveText('Сè уште чекаме потврда', { timeout: 200 })
    }).toPass({ timeout: 20000 })
    await expect(page.getByTestId('publish-success')).toHaveCount(0)
    await expect(page.getByRole('status')).toContainText('не е прикажана како објавена')
    expect(await noHorizontalScroll(page)).toBe(true)
    await page.screenshot({ path: `${SCRATCH}/inv701-slow-390.png` })

    confirmed = true
    await page.getByTestId('check-again').click()
    await expect(title).toHaveText('Вашата покана е објавена')
    // A relative link from the server is shown as an absolute one on this site.
    await expect(page.getByTestId('public-url')).toHaveValue(new RegExp(`^http://[^/]+${PUBLIC.replace(/[?]/g, '\\?')}$`))
    expect(await noHorizontalScroll(page)).toBe(true)
    await page.screenshot({ path: `${SCRATCH}/inv701-success-390.png` })
  })
})
