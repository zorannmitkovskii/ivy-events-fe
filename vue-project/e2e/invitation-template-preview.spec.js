import { test, expect } from '@playwright/test'

/**
 * INV-202 — a design previewed before it is chosen, inside the catalogue.
 *
 * No new tab; phone and desktop views of the page guests open, with the
 * person's own names where they entered them and sample content (RSVP
 * included) labelled as such. Closing it returns to the same place in the
 * catalogue with the choice and the draft unchanged; it works with the
 * keyboard and on a phone.
 */

const TEMPLATES = [
  { id: 't-coastal', name: 'Coastal Breeze', path: 'invitations/coastal-breeze', active: true },
  { id: 't-persian', name: 'Persian Wedding', path: 'invitations/persian-wedding', active: true },
  { id: 't-parisian', name: 'Parisian Wedding', path: 'invitations/parisian-wedding', active: true },
  { id: 't-chateau', name: 'Elegant Chateau', path: 'invitations/elegant-chateau', active: true },
  { id: 't-collage', name: 'Modern Collage', path: 'invitations/modern-collage', active: true },
  { id: 't-editorial', name: 'Editorial', path: 'invitations/editorial', active: true },
]

async function stub(page) {
  await page.route('**/public/invitation-templates/category/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEMPLATES) }))
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

const card = (page, name) => page.getByTestId('invitation-card').filter({ has: page.getByRole('heading', { name, exact: true }) })
const stored = (page) => page.evaluate(() => ({
  onboarding: localStorage.getItem('onboarding_state_v1'),
  draft: localStorage.getItem('invitation_draft_v1'),
}))
const frameOf = (page) => page.frameLocator('[data-testid="template-preview-frame"]')

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 800 } })

  test('opens in the page on phone and desktop, labels samples, and closes back to the same place', async ({ page, context }) => {
    let tabs = 0
    context.on('page', () => { tabs += 1 })
    await asGuestWithBasics(page)
    await stub(page)
    await page.goto('/en/event-invitations')
    await expect(page.getByTestId('invitation-card')).toHaveCount(6)

    await card(page, 'Persian Wedding').getByTestId('invitation-card-use').click()
    const coastal = card(page, 'Coastal Breeze')
    await coastal.scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, 200))
    const scrollBefore = await page.evaluate(() => window.scrollY)
    expect(scrollBefore).toBeGreaterThan(0)
    const before = await stored(page)

    await coastal.getByTestId('invitation-card-preview').click()
    const dialog = page.getByRole('dialog', { name: 'Preview: Coastal Breeze' })
    await expect(dialog).toBeVisible()
    await expect(page.getByTestId('template-preview-close')).toBeFocused()

    // The page guests open, with the names entered, and labelled as a preview.
    const frame = frameOf(page)
    await expect(frame.locator('.unified-invitation')).toBeAttached()
    await expect(frame.getByTestId('sample-preview-badge')).toBeVisible()
    await expect(frame.locator('body')).toContainText('Ана')
    await expect(frame.getByTestId('sample-preview-rsvp')).toBeAttached()
    await expect(frame.locator('.rsvp-form, #rsvp-section form').first()).toBeAttached()
    // Without the flow's own bars or the cookie question.
    await expect(frame.getByTestId('draft-preview-bar')).toHaveCount(0)
    await expect(frame.locator('nav[aria-label]')).toHaveCount(0)
    await expect(page.getByTestId('template-preview-own')).toContainText('names, date and place')
    await expect(page.getByTestId('template-preview-sample')).toContainText('photos')
    await expect(page.getByTestId('template-preview-sample')).toContainText('RSVP form (answers are not sent)')

    // Desktop by default on a wide screen; phone is the phone's width.
    await expect(page.getByTestId('template-preview-desktop')).toHaveAttribute('aria-pressed', 'true')
    const frameEl = page.getByTestId('template-preview-frame')
    expect(await frameEl.evaluate((f) => f.contentWindow.innerWidth)).toBe(1280)
    await page.getByTestId('template-preview-mobile').click()
    await expect(page.getByTestId('template-preview-mobile')).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => frameEl.evaluate((f) => f.contentWindow.innerWidth)).toBe(390)
    const box = await frameEl.boundingBox()
    expect(Math.round(box.width)).toBe(390)

    await page.waitForTimeout(500)
    const during = await stored(page)
    expect(during).toEqual(before)

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(coastal.getByTestId('invitation-card-preview')).toBeFocused()
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore)
    expect(await stored(page)).toEqual(before)
    expect(tabs).toBe(0)
    await expect(card(page, 'Persian Wedding').getByTestId('invitation-card-use')).toHaveAttribute('aria-pressed', 'true')
    await expect(coastal.getByTestId('invitation-card-use')).toHaveAttribute('aria-pressed', 'false')

    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page).toHaveURL(/\/en\/invitations\/persian-wedding\?.*new=1/)
  })

  test('works with the keyboard only, Escape inside the invitation included', async ({ page }) => {
    await asGuestWithBasics(page)
    await stub(page)
    await page.goto('/en/event-invitations')
    const parisian = card(page, 'Parisian Wedding')
    await parisian.getByTestId('invitation-card-preview').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByTestId('template-preview-close')).toBeFocused()

    // Shift+Tab from the first control stays in the dialog.
    await page.getByTestId('template-preview-mobile').focus()
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByTestId('template-preview-use')).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByTestId('template-preview-back')).toBeFocused()

    // Into the invitation, then Escape there.
    await expect(frameOf(page).locator('.unified-invitation')).toBeAttached()
    await frameOf(page).locator('body').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(parisian.getByTestId('invitation-card-preview')).toBeFocused()
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('fills the screen, phone view by default, desktop view scaled to fit, no sideways scroll', async ({ page }) => {
    await asGuestWithBasics(page)
    await stub(page)
    await page.goto('/en/event-invitations')
    const chateau = card(page, 'Elegant Chateau')
    await chateau.scrollIntoViewIfNeeded()
    const scrollBefore = await page.evaluate(() => window.scrollY)
    const before = await stored(page)

    await chateau.getByTestId('invitation-card-preview').tap()
    const dialog = page.getByTestId('template-preview')
    await expect(dialog).toBeVisible()
    const dbox = await dialog.boundingBox()
    expect(Math.round(dbox.width)).toBe(390)
    await expect(page.getByTestId('template-preview-mobile')).toHaveAttribute('aria-pressed', 'true')
    for (const id of ['template-preview-close', 'template-preview-use', 'template-preview-back', 'template-preview-desktop']) {
      await expect(page.getByTestId(id)).toBeInViewport()
    }
    const frameEl = page.getByTestId('template-preview-frame')
    await expect(frameOf(page).getByTestId('sample-preview-badge')).toBeVisible()
    expect(await frameEl.evaluate((f) => f.contentWindow.innerWidth)).toBeLessThanOrEqual(390)

    await page.getByTestId('template-preview-desktop').tap()
    await expect.poll(() => frameEl.evaluate((f) => f.contentWindow.innerWidth)).toBe(1280)
    const fbox = await frameEl.boundingBox()
    expect(fbox.width).toBeLessThanOrEqual(390)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)

    await page.getByTestId('template-preview-back').tap()
    await expect(dialog).toHaveCount(0)
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore)
    expect(await stored(page)).toEqual(before)
  })
})
