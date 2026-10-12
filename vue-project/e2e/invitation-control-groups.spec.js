import { test, expect } from '@playwright/test'

/**
 * INV-501 — basic and advanced controls.
 *
 * The editor groups its controls by task, the same on the desktop and on a
 * phone: Info, Content (the invitation's sections, then guest replies / RSVP)
 * and Preview as guest are the basics; the opening animation, colours and
 * fonts sit apart in the advanced Style tab. A basic invitation is made
 * without ever opening the advanced settings, and the advanced values are
 * kept while they are hidden.
 */

const DRAFT = {
  eventDetails: [], agenda: [], ourStory: [],
  theme: {
    info: { brideName: 'Ана', groomName: 'Марко', weddingDateTime: '2099-06-12T17:30:00', eventTimezone: 'Europe/Skopje', venue: 'Охрид', location: '' },
    rsvpConfig: { deadline: '', maxGuests: 3, showDietary: false, borderRadius: '8px' },
  },
}

async function stubApi(page) {
  await page.route('**/v1/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) }))
  await page.route('**/public/invitation-templates/category/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
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
  await stubApi(page)
  await page.goto(`/${lang}/invitations/coastal-breeze?new=1&edit=true`)
}

const groupsOf = (root, groupSel, titleSel, itemSel) => root.locator(groupSel).evaluateAll((groups, [titleSel, itemSel]) =>
  groups.map((g) => [g.querySelector(titleSel).textContent.trim().replace(/\s+/g, ' '),
    [...g.querySelectorAll(itemSel)].map((i) => i.textContent.trim())]), [titleSel, itemSel])

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('a basic invitation without the advanced settings; the style controls are grouped apart', async ({ page }) => {
    await asGuestInEditor(page)
    const sidebar = page.locator('aside.edit-sidebar')
    const mode = sidebar.getByTestId('editor-mode')
    const tabs = sidebar.locator('.edit-sidebar__tabs .tab-btn')
    await expect(mode.getByRole('button', { name: 'Quick start' })).toHaveAttribute('aria-pressed', 'true')
    await expect(tabs).toHaveText(['Info', 'Content'])

    // Info.
    await sidebar.locator('[data-info-field="brideName"]').fill('Ема')

    // Content: the sections, then guest replies — named groups, nothing advanced.
    await tabs.filter({ hasText: 'Content' }).click()
    const sidebarGroups = () => groupsOf(sidebar, '.control-group', '.control-group__title', '.accordion-label')
    expect(await sidebarGroups()).toEqual([
      ['Invitation sections', ['Cover photo', 'Event details', 'Programme', 'Our story', 'Story photos']],
      ['Guest replies', ['RSVP']],
    ])
    await expect(sidebar.getByRole('group', { name: 'Guest replies' })).toBeVisible()

    // RSVP deadline.
    await sidebar.locator('.accordion-label').filter({ hasText: 'RSVP' }).click()
    const deadline = sidebar.locator('[data-rsvp-field="deadline"] input[type="text"]')
    await deadline.fill('20/05/2099')
    await deadline.blur()
    await expect(page.locator('#rsvp-section .rsvp-subtitle')).toHaveText('Please respond by May 20, 2099')

    // Saved to the draft — all without the advanced settings.
    await expect.poll(async () => {
      const draft = JSON.parse(await page.evaluate(() => localStorage.getItem('invitation_draft_v1')))
      return [draft?.theme?.info?.brideName, draft?.theme?.rsvpConfig?.deadline]
    }).toEqual(['Ема', '2099-05-20'])

    // Preview as guest, and back.
    await page.getByTestId('preview-as-guest').click()
    await expect(page).toHaveURL(/preview=1/)
    await expect(page.locator('.hero-names, .couple-names').first()).toContainText('Ема')
    await page.getByTestId('preview-back-to-editor').click()
    await expect(page).toHaveURL(/edit=true/)
    await expect(page.locator('aside.edit-sidebar').getByTestId('editor-mode').getByRole('button', { name: 'Quick start' }))
      .toHaveAttribute('aria-pressed', 'true')

    // Advanced: Content is the same; the style controls are in Style, marked "Advanced".
    await mode.getByRole('button', { name: 'Advanced settings' }).click()
    await expect(tabs).toHaveText(['Info', 'Content', 'Style'])
    await tabs.filter({ hasText: 'Content' }).click()
    expect((await sidebarGroups()).map(([title]) => title)).toEqual(['Invitation sections', 'Guest replies'])
    await tabs.filter({ hasText: 'Style' }).click()
    expect(await sidebarGroups()).toEqual([
      ['Animation Advanced', ['Opening animation', 'Collage photos']],
      ['Colors and fonts Advanced', ['Colors', 'Fonts']],
    ])
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('the sheet has the same groups, labels and order; Preview as guest is in it', async ({ page }) => {
    await asGuestInEditor(page, 'mk')
    await page.getByText(/Допрете|Tap to open/).first().click({ force: true })
    await page.getByRole('button', { name: 'Прилагоди' }).click()
    const sheet = page.locator('.mobile-sheet')
    const tabs = sheet.locator('.mobile-tab-btn')
    await expect(tabs).toHaveText(['Инфо', 'Содржина'])
    await tabs.filter({ hasText: 'Содржина' }).click()
    const sheetGroups = () => groupsOf(sheet, '.mobile-sheet__group', '.mobile-sheet__group-title', '.mobile-sheet__label')
    expect(await sheetGroups()).toEqual([
      ['Делови на поканата', ['Насловна фотографија', 'Детали за настанот', 'Програма', 'Нашата приказна', 'Фотографии за приказната']],
      ['Одговори од гостите', ['RSVP']],
    ])

    // Show/hide here too, said in words.
    const toggle = sheet.getByRole('switch', { name: 'Прикажи „Програма“ на поканата' })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await expect(sheet.locator('[data-section="agendaList"]')).toContainText('Скриено')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'true')

    await sheet.getByTestId('editor-mode').getByRole('button', { name: 'Напредни поставки' }).click()
    await expect(tabs).toHaveText(['Инфо', 'Содржина', 'Стил'])
    await tabs.filter({ hasText: 'Стил' }).click()
    expect(await sheetGroups()).toEqual([
      ['Анимација Напредно', ['Воведна анимација', 'Фотографии за колажот']],
      ['Бои и фонтови Напредно', ['Бои', 'Фонтови']],
    ])

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)

    // Preview as guest from the sheet.
    await sheet.getByTestId('sheet-preview-as-guest').click()
    await expect(page).toHaveURL(/preview=1/)
    await expect(page.getByTestId('draft-preview-bar')).toBeVisible()
  })
})
