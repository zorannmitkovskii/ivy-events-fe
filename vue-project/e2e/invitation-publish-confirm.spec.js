import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * INV-603 — confirming the publish.
 *
 * Publishing is paying for the package. When the start fails the organizer
 * gets a concrete message, nothing is charged and the cart stays, so checkout
 * again is the retry. When the event is already published (and already has
 * the package) the server answers 409 and nothing is charged twice. The
 * request never carries a status — only the payment publishes.
 */

const USER = '77777777-7777-7777-7777-777777777777'
const EVENT = '99999999-9999-9999-9999-999999999999'

const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

test.describe('INV-603 publish confirmation', () => {
  test('a failed start is safe to retry; a repeated publish is answered "already published"', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
    await page.route('**/v1/api/**', (route) => route.fulfill(json({ success: true, data: null })))
    await page.route('**/public/packages/category/**', (route) => route.fulfill(json([
      { id: 'p1', packageType: 'INV_PRO', name: 'Pro', price: 1500, currency: 'MKD', features: [] },
    ])))
    const inits = []
    await page.route('**/api/cpay/init', (route) => {
      inits.push(route.request().postDataJSON())
      if (inits.length === 1) {
        return route.fulfill(json({ success: false, message: 'Unexpected internal error', data: {
          status: 500, errorCode: 'INTERNAL_SERVER_ERROR', detail: 'Unexpected internal error',
        } }, 500))
      }
      return route.fulfill(json({ success: false, message: 'The event is already published', data: {
        status: 409, errorCode: 'CONFLICT_EVENT_ALREADY_PUBLISHED', detail: 'The event is already published',
      } }, 409))
    })
    await signIn(page, { userId: USER, eventId: EVENT, lang: 'mk', roles: ['USER'] })
    await page.goto('/mk/dashboard/events/packages')

    await page.locator('.add-cart-btn').first().click()
    await page.locator('.cart-checkout-btn').click()
    await expect(page.locator('.cart-error')).toBeVisible()
    await expect(page.getByTestId('checkout-retry-hint')).toContainText('Ништо не е наплатено')
    await expect(page.locator('.cart-item')).toHaveCount(1)

    // Retry: one more request, the same cart, no status in it.
    await page.locator('.cart-checkout-btn').click()
    const notice = page.getByTestId('publish-already')
    await expect(notice).toBeVisible()
    await expect(notice).toHaveAttribute('role', 'status')
    await expect(notice).toContainText('веќе објавена')
    await expect(page.locator('.cart-error')).toHaveCount(0)
    await expect(page.getByTestId('checkout-retry-hint')).toHaveCount(0)
    expect(inits).toHaveLength(2)
    expect(inits[1]).toEqual(inits[0])
    expect(inits[0].eventId).toBe(EVENT)
    expect(inits[0]).not.toHaveProperty('status')
    await expect(page).toHaveURL(/\/dashboard\/events\/packages/)

    // The cart and its messages fit a phone. (The dashboard top bar's actions
    // overflow 390px on this page already — existing, not part of this flow.)
    const overflow = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      return Math.max(...['.cart-section', '[data-testid="publish-already"]', '.cart-checkout-btn']
        .map((s) => document.querySelector(s).getBoundingClientRect().right - vw))
    })
    expect(overflow).toBeLessThanOrEqual(0)
    await page.screenshot({
      path: 'C:/Users/techl/AppData/Local/Temp/claude/C--Projcets-ZM/17a780c3-35a7-45d6-9961-af0c146a2596/scratchpad/inv603-packages-already-390.png',
      fullPage: false,
    })
  })
})
