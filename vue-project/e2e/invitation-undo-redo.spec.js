import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * INV-801 — undo / redo in this visit, in a real browser.
 *
 * Undo / Redo buttons (disabled with nothing to do) and Ctrl/⌘+Z,
 * Ctrl/⌘+Shift+Z. One change is undone and redo brings it back; a new change
 * after undo drops the redo path. Undo is not a saved version: the save status
 * says "Saving…" until the server answered the PUT that carries the undone
 * state — for an entry the server had already created, that PUT replaces the
 * programme without it.
 */

const USER = '88888888-8888-8888-8888-888888888888'
const EVENT = '99999999-9999-9999-9999-999999999999'

const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

async function openExistingEvent(page) {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  const server = { puts: [], posts: [], holdPuts: false, release: [] }
  await page.route('**/v1/api/**', (route) => route.fulfill(json({ success: true, data: null })))
  await page.route('**/public/invitation-templates/category/**', (route) => route.fulfill(json([])))
  await page.route('**/public/invitation-page/**', (route) => route.fulfill(json({
    event: { coupleNames: { bride: 'Сервер', groom: 'Копија' }, eventCategory: 'WEDDING', timezone: 'Europe/Skopje' },
    agenda: [], ourStory: [], weddingDetails: [], ourStoryImages: [], collageImages: [],
  })))
  await page.route('**/v1/api/agendas?**', (route) => (route.request().method() === 'GET' ? route.fulfill(json([])) : route.fallback()))
  await page.route('**/v1/api/agendas', (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    const body = route.request().postDataJSON()
    server.posts.push(body)
    return route.fulfill(json({ id: 'a-new', ...body }))
  })
  await page.route(`**/v1/api/events/full/${EVENT}`, async (route) => {
    server.puts.push(route.request().postDataBuffer()?.toString('utf8') || '')
    if (server.holdPuts) await new Promise((resolve) => server.release.push(resolve))
    return route.fulfill(json({ success: true, data: { event: { id: EVENT }, eventDetails: [], agendas: [], ourStories: [] } }))
  })
  await signIn(page, { userId: USER, eventId: EVENT, lang: 'en', roles: ['USER'] })
  await page.goto(`/en/invitations/coastal-breeze?edit=true&eventId=${EVENT}`)
  return server
}

