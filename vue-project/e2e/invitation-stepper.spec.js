import { test, expect } from '@playwright/test'

/**
 * INV-102 — the stepper of a new invitation: Event, Design, Details, RSVP,
 * Preview, on every page of the INV-104 flow.
 *
 * A guest is sent to the field that is missing rather than past it, moves
 * between the steps with the keyboard, skips the optional ones, and goes back
 * to an earlier step without losing anything entered.
 */

async function stubApi(page) {
  await page.route('**/public/invitation-templates/category/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 't-coastal', name: 'Coastal Breeze', path: 'invitations/coastal-breeze', active: true },
      ]),
    }))
  await page.route('**/v1/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) }))
}

async function asGuest(page) {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent', 'rejected')
    localStorage.setItem('lang', 'en')
    if (!localStorage.getItem('onboarding_state_v1')) {
      localStorage.setItem('onboarding_state_v1', JSON.stringify({ selectedCategory: 'WEDDING' }))
    }
  })
}

const stepper = (page) => page.getByTestId('creation-stepper').filter({ visible: true }).first()
const step = (page, key) => stepper(page).locator(`[data-step="${key}"]`)

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('leads to what is missing, skips optional steps and keeps everything going back', async ({ page }) => {
    await asGuest(page)
    await stubApi(page)
    await page.goto('/en/event-basics')

    await expect(step(page, 'event')).toHaveAttribute('aria-current', 'step')
    await expect(step(page, 'event')).toHaveAttribute('data-status', 'incomplete')

    // Asking for a later step with nothing entered: to the first missing field.
    await page.getByLabel("Bride's Name").fill('Ана')
    await step(page, 'details').click()
    await expect(page).toHaveURL(/\/en\/event-basics/)
    await expect(page.getByLabel("Groom's Name")).toBeFocused()

    await page.getByLabel("Groom's Name").fill('Марко')
    await page.getByLabel('Date', { exact: true }).fill('2099-06-12')
    await page.getByLabel('Start time').fill('17:30')
    await page.getByLabel('Venue', { exact: true }).fill('Охрид')
    await expect(step(page, 'event')).toHaveAttribute('data-status', 'complete')

    // Keyboard: arrow to Design, Enter.
    await step(page, 'event').focus()
    await page.keyboard.press('ArrowRight')
    await expect(step(page, 'design')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/en\/event-invitations/)
    await expect(step(page, 'event')).toHaveAttribute('data-status', 'complete')
    await expect(step(page, 'design')).toHaveAttribute('aria-current', 'step')

    await page.getByTestId('invitation-card-use').first().click()
    await expect(step(page, 'design')).toHaveAttribute('data-status', 'complete')

    // Details is optional: straight on to RSVP, in the editor.
    await step(page, 'rsvp').click()
    await expect(page).toHaveURL(/\/en\/invitations\/coastal-breeze\?.*new=1/)
    await expect(step(page, 'rsvp')).toHaveAttribute('aria-current', 'step')
    await expect(step(page, 'details')).toHaveAttribute('data-status', /optional|skipped/)

    // Back to the Event step: everything entered is still there.
    await step(page, 'event').click()
    await expect(page).toHaveURL(/\/en\/event-basics/)
    await expect(page.getByLabel("Bride's Name")).toHaveValue('Ана')
    await expect(page.getByLabel('Venue', { exact: true })).toHaveValue('Охрид')

    // And forward again to the same design, still with those names.
    await step(page, 'details').click()
    await expect(page).toHaveURL(/\/en\/invitations\/coastal-breeze\?.*new=1/)
    await expect(page.locator('.hero-names, .couple-names').first()).toContainText('Ана')

    // In the editor a basics field emptied in Info is an error on the Event
    // step, and the step leads to that field.
    const bride = page.locator('aside [data-info-field="brideName"]')
    await bride.fill('')
    await expect(step(page, 'event')).toHaveAttribute('data-status', 'error')
    await step(page, 'event').click()
    await expect(bride).toBeFocused()
    await expect(bride).toHaveAttribute('aria-invalid', 'true')
    await bride.fill('Ана')
    await expect(step(page, 'event')).toHaveAttribute('data-status', 'complete')

    // Preview, then back into the editor through the stepper.
    await step(page, 'preview').click()
    await expect(page).toHaveURL(/preview=1/)
    await expect(step(page, 'preview')).toHaveAttribute('aria-current', 'step')
    await step(page, 'details').click()
    await expect(page).toHaveURL(/edit=true/)
  })
})

test.describe('desktop, basics left unfinished', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test("the design's demo couple does not pass for the person's basics", async ({ page }) => {
    await asGuest(page)
    await stubApi(page)
    await page.addInitScript(() => {
      localStorage.setItem('onboarding_state_v1', JSON.stringify({
        selectedCategory: 'WEDDING', invitationPath: 'invitations/coastal-breeze',
        eventDetails: { brideName: 'Ана', groomName: '', date: '2099-06-12', time: '17:30', timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' } },
      }))
    })
    await page.goto('/en/invitations/coastal-breeze?new=1&edit=true')
    await expect(step(page, 'event')).toHaveAttribute('data-status', 'error')
    await step(page, 'event').click()
    await expect(page).toHaveURL(/\/en\/event-basics\?focus=groomName/)
    await expect(page.getByLabel("Groom's Name")).toBeFocused()
    await expect(page.getByLabel("Bride's Name")).toHaveValue('Ана')
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('the stepper fits the screen and names the current step', async ({ page }) => {
    await asGuest(page)
    await stubApi(page)
    await page.goto('/en/event-basics')

    const nav = stepper(page)
    await expect(nav).toBeVisible()
    const box = await nav.boundingBox()
    expect(box.width).toBeLessThanOrEqual(390)
    await expect(page.getByTestId('creation-stepper-summary').first()).toContainText('Step 1 of 5: Event')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
  })
})

test.describe('phone editor', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('the steps are in the edit sheet, and lead on to the preview', async ({ page }) => {
    await asGuest(page)
    await stubApi(page)
    await page.addInitScript(() => {
      localStorage.setItem('onboarding_state_v1', JSON.stringify({
        selectedCategory: 'WEDDING', invitationName: 't-coastal', invitationPath: 'invitations/coastal-breeze',
        eventDetails: { brideName: 'Ана', groomName: 'Марко', date: '2099-06-12', time: '17:30', timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' } },
      }))
    })
    await page.goto('/en/invitations/coastal-breeze?new=1&edit=true')
    await page.getByText('Tap to open').click({ force: true })
    await page.getByRole('button', { name: 'Customize' }).click()

    await expect(step(page, 'details')).toHaveAttribute('aria-current', 'step')
    await expect(step(page, 'event')).toHaveAttribute('data-status', 'complete')
    await step(page, 'preview').click()
    await expect(page).toHaveURL(/preview=1/)
    await expect(step(page, 'preview')).toHaveAttribute('aria-current', 'step')
  })
})
