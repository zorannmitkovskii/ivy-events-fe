import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * INV-303 — a guest's draft joined to the account after sign-up, in a real
 * browser. The account already has drafts: the editor names them (name, last
 * change) and asks; nothing is merged or overwritten. A create refused because
 * another account on this device already used the draft's key does not loop:
 * the key is replaced, the draft stays, and the retry makes exactly one event.
 */

const USER = '33333333-3333-3333-3333-333333333333'
const EXISTING = '44444444-4444-4444-4444-444444444444'
const CREATED = '77777777-7777-7777-7777-777777777777'

function wrapped(route, data, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ success: status < 400, message: null, data }),
  })
}

async function stubApi(page, { claimFirst = false } = {}) {
  const state = { posts: [], puts: 0, claimed: claimFirst }
  await page.route('**/v1/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/v1/api', '')
    if (path === '/events/full' && request.method() === 'POST') {
      state.posts.push(request.postDataBuffer()?.toString('utf8') || '')
      if (state.claimed) {
        state.claimed = false
        return wrapped(route, { status: 409, errorCode: 'CONFLICT_OBJECT_ALREADY_EXISTS', message: 'clientRequestId already used' }, 409)
      }
      return wrapped(route, { event: { id: CREATED }, eventDetails: [], agendas: [], ourStories: [] })
    }
    if (request.method() === 'PUT') state.puts++
    if (path === '/events/workspace' && request.method() === 'GET') {
      return wrapped(route, [
        { id: EXISTING, name: 'Our first event', categoryType: 'WEDDING', status: 'DRAFT', updatedAt: '2026-09-30T10:00:00' },
        { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Paid event', categoryType: 'WEDDING', status: 'ACTIVE', updatedAt: '2026-10-01T10:00:00' },
      ])
    }
    return wrapped(route, null)
  })
  return state
}

async function withDraft(page) {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent', 'rejected')
    if (localStorage.getItem('invitation_draft_v1')) return
    localStorage.setItem('invitation_draft_v1', JSON.stringify({
      eventDetails: [], agenda: [], ourStory: [],
      theme: { info: { brideName: 'Ана', groomName: 'Марко', weddingDateTime: '2099-06-12T17:30:00', eventTimezone: 'Europe/Skopje', venue: 'Охрид' } },
      sectionState: null,
      fullPayload: { name: 'Ана & Марко', categoryType: 'WEDDING', invitationName: 'coastal-breeze', clientRequestId: 'draft-key-1' },
      clientRequestId: 'draft-key-1',
      updatedAt: new Date().toISOString(),
    }))
  })
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('the account already has a draft: it is named, nothing is merged, and a claimed key is replaced before one create', async ({ page }) => {
    const state = await stubApi(page, { claimFirst: true })
    await signIn(page, { userId: USER, eventId: EXISTING, lang: 'en', roles: ['USER'] })
    await withDraft(page)

    await page.goto('/en/invitations/coastal-breeze?edit=true&new=1&resume=choose&conflict=events')
    const dialog = page.getByTestId('invitation-auth-dialog')
    await expect(dialog).toHaveAttribute('data-conflict', 'events')
    const rows = page.getByTestId('resume-existing-draft')
    // Only the account's drafts; the active event is not one.
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('Our first event')
    await expect(rows.first()).toContainText('September 30, 2026')
    await expect(page.getByTestId('resume-existing')).toContainText('Nothing in your account will be changed or merged')
    expect(state.posts).toHaveLength(0)

    // The key was used by another account on this device: refused, not looped.
    await page.getByTestId('resume-save-new').click()
    await expect(page.getByTestId('draft-notice-failed')).toBeVisible()
    expect(state.posts).toHaveLength(1)
    expect(state.posts[0]).toContain('"clientRequestId":"draft-key-1"')
    const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('invitation_draft_v1')))
    expect(kept.fullPayload.name).toBe('Ана & Марко')
    expect(kept.clientRequestId).not.toBe('draft-key-1')

    // Retry: exactly one event, with the new key; the existing one untouched.
    await page.getByTestId('draft-notice-failed').getByRole('button').click()
    await expect(page).toHaveURL(/\/en\/dashboard/)
    expect(state.posts).toHaveLength(2)
    expect(state.posts[1]).toContain(`"clientRequestId":"${kept.clientRequestId}"`)
    expect(state.puts).toBe(0)
    expect(await page.evaluate(() => localStorage.getItem('invitation_draft_v1'))).toBeNull()
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('a draft another account already saved: explained, kept, no horizontal scroll', async ({ page }) => {
    const state = await stubApi(page)
    await signIn(page, { userId: USER, eventId: EXISTING, lang: 'en', roles: ['USER'] })
    await withDraft(page)

    await page.goto('/en/invitations/coastal-breeze?edit=true&new=1&resume=choose&conflict=claimed')
    const dialog = page.getByTestId('invitation-auth-dialog')
    await expect(dialog).toContainText('already saved to another account')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    await page.getByTestId('resume-keep').click()
    await expect(dialog).toBeHidden()
    await expect(page).not.toHaveURL(/resume=/)
    expect(state.posts).toHaveLength(0)
    const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('invitation_draft_v1')))
    expect(kept.fullPayload.name).toBe('Ана & Марко')
  })
})
