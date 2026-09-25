import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * The vendor studio and its public microsite (2026 vendor design).
 *
 * <p>The API is stubbed with the shapes the server answers, so what these
 * specs guard is the browser's half: the grouped sidebar, the inbox's reply
 * and status flow, and an anonymous visitor sending an inquiry from the
 * microsite without signing in.
 */

const VENDOR_USER = '33333333-3333-3333-3333-333333333333'

const ME = {
  vendorId: 'v-1', slug: 'studio-lumiere', name: 'Studio Lumière', type: 'PHOTOGRAPHY',
  instagramUrl: null, capabilities: ['CALENDAR', 'GALLERY', 'MEDIA_LINKS'], approvalStatus: 'APPROVED',
}

const HOME = {
  vendor: { id: 'v-1', name: 'Studio Lumière', type: 'PHOTOGRAPHY', slug: 'studio-lumiere', city: 'Скопје', approvalStatus: 'APPROVED' },
  kpis: { newInquiries: 1, awaitingReply: 2, upcomingEngagements: 1, micrositePublished: false },
  activities: [{ kind: 'INQUIRY_NEW', inquiryId: 'i-1', name: 'Ивана Петрова', date: '2026-10-03' }],
  readiness: { percent: 75, steps: [{ step: 'BASICS', done: true, missing: [] }] },
  upcoming: [],
}

const inquiry = (overrides = {}) => ({
  id: 'i-1', organizerName: 'Ивана Петрова', contactEmail: 'ivana@example.com', eventType: 'Свадба',
  eventDate: '2026-10-03T12:00:00Z', location: 'Скопје', guestCount: 120, requirements: 'Дали сте слободни?',
  status: 'SENT', workflowStatus: 'NEW', source: 'MICROSITE', createdAt: '2026-09-24T10:00:00Z', ...overrides,
})

/** An owner holds every vendor privilege, as the server answers for one. */
const OWNER_PRIVILEGES = [{ type: 'VENDOR', owner: true, privileges: [
  'vendor:overview', 'vendor:inquiries', 'vendor:calendar', 'vendor:portfolio', 'vendor:packages',
  'vendor:profile', 'vendor:settings', 'vendor:team',
] }]

let calls = []

async function stubPortal(page) {
  calls = []
  let current = inquiry()
  await page.route('**/v1/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/v1/api', '')
    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })
    calls.push(`${request.method()} ${path}`)

    // /me answers bare, like the other vendor-portal reads the layout uses.
    if (path === '/vendor-portal/me') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ME) })
    if (path === '/vendor-portal/home') return wrapped(HOME)
    if (path === '/vendor-portal/inbox/metrics') {
      return wrapped({ received: 1, answered: 0, unanswered: 1, medianMinutes: null, byWorkflow: { NEW: current.workflowStatus === 'NEW' ? 1 : 0 }, bySource: { MICROSITE: 1, IVY: 0 } })
    }
    if (path === '/vendor-portal/inbox') return wrapped([current])
    if (path === '/inquiries/i-1/messages' && request.method() === 'POST') {
      current = { ...current, workflowStatus: 'ANSWERED' }
      return wrapped({ id: 'm-2', authorRole: 'VENDOR', body: 'Слободни сме.' })
    }
    if (path === '/inquiries/i-1/messages') return wrapped([])
    if (path === '/me/privileges') return wrapped(OWNER_PRIVILEGES)
    return wrapped(null)
  })
}

test('the sidebar groups the studio as the design does, with the new inquiry counted', async ({ page }) => {
  await stubPortal(page)
  await signIn(page, { userId: VENDOR_USER, eventId: 'none', lang: 'en', roles: ['VENDOR', 'USER'] })
  await page.goto('/en/vendor')

  await expect(page).toHaveURL(/\/en\/vendor\/home$/)
  const nav = page.locator('.snav')
  await expect(nav.locator('.snav-caption')).toHaveText(['Work', 'Presentation', 'Management'])
  await expect(nav.getByRole('link', { name: /Inquiries/ })).toContainText('1')
  await expect(page.getByText('Reply to Ивана Петрова')).toBeVisible()
})

test('replying in the inbox marks the inquiry answered', async ({ page }) => {
  await stubPortal(page)
  await signIn(page, { userId: VENDOR_USER, eventId: 'none', lang: 'en', roles: ['VENDOR', 'USER'] })
  await page.goto('/en/vendor/inbox')

  await expect(page.locator('.request').first()).toContainText('New')
  await page.getByPlaceholder('Write a short reply…').fill('Слободни сме.')
  await page.getByRole('button', { name: 'Send reply' }).click()

  await expect(page.locator('.request').first()).toContainText('Answered')
  expect(calls).toContain('POST /inquiries/i-1/messages')
})

test('a visitor sends an inquiry from the microsite without signing in', async ({ page }) => {
  let sent = null
  await page.route('**/v1/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/v1/api', '')
    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })
    if (path === '/public/microsite') {
      return wrapped({
        profile: { name: 'Studio Lumière', type: 'PHOTOGRAPHY', city: 'Скопје', slug: 'studio-lumiere' },
        theme: 'CLASSIC', canonicalUrl: '/vendors/photography/studio-lumiere', media: [], packages: [],
        sections: { gallery: true, services: true, faq: true }, slug: 'studio-lumiere',
        details: {}, content: { hero: { title: 'Studio Lumière' }, services: [{ name: 'Свадби' }, { name: 'Конференции' }] },
      })
    }
    if (path === '/public/vendors/studio-lumiere/inquiries') {
      sent = request.postDataJSON()
      return wrapped({ received: true })
    }
    return wrapped(null)
  })

  await page.goto('/en/s/studio-lumiere')
  await page.getByRole('link', { name: /Check availability/ }).click()

  const form = page.locator('#ms-contact form')
  await form.getByLabel(/^Name/).fill('Ана')
  await form.getByLabel(/^Email/).fill('ana@example.com')
  await form.getByLabel(/^Event date/).fill('2099-10-03')
  await form.getByLabel(/^City/).fill('Охрид')
  await form.getByLabel(/^Short description/).fill('Свадба за 80 гости.')
  await form.getByLabel(/I agree/).check()
  await form.getByRole('button', { name: /Send inquiry/ }).click()

  await expect(page.getByText('Thank you!')).toBeVisible()
  expect(sent).toMatchObject({ name: 'Ана', email: 'ana@example.com', city: 'Охрид', consent: true, website: '' })
})
