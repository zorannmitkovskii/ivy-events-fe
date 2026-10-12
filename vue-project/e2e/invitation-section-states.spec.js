import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * INV-402 — empty, skipped, hidden and unread sections in the editor.
 *
 * An existing event whose programme could not be read never saves over it
 * (the PUT is a full replacement — an empty list would erase the programme):
 * the panel says so with "Try again", the save status says saving is held
 * back, and once the programme is read the change is saved with it. A design's
 * example changed in an existing event becomes a real entry. An empty
 * optional section explains itself, offers one way to add the first entry and
 * a way to skip it; hiding keeps the entries, and the guest preview has no
 * empty block.
 */

const USER = '44444444-4444-4444-4444-444444444444'
const EVENT = '77777777-7777-7777-7777-777777777777'

const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

async function stubApi(page) {
  await page.route('**/v1/api/**', (route) => route.fulfill(json({ success: true, data: null })))
  await page.route('**/public/invitation-templates/category/**', (route) => route.fulfill(json([])))
}

async function openExistingEvent(page, { agenda }) {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  const puts = []
  await stubApi(page)
  await page.route('**/public/invitation-page/**', (route) => route.fulfill(json({
    event: { coupleNames: { bride: 'Сервер', groom: 'Копија' }, eventCategory: 'WEDDING', timezone: 'Europe/Skopje' },
    agenda: [{ id: 'a-1', agendaType: 'CEREMONY', time: '17:00' }],
    ourStory: [], weddingDetails: [], ourStoryImages: [], collageImages: [],
  })))
  await page.route('**/v1/api/agendas?**', (route) => (route.request().method() === 'GET' ? agenda(route) : route.fallback()))
  await page.route(`**/v1/api/events/full/${EVENT}`, (route) => {
    puts.push(route.request().postDataBuffer()?.toString('utf8') || '')
    return route.fulfill(json({ success: true, data: { event: { id: EVENT }, eventDetails: [], agendas: [], ourStories: [] } }))
  })
  await signIn(page, { userId: USER, eventId: EVENT, lang: 'en', roles: ['USER'] })
  await page.goto(`/en/invitations/coastal-breeze?edit=true&eventId=${EVENT}`)
  return puts
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('a programme that could not be read is not saved over; "Try again" reads it, then saves', async ({ page }) => {
    let agendaFails = true
    const puts = await openExistingEvent(page, {
      agenda: (route) => (agendaFails
        ? route.fulfill(json({ message: 'boom' }, 500))
        : route.fulfill(json([{ id: 'a-1', type: 'CEREMONY', time: '17:00' }]))),
    })
    const sidebar = page.locator('aside.edit-sidebar')
    await expect(sidebar.locator('[data-info-field="brideName"]')).toHaveValue('Сервер')

    await sidebar.locator('.edit-sidebar__tabs .tab-btn').filter({ hasText: 'Content' }).click()
    await sidebar.locator('.accordion-label').filter({ hasText: 'Programme' }).click()
    const alert = sidebar.getByRole('alert')
    await expect(alert).toContainText("We couldn't load: Programme")
    await expect(alert).toContainText('Saving is paused')
    // Nothing to edit, and no design examples standing in for the programme.
    await expect(sidebar.getByTestId('example-badge')).toHaveCount(0)

    await sidebar.locator('.edit-sidebar__tabs .tab-btn').filter({ hasText: 'Info' }).click()
    await sidebar.locator('[data-info-field="brideName"]').fill('Ема')
    const status = page.getByTestId('save-status').first()
    await expect(status).toHaveAttribute('data-status', 'error', { timeout: 8000 })
    await expect(status).toContainText("part of the invitation couldn't be loaded")
    // Without the fix this PUT carried "agendas":[] and erased the programme.
    expect(puts).toHaveLength(0)

    agendaFails = false
    await status.getByRole('button', { name: 'Load again' }).click()
    await expect(status).toHaveAttribute('data-status', 'synced', { timeout: 8000 })
    expect(puts).toHaveLength(1)
    expect(puts[0]).toContain('Ема')
    expect(puts[0]).toContain('"agendas":[{"id":"a-1","type":"CEREMONY","time":"17:00"')

    await sidebar.locator('.edit-sidebar__tabs .tab-btn').filter({ hasText: 'Content' }).click()
    await sidebar.locator('.accordion-label').filter({ hasText: 'Programme' }).click()
    await expect(sidebar.getByRole('alert')).toHaveCount(0)
    await expect(sidebar.locator('.item-card')).toHaveCount(1)
  })

  test("an existing event's example, once changed, is created as a real entry", async ({ page }) => {
    const posts = []
    await openExistingEvent(page, { agenda: (route) => route.fulfill(json([])) })
    await page.route('**/v1/api/agendas', (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      const body = route.request().postDataJSON()
      posts.push(body)
      return route.fulfill(json({ id: 'a-new', ...body }))
    })
    const sidebar = page.locator('aside.edit-sidebar')
    await sidebar.locator('.edit-sidebar__tabs .tab-btn').filter({ hasText: 'Content' }).click()
    await sidebar.locator('.accordion-label').filter({ hasText: 'Programme' }).click()
    await expect(sidebar.getByTestId('example-badge')).toHaveCount(6)
    // Only examples: the section is still empty for the guests.
    await expect(sidebar.getByTestId('section-state')).toHaveAttribute('data-state', 'empty')

    await sidebar.locator('.item-card-header').nth(3).click()
    await sidebar.locator('.item-card-body select').nth(1).selectOption('17')
    await expect(sidebar.getByTestId('example-badge')).toHaveCount(5)
    expect(posts).toEqual([expect.objectContaining({ type: 'CEREMONY', time: '17:00', eventId: EVENT })])
    // The entry stays open and the next change goes to it, not to a new one.
    await sidebar.locator('.item-card-body select').nth(2).selectOption('30')
    await expect(sidebar.locator('.item-card').nth(3)).toBeVisible()
    expect(posts).toHaveLength(1)
    await expect(sidebar.getByTestId('section-state')).toHaveCount(0)
  })

  test('an empty optional section: explanation, add the first entry, skip; hiding keeps entries; guest preview has no empty block', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return
      sessionStorage.setItem('seeded', '1')
      localStorage.setItem('cookie_consent', 'rejected')
      localStorage.setItem('lang', 'en')
      localStorage.setItem('onboarding_state_v1', JSON.stringify({
        selectedCategory: 'WEDDING', invitationName: 't-coastal', invitationPath: 'invitations/coastal-breeze',
        eventDetails: { brideName: 'Ана', groomName: 'Марко', date: '2099-06-12', time: '17:30', timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' } },
      }))
      // The person emptied the story earlier; the programme has one entry.
      localStorage.setItem('invitation_draft_v1', JSON.stringify({
        eventDetails: [],
        agenda: [{ _localId: '_local_a1', type: 'CEREMONY', time: '17:30' }],
        ourStory: [],
        seeded: { eventDetails: true, agenda: true, ourStory: true },
        theme: { info: { brideName: 'Ана', groomName: 'Марко', weddingDateTime: '2099-06-12T17:30:00', eventTimezone: 'Europe/Skopje', venue: 'Охрид', location: '' } },
        updatedAt: new Date().toISOString(),
      }))
    })
    await stubApi(page)
    await page.goto('/en/invitations/coastal-breeze?new=1&edit=true')

    const sidebar = page.locator('aside.edit-sidebar')
    await sidebar.locator('.edit-sidebar__tabs .tab-btn').filter({ hasText: 'Content' }).click()
    await sidebar.locator('.accordion-label').filter({ hasText: 'Our story' }).click()
    const state = sidebar.getByTestId('section-state')
    await expect(state).toHaveAttribute('data-state', 'empty')
    await expect(state).toContainText('No story yet')
    await expect(state).toContainText("guests won't see it")
    await expect(sidebar.getByRole('button', { name: 'Add the first chapter' })).toBeVisible()
    // The editor preview says the section is empty; nothing from the design.
    // (behind the opening envelope until it is opened, hence attached, not visible)
    await expect(page.locator('[data-edit-section="ourStoryList"] [data-testid="preview-empty-hint"]')).toHaveCount(1)

    // Skip: hidden, said in words, focus on the way back.
    await sidebar.getByRole('button', { name: 'Skip — hide this section' }).click()
    await expect(sidebar.getByTestId('section-show')).toBeFocused()
    await expect(sidebar.getByTestId('section-hidden-badge')).toHaveText('Hidden')
    await expect(sidebar.getByRole('switch', { name: 'Show “Our story” on the invitation' })).toHaveAttribute('aria-checked', 'false')
    await expect(page.locator('[data-edit-section="ourStoryList"]')).toHaveCount(0)
    await sidebar.getByTestId('section-show').click()
    await expect(page.locator('[data-edit-section="ourStoryList"]')).toHaveCount(1)

    // Hiding the programme keeps its entry; showing it again brings it back.
    await sidebar.locator('.accordion-label').filter({ hasText: 'Programme' }).click()
    const agendaPanel = sidebar.locator('.accordion-section').filter({ has: page.locator('.accordion-label', { hasText: 'Programme' }) })
    await agendaPanel.getByRole('switch', { name: 'Show “Programme” on the invitation' }).click()
    await expect(agendaPanel.getByTestId('section-state')).toHaveAttribute('data-state', 'hidden')
    await expect(agendaPanel.locator('.item-card')).toHaveCount(1)
    await expect(page.locator('[data-edit-section="agendaList"]')).toHaveCount(0)
    let saved = JSON.parse(await page.evaluate(() => localStorage.getItem('invitation_draft_v1')))
    expect(saved.agenda).toEqual([expect.objectContaining({ type: 'CEREMONY', time: '17:30' })])
    await agendaPanel.getByTestId('section-show').click()
    await expect(page.locator('[data-edit-section="agendaList"]')).toContainText('17:30')

    // Reopening does not refill the emptied story with the design's examples.
    await page.reload()
    await sidebar.locator('.edit-sidebar__tabs .tab-btn').filter({ hasText: 'Content' }).click()
    await sidebar.locator('.accordion-label').filter({ hasText: 'Our story' }).click()
    await expect(sidebar.getByTestId('section-state')).toHaveAttribute('data-state', 'empty')
    saved = JSON.parse(await page.evaluate(() => localStorage.getItem('invitation_draft_v1')))
    expect(saved.ourStory).toEqual([])

    // The guest preview: no story block at all.
    await page.getByTestId('preview-as-guest').click()
    await expect(page).toHaveURL(/preview=1/)
    await expect(page.locator('[data-edit-section="hero"]')).toHaveCount(1)
    await expect(page.locator('[data-edit-section="ourStoryList"]')).toHaveCount(0)
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('the empty programme in the Customize sheet, in Macedonian; no horizontal scroll', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return
      sessionStorage.setItem('seeded', '1')
      localStorage.setItem('cookie_consent', 'rejected')
      localStorage.setItem('lang', 'mk')
      localStorage.setItem('onboarding_state_v1', JSON.stringify({
        selectedCategory: 'WEDDING', invitationName: 't-coastal', invitationPath: 'invitations/coastal-breeze',
        eventDetails: { brideName: 'Ана', groomName: 'Марко', date: '2099-06-12', time: '17:30', timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' } },
      }))
      localStorage.setItem('invitation_draft_v1', JSON.stringify({
        eventDetails: [], agenda: [], ourStory: [],
        seeded: { eventDetails: true, agenda: true, ourStory: true },
        theme: { info: { brideName: 'Ана', groomName: 'Марко', weddingDateTime: '2099-06-12T17:30:00', eventTimezone: 'Europe/Skopje', venue: 'Охрид', location: '' } },
        updatedAt: new Date().toISOString(),
      }))
    })
    await stubApi(page)
    await page.goto('/mk/invitations/coastal-breeze?new=1&edit=true')
    await page.getByText('Допрете за отворање').click({ force: true })
    await page.getByRole('button', { name: 'Прилагоди' }).click()
    const sheet = page.locator('.mobile-sheet')
    await sheet.locator('.mobile-tab-btn').filter({ hasText: 'Содржина' }).click()
    await sheet.locator('.mobile-sheet__item[data-section="agendaList"]').click()

    const state = page.getByTestId('section-state').first()
    await expect(state).toContainText('Сè уште нема програма')
    await expect(page.getByRole('button', { name: 'Додај прва ставка во програмата' })).toBeVisible()
    await page.getByRole('button', { name: 'Прескокни — сокриј го делот' }).click()
    await expect(page.getByTestId('section-state').first()).toContainText('Овој дел е скриен')

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
