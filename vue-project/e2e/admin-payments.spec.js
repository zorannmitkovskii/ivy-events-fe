import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * The admin payments list is an ordinary table.
 *
 * <p>It used to sit inside `.tbl-round` — the seating plan's round table,
 * `aspect-ratio: 1; border-radius: 50%` — and the browser drew every payment
 * inside a circle. The unit test proves the markup; only a browser proves the
 * shape: a wide, lightly rounded card, not a disc.
 */

const ADMIN = '11111111-1111-1111-1111-111111111111'

const payment = (id, status) => ({
  id,
  status,
  providerOrderRef: `ORD-${id}`,
  customerEmail: `${id}@ivy.test`,
  packageType: 'PREMIUM',
  amount: 1200,
  currency: 'MKD',
  createdAt: '2026-09-01T10:00:00Z',
})

async function stubApi(page) {
  await page.route('**/v1/api/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace('/v1/api', '')
    const respond = (body) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(body),
    })

    if (path === '/admin/payments') {
      return respond({ success: true, message: null, data: {
        content: [payment('a', 'SUCCESS'), payment('b', 'FAILED'), payment('c', 'PENDING')],
        totalElements: 3,
      } })
    }
    if (path.startsWith('/admin/users') || path.startsWith('/events')) return respond([])

    return respond({ success: true, message: null, data: null })
  })
}

test('payments render as a table in a card, one row per attempt, not in a circle', async ({ page }) => {
  await stubApi(page)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN'] })
  await page.goto('/en/admin/payments')

  await expect(page.locator('.tbl-card table.tbl tbody tr')).toHaveCount(3)
  await expect(page.locator('.tbl-round')).toHaveCount(0)

  const card = page.locator('.tbl-card')
  const box = await card.boundingBox()
  expect(box.width).toBeGreaterThan(box.height * 1.5)

  const radius = await card.evaluate((element) => parseFloat(getComputedStyle(element).borderTopLeftRadius))
  expect(radius).toBeLessThan(box.height / 4)
})

// ── CPay round 2 (5): awaiting confirmation and the admin's decision ──────

const SCRATCH = 'C:/Users/techl/AppData/Local/Temp/claude/C--Projcets-ZM/17a780c3-35a7-45d6-9961-af0c146a2596/scratchpad'

const waiting = (reference, extra = {}) => ({
  id: `pay-${reference}`,
  reference,
  amount: 4999,
  currency: 'MKD',
  packageTypes: ['INV_PRO'],
  eventId: 'ev-1',
  eventName: 'Свадба Ана и Марко',
  userId: 'user-1',
  customerEmail: 'ana@ivy.test',
  status: 'PENDING',
  createdAt: '2026-10-11T08:00:00Z',
  ageMinutes: 135,
  reason: 'NO_BANK_RESPONSE',
  reasonDetail: null,
  ...extra,
})

async function stubAwaiting(page) {
  const state = { rows: [waiting('ab12cd34ef'), waiting('ff00ee11dd', { reason: 'NEEDS_CONFIRMATION' })], decisions: [] }
  await page.route('**/v1/api/**', (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/v1/api', '')
    const respond = (body, status = 200) => route.fulfill({
      status, contentType: 'application/json', body: JSON.stringify(body),
    })
    if (path === '/admin/payments/awaiting-confirmation') {
      return respond({ success: true, data: { content: state.rows, totalElements: state.rows.length } })
    }
    const decided = path.match(/^\/admin\/payments\/([^/]+)\/(mark-paid|mark-failed)$/)
    if (decided && request.method() === 'POST') {
      const [, id, action] = decided
      state.decisions.push({ id, action, body: request.postDataJSON() })
      const row = state.rows.find((r) => r.id === id)
      if (!row) {
        return respond({ success: false, data: { status: 409, errorCode: 'CONFLICT_PAYMENT_ALREADY_SETTLED', detail: 'no longer waits' } }, 409)
      }
      state.rows = state.rows.filter((r) => r.id !== id)
      return respond({ success: true, data: { id, status: action === 'mark-paid' ? 'SUCCESS' : 'FAILED' } })
    }
    if (path === '/admin/payments') return respond({ success: true, data: { content: [], totalElements: 0 } })
    if (path.startsWith('/admin/users') || path.startsWith('/events')) return respond([])
    return respond({ success: true, message: null, data: null })
  })
  return state
}

