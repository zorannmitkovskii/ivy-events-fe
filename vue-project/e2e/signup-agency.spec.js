import { test, expect } from '@playwright/test'
import { fakeToken } from './support/session.js'

/**
 * Signing up as an agency, end to end in the browser.
 *
 * <p>The form used to send accountType AGENCY_MEMBER, which zm-iam-service
 * refused, and a verified account always landed on the couple's first step.
 * IAM and Keycloak are stubbed: what is tested is what the app sends, and where
 * it takes an account whose token says AGENCY.
 */

const OWNER = '33333333-3333-3333-3333-333333333333'

test('an agency signs up as ORGANIZER with its name, verifies, and lands on the agency workspace', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))

  let registered = null
  const agencyToken = fakeToken({ sub: OWNER, roles: ['AGENCY', 'USER'] })
  const tokens = { access_token: agencyToken, refresh_token: 'r', id_token: agencyToken, expires_in: 300 }
  const json = (route, body, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

  await page.route('**/public/users/register', async (route) => {
    registered = route.request().postDataJSON()
    return json(route, { username: 'ana' })
  })
  await page.route('**/public/auth/verify-email', (route) => json(route, { status: 'verified' }))
  await page.route('**/public/users/login', (route) => json(route, tokens))
  await page.route('**/assign-role**', (route) => json(route, {}))
  await page.route('**/protocol/openid-connect/token', (route) => json(route, tokens))
  await page.route('**/v1/api/**', (route) => json(route, null))

  await page.goto('/mk/auth/signup')
  await page.getByText('Агенција', { exact: true }).click()
  await page.getByLabel('Име на агенцијата').fill('Ивена Агенција')
  await page.getByLabel('Име', { exact: true }).fill('Ана')
  await page.getByLabel('Е-пошта').fill('ana@ivena.mk')
  await page.getByLabel('Лозинка', { exact: true }).fill('Lozinka1!')
  await page.getByLabel('Потврди Лозинка').fill('Lozinka1!')
  await page.locator('input[type="checkbox"]').first().check()
  await page.locator('form button[type="submit"]').click()

  await expect(page).toHaveURL(/\/mk\/auth\/verify-email/)
  expect(registered).toMatchObject({ accountType: 'ORGANIZER', organizationName: 'Ивена Агенција', email: 'ana@ivena.mk' })

  await page.locator('input').first().fill('123456')
  await page.locator('form').first().evaluate((form) => form.requestSubmit())

  await expect(page).toHaveURL(/\/mk\/agency\/dashboard/)
})
