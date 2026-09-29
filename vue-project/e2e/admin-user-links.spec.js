import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * An administrator turns an account into a vendor's owner from the users
 * screen: the vendor is chosen with the role and sent with it.
 */

const ADMIN = '11111111-1111-1111-1111-111111111111'
const ANA = { id: 'u1', firstName: 'Ana', lastName: 'Petrova', email: 'ana@example.mk', roles: ['USER'], enabled: true, emailVerified: true, packages: [], eventIds: [] }
const VENDORS = [
  { id: 'v-1', name: 'Studio Lumière', type: 'PHOTOGRAPHY' },
  { id: 'v-2', name: 'Catering Vardar', type: 'CATERING' },
]

async function stubApi(page) {
  const puts = []
  await page.route('**/v1/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/v1/api', '')
    const bare = (data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })

    if (path === '/admin/users/page') return bare({ items: [ANA], nextFirst: 1, hasMore: false })
    if (path === '/admin/users/u1' && request.method() === 'GET') return bare(ANA)
    if (path === '/admin/users/u1' && request.method() === 'PUT') {
      puts.push(request.postDataJSON())
      return bare({ ...ANA, roles: ['VENDOR', 'VENDOR_MEMBER'], vendorId: 'v-2' })
    }
    if (path === '/admin/agencies') return bare({ success: true, message: null, data: [] })
    if (path === '/vendors') return bare(VENDORS)
    if (path === '/events') return bare([])
    return bare({ success: true, message: null, data: null })
  })
  return puts
}

test('an administrator makes an account a vendor owner, choosing the vendor with the role', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  const puts = await stubApi(page)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN', 'USER'] })
  await page.goto('/en/admin/users')

  await page.locator('tbody tr', { hasText: 'Ana' }).locator('.action-btn--edit').click()
  const dialog = page.locator('.dialog')

  await dialog.locator('input[type="checkbox"][value="USER"]').uncheck()
  await dialog.locator('input[type="checkbox"][value="VENDOR"]').check()

  const vendorField = dialog.getByTestId('link-vendor')
  await expect(vendorField).toBeVisible()
  await vendorField.locator('input[type="text"]').fill('vard')
  await vendorField.locator('select').selectOption('v-2')
  await dialog.locator('.btn-save').click()

  await expect.poll(() => puts.length).toBe(1)
  expect(puts[0]).toMatchObject({ roles: ['VENDOR'], vendorId: 'v-2', orgId: null })
  await expect(dialog).toHaveCount(0)
})

test('an agency role without an agency is refused in the dialog, before anything is sent', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  const puts = await stubApi(page)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN', 'USER'] })
  await page.goto('/en/admin/users')

  await page.locator('tbody tr', { hasText: 'Ana' }).locator('.action-btn--edit').click()
  const dialog = page.locator('.dialog')
  await dialog.locator('input[type="checkbox"][value="AGENCY_MEMBER"]').check()
  await dialog.locator('.btn-save').click()

  await expect(dialog.locator('.form-error')).toHaveText('AGENCY and AGENCY_MEMBER need an agency.')
  expect(puts).toHaveLength(0)
})