test('awaiting confirmation: keyboard only — mark paid with the CPay reference and a note; a second decision on it is refused', async ({ page }) => {
  const state = await stubAwaiting(page)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'mk', roles: ['ADMIN'] })
  await page.goto('/mk/admin/payments')

  const filter = page.getByTestId('filter-awaiting')
  await filter.focus()
  await page.keyboard.press('Enter')
  await expect(filter).toHaveAttribute('aria-pressed', 'true')
  const row = page.getByTestId('awaiting-row-ab12cd34ef')
  await expect(row).toContainText('Нема повратен одговор од банка')
  await expect(row).toContainText('INV_PRO')
  await expect(row.getByRole('link', { name: /Свадба Ана и Марко/ })).toHaveAttribute('href', /\/mk\/admin\/events\?q=/)
  await expect(page.getByTestId('awaiting-row-ff00ee11dd')).toContainText('/ok без потврда на трансакција')

  await page.getByRole('button', { name: 'Означи го плаќањето ab12cd34ef како платено и активирај' }).focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Означи како платено и активирај' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('ab12cd34ef')

  // Required fields: nothing is sent, focus goes to the reference.
  await dialog.getByTestId('decision-confirm').click()
  await expect(dialog.getByLabel(/CPay референца/)).toBeFocused()
  await expect(dialog.getByLabel(/CPay референца/)).toHaveAttribute('aria-invalid', 'true')
  expect(state.decisions).toHaveLength(0)

  await page.keyboard.type('CP-778899')
  await expect(dialog.getByLabel(/CPay референца/)).toHaveAttribute('aria-invalid', 'false')
  await page.keyboard.press('Tab')
  await expect(dialog.getByLabel('Белешка')).toBeFocused()
  await page.keyboard.type('Видено во CPay порталот')
  await page.screenshot({ path: `${SCRATCH}/cpay-r2-admin-confirm-dialog.png`, fullPage: false })
  await dialog.getByTestId('decision-confirm').focus()
  await page.keyboard.press('Enter')

  await expect(dialog).toHaveCount(0)
  await expect(page.getByTestId('awaiting-notice')).toHaveText('Плаќањето ab12cd34ef е означено како платено; пакетите се активираат.')
  await expect(page.getByTestId('awaiting-notice')).toBeFocused()
  await expect(page.getByTestId('awaiting-row-ab12cd34ef')).toHaveCount(0)
  expect(state.decisions).toEqual([{ id: 'pay-ab12cd34ef', action: 'mark-paid', body: { providerReference: 'CP-778899', note: 'Видено во CPay порталот' } }])

  // Someone else settled the other one meanwhile: 409 → said so, list refreshed, nothing else.
  state.rows = state.rows.filter((r) => r.reference !== 'ff00ee11dd')
  await page.getByTestId('mark-failed-ff00ee11dd').click()
  const failDialog = page.getByRole('dialog', { name: 'Означи како неуспешно' })
  await failDialog.getByLabel('Белешка').fill('Корисникот откажа')
  await failDialog.getByTestId('decision-confirm').click()
  await expect(failDialog).toHaveCount(0)
  await expect(page.getByTestId('awaiting-notice')).toContainText('повеќе не чека')
  await expect(page.getByTestId('awaiting-row-ff00ee11dd')).toHaveCount(0)
  await page.screenshot({ path: `${SCRATCH}/cpay-r2-admin-awaiting.png`, fullPage: true })
})

// ── CPay reconciliation: SUCCESS for a period, CPay reference, CSV ─────────

test('reconciliation (390px, mk): SUCCESS + period → the CPay reference is listed and the CSV has the five columns, no overflow', async ({ page }) => {
  const requests = []
  await page.route('**/v1/api/**', (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/v1/api', '')
    const respond = (body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    if (path === '/admin/payments') {
      requests.push(Object.fromEntries(url.searchParams))
      const rows = url.searchParams.get('status') === 'SUCCESS'
        ? [{ ...payment('a', 'SUCCESS'), providerTransactionRef: 'R7731905', paidAt: '2026-10-06T11:20:00' }]
        : [payment('a', 'SUCCESS'), payment('c', 'PENDING')]
      return respond({ success: true, data: { content: rows, totalElements: rows.length, totalPages: 1 } })
    }
    if (path.startsWith('/admin/users') || path.startsWith('/events')) return respond([])
    return respond({ success: true, message: null, data: null })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'mk', roles: ['ADMIN'] })
  await page.goto('/mk/admin/payments')

  await page.getByRole('button', { name: 'Успешно', exact: true }).click()
  await page.getByLabel('Од', { exact: true }).fill('2026-10-05')
  await page.getByLabel('Од', { exact: true }).dispatchEvent('change')
  await page.getByLabel('До', { exact: true }).fill('2026-10-11')
  await page.getByLabel('До', { exact: true }).dispatchEvent('change')

  await expect.poll(() => requests.at(-1)).toMatchObject({ status: 'SUCCESS', from: '2026-10-05', to: '2026-10-11', page: '0' })
  await expect(page.getByRole('columnheader', { name: 'CPay референца' })).toBeVisible()
  await expect(page.getByTestId('payment-row-a').getByTestId('cpay-ref')).toHaveText('R7731905')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Преземи CSV' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('cpay-payments-success-2026-10-05_2026-10-11.csv')
  const stream = await download.createReadStream()
  let csv = ''
  for await (const chunk of stream) csv += chunk
  expect(csv.replace(/^﻿/, '')).toBe('reference,cPayPaymentRef,amount,currency,paidAt\r\nORD-a,R7731905,1200,MKD,2026-10-06T11:20:00\r\n')
  await expect(page.getByTestId('awaiting-notice')).toHaveText('Преземен е CSV со 1 плаќања.')

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  await page.screenshot({ path: `${SCRATCH}/cpay-reconciliation-390.png`, fullPage: true })
})
