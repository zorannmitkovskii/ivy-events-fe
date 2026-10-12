import { test, expect } from '@playwright/test'

/**
 * INV-201 — informative cards in the design catalogue.
 *
 * Each card has a description and what the design has (layout, story,
 * programme, opening); "Preview" only looks and "Use this design" picks; the
 * pick is shown with a check, a word and a pressed button, not only a colour;
 * both work with the keyboard and on a phone.
 */

async function stubTemplates(page) {
  await page.route('**/public/invitation-templates/category/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 't-coastal', name: 'Coastal Breeze', path: 'invitations/coastal-breeze', active: true },
        { id: 't-persian', name: 'Persian Wedding', path: 'invitations/persian-wedding', active: true },
      ]),
    }))
  await page.route('**/v1/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) }))
}

async function asGuestWithBasics(page) {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent', 'rejected')
    localStorage.setItem('lang', 'en')
    if (!localStorage.getItem('onboarding_state_v1')) {
      localStorage.setItem('onboarding_state_v1', JSON.stringify({
        selectedCategory: 'WEDDING',
        eventDetails: {
          brideName: 'Ана', groomName: 'Марко', date: '2099-06-12', time: '17:30',
          timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' },
        },
      }))
    }
  })
}

const card = (page, name) => page.getByTestId('invitation-card').filter({ has: page.getByRole('heading', { name }) })
const stored = (page) => page.evaluate(() => ({
  onboarding: JSON.parse(localStorage.getItem('onboarding_state_v1') || '{}'),
  draft: localStorage.getItem('invitation_draft_v1'),
}))

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('cards say what each design has; Preview only looks, Use picks — with the keyboard', async ({ page }) => {
    await asGuestWithBasics(page)
    await stubTemplates(page)
    await page.goto('/en/event-invitations')

    await expect(page.getByTestId('invitation-card')).toHaveCount(2)
    await expect(page.getByTestId('designs-shared-sections')).toContainText('event details, a programme, your story and an RSVP form')
    const persian = card(page, 'Persian Wedding')
    await expect(persian.getByTestId('invitation-card-description')).toContainText('red curtain')
    await expect(persian.getByTestId('invitation-card-traits')).toContainText('Opening')
    await expect(persian.getByTestId('invitation-card-traits')).toContainText('curtain animation')
    await expect(card(page, 'Coastal Breeze').getByTestId('invitation-card-traits')).toContainText('envelope animation')

    // Keyboard: Tab from Preview reaches Use on the same card; Enter picks.
    await persian.getByTestId('invitation-card-preview').focus()
    await page.keyboard.press('Tab')
    await expect(persian.getByTestId('invitation-card-use')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(persian.getByTestId('invitation-card-use')).toHaveAttribute('aria-pressed', 'true')
    await expect(persian.getByTestId('invitation-card-selected')).toHaveText(/Selected/)
    await expect(page.getByTestId('invitation-selected-status')).toHaveText(/Selected design: Persian Wedding/)
    const before = await stored(page)
    expect(before.onboarding.invitationPath).toBe('invitations/persian-wedding')

    // Preview another design: it opens (in this page, INV-202), but the
    // choice and the draft stay.
    const coastal = card(page, 'Coastal Breeze')
    await coastal.getByTestId('invitation-card-preview').click()
    const frame = page.frameLocator('[data-testid="template-preview-frame"]')
    await expect(frame.locator('.unified-invitation')).toBeAttached()
    await page.waitForTimeout(500)
    const after = await stored(page)
    expect(after.onboarding.invitationName).toBe('t-persian')
    expect(after.onboarding.invitationPath).toBe('invitations/persian-wedding')
    expect(after.draft).toBe(before.draft)
    await page.getByTestId('template-preview-close').click()
    await expect(page.getByTestId('template-preview')).toHaveCount(0)

    await expect(persian.getByTestId('invitation-card-use')).toHaveAttribute('aria-pressed', 'true')
    await expect(coastal.getByTestId('invitation-card-use')).toHaveAttribute('aria-pressed', 'false')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page).toHaveURL(/\/en\/invitations\/persian-wedding\?.*new=1/)
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('cards fit, both actions are visible and a tap on Use picks the design', async ({ page }) => {
    await asGuestWithBasics(page)
    await stubTemplates(page)
    await page.goto('/en/event-invitations')

    const coastal = card(page, 'Coastal Breeze')
    await coastal.scrollIntoViewIfNeeded()
    await expect(coastal.getByTestId('invitation-card-preview')).toBeVisible()
    await expect(coastal.getByTestId('invitation-card-use')).toBeVisible()
    await coastal.getByTestId('invitation-card-use').tap()
    await expect(coastal.getByTestId('invitation-card-use')).toHaveAttribute('aria-pressed', 'true')
    await expect(coastal.getByTestId('invitation-card-selected')).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
