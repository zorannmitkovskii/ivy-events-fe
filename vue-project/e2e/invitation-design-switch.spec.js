import { Buffer } from 'node:buffer'
import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * INV-203 — changing the design after editing has started.
 *
 * Only the look changes: the names, programme, story photos and RSVP settings
 * stay, the preview shows the new design at once, and the change is saved like
 * any other edit. Content the new design has no place for is kept and named;
 * switching back shows it again.
 */

const USER = '33333333-3333-3333-3333-333333333333'
const EVENT = '55555555-5555-5555-5555-555555555555'

const TEMPLATES = [
  { id: 't-coastal', name: 'Coastal Breeze', path: 'invitations/coastal-breeze', active: true },
  { id: 't-persian', name: 'Persian Wedding', path: 'invitations/persian-wedding', active: true },
  { id: 't-editorial', name: 'Editorial', path: 'invitations/editorial', active: true },
]

const DRAFT = {
  eventDetails: [{ _localId: '_local_d1', type: 'CHURCH', time: '15:30', eventDate: '2099-06-12' }],
  agenda: [{ _localId: '_local_a1', type: 'CEREMONY', time: '17:00', description: 'Венчавка на брегот' }],
  ourStory: [{ _localId: '_local_s1', type: 'HOW_WE_MET', description: 'Се запознавме во Охрид', storyDate: '' }],
  theme: {
    info: { brideName: 'Ана', groomName: 'Марко', weddingDateTime: '2099-06-12T17:30:00', eventTimezone: 'Europe/Skopje', venue: 'Охрид', location: '' },
    rsvpConfig: { deadline: '2099-05-30', maxGuests: 3, showDietary: false, borderRadius: '8px' },
  },
}

