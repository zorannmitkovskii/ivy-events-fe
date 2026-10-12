import { test, expect } from '@playwright/test'

/**
 * INV-503 — keyboard and screen reader support in the invitation editor.
 *
 * Done with the keyboard alone: the tabs answer the arrows, sections open from
 * real buttons and close with Escape (focus back on their header), the
 * phone's sheet and section dialogs close with Escape and give the focus back
 * to "Customize", states are pressed/ticked/said in words, a wrong colour code
 * is explained next to its field, and low-contrast custom colours are flagged.
 * No axe package in the project: the checks are explicit DOM/ARIA assertions.
 */

const DRAFT = {
  eventDetails: [], agenda: [], ourStory: [],
  theme: {
    info: { brideName: 'Ана', groomName: 'Марко', weddingDateTime: '2099-06-12T17:30:00', eventTimezone: 'Europe/Skopje', venue: 'Охрид', location: '' },
    rsvpConfig: { deadline: '', maxGuests: 3, showDietary: false, borderRadius: '8px' },
  },
}

async function asGuestInEditor(page, lang = 'en') {
  await page.addInitScript(({ draft, lang }) => {
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    localStorage.setItem('cookie_consent', 'rejected')
    localStorage.setItem('lang', lang)
    localStorage.setItem('onboarding_state_v1', JSON.stringify({
      selectedCategory: 'WEDDING', invitationName: 't-coastal', invitationPath: 'invitations/coastal-breeze',
      eventDetails: { brideName: 'Ана', groomName: 'Марко', date: '2099-06-12', time: '17:30', timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' } },
    }))
    localStorage.setItem('invitation_draft_v1', JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }))
  }, { draft: DRAFT, lang })
  await page.route('**/v1/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) }))
  await page.route('**/public/invitation-templates/category/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await page.goto(`/${lang}/invitations/coastal-breeze?new=1&edit=true`)
}

const focused = (page) => page.evaluate(() => {
  const el = document.activeElement
  return {
    trigger: el?.dataset?.sectionTrigger || null,
    tab: el?.dataset?.tab || null,
    testid: el?.dataset?.testid || null,
    label: el?.getAttribute('aria-label') || null,
    outline: el ? getComputedStyle(el).outlineStyle : null,
  }
})

/** Every button in `selector` has a name a screen reader can say. */
const unnamedButtons = (page, selector) => page.locator(selector).evaluate((root) =>
  [...root.querySelectorAll('button')]
    .filter((b) => !(b.getAttribute('aria-label') || b.textContent).trim() && !b.getAttribute('aria-labelledby'))
    .map((b) => b.outerHTML.slice(0, 80)))

test.describe('desktop, keyboard only', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('tabs, sections, Escape, the preview\'s edit buttons — focus stays predictable and visible', async ({ page }) => {
    await asGuestInEditor(page)
    const sidebar = page.locator('aside.edit-sidebar')
    await expect(sidebar.getByRole('tablist', { name: 'Editor tabs' })).toBeVisible()

    // Tabs: one stop, arrows select.
    await sidebar.getByRole('tab', { name: 'Info' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(sidebar.getByRole('tab', { name: 'Content' })).toHaveAttribute('aria-selected', 'true')
    expect((await focused(page)).tab).toBe('sections')
    expect((await focused(page)).outline).not.toBe('none')

    // The first Tab from the tab list goes into the panel: the first section's button.
    await page.keyboard.press('Tab')
    expect((await focused(page)).trigger).toBe('hero')

    // RSVP: Enter opens it, its field takes text, Escape closes it — focus back on its header.
    const rsvp = sidebar.locator('[data-section-trigger="rsvp"]')
    await rsvp.focus()
    await page.keyboard.press('Enter')
    await expect(rsvp).toHaveAttribute('aria-expanded', 'true')
    const deadline = sidebar.locator('[data-rsvp-field="deadline"] input[type="text"]')
    await expect(sidebar.getByLabel('RSVP Deadline')).toBeVisible()
    await deadline.focus()
    await page.keyboard.type('20/05/2099')
    await page.keyboard.press('Tab')
    await expect(page.locator('#rsvp-section .rsvp-subtitle')).toHaveText('Please respond by May 20, 2099')
    await deadline.focus()
    await page.keyboard.press('Escape')
    await expect(rsvp).toHaveAttribute('aria-expanded', 'false')
    expect((await focused(page)).trigger).toBe('rsvp')
    expect((await focused(page)).outline).not.toBe('none')

    // The visibility switch is its own stop, named, with "Hidden" in words.
    const sw = sidebar.getByRole('switch', { name: /Programme/ })
    await sw.focus()
    await page.keyboard.press('Space')
    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await expect(sidebar.locator('[data-section-trigger="agendaList"]')).toContainText('Hidden')
    await page.keyboard.press('Space')
    await expect(sw).toHaveAttribute('aria-checked', 'true')

    // "Edit programme" on the preview: the section opens and the focus is on its header.
    await page.getByText(/Tap to open/).first().click({ force: true })
    await page.getByRole('button', { name: 'Edit programme' }).focus()
    await page.keyboard.press('Enter')
    const agenda = sidebar.locator('[data-section-trigger="agendaList"]')
    await expect(agenda).toHaveAttribute('aria-expanded', 'true')
    expect((await focused(page)).trigger).toBe('agendaList')
    // A programme item opens from a button too.
    await page.keyboard.press('Tab')
    const firstToggle = sidebar.locator('.item-toggle').first()
    await firstToggle.focus()
    await page.keyboard.press('Enter')
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'true')
    await expect(sidebar.getByRole('group', { name: 'Start Time' }).first()).toBeVisible()

    // Preview widths: named and pressed.
    const devices = sidebar.getByRole('group', { name: 'Preview width' })
    await devices.getByRole('button', { name: 'Mobile' }).focus()
    await page.keyboard.press('Enter')
    await expect(devices.getByRole('button', { name: 'Mobile' })).toHaveAttribute('aria-pressed', 'true')
    await expect(devices.getByRole('button', { name: 'Desktop' })).toHaveAttribute('aria-pressed', 'false')

    expect(await unnamedButtons(page, 'aside.edit-sidebar')).toEqual([])
  })

  test('custom colours: chosen theme in words, a wrong code explained at its field, low contrast flagged', async ({ page }) => {
    await asGuestInEditor(page)
    const sidebar = page.locator('aside.edit-sidebar')
    await sidebar.getByTestId('editor-mode').getByRole('button', { name: 'Advanced settings' }).focus()
    await page.keyboard.press('Enter')
    await sidebar.getByRole('tab', { name: 'Info' }).focus()
    await page.keyboard.press('End')
    await expect(sidebar.getByRole('tab', { name: 'Style' })).toHaveAttribute('aria-selected', 'true')
    const colors = sidebar.locator('[data-section-trigger="colors"]')
    await colors.focus()
    await page.keyboard.press('Enter')

    // A theme chosen with the keyboard is pressed and says "Selected".
    const black = sidebar.locator('[data-palette="Black + Gold"]')
    await black.focus()
    await page.keyboard.press('Enter')
    await expect(black).toHaveAttribute('aria-pressed', 'true')
    await expect(black).toContainText('Selected')
    await expect(sidebar.locator('.palette-card[aria-pressed="true"]')).toHaveCount(1)
    await expect(sidebar.locator('[data-contrast]')).toHaveCount(4)
    await expect(sidebar.locator('[data-contrast][data-passes="false"]')).toHaveCount(0)

    // The text colour: a wrong code is explained and tied to the field; nothing changes.
    const textHex = sidebar.getByLabel('Text: hex code')
    await expect(sidebar.getByLabel('Text', { exact: true })).toHaveAttribute('type', 'color')
    await textHex.fill('#12')
    await page.keyboard.press('Tab')
    await expect(textHex).toHaveAttribute('aria-invalid', 'true')
    const errorId = await textHex.getAttribute('aria-describedby')
    await expect(page.locator(`[id="${errorId}"]`)).toHaveText(/Enter # and six characters/)

    // A dark text on the dark theme: unreadable, said in words with the ratio.
    await textHex.fill('#222222')
    await page.keyboard.press('Tab')
    await expect(textHex).not.toHaveAttribute('aria-invalid', 'true')
    const row = sidebar.locator('[data-contrast="textOnBackground"]')
    await expect(row).toHaveAttribute('data-passes', 'false')
    await expect(row).toContainText('low contrast')
    await expect(row).toContainText(':1')
    await expect(sidebar.getByTestId('contrast-hint')).toContainText('4.5:1')
    await expect(black).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('the sheet and a section dialog close with Escape; focus goes back to Customize (INV-103 Escape bug)', async ({ page }) => {
    await asGuestInEditor(page, 'mk')
    await page.getByText(/Допрете|Tap to open/).first().click({ force: true })
    const customize = page.getByTestId('mobile-customize')
    await customize.focus()
    await page.keyboard.press('Enter')

    const sheet = page.getByRole('dialog', { name: 'Прилагоди' })
    await expect(sheet).toBeVisible()
    expect((await focused(page)).label).toBe('Затвори')
    // Tab stays in the sheet.
    for (let i = 0; i < 4; i++) await page.keyboard.press('Shift+Tab')
    expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
    expect((await focused(page)).testid).toBe('mobile-customize')

    // Programme from the sheet: a dialog with the focus in it; Escape closes it.
    await page.keyboard.press('Enter')
    await sheet.getByRole('tab', { name: 'Инфо' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(sheet.getByRole('tab', { name: 'Содржина' })).toHaveAttribute('aria-selected', 'true')
    await sheet.locator('.mobile-sheet__item[data-section="agendaList"]').focus()
    await page.keyboard.press('Enter')
    const programme = page.getByRole('dialog', { name: 'Ставки на агенда' })
    await expect(programme).toBeVisible()
    expect(await programme.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(programme).toHaveCount(0)
    expect((await focused(page)).testid).toBe('mobile-customize')

    // The mode hint is short now: at most two lines in the sheet.
    await page.keyboard.press('Enter')
    const hint = page.locator('.mobile-sheet .editor-mode__hint')
    const lines = await hint.evaluate((el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)))
    expect(lines).toBeLessThanOrEqual(2)
    expect(await unnamedButtons(page, '.mobile-sheet')).toEqual([])

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
  })
})
