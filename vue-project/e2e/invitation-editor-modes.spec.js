import { test, expect } from '@playwright/test'

/**
 * INV-103 — the editor's quick start and advanced settings.
 *
 * Quick start: Info, the content sections and RSVP — enough for a working
 * invitation. Advanced settings: also the opening animation, colours, fonts
 * and layouts. Switching only changes which controls show: what was typed and
 * the styles chosen stay, on the desktop and on a phone.
 */

async function stubApi(page) {
  await page.route('**/public/invitation-templates/category/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 't-coastal', name: 'Coastal Breeze', path: 'invitations/coastal-breeze', active: true }]),
    }))
  await page.route('**/v1/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) }))
}

async function asGuestInEditor(page) {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent', 'rejected')
    localStorage.setItem('lang', 'en')
    localStorage.setItem('onboarding_state_v1', JSON.stringify({
      selectedCategory: 'WEDDING', invitationName: 't-coastal', invitationPath: 'invitations/coastal-breeze',
      eventDetails: { brideName: 'Ана', groomName: 'Марко', date: '2099-06-12', time: '17:30', timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' } },
    }))
  })
  await stubApi(page)
  await page.goto('/en/invitations/coastal-breeze?new=1&edit=true')
}

const rootStyle = (page) => page.locator('.unified-invitation').getAttribute('style')

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('quick start makes a working invitation; switching modes keeps text and styles', async ({ page }) => {
    await asGuestInEditor(page)
    const sidebar = page.locator('aside.edit-sidebar')
    const mode = sidebar.getByTestId('editor-mode')
    const tabs = sidebar.locator('.edit-sidebar__tabs .tab-btn')

    // Quick start by default: Info and Content only.
    await expect(mode.getByRole('button', { name: 'Quick start' })).toHaveAttribute('aria-pressed', 'true')
    await expect(tabs).toHaveText(['Info', 'Content'])

    // Info → the preview.
    const bride = sidebar.locator('[data-info-field="brideName"]')
    await bride.fill('Ема')
    await expect(page.locator('.hero-names, .couple-names').first()).toContainText('Ема')

    // Content and RSVP without the advanced settings.
    await tabs.filter({ hasText: 'Content' }).click()
    const labels = sidebar.locator('.accordion-label')
    await expect(labels).not.toContainText(['Opening animation'])
    await expect(labels.filter({ hasText: 'RSVP' })).toHaveCount(1)
    await labels.filter({ hasText: 'RSVP' }).click()
    await expect(sidebar.locator('[data-rsvp-field="deadline"]')).toBeVisible()
    await expect(sidebar.locator('.sub-tab-bar')).toHaveCount(0)

    // Advanced: a palette.
    await mode.getByRole('button', { name: 'Advanced settings' }).click()
    await expect(tabs).toHaveText(['Info', 'Content', 'Style'])
    await tabs.filter({ hasText: 'Style' }).click()
    await sidebar.locator('.accordion-label', { hasText: 'Colors' }).click()
    const before = await rootStyle(page)
    const card = sidebar.locator('.palette-card').nth(2)
    await expect(card).not.toHaveClass(/palette-card--active/)
    await card.click()
    await expect(card).toHaveClass(/palette-card--active/)
    const styled = await rootStyle(page)
    expect(styled).not.toBe(before)

    // Back to quick start: the Style tab goes, the palette and the names stay.
    await mode.getByRole('button', { name: 'Quick start' }).click()
    await expect(tabs).toHaveText(['Info', 'Content'])
    expect(await rootStyle(page)).toBe(styled)
    await tabs.filter({ hasText: 'Info' }).click()
    await expect(bride).toHaveValue('Ема')

    // And advanced again: the same palette is still the chosen one.
    await mode.getByRole('button', { name: 'Advanced settings' }).click()
    await tabs.filter({ hasText: 'Style' }).click()
    await sidebar.locator('.accordion-label', { hasText: 'Colors' }).click()
    await expect(sidebar.locator('.palette-card--active')).toHaveCount(1)
    await expect(card).toHaveClass(/palette-card--active/)
    expect(await rootStyle(page)).toBe(styled)

    // The choice of mode is remembered on reload.
    await page.reload()
    await expect(page.locator('aside.edit-sidebar').getByTestId('editor-mode').getByRole('button', { name: 'Advanced settings' }))
      .toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('desktop, entry overlay', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('"Edit entry" from quick start opens the entry settings in the advanced settings', async ({ page }) => {
    await asGuestInEditor(page)
    const sidebar = page.locator('aside.edit-sidebar')
    await expect(sidebar.getByTestId('editor-mode').getByRole('button', { name: 'Quick start' })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Edit opening animation' }).click()
    await expect(sidebar.getByTestId('editor-mode').getByRole('button', { name: 'Advanced settings' })).toHaveAttribute('aria-pressed', 'true')
    await expect(sidebar.locator('.accordion-header--active')).toContainText('Opening animation')
    await expect(page.getByRole('status').filter({ hasText: 'Advanced settings turned on: Opening animation.' })).toHaveCount(1)
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('same grouping in the sheet; sections open, styles stay when going back to quick start', async ({ page }) => {
    await asGuestInEditor(page)
    await page.getByText('Tap to open').click({ force: true })
    await page.getByRole('button', { name: 'Customize' }).click()

    const sheet = page.locator('.mobile-sheet')
    const tabs = sheet.locator('.mobile-tab-btn')
    await expect(sheet.getByTestId('editor-mode').getByRole('button', { name: 'Quick start' })).toHaveAttribute('aria-pressed', 'true')
    await expect(tabs).toHaveText(['Info', 'Content'])

    // A content section opens with its form (RSVP).
    await tabs.filter({ hasText: 'Content' }).click()
    await sheet.locator('.mobile-sheet__item[data-section="rsvp"]').click()
    await expect(page.locator('[data-rsvp-field="deadline"]')).toBeVisible()
    await page.getByRole('dialog').locator('.ivy-modal__close').click()
    await expect(page.locator('[data-rsvp-field="deadline"]')).toHaveCount(0)

    // Advanced: colours open inside the sheet.
    await page.getByRole('button', { name: 'Customize' }).click()
    await sheet.getByTestId('editor-mode').getByRole('button', { name: 'Advanced settings' }).click()
    await expect(tabs).toHaveText(['Info', 'Content', 'Style'])
    await tabs.filter({ hasText: 'Style' }).click()
    await sheet.locator('.mobile-sheet__item[data-section="colors"]').click()
    const panel = sheet.getByTestId('mobile-sheet-panel')
    const card = panel.locator('.palette-card').nth(2)
    await expect(card).not.toHaveClass(/palette-card--active/)
    await card.click()
    await expect(card).toHaveClass(/palette-card--active/)
    const styled = await rootStyle(page)
    await sheet.getByTestId('mobile-panel-back').click()

    await sheet.getByTestId('editor-mode').getByRole('button', { name: 'Quick start' }).click()
    await expect(tabs).toHaveText(['Info', 'Content'])
    expect(await rootStyle(page)).toBe(styled)

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
  })
})
