import { Buffer } from 'node:buffer'
import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * INV-403 — photo slots: preview, progress, failure and retry.
 *
 * A photo is uploaded with the invitation's save. Replacing one story photo of
 * an existing event sends only it, with the other photos named so they stay;
 * a failed upload is marked "Not saved" (never as saved) and "Try again"
 * resends it with the other changes. An event that could not be read is never
 * saved over with the design's demo names.
 */

const USER = '66666666-6666-6666-6666-666666666666'
const EVENT = '88888888-8888-8888-8888-888888888888'
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')

const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })
const img = (n) => `/e2e-img/story-${n}.png?sig=1`

const PAGE = {
  event: { coupleNames: { bride: 'Сервер', groom: 'Копија' }, eventCategory: 'WEDDING', timezone: 'Europe/Skopje' },
  agenda: [], ourStory: [], weddingDetails: [],
  ourStoryImages: [img(1), img(2), img(3), img(4)], collageImages: [],
}

async function openExistingEvent(page, { pageFails = () => false, putStatus = () => 200 } = {}) {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  const puts = []
  await page.route('**/v1/api/**', (route) => route.fulfill(json({ success: true, data: null })))
  await page.route('**/public/invitation-templates/category/**', (route) => route.fulfill(json([])))
  await page.route('**/e2e-img/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }))
  await page.route('**/public/invitation-page/**', (route) =>
    (pageFails() ? route.fulfill(json({ message: 'boom' }, 500)) : route.fulfill(json(PAGE))))
  await page.route('**/v1/api/our-stories/with-images**', (route) =>
    route.fulfill(json({ stories: [], images: [img(1), img(2), img(3), img(4)] })))
  await page.route(`**/v1/api/events/full/${EVENT}`, (route) => {
    const body = route.request().postDataBuffer()?.toString('latin1') || ''
    puts.push(body)
    const status = putStatus(puts.length)
    if (status !== 200) return route.fulfill(json({ message: 'boom' }, status))
    return route.fulfill(json({
      success: true,
      data: {
        event: { id: EVENT }, eventDetails: [], agendas: [], ourStories: [],
        ourStoryImages: [img(1), img(9), img(3), img(4)].map((url) => ({ url })),
      },
    }))
  })
  await signIn(page, { userId: USER, eventId: EVENT, lang: 'en', roles: ['USER'] })
  await page.goto(`/en/invitations/persian-wedding?edit=true&eventId=${EVENT}`)
  return puts
}

async function openStoryImages(page) {
  const sidebar = page.locator('aside.edit-sidebar')
  await sidebar.locator('.edit-sidebar__tabs .tab-btn').filter({ hasText: 'Content' }).click()
  await sidebar.locator('.accordion-label', { hasText: 'Story photos' }).click()
  return sidebar.getByTestId('photo-panel-story')
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('replace one story photo with the keyboard; a failed upload is "Not saved"; "Try again" saves it with the text change', async ({ page }) => {
    const puts = await openExistingEvent(page, { putStatus: (n) => (n === 1 ? 500 : 200) })
    const sidebar = page.locator('aside.edit-sidebar')
    await expect(sidebar.locator('[data-info-field="brideName"]')).toHaveValue('Сервер')
    await sidebar.locator('[data-info-field="brideName"]').fill('Ема')

    const panel = await openStoryImages(page)
    await expect(panel.getByTestId('photo-limits')).toContainText('50 MB')
    const second = panel.getByRole('group', { name: 'Story photo 2' })
    await expect(second.getByTestId('photo-slot-status')).toHaveText('Saved.')

    // Keyboard only: the slot's button opens the file picker.
    const pick = second.getByRole('button', { name: 'Story photo 2: replace the photo' })
    await pick.focus()
    const chooser = page.waitForEvent('filechooser')
    await page.keyboard.press('Enter')
    await (await chooser).setFiles({ name: 'second.png', mimeType: 'image/png', buffer: PNG })

    // The first save fails: the photo is marked not saved, never as saved.
    await expect(second.getByTestId('photo-slot-status')).toContainText('Not saved.', { timeout: 8000 })
    await expect(second).toHaveAttribute('data-status', 'failed')
    await expect(second.locator('.story-img-badge--saved')).toHaveCount(0)
    expect(puts).toHaveLength(1)
    // Only the replaced slot is sent; the other three are named and stay.
    expect(puts[0]).toContain('name="ourStoryImages"; filename="second.png"')
    expect(puts[0]).toMatch(/"ourStoryImageSlots":\["[^"]*story-1\.png[^"]*",null,"[^"]*story-3\.png[^"]*","[^"]*story-4\.png[^"]*"\]/)

    await second.getByRole('button', { name: 'Try again — Story photo 2' }).click()
    await expect(second.getByTestId('photo-slot-status')).toHaveText('Saved.', { timeout: 8000 })
    expect(puts).toHaveLength(2)
    expect(puts[1]).toContain('name="ourStoryImages"; filename="second.png"')
    // The text change made before is in the same save.
    expect(Buffer.from(puts[1], 'latin1').toString('utf8')).toContain('"brideName":"Ема"')
    await expect(page.getByTestId('save-status').first()).toHaveAttribute('data-status', 'synced')
  })

  test('a file that is not an image is refused and explained; nothing is drawn or sent', async ({ page }) => {
    const puts = await openExistingEvent(page)
    const panel = await openStoryImages(page)
    const first = panel.getByRole('group', { name: 'Story photo 1' })
    const chooser = page.waitForEvent('filechooser')
    await first.getByTestId('photo-slot-pick').click()
    await (await chooser).setFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') })
    await expect(first.getByTestId('photo-slot-status')).toHaveText("This file isn’t an image. Choose a photo file.")
    await expect(first.locator('img')).toHaveCount(0)
    await first.getByRole('button', { name: 'Remove — Story photo 1' }).click()
    await expect(first.getByTestId('photo-slot-status')).toHaveText('Saved.')
    await page.waitForTimeout(2000)
    expect(puts).toHaveLength(0)
  })

  test('an event that could not be read: no names to edit, nothing saved over it; "Load again" then saves', async ({ page }) => {
    let fail = true
    const puts = await openExistingEvent(page, { pageFails: () => fail })
    const sidebar = page.locator('aside.edit-sidebar')
    await expect(sidebar.getByRole('alert')).toContainText("We couldn't load: Event information")
    await expect(sidebar.locator('[data-info-field="brideName"]')).toHaveCount(0)

    // A change elsewhere (a story photo) is held back, not saved with demo names.
    const panel = await openStoryImages(page)
    const chooser = page.waitForEvent('filechooser')
    await panel.getByRole('group', { name: 'Story photo 1' }).getByTestId('photo-slot-pick').click()
    await (await chooser).setFiles({ name: 'first.png', mimeType: 'image/png', buffer: PNG })
    const status = page.getByTestId('save-status').first()
    await expect(status).toHaveAttribute('data-status', 'error', { timeout: 8000 })
    await expect(status).toContainText("part of the invitation couldn't be loaded")
    expect(puts).toHaveLength(0)

    fail = false
    await status.getByRole('button', { name: 'Load again' }).click()
    await expect(status).toHaveAttribute('data-status', 'synced', { timeout: 8000 })
    expect(puts).toHaveLength(1)
    expect(Buffer.from(puts[0], 'latin1').toString('utf8')).toContain('"brideName":"Сервер"')
    await sidebar.locator('.edit-sidebar__tabs .tab-btn').filter({ hasText: 'Info' }).click()
    await expect(sidebar.locator('[data-info-field="brideName"]')).toHaveValue('Сервер')
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the story photo slots fit a phone without sideways scrolling', async ({ page }) => {
    await openExistingEvent(page)
    await page.getByText('Tap to open').click({ force: true })
    await page.getByRole('button', { name: 'Customize' }).click()
    const panelHost = page.locator('.mobile-sheet')
    await panelHost.locator('.mobile-tab-btn').filter({ hasText: 'Content' }).click()
    await panelHost.locator('.mobile-sheet__item[data-section="ourStoryImages"]').click()
    await expect(panelHost.getByRole('group', { name: 'Story photo 4' })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
