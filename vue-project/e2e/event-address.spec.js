import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * An event's own invitation address, in a real browser: the settings offer the
 * couple's name, a taken name is refused with an alternative, and the saved
 * address becomes the link guests are given.
 */

const USER = '33333333-3333-3333-3333-333333333333'
const EVENT = '44444444-4444-4444-4444-444444444444'

const EVENT_BODY = {
  id: EVENT, name: 'Ана & Марко', date: '2026-06-20', categoryType: 'WEDDING', status: 'ACTIVE', lang: 'mk',
  invitation: { invitationUrl: `http://localhost/mk/invitations/coastal-breeze?eventId=${EVENT}`, galleryUrl: '', privateInvitationUrl: '' },
}

function stubApi(page) {
  const state = { address: { label: null, enabled: false, host: null, url: null, suggestion: 'ana-marko' }, saves: [] }
  return page.route('**/v1/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/v1/api', '')
    const wrapped = (data, status = 200) => route.fulfill({
      status, contentType: 'application/json', body: JSON.stringify({ success: status < 400, message: null, data }),
    })
    const bare = (data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })

    if (path === `/events/${EVENT}/address/availability`) {
      const label = url.searchParams.get('label')
      return label === 'studio-lumiere'
        ? wrapped({ label, available: false, reason: 'TAKEN', suggestion: 'studio-lumiere-2026' })
        : wrapped({ label, available: true, reason: null, suggestion: null })
    }
    if (path === `/events/${EVENT}/address` && request.method() === 'PUT') {
      const body = request.postDataJSON()
      state.saves.push(body)
      state.address = { label: body.label, enabled: body.enabled, host: `${body.label}.ivyevents.mk`, url: `https://${body.label}.ivyevents.mk/`, suggestion: null }
      return wrapped(state.address)
    }
    if (path === `/events/${EVENT}/address`) return wrapped(state.address)
    if (path === `/events/${EVENT}`) return bare(EVENT_BODY)
    return wrapped(null)
  }).then(() => state)
}

test('the settings offer the name, refuse a taken one, and save the address guests get', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  const state = await stubApi(page)
  await signIn(page, { userId: USER, eventId: EVENT, lang: 'en', roles: ['USER'] })

  await page.goto('/en/dashboard/events/settings')
  const section = page.getByTestId('event-address')
  const input = section.locator('input.addr-input')

  await expect(input).toHaveValue('ana-marko')
  await expect(section).toContainText('"ana-marko" is free.')

  await input.fill('studio-lumiere')
  await expect(section).toContainText('"studio-lumiere" is taken.')
  await section.getByRole('button', { name: 'Use "studio-lumiere-2026"' }).click()
  await expect(input).toHaveValue('studio-lumiere-2026')

  await section.getByLabel('Open the invitation at this address').check()
  await section.getByRole('button', { name: 'Save address' }).click()

  await expect(section.locator('.addr-open')).toHaveAttribute('href', 'https://studio-lumiere-2026.ivyevents.mk/')
  expect(state.saves).toEqual([{ label: 'studio-lumiere-2026', enabled: true }])

  await page.goto('/en/dashboard/events/invitation-links')
  await expect(page.getByText('https://studio-lumiere-2026.ivyevents.mk/').first()).toBeVisible()
})
