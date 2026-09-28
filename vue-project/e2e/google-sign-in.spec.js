import { test, expect } from '@playwright/test'

/**
 * Google sign-in in a real browser: the button sends Keycloak a PKCE challenge
 * (eventFE requires one), and a sign-in Keycloak refuses comes back as a
 * message — not as the email-code form with no address in it.
 *
 * Keycloak itself is stubbed: what is tested is what the app sends and how it
 * reads the answer.
 */

test('the Google button asks Keycloak for the code with a PKCE challenge', async ({ page }) => {
  let authorize = null
  await page.route('**/protocol/openid-connect/auth**', async (route) => {
    authorize = new URL(route.request().url())
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<p>keycloak</p>' })
  })

  await page.goto('/en/auth/login')
  await page.getByRole('button', { name: /google/i }).click()

  await expect.poll(() => authorize?.searchParams.get('kc_idp_hint')).toBe('google')
  expect(authorize.searchParams.get('client_id')).toBe('eventFE')
  expect(authorize.searchParams.get('code_challenge_method')).toBe('S256')
  expect(authorize.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/)
  expect(authorize.searchParams.get('redirect_uri')).toMatch(/\/en\/auth\/verify-email$/)
})

test('a sign-in Keycloak refuses says so, and leads back to the login page', async ({ page }) => {
  await page.goto('/en/auth/verify-email?error=invalid_request&error_description=Missing+parameter%3A+code_challenge_method')

  await expect(page.getByText('Google sign-in failed')).toBeVisible()
  await expect(page.getByTestId('oauth-error')).toHaveText('Missing parameter: code_challenge_method')
  await expect(page.getByText('Verify email')).toHaveCount(0)

  await page.getByRole('button', { name: 'Back to sign in' }).click()
  await expect(page).toHaveURL(/\/en\/auth\/login$/)
})
