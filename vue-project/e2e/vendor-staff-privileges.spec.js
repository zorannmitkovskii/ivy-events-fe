import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * A vendor's staff member typing the address of a screen the owner did not
 * give them. The server refuses the data; the browser should not show a page
 * of errors — it sends them to the first screen they may open.
 */

const MEMBER = '44444444-4444-4444-4444-444444444444'

const ME = {
  vendorId: 'v-1', slug: 'studio-lumiere', name: 'Studio Lumière', type: 'PHOTOGRAPHY',
  capabilities: ['CALENDAR', 'GALLERY', 'MEDIA_LINKS'], approvalStatus: 'APPROVED',
}

async function stubPortal(page, granted) {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'rejected'))
  await page.route('**/v1/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/v1/api', '')
    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: null, data }),
    })
    if (path === '/vendor-portal/me') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ME) })
    if (path === '/me/privileges') return wrapped([{ type: 'VENDOR', owner: false, privileges: granted }])
    if (path === '/vendor-portal/availability' || path === '/vendor-portal/calendar') return wrapped({ blocks: [], bookings: [], days: [] })
    return wrapped(null)
  })
  await signIn(page, { userId: MEMBER, eventId: 'none', lang: 'en', roles: ['VENDOR_MEMBER', 'USER'] })
}

test('a member without the inquiries privilege who types the inbox address lands on their calendar', async ({ page }) => {
  await stubPortal(page, ['vendor:calendar'])

  await page.goto('/en/vendor/inbox')

  await expect(page).toHaveURL(/\/en\/vendor\/calendar$/)
})

test('a member with the privilege opens the screen as asked', async ({ page }) => {
  await stubPortal(page, ['vendor:calendar', 'vendor:inquiries'])

  await page.goto('/en/vendor/inbox')

  await expect(page).toHaveURL(/\/en\/vendor\/inbox$/)
})
