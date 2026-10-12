import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * IVY-INV-301 — the invitation editor says where an edit is saved, in a real
 * browser: on this device for a guest, on the account only after the server
 * confirmed it, and a failed or offline save keeps the edit and offers a
 * retry that does not create anything twice.
 */

const USER = '33333333-3333-3333-3333-333333333333'
const EVENT = '55555555-5555-5555-5555-555555555555'

test.use({ viewport: { width: 1400, height: 900 } })

function wrapped(route, data, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ success: status < 400, message: null, data }),
  })
}

async function stubApi(page, { failFirstSaves = 0 } = {}) {
  const state = { puts: 0, posts: 0, failuresLeft: failFirstSaves }
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
  // The event itself (INV-403: an event that could not be read is never saved
  // over, so these signed-in edits need it read first).
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

test('a guest edit is saved on this device and survives a reload', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  await page.addInitScript(() => localStorage.setItem('lang', 'en'))
  const state = await stubApi(page)

  await page.goto('/en/invitations/coastal-breeze?edit=true')
  await brideInput(page).fill('Ана')

  await expect(status(page)).toHaveAttribute('data-status', 'local')
  await expect(status(page)).toContainText('Saved on this device. Sign up to keep it in your account.')
  expect(state.puts + state.posts).toBe(0)

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('invitation_draft_v1')))
  expect(saved.theme.info.brideName).toBe('Ана')
  expect(saved.fullPayload.brideName).toBe('Ана')
  expect(saved.fullPayload.clientRequestId).toBeTruthy()

  await page.reload()
  await expect(brideInput(page)).toHaveValue('Ана')
})

test('a signed-in edit shows "saved to your account" only after the server confirmed it, and retry recovers a failure', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  const state = await stubApi(page, { failFirstSaves: 1 })
  await signIn(page, { userId: USER, eventId: EVENT, lang: 'en', roles: ['USER'] })

  await page.goto(`/en/invitations/coastal-breeze?edit=true&eventId=${EVENT}`)
  await expect(brideInput(page)).toBeVisible()
  // Opening the editor saves nothing.
  await page.waitForTimeout(2000)
  expect(state.puts).toBe(0)

  // A burst of typing is one request after the pause.
  await brideInput(page).clear()
  await brideInput(page).pressSequentially('Ана', { delay: 50 })
  await expect(status(page)).toHaveAttribute('data-status', 'error')
  await expect(status(page)).toContainText("Couldn't save to your account. Your changes are kept on this device.")
  expect(state.puts).toBe(1)
  const kept = await page.evaluate((id) => localStorage.getItem('invitation_unsynced_v1:' + id), EVENT)
  expect(JSON.parse(kept).payload.brideName).toBe('Ана')

  await page.getByTestId('save-status-retry').first().click()
  await expect(status(page)).toHaveAttribute('data-status', 'synced')
  await expect(status(page)).toContainText('Saved to your account')
  expect(state.puts).toBe(2)
  expect(state.posts).toBe(0)
  const left = await page.evaluate((id) => localStorage.getItem('invitation_unsynced_v1:' + id), EVENT)
  expect(left).toBeNull()
})

test('offline edits wait on this device and sync when the connection returns', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  const state = await stubApi(page)
  await signIn(page, { userId: USER, eventId: EVENT, lang: 'en', roles: ['USER'] })

  await page.goto(`/en/invitations/coastal-breeze?edit=true&eventId=${EVENT}`)
  await expect(brideInput(page)).toBeVisible()

  await context.setOffline(true)
  await brideInput(page).fill('Ана')
  await expect(status(page)).toHaveAttribute('data-status', 'offline')
  await expect(status(page)).toContainText("You're offline.")
  expect(state.puts).toBe(0)

  await context.setOffline(false)
  await expect(status(page)).toHaveAttribute('data-status', 'synced')
  expect(state.puts).toBe(1)
})
