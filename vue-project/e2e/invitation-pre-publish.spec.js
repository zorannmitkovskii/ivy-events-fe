import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * INV-601 — the check before publishing.
 *
 * The guest preview weighs its notes: what must be fixed before publishing
 * (no venue, a date already past in the event's timezone) and what is only
 * advice (an empty optional section). Publishing is paying for the package:
 * the server refuses an invitation that is not ready before anything is
 * charged, and every problem leads to its exact control in the editor.
 */

const USER = '77777777-7777-7777-7777-777777777777'
const EVENT = '88888888-8888-8888-8888-888888888888'

const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

/**
 * An unpublished wedding whose date is already over and whose RSVP deadline
 * has passed. (A missing venue is caught by the server: the editor shows a
 * design's default venue for an event without one — existing behaviour.)
 */
async function stubDraftEvent(page) {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  await page.route('**/v1/api/**', (route) => route.fulfill(json({ success: true, data: null })))
  await page.route('**/public/invitation-templates/category/**', (route) => route.fulfill(json([])))
  await page.route('**/public/invitation-page/**', (route) => route.fulfill(json({
    event: {
      coupleNames: { bride: 'Ана', groom: 'Марко' }, eventCategory: 'WEDDING', timezone: 'Europe/Skopje',
      status: 'DRAFT', startDate: Date.UTC(2020, 5, 12, 15, 30),
    },
    location: { venueName: 'Охрид' },
    rsvpConfig: { deadline: '2020-01-01' },
    agenda: [], ourStory: [], weddingDetails: [], ourStoryImages: [], collageImages: [],
    sectionOrder: { entry: 0, hero: 1, details: 2, agendaList: 3, ourStoryList: 4, rsvp: 5 },
    sectionVisibility: {},
  })))
  await page.route(`**/v1/api/events/full/${EVENT}`, (route) =>
    route.fulfill(json({ success: true, data: { event: { id: EVENT }, eventDetails: [], agendas: [], ourStories: [] } })))
}

test.describe('INV-601 check before publishing', () => {
  test('the guest preview separates blockers from advice, and a blocker leads to its field', async ({ page }) => {
    await stubDraftEvent(page)
    await signIn(page, { userId: USER, eventId: EVENT, lang: 'en', roles: ['USER'] })
    await page.goto(`/en/invitations/coastal-breeze?edit=true&eventId=${EVENT}`)
    const sidebar = page.locator('aside.edit-sidebar')
    await expect(sidebar.locator('[data-info-field="brideName"]')).toHaveValue('Ана')

    await sidebar.getByTestId('preview-as-guest').click()
    await expect(page).toHaveURL(/preview=1/)
    const readiness = page.getByTestId('publish-readiness')
    await expect(readiness).toHaveAttribute('data-ready', 'false')
    await expect(readiness).toContainText('To fix before publishing: 2')

    await page.getByTestId('preview-notes-toggle').click()
    const blockers = page.getByTestId('publish-group-blockers')
    await expect(blockers.getByRole('heading')).toHaveText('Must be fixed before publishing (2)')
    await expect(blockers).toContainText('already passed in Europe/Skopje')
    await expect(blockers.locator('[data-section="rsvp"]')).toContainText('The RSVP deadline has already passed')
    // The empty programme is advice only.
    const advice = page.getByTestId('publish-group-recommendations')
    await expect(advice.locator('[data-section="agendaList"]')).toContainText('is empty')
    await expect(blockers.locator('[data-section="agendaList"]')).toHaveCount(0)

    await blockers.locator('[data-section="info"]').getByTestId('preview-note-edit').click()
    await expect(page).toHaveURL(/edit=true/)
    await expect(sidebar.locator('[data-info-field="date"]')).toBeFocused()
    // The Info panel says why, tied to the field.
    await expect(sidebar.locator('[data-info-field="date"]')).toHaveAttribute('aria-describedby', /past/)
  })

  test('paying for the package is refused with the problems; "Fix" opens the editor at the field', async ({ page }) => {
    await stubDraftEvent(page)
    await page.route('**/public/packages/category/**', (route) => route.fulfill(json([
      { id: 'p1', packageType: 'INV_PRO', name: 'Pro', price: 1500, currency: 'MKD', features: [] },
    ])))
    await page.route(`**/v1/api/events/${EVENT}`, (route) => route.fulfill(json({ success: true, data: {
      id: EVENT, timezone: 'Europe/Skopje',
      invitation: { invitationUrl: `https://ivy.example/en/invitations/coastal-breeze?eventId=${EVENT}` },
    } })))
    const inits = []
    await page.route('**/api/cpay/init', (route) => {
      inits.push(route.request().postDataJSON())
      return route.fulfill(json({ success: false, message: 'The invitation is not ready to publish', data: {
        status: 422, errorCode: 'BR_EVENT_NOT_READY_TO_PUBLISH', detail: 'The invitation is not ready to publish',
        validationErrors: { date: 'past', location: 'missing' },
      } }, 422))
    })
    await signIn(page, { userId: USER, eventId: EVENT, lang: 'en', roles: ['USER'] })
    await page.goto('/en/dashboard/events/packages')

    await page.locator('.add-cart-btn').first().click()
    await page.locator('.cart-checkout-btn').click()
    const box = page.getByTestId('publish-blockers')
    await expect(box).toBeVisible()
    await expect(box).toBeFocused()
    expect(inits).toHaveLength(1)
    expect(inits[0].eventId).toBe(EVENT)
    await expect(box).toContainText('This date and time have already passed in Europe/Skopje.')
    await expect(box).toContainText('Nothing has been charged.')
    // Still here, not sent on to the payment page.
    await expect(page).toHaveURL(/\/dashboard\/events\/packages/)

    await box.locator('[data-field="location"]').getByTestId('publish-blocker-fix').click()
    await expect(page).toHaveURL(new RegExp(`/en/invitations/coastal-breeze\\?.*eventId=${EVENT}`))
    const sidebar = page.locator('aside.edit-sidebar')
    await expect(sidebar.locator('[data-info-field="location"] input').first()).toBeFocused()
    // Used once: the address no longer asks to fix anything.
    await expect(page).not.toHaveURL(/fix=/)
  })
})
