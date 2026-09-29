import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

/**
 * A guest answering the invitation in a real browser.
 *
 * <p>What used to go wrong: the form thanked the guest even when the request
 * failed, and the allergies it asked for were never sent. The backend is
 * stubbed — first refusing, then accepting — so both are visible here.
 */

const mk = JSON.parse(readFileSync(new URL('../src/i18n/locales/mk.json', import.meta.url), 'utf8'))
const EVENT = '11111111-2222-3333-4444-555555555555'

test('a failed reply says so and keeps the answers; the retry sends allergies and lands on the thank-you page', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))

  const sent = []
  await page.route('**/public/invitation-page/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await page.route('**/public/guests', async (route) => {
    sent.push(route.request().postDataJSON())
    // The first attempt fails, the second is stored.
    if (sent.length === 1) return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"id":"g-1"}' })
  })

  await page.goto(`/mk/invitations/coastal-breeze?eventId=${EVENT}`)
  // The invitation opens behind an envelope; the guest taps it.
  // Animated, so never "stable" for Playwright; a tap is what a guest does.
  await page.getByText(/Допрете за отворање/).click({ force: true })

  const form = page.locator('form.form')
  await form.scrollIntoViewIfNeeded()
  await form.locator('input.field-input[type="text"]').first().fill('Ана Петрова')
  await form.getByPlaceholder(mk.invitation.allergiesPlaceholder).fill('Ореви')
  await form.locator('label.radio-card', { has: page.locator('input[value="accept"]') }).click()

  await form.locator('button.submit-btn').click()
  await expect(form.locator('.submit-message--error')).toHaveText(mk.invitation.rsvpError)
  await expect(form.locator('input.field-input[type="text"]').first()).toHaveValue('Ана Петрова')

  await form.locator('button.submit-btn').click()
  await expect(page).toHaveURL(/\/mk\/rsvp-success/)

  expect(sent).toHaveLength(2)
  expect(sent[1].guests[0]).toMatchObject({ name: 'Ана Петрова', allergies: 'Ореви' })
  expect(sent[1].inviteStatus).toBe('CONFIRMED')
})
