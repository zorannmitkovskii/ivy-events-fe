import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * CPay fixes 1 and 7 — the server prices the payment and allows one payment
 * of an event at a time.
 *
 * The applied coupon goes with the payment (`discountCode`). When the amount
 * shown is not what the server would charge it answers 409 with its amount:
 * the page says so, reloads the packages and the cart, and the next checkout
 * sends the new amount. A payment started minutes ago is 409 with the time
 * from which a new one may start.
 */

const USER = '77777777-7777-7777-7777-777777777777'
const EVENT = '99999999-9999-9999-9999-999999999999'

const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })
const fail = (status, errorCode, validationErrors) => json({ success: false, message: errorCode, data: {
  status, errorCode, detail: errorCode, validationErrors,
} }, status)

test.describe('CPay checkout conflicts', () => {
  test('coupon sent; price changed → new amount shown and used; payment in progress → try again after HH:mm', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
    await page.route('**/v1/api/**', (route) => route.fulfill(json({ success: true, data: null })))
    let price = 1500
    await page.route('**/public/packages/category/**', (route) => route.fulfill(json([
      { id: 'p1', packageType: 'INV_PRO', name: 'Pro', price, currentPrice: price, currency: 'MKD', features: [] },
    ])))
    await page.route('**/public/discounts/validate', (route) => route.fulfill(json({
      valid: true, message: 'ok', discountPercent: 10, promotionName: 'Welcome',
    })))
    const inits = []
    const retryAfter = '2026-10-11T10:20:00Z'
    await page.route('**/api/cpay/init', (route) => {
      inits.push(route.request().postDataJSON())
      if (inits.length === 1) {
        price = 2000 // the admin changed the price meanwhile
        return route.fulfill(fail(409, 'CONFLICT_PRICE_CHANGED', { amount: '1800.00', currency: 'MKD' }))
      }
      return route.fulfill(fail(409, 'CONFLICT_PAYMENT_IN_PROGRESS', { retryAfter }))
    })
    await signIn(page, { userId: USER, eventId: EVENT, lang: 'mk', roles: ['USER'] })
    await page.goto('/mk/dashboard/events/packages')

    await page.locator('.add-cart-btn').first().click()
    await page.locator('.discount-input').fill('WELCOME10')
    await page.locator('.discount-btn').click()
    await expect(page.locator('.cart-total-amount')).toHaveText('1350 MKD')

    await page.locator('.cart-checkout-btn').click()
    const alert = page.locator('.cart-error')
    await expect(alert).toHaveAttribute('role', 'alert')
    await expect(alert).toContainText('Цената е променета')
    await expect(alert).toContainText('1800 MKD')
    expect(inits[0]).toMatchObject({ amount: 1350, discountCode: 'WELCOME10', packageTypes: ['INV_PRO'], eventId: EVENT })
    // Packages and cart reloaded: 2000 − 10 % = 1800, what the server charges.
    await expect(page.locator('.cart-total-amount')).toHaveText('1800 MKD')
    await expect(page.locator('.cart-item')).toHaveCount(1)

    await page.locator('.cart-checkout-btn').click()
    const time = await page.evaluate((iso) => new Intl.DateTimeFormat('mk', {
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).format(new Date(iso)), retryAfter)
    await expect(alert).toContainText('Плаќањето е во тек')
    await expect(alert).toContainText(`обидете се повторно по ${time}`)
    expect(inits).toHaveLength(2)
    expect(inits[1]).toMatchObject({ amount: 1800, discountCode: 'WELCOME10' })
    await expect(page).toHaveURL(/\/dashboard\/events\/packages/)

    const overflow = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      return Math.max(...['.cart-section', '.cart-error', '.cart-checkout-btn']
        .map((s) => document.querySelector(s).getBoundingClientRect().right - vw))
    })
    expect(overflow).toBeLessThanOrEqual(0)
    await page.screenshot({
      path: 'C:/Users/techl/AppData/Local/Temp/claude/C--Projcets-ZM/17a780c3-35a7-45d6-9961-af0c146a2596/scratchpad/cpay-in-progress-390.png',
      fullPage: false,
    })
  })
})
