import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * INV-104 — data first, a personalised invitation, an account only at the end.
 *
 * A guest enters the basics, sees them on the designs and in the chosen
 * invitation (desktop and phone), and is asked for an account only on Save,
 * told plainly that until then the draft is in this browser only. A signed-in
 * account that already has an event is asked what to do with the draft, and
 * saving it as a new event sends exactly one create with the draft's key.
 */

const USER = '33333333-3333-3333-3333-333333333333'
const EXISTING = '44444444-4444-4444-4444-444444444444'
const CREATED = '66666666-6666-6666-6666-666666666666'

function wrapped(route, data, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ success: status < 400, message: null, data }),
  })
}

async function stubApi(page) {
  const state = { posts: [], puts: 0 }
  // The public client has no /v1/api prefix.
  await page.route('**/public/invitation-templates/category/**', (route) =>
    route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 't-coastal', name: 'Coastal Breeze', path: 'invitations/coastal-breeze', active: true },
          { id: 't-persian', name: 'Persian Wedding', path: 'invitations/persian-wedding', active: true },
        ]),
      }))
  await page.route('**/v1/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/v1/api', '')
    if (path === '/events/full' && request.method() === 'POST') {
      state.posts.push(request.postDataBuffer()?.toString('utf8') || '')
      return wrapped(route, { event: { id: CREATED }, eventDetails: [], agendas: [], ourStories: [] })
    }
    if (request.method() === 'PUT') state.puts++
    if (path === '/events' && request.method() === 'GET') {
      return wrapped(route, [{ id: EXISTING, name: 'Our first event', categoryType: 'WEDDING', status: 'DRAFT' }])
    }
    return wrapped(route, null)
  })
  return state
}

async function asGuest(page) {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent', 'rejected')
    localStorage.setItem('lang', 'en')
    if (!localStorage.getItem('onboarding_state_v1')) {
      localStorage.setItem('onboarding_state_v1', JSON.stringify({ selectedCategory: 'WEDDING' }))
    }
  })
}

async function enterBasics(page) {
  await page.goto('/en/event-basics')
  await page.getByLabel("Bride's Name").fill('Ана')
  await page.getByLabel("Groom's Name").fill('Марко')
  await page.getByLabel('Date', { exact: true }).fill('2099-06-12')
  await page.getByLabel('Start time').fill('17:30')
  await expect(page.getByLabel('Timezone')).toHaveValue('Europe/Skopje')
  await page.getByLabel('Venue', { exact: true }).fill('Охрид')
  await expect(page.getByText('kept only in this browser on this device')).toBeVisible()
  // Keyboard only: Enter submits the form.
  await page.getByLabel('Venue', { exact: true }).press('Enter')
  await expect(page).toHaveURL(/\/en\/event-invitations/)
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('a guest enters the basics, sees them on the designs and in the invitation, and meets the account only at Save', async ({ page }) => {
    await asGuest(page)
    const state = await stubApi(page)
    await enterBasics(page)

    // The designs carry the user's names, date and place.
    const personal = page.getByTestId('invitation-card-personal')
    await expect(personal).toHaveCount(2)
    await expect(personal.first()).toContainText('Ана & Марко')
    await expect(personal.first()).toContainText('Охрид')

    // Pick a design with the keyboard and continue: no sign-up yet.
    await page.getByTestId('invitation-card-use').last().focus()
    await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page).toHaveURL(/\/en\/invitations\/coastal-breeze\?.*new=1/)

    // The invitation shows them, not the demo couple.
    await expect(page.locator('.hero-names, .couple-names').first()).toContainText('Ана')
    await expect(page.locator('.hero-names, .couple-names').first()).toContainText('Марко')

    // Save asks for an account, says where the draft is, and can be cancelled.
    await page.getByTestId('editor-save').first().click()
    const dialog = page.getByTestId('invitation-auth-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('saved only in this browser on this device')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    await page.getByTestId('editor-save').first().click()
    await page.getByTestId('auth-gate-signup').click()
    await expect(page).toHaveURL(/\/en\/auth\/signup/)
    await expect(page.getByTestId('draft-auth-notice')).toBeVisible()

    // Nothing reached the server; the draft holds the basics with time and zone.
    expect(state.posts).toHaveLength(0)
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('invitation_draft_v1')))
    expect(saved.fullPayload).toMatchObject({
      brideName: 'Ана', groomName: 'Марко', date: '2099-06-12', time: '17:30',
      timezone: 'Europe/Skopje', categoryType: 'WEDDING', invitationName: 'coastal-breeze',
    })
    expect(saved.fullPayload.clientRequestId).toBeTruthy()

    // Back to the same invitation from the sign-up page: still there.
    await page.getByTestId('draft-auth-notice').getByRole('link').click()
    await expect(page.locator('.hero-names, .couple-names').first()).toContainText('Ана')
  })

  test('an account that already has an event is asked; saving as new sends one create with the draft key', async ({ page }) => {
    const state = await stubApi(page)
    await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
    await signIn(page, { userId: USER, eventId: EXISTING, lang: 'en', roles: ['USER'] })
    await page.addInitScript(() => {
      if (localStorage.getItem('invitation_draft_v1')) return
      localStorage.setItem('invitation_draft_v1', JSON.stringify({
        eventDetails: [], agendas: [], ourStory: [],
        theme: { info: { brideName: 'Ана', groomName: 'Марко', weddingDateTime: '2099-06-12T17:30:00', eventTimezone: 'Europe/Skopje', venue: 'Охрид' } },
        sectionState: null,
        fullPayload: { name: 'Ана & Марко', categoryType: 'WEDDING', invitationName: 'coastal-breeze', clientRequestId: 'draft-key-1' },
        clientRequestId: 'draft-key-1',
        updatedAt: new Date().toISOString(),
      }))
    })

    await page.goto('/en/invitations/coastal-breeze?edit=true&new=1&resume=choose&photos=2')
    const dialog = page.getByTestId('invitation-auth-dialog')
    await expect(dialog).toHaveAttribute('data-mode', 'choose')
    await expect(page.getByTestId('draft-notice-photos')).toContainText('2 photos')
    // The draft, not the existing event, is what the editor shows.
    await expect(page.locator('.hero-names, .couple-names').first()).toContainText('Ана')
    expect(state.posts).toHaveLength(0)

    await page.getByTestId('resume-save-new').click()
    await expect(page).toHaveURL(/\/en\/dashboard/)
    expect(state.posts).toHaveLength(1)
    expect(state.posts[0]).toContain('"clientRequestId":"draft-key-1"')
    expect(state.posts[0]).toContain('"time":"17:30"')
    expect(state.posts[0]).toContain('"timezone":"Europe/Skopje"')
    // The existing event was never written to.
    expect(state.puts).toBe(0)
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('a guest previews the personalised invitation as a guest will see it', async ({ page }) => {
    await asGuest(page)
    await stubApi(page)
    await enterBasics(page)

    await page.getByTestId('invitation-card-use').first().click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page).toHaveURL(/\/en\/invitations\/persian-wedding\?.*edit=true/)

    // The entry overlay opens first; the invitation is behind it.
    await page.getByText('Tap to open').click({ force: true })
    await page.getByTestId('preview-as-guest').click()
    await expect(page).toHaveURL(/preview=1/)
    await expect(page).not.toHaveURL(/edit=true/)
    await expect(page.getByTestId('draft-preview-bar')).toBeVisible()
    await expect(page.locator('.hero-names, .couple-names').first()).toContainText('Ана')

    await page.getByTestId('preview-back-to-editor').click()
    await expect(page).toHaveURL(/edit=true/)
  })
})
