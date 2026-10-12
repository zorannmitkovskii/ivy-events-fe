import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * INV-302 — coming back to an unfinished invitation: continue the draft on
 * this device or one saved in the account, or delete the local one — only
 * after a confirmation that names what goes. Expired and unreadable drafts are
 * explained, never break the page, and are not promised back.
 */

const CARDS = [
  { category: 'WEDDING', order: 1, available: true, featured: true, tint: '', sample: { en: 'Elena & Nikola' }, types: ['WEDDING'] },
]

const ONBOARDING = {
  selectedCategory: 'WEDDING',
  eventDetails: {
    brideName: 'Ана', groomName: 'Марко', title: '', date: '2099-06-12', time: '17:30',
    timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' },
  },
  invitationName: 't-coastal',
  invitationPath: 'invitations/coastal-breeze',
}

async function stubApi(page, { drafts = null } = {}) {
  await page.route('**/v1/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) }))
  await page.route('**/v1/api/public/event-categories', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: null, data: CARDS }) }))
  const asked = []
  if (drafts) {
    await page.route('**/v1/api/events/workspace**', (route) => {
      asked.push(route.request().url())
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: drafts }) })
    })
  }
  return asked
}

/** Seeds storage once per test (a reload must see what the app left, not the seed). */
async function seed(page, items) {
  await page.addInitScript((entries) => {
    if (sessionStorage.getItem('__seeded')) return
    localStorage.setItem('cookie_consent', 'rejected')
    localStorage.setItem('lang', 'en')
    for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v)
    sessionStorage.setItem('__seeded', '1')
  }, items)
}

