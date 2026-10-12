import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * INV-502 — unsaved changes and the exit guard, in a real browser: one
 * localized dialog (Save and exit / Discard changes / Keep editing) only when
 * leaving would lose a change; nothing after a confirmed save; browser back
 * and tab close covered (the latter best effort, the browser's own prompt).
 */

const USER = '33333333-3333-3333-3333-333333333333'
const EVENT = '55555555-5555-5555-5555-555555555555'
const EDITOR = `/invitations/coastal-breeze?edit=true&eventId=${EVENT}`

function wrapped(route, data, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ success: status < 400, message: null, data }),
  })
}

async function stubApi(page, { failSaves = 0 } = {}) {
  const state = { puts: 0, posts: 0, failuresLeft: failSaves }
  await page.route('**/v1/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/v1/api', '')
    if (path === `/events/full/${EVENT}` && request.method() === 'PUT') {
      state.puts++
      if (state.failuresLeft > 0) {
        state.failuresLeft--
        return wrapped(route, { status: 500, errorCode: 'INTERNAL', message: 'boom' }, 500)
      }
      return wrapped(route, { event: { id: EVENT }, eventDetails: [], agendas: [], ourStories: [] })
    }
    if (path === '/events/full' && request.method() === 'POST') {
      state.posts++
      return wrapped(route, { event: { id: EVENT }, eventDetails: [], agendas: [], ourStories: [] })
    }
    return wrapped(route, null)
  })
  await page.route('**/public/invitation-page/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      event: { coupleNames: { bride: 'Сервер', groom: 'Копија' }, eventCategory: 'WEDDING', timezone: 'Europe/Skopje' },
      agenda: [], ourStory: [], weddingDetails: [], ourStoryImages: [], collageImages: [],
    }),
  }))
  return state
}

const status = (page) => page.getByTestId('save-status').first()
const brideInput = (page) => page.locator('.info-panel input.input').first()
const dialog = (page) => page.getByRole('alertdialog')

/** An in-app navigation, as a link in the app would make it. */
function goInApp(page, path) {
  return page.evaluate(async (to) => {
    const router = document.querySelector("#app").__vue_app__.config.globalProperties.$router
    // The first navigation finishes with a replace; push after it.
    await router.isReady()
    router.push(to).catch(() => {})
  }, path)
}