const status = (page) => page.getByTestId('save-status').first()

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('names: buttons and shortcuts; a new change after undo drops redo; "Saved" only after the server answered', async ({ page }) => {
    const server = await openExistingEvent(page)
    const sidebar = page.locator('aside.edit-sidebar')
    const undo = sidebar.getByTestId('history-undo')
    const redo = sidebar.getByTestId('history-redo')
    const bride = page.locator('.info-panel input.input').first()
    await expect(bride).toHaveValue('Сервер')
    // Opening the event is not a change.
    await expect(undo).toBeDisabled()
    await expect(redo).toBeDisabled()
    await expect(undo).toHaveAccessibleName('Nothing to undo')
    await expect(sidebar.getByRole('group', { name: 'Undo and redo' })).toHaveAccessibleDescription(/not a saved version/)

    await bride.fill('Ема')
    await expect(status(page)).toHaveAttribute('data-status', 'synced')
    expect(server.puts.at(-1)).toContain('"brideName":"Ема"')
    await expect(undo).toBeEnabled()
    await expect(undo).toHaveAccessibleName('Undo: Names')
    await page.screenshot({ path: 'C:/Users/techl/AppData/Local/Temp/claude/C--Projcets-ZM/17a780c3-35a7-45d6-9961-af0c146a2596/scratchpad/inv801-desktop-1400.png' })

    // Undo: the earlier name, saved like any change — "Saving…" until the PUT is answered.
    server.holdPuts = true
    await undo.click()
    await expect(bride).toHaveValue('Сервер')
    await expect(status(page)).toHaveAttribute('data-status', 'saving')
    await expect(page.getByTestId('history-status')).toHaveText('Undone: Names. Saving this like any other change.')
    await expect.poll(() => server.release.length).toBe(1)
    await expect(status(page)).toHaveAttribute('data-status', 'saving')
    expect(server.puts.at(-1)).toContain('"brideName":"Сервер"')
    server.holdPuts = false
    server.release.shift()()
    await expect(status(page)).toHaveAttribute('data-status', 'synced')

    // Redo by keyboard (focus outside a text field).
    await expect(redo).toHaveAccessibleName('Redo: Names')
    await redo.focus()
    await page.keyboard.press('Control+Shift+Z')
    await expect(bride).toHaveValue('Ема')
    await page.keyboard.press('Control+z')
    await expect(bride).toHaveValue('Сервер')
    await expect(redo).toBeEnabled()

    // A new change after undo: the redo path is gone.
    await sidebar.locator('.edit-sidebar__tabs .tab-btn').filter({ hasText: 'Content' }).click()
    const programmeSwitch = sidebar.getByRole('switch', { name: 'Show “Programme” on the invitation' })
    await programmeSwitch.click()
    await expect(programmeSwitch).toHaveAttribute('aria-checked', 'false')
    await expect(redo).toBeDisabled()
    await expect(undo).toHaveAccessibleName('Undo: Shown sections')
    await undo.click()
    await expect(programmeSwitch).toHaveAttribute('aria-checked', 'true')
    await expect(status(page)).toHaveAttribute('data-status', 'synced')
    expect(server.puts.at(-1)).toContain('"showAgenda":true')
  })

  test('an entry the server already created: undo takes it out with the next PUT; redo puts it back', async ({ page }) => {
    const server = await openExistingEvent(page)
    const sidebar = page.locator('aside.edit-sidebar')
    await sidebar.locator('.edit-sidebar__tabs .tab-btn').filter({ hasText: 'Content' }).click()
    await sidebar.locator('.accordion-label').filter({ hasText: 'Programme' }).click()
    await expect(sidebar.getByTestId('example-badge')).toHaveCount(6)

    // Changing an example creates it on the server (INV-402).
    await sidebar.locator('.item-card-header').nth(3).click()
    await sidebar.locator('.item-card-body select').nth(1).selectOption('17')
    await expect(sidebar.getByTestId('example-badge')).toHaveCount(5)
    expect(server.posts).toHaveLength(1)
    await expect(status(page)).toHaveAttribute('data-status', 'synced')

    const undo = sidebar.getByTestId('history-undo')
    await expect(undo).toHaveAccessibleName('Undo: Programme')
    const putsBefore = server.puts.length
    await undo.click()
    await expect(sidebar.getByTestId('example-badge')).toHaveCount(6)
    await expect(status(page)).toHaveAttribute('data-status', 'synced')
    expect(server.puts.length).toBeGreaterThan(putsBefore)
    // The full replacement without the created entry (the examples are never sent).
    expect(server.puts.at(-1)).toContain('"agendas":[]')

    await sidebar.getByTestId('history-redo').click()
    await expect(sidebar.getByTestId('example-badge')).toHaveCount(5)
    await expect(status(page)).toHaveAttribute('data-status', 'synced')
    expect(server.puts.at(-1)).toContain('"agendas":[{"id":"a-new","type":"CEREMONY","time":"17:00"')
    // Undo and redo themselves never create on the server.
    expect(server.posts).toHaveLength(1)
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('Macedonian: undo / redo with the floating buttons and in the sheet; no horizontal scroll', async ({ page }) => {
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
        eventDetails: [], agenda: [{ _localId: '_local_a1', type: 'CEREMONY', time: '17:30' }], ourStory: [],
        seeded: { eventDetails: true, agenda: true, ourStory: true },
        theme: { info: { brideName: 'Ана', groomName: 'Марко', weddingDateTime: '2099-06-12T17:30:00', eventTimezone: 'Europe/Skopje', venue: 'Охрид', location: '' } },
        updatedAt: new Date().toISOString(),
      }))
    })
    await page.route('**/v1/api/**', (route) => route.fulfill(json({ success: true, data: null })))
    await page.route('**/public/invitation-templates/category/**', (route) => route.fulfill(json([])))
    await page.goto('/mk/invitations/coastal-breeze?new=1&edit=true')
    await page.getByText('Допрете за отворање').click({ force: true })

    const pill = page.locator('.mobile-history')
    await expect(pill.getByTestId('history-undo')).toBeDisabled()
    await expect(pill.getByTestId('history-undo')).toHaveAccessibleName('Нема што да се поништи')

    await page.getByRole('button', { name: 'Прилагоди' }).click()
    const sheet = page.locator('.mobile-sheet')
    await sheet.locator('.mobile-tab-btn').filter({ hasText: 'Содржина' }).click()
    const toggle = sheet.getByRole('switch', { name: 'Прикажи „Програма“ на поканата' })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    const sheetUndo = sheet.getByTestId('history-undo')
    await expect(sheetUndo).toHaveAccessibleName('Поништи: Прикажани делови')
    await sheetUndo.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('history-status')).toContainText('Поништено: Прикажани делови.')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)

    // The floating buttons: big enough to tap, inside the screen.
    const undo = pill.getByTestId('history-undo')
    const redo = pill.getByTestId('history-redo')
    for (const b of [undo, redo]) {
      const box = await b.boundingBox()
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.x + box.width).toBeLessThanOrEqual(390)
    }
    await undo.tap()
    await expect(page.locator('[data-edit-section="agendaList"]')).toContainText('17:30')
    // Written to this device like any change (after the autosave pause).
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('invitation_draft_v1'))?.sectionState?.visibility?.agendaList !== false))
      .toBe(true)
    await expect(status(page)).toHaveAttribute('data-status', 'local')
    await expect(redo).toHaveAccessibleName('Повтори: Прикажани делови')
    await redo.tap()
    await expect(page.locator('[data-edit-section="agendaList"]')).toHaveCount(0)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    await page.screenshot({ path: 'C:/Users/techl/AppData/Local/Temp/claude/C--Projcets-ZM/17a780c3-35a7-45d6-9961-af0c146a2596/scratchpad/inv801-phone-390.png' })
  })
})