function localDraft(updatedAt = new Date().toISOString()) {
  return JSON.stringify({
    eventDetails: [], ourStory: [],
    agenda: [{ title: 'Моја церемонија', time: '17:00', _localId: '_local_1' }, { title: 'Мојата вечера', time: '20:00', _localId: '_local_2' }],
    theme: { info: { brideName: 'Ана', groomName: 'Марко' } },
    sectionState: null, fullPayload: null, clientRequestId: null, pendingFiles: null, updatedAt,
  })
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('a guest discards the draft only after a confirmation that names what goes', async ({ page }) => {
    await seed(page, { onboarding_state_v1: JSON.stringify(ONBOARDING), invitation_draft_v1: localDraft() })
    await stubApi(page)
    await page.goto('/en/event-category')

    const card = page.getByTestId('local-draft')
    await expect(card).toContainText('Ана & Марко')
    await expect(card).toContainText('Saved only in this browser')
    await expect(card.getByTestId('draft-expires')).toBeVisible()

    // Cancel: nothing is deleted, focus is back on the button.
    await page.getByTestId('discard-draft').click()
    const dialog = page.getByRole('alertdialog', { name: 'Delete the draft?' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByTestId('discard-scope-deleted')).toContainText('Weddings · Ана & Марко')
    await expect(dialog.getByTestId('discard-scope-deleted')).toContainText('Coastal Breeze')
    await expect(dialog.getByTestId('discard-scope-deleted')).toContainText('2 programme items')
    await expect(dialog.getByTestId('discard-scope-kept')).toContainText('only in this browser')
    await expect(dialog.getByTestId('discard-cancel')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(page.getByTestId('discard-draft')).toBeFocused()
    expect(await page.evaluate(() => localStorage.getItem('invitation_draft_v1'))).not.toBeNull()

    // Confirm: deleted, said, and the categories open.
    await page.getByTestId('discard-draft').click()
    await page.getByTestId('discard-confirm').click()
    await expect(page.getByTestId('start-choice')).toHaveCount(0)
    await expect(page.locator('#category-picker')).toBeVisible()
    await expect(page.getByTestId('start-announce')).toHaveText('The draft was deleted from this device.')
    const left = await page.evaluate(() => ({
      draft: localStorage.getItem('invitation_draft_v1'),
      onboarding: JSON.parse(localStorage.getItem('onboarding_state_v1')),
    }))
    expect(left.draft).toBeNull()
    expect(left.onboarding.selectedCategory).toBe('')
    expect(left.onboarding.eventDetails.brideName).toBe('')

    // Nothing to offer after a reload either.
    await page.reload()
    await expect(page.getByTestId('start-choice')).toHaveCount(0)
  })

  test('an expired draft is explained, not offered, and the page works', async ({ page }) => {
    await seed(page, {
      onboarding_state_v1: JSON.stringify(ONBOARDING),
      invitation_draft_v1: localDraft(new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString()),
    })
    await stubApi(page)
    await page.goto('/en/event-category')

    const notice = page.getByTestId('draft-notice')
    await expect(notice).toContainText('deleted automatically because it was not changed for 30 days')
    await expect(notice).toContainText('cannot be restored')
    await expect(page.getByTestId('start-choice')).toHaveCount(0)
    await expect(page.locator('#category-picker button.cat')).toHaveCount(1)
    await notice.getByRole('button', { name: 'OK' }).click()
    await expect(page.getByTestId('draft-notice')).toHaveCount(0)
    await page.reload()
    await expect(page.getByTestId('draft-notice')).toHaveCount(0)
  })

  test('signed in: drafts in the account are offered and continue in the editor', async ({ page }) => {
    await signIn(page, { userId: '11111111-1111-1111-1111-111111111111', eventId: '', lang: 'en', roles: ['USER'] })
    await page.addInitScript(() => {
      localStorage.setItem('cookie_consent', 'rejected')
      localStorage.setItem('invitation_unsynced_v1:ev-2', JSON.stringify({ payload: { name: 'x' }, savedAt: new Date().toISOString() }))
    })
    const asked = await stubApi(page, {
      drafts: [
        { pinned: false, event: { id: 'ev-1', name: 'Ана & Марко', categoryType: 'WEDDING', status: 'DRAFT', updatedAt: '2026-09-01T10:00:00', invitation: { invitationName: 'coastal-breeze' } } },
        { pinned: false, event: { id: 'ev-2', name: 'Ема & Иван', categoryType: 'WEDDING', status: 'DRAFT', updatedAt: '2026-10-05T10:00:00', invitation: { invitationName: 'persian-wedding' } } },
      ],
    })
    await page.goto('/en/event-category')

    const cards = page.getByTestId('server-draft')
    await expect(cards).toHaveCount(2)
    expect(asked[0]).toContain('status=DRAFT')
    await expect(cards.nth(0)).toContainText('Ема & Иван')
    await expect(cards.nth(0).getByTestId('server-draft-unsynced')).toBeVisible()
    await expect(cards.nth(1).getByTestId('server-draft-unsynced')).toHaveCount(0)
    await expect(page.getByTestId('local-draft')).toHaveCount(0)

    await page.getByRole('button', { name: 'Continue the draft Ана & Марко' }).click()
    await expect(page).toHaveURL(/\/en\/invitations\/coastal-breeze\?.*eventId=ev-1/)
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('a damaged draft is explained; the confirmation fits a phone', async ({ page }) => {
    await seed(page, { invitation_draft_v1: '{broken', onboarding_state_v1: JSON.stringify(ONBOARDING) })
    await stubApi(page)
    await page.goto('/en/event-category')

    // The editor's copy was unreadable; the basics survived and are still a
    // draft to offer — with a note that part of it could not be read.
    await expect(page.getByTestId('local-draft')).toBeVisible()
    await expect(page.getByTestId('draft-partial')).toContainText('could not be read')
    await expect(page.getByTestId('draft-notice')).toHaveCount(0)
    await page.getByTestId('start-new').click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    const box = await page.getByTestId('discard-confirm').boundingBox()
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(390)
    await page.getByTestId('discard-confirm').click()
    await expect(page.locator('#category-picker button.cat').first()).toBeFocused()
  })
})