async function setup(page, { lang = 'en', failSaves = 0 } = {}) {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  const state = await stubApi(page, { failSaves })
  await signIn(page, { userId: USER, eventId: EVENT, lang, roles: ['USER'] })
  return state
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('a failed save: Keep editing (Escape) stays, Save and exit shows the failure, Discard leaves and drops the device copy', async ({ page }) => {
    const state = await setup(page, { failSaves: 99 })
    await page.goto(`/en${EDITOR}`)
    await expect(brideInput(page)).toBeVisible()

    await brideInput(page).fill('Ана')
    await expect(status(page)).toHaveAttribute('data-status', 'error')

    await goInApp(page, '/en/event-category')
    await expect(dialog(page)).toBeVisible()
    await expect(dialog(page)).toContainText('Unsaved changes')
    await expect(dialog(page)).toContainText("Some of your changes aren't saved to your account yet.")
    await expect(dialog(page)).toContainText('including the copy kept on this device')
    await expect(page.getByTestId('unsaved-stay')).toBeFocused()
    await expect(page.getByTestId('unsaved-discard')).toHaveAccessibleDescription(/lost/)

    await page.keyboard.press('Escape')
    await expect(dialog(page)).toBeHidden()
    expect(new URL(page.url()).pathname).toBe('/en/invitations/coastal-breeze')
    await expect(brideInput(page)).toHaveValue('Ана')

    // Asked again: one dialog, never two.
    await goInApp(page, '/en/event-category')
    await expect(dialog(page)).toBeVisible()
    await expect(page.getByRole('alertdialog')).toHaveCount(1)
    const putsBefore = state.puts
    await page.getByTestId('unsaved-save').click()
    await expect(page.getByTestId('unsaved-save-failed')).toBeVisible()
    expect(state.puts).toBeGreaterThan(putsBefore)
    expect(new URL(page.url()).pathname).toBe('/en/invitations/coastal-breeze')

    await page.getByTestId('unsaved-discard').click()
    await expect(page).toHaveURL(/\/en\/event-category/)
    const kept = await page.evaluate((id) => localStorage.getItem('invitation_unsynced_v1:' + id), EVENT)
    expect(kept).toBeNull()
    expect(state.posts).toBe(0)
  })

  test('Save and exit leaves once the server confirmed it', async ({ page }) => {
    const state = await setup(page, { failSaves: 1 })
    await page.goto(`/en${EDITOR}`)
    await expect(brideInput(page)).toBeVisible()
    await brideInput(page).fill('Ана')
    await expect(status(page)).toHaveAttribute('data-status', 'error')

    await goInApp(page, '/en/event-category')
    await expect(dialog(page)).toBeVisible()
    await page.getByTestId('unsaved-save').click()
    await expect(page).toHaveURL(/\/en\/event-category/)
    expect(state.puts).toBe(2)
  })

  test('no change, or a confirmed save: leaving asks nothing; browser back asks with a pending failure', async ({ page }) => {
    const state = await setup(page)
    await page.goto('/en/event-category')
    await goInApp(page, `/en${EDITOR}`)
    await expect(brideInput(page)).toBeVisible()

    // Untouched existing event (its Save button is enabled): no question.
    await page.goBack()
    await expect(page).toHaveURL(/\/en\/event-category/)
    await expect(dialog(page)).toHaveCount(0)

    await goInApp(page, `/en${EDITOR}`)
    await expect(brideInput(page)).toBeVisible()
    await brideInput(page).fill('Ана')
    await expect(status(page)).toHaveAttribute('data-status', 'synced')
    await page.goBack()
    await expect(page).toHaveURL(/\/en\/event-category/)
    await expect(dialog(page)).toHaveCount(0)
    expect(state.puts).toBe(1)

    // Now a save that fails: browser back asks; Keep editing keeps the editor.
    state.failuresLeft = 99
    await goInApp(page, `/en${EDITOR}`)
    await expect(brideInput(page)).toBeVisible()
    await brideInput(page).fill('Марија')
    await expect(status(page)).toHaveAttribute('data-status', 'error')
    await page.goBack()
    await expect(dialog(page)).toBeVisible()
    await page.getByTestId('unsaved-stay').click()
    await expect(dialog(page)).toBeHidden()
    await expect(page).toHaveURL(/invitations\/coastal-breeze/)
    await expect(brideInput(page)).toHaveValue('Марија')
  })

  test('closing the tab with an unconfirmed change triggers the browser prompt (best effort)', async ({ page }) => {
    await setup(page, { failSaves: 99 })
    await page.goto(`/en${EDITOR}`)
    await expect(brideInput(page)).toBeVisible()
    await brideInput(page).fill('Ана')
    await expect(status(page)).toHaveAttribute('data-status', 'error')
    const prompted = new Promise((resolve) => page.once('dialog', (d) => { resolve(d.type()); d.dismiss() }))
    await page.close({ runBeforeUnload: true })
    expect(await prompted).toBe('beforeunload')
  })

  test('a guest draft is on this device: leaving asks nothing', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
    await page.addInitScript(() => localStorage.setItem('lang', 'en'))
    const state = await stubApi(page)
    await page.goto('/en/invitations/coastal-breeze?edit=true')
    await brideInput(page).fill('Ана')
    await expect(status(page)).toHaveAttribute('data-status', 'local')
    await goInApp(page, '/en/event-category')
    await expect(page).toHaveURL(/\/en\/event-category/)
    await expect(dialog(page)).toHaveCount(0)
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('invitation_draft_v1')))
    expect(saved.fullPayload.brideName).toBe('Ана')
    expect(state.puts + state.posts).toBe(0)
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('Macedonian dialog fits the screen; Discard leaves', async ({ page }) => {
    await setup(page, { lang: 'mk', failSaves: 99 })
    await page.goto(`/mk${EDITOR}`)
    await page.getByText(/Допрете|Tap to open/).first().click({ force: true })
    await page.getByRole('button', { name: 'Прилагоди' }).click()
    const sheet = page.locator('.mobile-sheet')
    await sheet.locator('.mobile-tab-btn').filter({ hasText: 'Содржина' }).click()
    const toggle = sheet.getByRole('switch', { name: 'Прикажи „Програма“ на поканата' })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await expect(status(page)).toHaveAttribute('data-status', 'error')
    await page.keyboard.press('Escape')

    await goInApp(page, '/mk/event-category')
    await expect(dialog(page)).toBeVisible()
    await expect(dialog(page)).toContainText('Незачувани измени')
    // The route loader does not cover the question (it waits on the person).
    await expect(page.locator('.route-loader')).toHaveCount(0)
    await expect(page.getByTestId('unsaved-save')).toHaveText('Зачувај и излези')
    await expect(page.getByTestId('unsaved-discard')).toHaveText('Отфрли измени')
    await expect(page.getByTestId('unsaved-stay')).toHaveText('Продолжи со уредување')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    for (const id of ['unsaved-save', 'unsaved-discard', 'unsaved-stay']) {
      const box = await page.getByTestId(id).boundingBox()
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(390)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
    await page.screenshot({ path: 'C:/Users/techl/AppData/Local/Temp/claude/C--Projcets-ZM/17a780c3-35a7-45d6-9961-af0c146a2596/scratchpad/inv502-phone-mk.png' })
    await page.getByTestId('unsaved-discard').click()
    await expect(page).toHaveURL(/\/mk\/event-category/)
  })
})
