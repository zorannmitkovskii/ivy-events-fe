import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * INV-602 — the final preview as a guest.
 *
 * The editor's "Preview as guest" shows the invitation without any editor
 * control, in a phone or computer view, on the public or private link, with
 * the RSVP form as guests get it (a reply here is never sent). Notes say what
 * guests will not see or what is still an example, and each note's "Edit"
 * goes back to the exact place in the editor — the same page, so nothing
 * typed is lost.
 */

const USER = '55555555-5555-5555-5555-555555555555'
const EVENT = '66666666-6666-6666-6666-666666666666'
const LONG_NAME = 'Александра-Магдалена Петровска-Стојановска-Димитриевска'
const LONG_STORY = 'Се запознавме на една долга, долга летна вечер покрај езерото. '.repeat(12) + 'Безкрајнодолгозборбезпразнинидаседелиналинииииииииииииииииииииииии'

const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

async function stubApi(page) {
  await page.route('**/v1/api/**', (route) => route.fulfill(json({ success: true, data: null })))
  await page.route('**/public/invitation-templates/category/**', (route) => route.fulfill(json([])))
}

/** Every RSVP the page tries to send. */
function rsvpPosts(page) {
  const sent = []
  page.on('request', (r) => {
    // rsvpService.submitRsvp → POST /public/guests
    if (r.method() === 'POST' && /\/public\/guests|rsvp/i.test(r.url())) sent.push(r.url())
  })
  return sent
}

