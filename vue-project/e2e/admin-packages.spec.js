import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * The admin's package list: every row can be edited and deleted.
 *
 * <p>The edit and delete buttons were always in the page, but hidden: their
 * CSS showed them on `.row-hover:hover`, and the shared DataTable never gives
 * a row that class. So they sat invisible — here and on five other admin
 * lists. What this guards is that they can be seen and that they work.
 */

const ADMIN = '11111111-1111-1111-1111-111111111111'

const PREMIUM = {
  id: 'p1', name: 'Premium', description: 'Сè вклучено', packageCategory: 'WEDDING', packageType: 'INV_PREMIUM',
  price: 2400, currency: 'MKD', discount: 10, activeDiscount: true,
  nameI18n: { mk: 'Премиум', en: 'Premium' }, descriptionI18n: {},
  features: [{ id: 'f1', name: 'RSVP', included: true, nameI18n: {}, descriptionI18n: {} }],
}
const BASIC = { id: 'p2', name: 'Basic', description: 'Основно', packageCategory: 'WEDDING', packageType: 'INV_BASIC', price: 0, currency: 'MKD', features: [] }

async function stubApi(page) {
  const calls = []
  await page.route('**/v1/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/v1/api', '')
    calls.push({ method: request.method(), path, body: request.postDataJSON?.() ?? null })
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: data == null ? '' : JSON.stringify(data) })

    if (path === '/packages' && request.method() === 'GET') return reply([PREMIUM, BASIC])
    if (path === '/packages/p1' && request.method() === 'GET') return reply(PREMIUM)
    if (path === '/packages/p1' && request.method() === 'PUT') return reply({ ...PREMIUM, ...request.postDataJSON() })
    if (path === '/packages/p2' && request.method() === 'DELETE') return reply(null, 204)
    if (path === '/me/privileges') return reply([])
    return reply(null)
  })
  return calls
}

test.beforeEach(async ({ page }) => {
  // Answered already, so the consent banner does not sit over the dialog's buttons.
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN', 'USER'] })
})

test('every package row shows its edit and delete buttons without hovering', async ({ page }) => {
  await stubApi(page)
  await page.goto('/en/admin/packages')

  const premiumRow = page.locator('tbody tr', { hasText: 'Premium' })
  await expect(premiumRow.locator('.action-btn--edit')).toBeVisible()
  await expect(premiumRow.locator('.action-btn--danger')).toBeVisible()
  await expect(premiumRow.locator('.actions')).toHaveCSS('opacity', '1')
})

test('editing a package loads it, and saving sends the new price', async ({ page }) => {
  const calls = await stubApi(page)
  await page.goto('/en/admin/packages')

  await page.locator('tbody tr', { hasText: 'Premium' }).locator('.action-btn--edit').click()
  const dialog = page.locator('.dialog')
  await expect(dialog.locator('input.form-input').first()).toHaveValue('Premium')

  const price = dialog.locator('input[type="number"]').first()
  await price.fill('2900')
  await dialog.locator('.btn-save').click()

  await expect.poll(() => calls.find((c) => c.method === 'PUT')?.body?.price).toBe(2900)
  await expect(page.locator('tbody tr', { hasText: 'Premium' })).toContainText('2900')
})

test('deleting a package asks first, then removes it from the list', async ({ page }) => {
  const calls = await stubApi(page)
  await page.goto('/en/admin/packages')
  page.once('dialog', (confirm) => confirm.accept())

  await page.locator('tbody tr', { hasText: 'Basic' }).locator('.action-btn--danger').click()

  await expect.poll(() => calls.some((c) => c.method === 'DELETE' && c.path === '/packages/p2')).toBe(true)
  await expect(page.locator('tbody tr', { hasText: 'Basic' })).toHaveCount(0)
  await expect(page.locator('tbody tr', { hasText: 'Premium' })).toHaveCount(1)
})