async function stubApi(page) {
  await page.route('**/v1/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) }))
  await page.route('**/public/invitation-templates/category/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEMPLATES) }))
}

async function asGuestInEditor(page, design = 'persian-wedding') {
  await page.addInitScript((draft) => {
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    localStorage.setItem('cookie_consent', 'rejected')
    localStorage.setItem('lang', 'en')
    localStorage.setItem('onboarding_state_v1', JSON.stringify({
      selectedCategory: 'WEDDING', invitationName: 't-persian', invitationPath: 'invitations/persian-wedding',
      eventDetails: { brideName: 'Ана', groomName: 'Марко', date: '2099-06-12', time: '17:30', timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' } },
    }))
    localStorage.setItem('invitation_draft_v1', JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }))
  }, DRAFT)
  await stubApi(page)
  await page.goto(`/en/invitations/${design}?new=1&edit=true`)
}

const draft = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('invitation_draft_v1')))
const onboarding = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('onboarding_state_v1')))

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('another design keeps the content; what it cannot show is named and comes back', async ({ page }) => {
    await asGuestInEditor(page)
    const sidebar = page.locator('aside.edit-sidebar')
    const tabs = sidebar.locator('.edit-sidebar__tabs .tab-btn')
    const root = page.locator('.unified-invitation')
    await expect(root).toHaveClass(/persian-wedding/)

    // A story photo, picked in this design (it has four story photo slots).
    await tabs.filter({ hasText: 'Content' }).click()
    await sidebar.locator('.accordion-label', { hasText: 'Story photos' }).click()
    const chooser = page.waitForEvent('filechooser')
    await sidebar.locator('.story-img-thumb').first().click()
    await (await chooser).setFiles({ name: 'us.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') })
    await expect(sidebar.locator('.story-img-badge')).toHaveCount(1)

    // The design switch in the Info tab.
    await tabs.filter({ hasText: 'Info' }).click()
    const sw = sidebar.getByTestId('design-switch')
    await expect(sw.getByTestId('design-switch-current')).toHaveText('Persian Wedding')
    await expect(sw.getByTestId('design-switch-hidden')).toHaveCount(0)
    await sw.getByTestId('design-switch-toggle').click()
    await expect(sw.getByTestId('design-switch-toggle')).toHaveAttribute('aria-expanded', 'true')
    await expect(sw.locator('[data-design="persian-wedding"]')).toHaveAttribute('aria-pressed', 'true')

    // No confirmation: nothing is lost by switching between designs.
    await sw.locator('[data-design="coastal-breeze"]').click()
    await expect(page).toHaveURL(/\/en\/invitations\/coastal-breeze\?new=1&edit=true$/)
    await expect(root).toHaveClass(/coastal-breeze/)
    await expect(sw.getByTestId('design-switch-confirm')).toHaveCount(0)
    await expect(sw.locator('[data-design="coastal-breeze"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(sw.getByRole('status')).toHaveText('Design changed to Coastal Breeze. All your content is kept.')

    // The content is all there, in the new look.
    await expect(sidebar.locator('[data-info-field="brideName"]')).toHaveValue('Ана')
    await expect(root.locator('[data-edit-section="hero"]')).toContainText('Ана')
    const programme = root.locator('[data-edit-section="agendaList"]')
    await expect(programme).toContainText('17:00')
    await expect(programme).not.toContainText('14:00')

    // This design has no story photos: kept, and said so.
    const hidden = sw.getByTestId('design-switch-hidden')
    await expect(hidden).toContainText('Saved, but not shown in this design')
    await expect(hidden.locator('[data-hidden="storyPhotos"]')).toHaveText('Story photos (1)')
    await expect(hidden).toContainText('Nothing has been deleted')

    // Saved like any other edit: the draft has the new design and every entry.
    await expect.poll(async () => (await draft(page)).fullPayload?.invitationName, { timeout: 8000 }).toBe('coastal-breeze')
    const saved = await draft(page)
    expect(saved.agenda.map((a) => a.description)).toEqual(['Венчавка на брегот'])
    expect(saved.eventDetails).toHaveLength(1)
    expect(saved.ourStory.map((s) => s.description)).toEqual(['Се запознавме во Охрид'])
    expect(saved.theme.info.brideName).toBe('Ана')
    expect(saved.theme.rsvpConfig).toMatchObject({ deadline: '2099-05-30', maxGuests: 3 })
    expect(saved.pendingFiles.story).toBe(1)
    const ob = await onboarding(page)
    expect(ob.invitationPath).toBe('invitations/coastal-breeze')
    expect(ob.invitationName).toBe('t-coastal')

    // Back to the first design: the story photo is shown again.
    await sw.locator('[data-design="persian-wedding"]').click()
    await expect(root).toHaveClass(/persian-wedding/)
    await expect(sw.getByTestId('design-switch-hidden')).toHaveCount(0)
    await tabs.filter({ hasText: 'Content' }).click()
    await sidebar.locator('.accordion-label', { hasText: 'Story photos' }).click()
    await expect(sidebar.locator('.story-img-badge')).toHaveCount(1)

    // The RSVP settings are untouched.
    await sidebar.locator('.accordion-label', { hasText: 'RSVP' }).click()
    await expect(sidebar.locator('[data-rsvp-field="deadline"] input[type="date"]')).toHaveValue('2099-05-30')
  })

  test('keyboard only', async ({ page }) => {
    await asGuestInEditor(page, 'coastal-breeze')
    const sw = page.locator('aside.edit-sidebar').getByTestId('design-switch')
    await sw.getByTestId('design-switch-toggle').focus()
    await page.keyboard.press('Enter')
    const editorial = sw.locator('[data-design="editorial"]')
    await expect(editorial).toBeVisible()
    await editorial.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.unified-invitation')).toHaveClass(/editorial/)
    await expect(editorial).toHaveAttribute('aria-pressed', 'true')
    await expect(editorial).toBeFocused()
  })

  test('an existing event: unsaved typing is not replaced by the server copy, and the save carries the design', async ({ page }) => {
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
    const bride = sidebar.locator('[data-info-field="brideName"]')
    await expect(bride).toHaveValue('Сервер')

    const sw = sidebar.getByTestId('design-switch')
    await sw.getByTestId('design-switch-toggle').click()
    await expect(sw.getByTestId('design-switch-link-note')).toContainText('links you have already sent keep opening the previous design')

    // Typed, and the design changed before the autosave went out.
    await bride.fill('Ема')
    await sw.locator('[data-design="persian-wedding"]').click()
    await expect(page).toHaveURL(new RegExp(`/en/invitations/persian-wedding\\?edit=true&eventId=${EVENT}$`))
    await expect(bride).toHaveValue('Ема')
    await expect(page.locator('.unified-invitation [data-edit-section="hero"]')).toContainText('Ема')

    await expect(page.getByTestId('save-status').first()).toHaveAttribute('data-status', 'synced', { timeout: 8000 })
    const last = puts[puts.length - 1]
    expect(last).toContain('"invitationName":"persian-wedding"')
    expect(last).toContain('Ема')
    // No photo was picked: none is sent, so the stored ones stay.
    expect(last).not.toMatch(/name="(heroImage|collageImages|ourStoryImages)"/)
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('the switch in the Customize sheet; no horizontal scroll', async ({ page }) => {
    await asGuestInEditor(page, 'coastal-breeze')
    await page.getByText('Tap to open').click({ force: true })
    await page.getByRole('button', { name: 'Customize' }).click()
    const sheet = page.locator('.mobile-sheet')
    const sw = sheet.getByTestId('design-switch')
    await expect(sw.getByTestId('design-switch-current')).toHaveText('Coastal Breeze')
    await sw.getByTestId('design-switch-toggle').click()
    await sw.locator('[data-design="persian-wedding"]').tap()
    await expect(page.locator('.unified-invitation')).toHaveClass(/persian-wedding/)
    await expect(sw.locator('[data-design="persian-wedding"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(sheet.locator('[data-info-field="brideName"]')).toHaveValue('Ана')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(390)
  })
})