async function seedGuestDraft(page, design = 'coastal-breeze') {
  await page.addInitScript(({ design, longName, longStory }) => {
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    localStorage.setItem('cookie_consent', 'rejected')
    localStorage.setItem('lang', 'en')
    localStorage.setItem('onboarding_state_v1', JSON.stringify({
      selectedCategory: 'WEDDING', invitationName: 't-' + design, invitationPath: 'invitations/' + design,
      eventDetails: { brideName: longName, groomName: 'Марко', date: '2099-06-12', time: '17:30', timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' } },
    }))
    localStorage.setItem('invitation_draft_v1', JSON.stringify({
      eventDetails: [],
      agenda: [{ _localId: '_local_a1', type: 'CEREMONY', time: '17:30' }],
      ourStory: [{ _localId: '_local_s1', type: 'HOW_WE_MET', description: longStory, storyDate: '' }],
      seeded: { eventDetails: true, agenda: true, ourStory: true },
      theme: { info: { brideName: longName, groomName: 'Марко', weddingDateTime: '2099-06-12T17:30:00', eventTimezone: 'Europe/Skopje', venue: 'Охрид', location: '' } },
      updatedAt: new Date().toISOString(),
    }))
  }, { design, longName: LONG_NAME, longStory: LONG_STORY })
}

const frame = (page) => page.locator('.preview-frame')

async function openNotes(page) {
  const toggle = page.getByTestId('preview-notes-toggle')
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click()
  return page.getByTestId('preview-notes')
}

/** No sideways scrolling, in the page or inside the invitation's frame. */
async function noHorizontalScroll(page) {
  const sizes = await page.evaluate(() => {
    const f = document.querySelector('.preview-frame')
    return { page: document.documentElement.scrollWidth, view: window.innerWidth, frame: f.scrollWidth, frameView: f.clientWidth }
  })
  expect(sizes.page).toBeLessThanOrEqual(sizes.view)
  expect(sizes.frame).toBeLessThanOrEqual(sizes.frameView + 1)
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('read-only preview: phone and computer, notes, private link, RSVP not sent, a note back to its section', async ({ page }) => {
    await seedGuestDraft(page)
    await stubApi(page)
    const sent = rsvpPosts(page)
    await page.goto('/en/invitations/coastal-breeze?new=1&edit=true')
    const sidebar = page.locator('aside.edit-sidebar')
    await expect(sidebar.locator('[data-info-field="brideName"]')).toHaveValue(LONG_NAME)

    await sidebar.getByTestId('preview-as-guest').click()
    await expect(page).toHaveURL(/preview=1/)
    // No editor: no sidebar, no "Edit …" buttons, no save status.
    await expect(sidebar).toHaveCount(0)
    await expect(page.locator('.section-edit-btn:visible')).toHaveCount(0)
    await expect(page.getByTestId('save-status')).toHaveCount(0)
    const bar = page.getByTestId('draft-preview-bar')
    await expect(bar).toBeVisible()
    expect(await bar.evaluate((el) => !!el.closest('.preview-frame'))).toBe(false)

    // Computer view by default on a computer: the full width, not scaled.
    await expect(bar.locator('[data-device="desktop"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(frame(page)).toHaveAttribute('data-guest-scale', '1')
    await frame(page).getByText('Tap to open').click({ force: true })
    await expect(frame(page).locator('.hero-names, .couple-names').first()).toContainText('Александра')

    // The RSVP form as guests get it; a reply here goes nowhere.
    const rsvp = frame(page).locator('#rsvp-section')
    await rsvp.scrollIntoViewIfNeeded()
    await expect(rsvp.getByTestId('guest-preview-rsvp')).toContainText('a reply sent here is not saved')
    await rsvp.locator('input[type="text"]').first().fill('Гостин')
    await rsvp.getByText('Joyfully Accept').click()
    await rsvp.getByRole('button', { name: 'Send RSVP' }).click()
    await page.waitForTimeout(300)
    expect(sent).toEqual([])

    // The notes: the programme is only on the private link; the photos are examples.
    const notes = await openNotes(page)
    await expect(notes.locator('[data-section="agendaList"]')).toContainText('only to guests with the private link')
    await expect(notes.locator('[data-section="hero"]')).toContainText('Example')
    await expect(frame(page).locator('[data-edit-section="agendaList"]')).toHaveCount(0)
    await notes.getByTestId('preview-note-private').click()
    await expect(page).toHaveURL(/isPrivate=true/)
    await expect(bar.locator('[data-link="private"]')).toHaveAttribute('aria-pressed', 'true')
    const programme = frame(page).locator('[data-edit-section="agendaList"]')
    await expect(programme).toHaveCount(1)
    // Drawn only now, and still revealed when scrolled to (not left invisible).
    await programme.scrollIntoViewIfNeeded()
    await expect(programme).toHaveCSS('opacity', '1')
    await expect(notes.locator('[data-section="agendaList"]')).toHaveCount(0)

    // Phone: the invitation at 390px in a phone frame; long texts stay inside it.
    await bar.locator('[data-device="mobile"]').click()
    await expect(bar.locator('[data-device="mobile"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(frame(page)).toHaveAttribute('data-guest-device', 'mobile')
    await expect.poll(() => frame(page).locator('.unified-invitation').evaluate((el) => el.clientWidth)).toBe(390)
    await noHorizontalScroll(page)
    await page.screenshot({ path: 'C:/Users/techl/AppData/Local/Temp/claude/C--Projcets-ZM/17a780c3-35a7-45d6-9961-af0c146a2596/scratchpad/inv602-desktop-phone.png' })

    // Hide the story in the editor first, to follow its note back.
    await bar.getByTestId('preview-back-to-editor').click()
    await expect(page).toHaveURL(/edit=true/)
    await expect(page).not.toHaveURL(/isPrivate/)
    await expect(sidebar.locator('[data-info-field="brideName"]')).toHaveValue(LONG_NAME)
    await sidebar.locator('.edit-sidebar__tabs .tab-btn').filter({ hasText: 'Content' }).click()
    await sidebar.locator('[data-section-toggle="ourStoryList"], [role="switch"][aria-label*="Our story"]').first().click()
    await sidebar.getByTestId('preview-as-guest').click()

    const notes2 = await openNotes(page)
    const storyNote = notes2.locator('[data-section="ourStoryList"]')
    await expect(storyNote).toContainText('Hidden')
    await expect(storyNote).toContainText('guests won\'t see it')
    await expect(frame(page).locator('[data-edit-section="ourStoryList"]')).toHaveCount(0)
    await storyNote.getByRole('button', { name: 'Open “Our story” in the editor' }).click()

    await expect(page).toHaveURL(/edit=true/)
    await expect(sidebar.locator('#edit-sidebar-trigger-ourStoryList')).toBeFocused()
    await expect(sidebar.locator('#edit-sidebar-trigger-ourStoryList')).toHaveAttribute('aria-expanded', 'true')
    await expect(sidebar.getByTestId('section-state')).toHaveAttribute('data-state', 'hidden')
    // The draft is as it was: the name and the story are still there.
    const draft = JSON.parse(await page.evaluate(() => localStorage.getItem('invitation_draft_v1')))
    expect(draft.theme.info.brideName).toBe(LONG_NAME)
    expect(draft.ourStory[0].description).toContain('долга летна вечер')
  })

  test('an existing event with the RSVP form switched off: the note leads to it, showing it brings the form back', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
    await stubApi(page)
    const sent = rsvpPosts(page)
    await page.route('**/public/invitation-page/**', (route) => route.fulfill(json({
      event: { coupleNames: { bride: 'Ана', groom: 'Марко' }, eventCategory: 'WEDDING', timezone: 'Europe/Skopje', status: 'ACTIVE', startDate: Date.UTC(2099, 5, 12, 15, 30) },
      location: { venueName: 'Охрид' },
      agenda: [], ourStory: [], weddingDetails: [], ourStoryImages: [], collageImages: [],
      sectionOrder: { entry: 0, hero: 1, details: 2, agendaList: 3, ourStoryList: 4, rsvp: 5 },
      sectionVisibility: { rsvp: false },
    })))
    await page.route(`**/v1/api/events/full/${EVENT}`, (route) =>
      route.fulfill(json({ success: true, data: { event: { id: EVENT }, eventDetails: [], agendas: [], ourStories: [] } })))
    await signIn(page, { userId: USER, eventId: EVENT, lang: 'en', roles: ['USER'] })
    await page.goto(`/en/invitations/coastal-breeze?edit=true&eventId=${EVENT}`)
    const sidebar = page.locator('aside.edit-sidebar')
    await expect(sidebar.locator('[data-info-field="brideName"]')).toHaveValue('Ана')

    await sidebar.getByTestId('preview-as-guest').click()
    await expect(page).toHaveURL(/preview=1/)
    await expect(frame(page).locator('#rsvp-section')).toHaveCount(0)
    const notes = await openNotes(page)
    const rsvpNote = notes.locator('[data-section="rsvp"]')
    await expect(rsvpNote).toContainText('The RSVP form is switched off')
    // The empty programme of an existing event: the editor's examples are not drawn here.
    await expect(notes.locator('[data-section="agendaList"]')).toContainText('is empty')
    await rsvpNote.getByTestId('preview-note-edit').click()

    await expect(page).toHaveURL(/edit=true/)
    await expect(sidebar.locator('#edit-sidebar-trigger-rsvp')).toHaveAttribute('aria-expanded', 'true')
    await sidebar.getByTestId('section-show').click()
    await sidebar.getByTestId('preview-as-guest').click()

    const rsvp = frame(page).locator('#rsvp-section')
    await expect(rsvp).toBeVisible()
    await expect((await openNotes(page)).locator('[data-section="rsvp"]')).toHaveCount(0)
    await rsvp.locator('input[type="text"]').first().fill('Гостин')
    await rsvp.getByText('Joyfully Accept').click()
    await rsvp.getByRole('button', { name: 'Send RSVP' }).click()
    await page.waitForTimeout(300)
    // A real event — before, the preview sent this reply for real.
    expect(sent).toEqual([])
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('phone view by default, computer view scaled, a photo note opens the photos in the sheet (mk)', async ({ page }) => {
    await seedGuestDraft(page, 'persian-wedding')
    await page.addInitScript(() => localStorage.setItem('lang', 'mk'))
    await stubApi(page)
    await page.goto('/mk/invitations/persian-wedding?new=1&edit=true')
    await page.getByText('Допрете за отворање').click({ force: true }).catch(() => {})
    await page.getByTestId('preview-as-guest').click()
    await expect(page).toHaveURL(/preview=1/)

    const bar = page.getByTestId('draft-preview-bar')
    await expect(bar.getByTestId('preview-back-to-editor')).toContainText('Назад кон уредување')
    await expect(bar.locator('[data-device="mobile"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(frame(page)).not.toHaveClass(/preview-frame--constrained/)
    await noHorizontalScroll(page)

    await bar.locator('[data-device="desktop"]').click()
    const scale = Number(await frame(page).getAttribute('data-guest-scale'))
    expect(scale).toBeGreaterThan(0.25)
    expect(scale).toBeLessThan(0.35)
    expect((await frame(page).boundingBox()).width).toBeLessThanOrEqual(390)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    await bar.locator('[data-device="mobile"]').click()

    const notes = await openNotes(page)
    await expect(notes.locator('[data-section="ourStoryImages"]')).toContainText('Пример')
    await page.screenshot({ path: 'C:/Users/techl/AppData/Local/Temp/claude/C--Projcets-ZM/17a780c3-35a7-45d6-9961-af0c146a2596/scratchpad/inv602-phone-notes.png' })
    await notes.locator('[data-section="ourStoryImages"]').getByTestId('preview-note-edit').click()

    await expect(page).toHaveURL(/edit=true/)
    const sheet = page.getByTestId('mobile-sheet')
    await expect(sheet).toBeVisible()
    await expect(sheet.getByTestId('mobile-sheet-panel')).toBeVisible()
    await expect(sheet.getByTestId('mobile-panel-back')).toBeFocused()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })
})
