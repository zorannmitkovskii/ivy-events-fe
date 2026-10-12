import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * INV-401 — help texts and examples in the editor.
 *
 * Location, programme, story and RSVP each say whether they are required,
 * what the guests will see, and give an example that is not a value of the
 * field and is never saved. The RSVP line in the preview follows the deadline
 * as it is entered. An existing event whose sections are empty shows the
 * design's examples marked as such, and its autosave sends none of them.
 */

const USER = '33333333-3333-3333-3333-333333333333'
const EVENT = '66666666-6666-6666-6666-666666666666'

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

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('guides for location, programme, story and RSVP; the RSVP line follows the deadline', async ({ page }) => {
    await asGuestInEditor(page)
    const sidebar = page.locator('aside.edit-sidebar')
    const tabs = sidebar.locator('.edit-sidebar__tabs .tab-btn')

    // Location: its own label, a guide that says required + an example; the
    // example is not in the field.
    const venue = sidebar.getByLabel('Venue / Location', { exact: true })
    await expect(venue).toBeVisible()
    const guideId = await venue.getAttribute('aria-describedby')
    const guide = sidebar.locator(`[id="${guideId}"]`)
    await expect(guide).toContainText('Required')
    await expect(guide).toContainText('Example:')
    await expect(guide).toContainText('Lakeside Restaurant, 12 Macedonia Quay, Ohrid')
    // The field holds the person's place, never the example.
    await expect(venue).toHaveValue('Охрид')

    // Programme and story: optional sections with an example.
    await tabs.filter({ hasText: 'Content' }).click()
    const labels = sidebar.locator('.accordion-label')
    await labels.filter({ hasText: 'Programme' }).click()
    await expect(sidebar.getByTestId('field-guide').first()).toContainText('Optional section')
    await expect(sidebar.getByTestId('field-guide').first()).toContainText('16:00 Ceremony')
    // The new invitation's starter entries are in the draft: no "not saved" badge.
    await expect(sidebar.getByTestId('example-badge')).toHaveCount(0)

    await labels.filter({ hasText: 'Our story' }).click()
    await expect(sidebar.getByTestId('field-guide').first()).toContainText('We met on the shore of Lake Ohrid')

    // RSVP: what guests will see, live with the preview.
    await labels.filter({ hasText: 'RSVP' }).click()
    const rsvpGuide = sidebar.getByTestId('field-guide').first()
    await expect(rsvpGuide).toContainText('Guests will see:')
    await expect(rsvpGuide.locator('q')).toHaveText('Please respond by May 29, 2099')
    const previewLine = page.locator('#rsvp-section .rsvp-subtitle')
    await expect(previewLine).toHaveText('Please respond by May 29, 2099')

    const deadline = sidebar.locator('[data-rsvp-field="deadline"] input[type="text"]')
    await deadline.fill('20/05/2099')
    await deadline.blur()
    await expect(previewLine).toHaveText('Please respond by May 20, 2099')
    await expect(rsvpGuide.locator('q')).toHaveText('Please respond by May 20, 2099')

    // Nothing of the guides went into the draft.
    const saved = await page.evaluate(() => localStorage.getItem('invitation_draft_v1'))
    for (const text of ['Lakeside Restaurant', 'We met on the shore of Lake Ohrid', '16:00 Ceremony']) {
      expect(saved).not.toContain(text)
    }
  })

  test('an existing event with empty sections: examples are marked and the autosave sends none', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
    const puts = []
    await stubApi(page)
    await page.route('**/public/invitation-page/**', (route) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ event: { coupleNames: { bride: 'Сервер', groom: 'Копија' }, eventCategory: 'WEDDING', timezone: 'Europe/Skopje', status: 'ACTIVE' } }),
    }))
    await page.route(`**/v1/api/events/full/${EVENT}`, (route) => {
      puts.push(route.request().postDataBuffer()?.toString('utf8') || '')
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { event: { id: EVENT }, eventDetails: [], agendas: [], ourStories: [] } }) })
    })
    await signIn(page, { userId: USER, eventId: EVENT, lang: 'en', roles: ['USER'] })
    await page.goto(`/en/invitations/coastal-breeze?edit=true&eventId=${EVENT}`)

    const sidebar = page.locator('aside.edit-sidebar')
    await expect(sidebar.locator('[data-info-field="brideName"]')).toHaveValue('Сервер')

    await sidebar.locator('.edit-sidebar__tabs .tab-btn').filter({ hasText: 'Content' }).click()
    await sidebar.locator('.accordion-label').filter({ hasText: 'Programme' }).click()
    await expect(sidebar.getByTestId('examples-note')).toContainText('only for display and are not saved')
    await expect(sidebar.getByTestId('example-badge')).toHaveCount(6)

    await sidebar.locator('.edit-sidebar__tabs .tab-btn').filter({ hasText: 'Info' }).click()
    await sidebar.locator('[data-info-field="brideName"]').fill('Ема')
    await expect(page.getByTestId('save-status').first()).toHaveAttribute('data-status', 'synced', { timeout: 8000 })

    const last = puts[puts.length - 1]
    expect(last).toContain('Ема')
    expect(last).toContain('"agendas":[]')
    expect(last).toContain('"ourStories":[]')
    expect(last).toContain('"eventDetails":[]')
    expect(last).not.toContain('FIRST_DANCE')
    expect(last).not.toContain('Случајна средба')
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('the guides in the Customize sheet, in Macedonian; no horizontal scroll', async ({ page }) => {
    await asGuestInEditor(page, 'mk')
    await page.getByText('Допрете за отворање').click({ force: true })
    await page.getByRole('button', { name: 'Прилагоди' }).click()
    const sheet = page.locator('.mobile-sheet')
    await expect(sheet.getByTestId('field-guide').first()).toContainText('Задолжително')
    await expect(sheet.getByTestId('field-guide').first()).toContainText('Пример:')

    await sheet.locator('.mobile-tab-btn').filter({ hasText: 'Содржина' }).click()
    await sheet.locator('.mobile-sheet__item[data-section="rsvp"]').click()
    await expect(page.getByTestId('field-guide').first()).toContainText('Гостите ќе видат:')

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
