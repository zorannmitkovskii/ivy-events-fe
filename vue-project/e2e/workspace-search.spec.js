import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * The console top-bar search and bell in a real browser (audit items 2 and 8):
 * type, see the hits, press Enter, land on the screen the hit belongs to. The
 * API is stubbed with the shapes the server answers; scope is the backend's
 * integration tests' to prove.
 */

const OWNER = '11111111-1111-1111-1111-111111111111'
const VENDOR_USER = '33333333-3333-3333-3333-333333333333'

const AGENCY_HITS = [
  { kind: 'EVENT', id: 'e-1', title: 'Марија & Филип', subtitle: '2026-10-10 · Скопје', eventId: 'e-1', categoryType: 'WEDDING', status: 'ACTIVE' },
  { kind: 'LEAD', id: 'l-1', title: 'Марија Петрова', subtitle: 'maria@example.com · INQUIRY', eventId: null },
]

const VENDOR_HITS = [
  { kind: 'INQUIRY', id: 'i-1', title: 'Ивана Петрова', subtitle: 'Свадба · Скопје', eventId: null },
  { kind: 'PACKAGE', id: 'p-1', title: 'Ивана пакет', subtitle: null, eventId: null },
]

const INBOX = {
  items: [{ id: 'n-1', template: 'VENDOR_INQUIRY_RECEIVED', params: { organizerName: 'Ивана Петрова' }, createdAt: new Date().toISOString(), read: false }],
  total: 1,
  unread: 1,
}

const AGENCY_PRIVILEGES = [{ type: 'AGENCY', owner: true, privileges: [
  'agency:dashboard', 'agency:events', 'agency:crm', 'agency:calendar', 'agency:tasks',
  'agency:team', 'agency:vendors', 'agency:reports', 'agency:settings',
] }]

const VENDOR_PRIVILEGES = [{ type: 'VENDOR', owner: true, privileges: [
  'vendor:overview', 'vendor:inquiries', 'vendor:calendar', 'vendor:portfolio', 'vendor:packages',
  'vendor:profile', 'vendor:settings', 'vendor:team',
] }]

const ME = {
  vendorId: 'v-1', slug: 'studio-lumiere', name: 'Studio Lumière', type: 'PHOTOGRAPHY',
  capabilities: ['CALENDAR', 'GALLERY', 'PACKAGES'], approvalStatus: 'APPROVED',
}

let queries = []

async function stubApi(page, privileges) {
  queries = []
  await page.route('**/v1/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/v1/api', '')
    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })
    if (path === '/analytics/agency/search') {
      queries.push(url.searchParams.get('q'))
      return wrapped(AGENCY_HITS)
    }
    if (path === '/vendor-portal/search') {
      queries.push(url.searchParams.get('q'))
      return wrapped(VENDOR_HITS)
    }
    if (path === '/me/notifications/unread-count') return wrapped({ count: INBOX.unread })
    if (path === '/me/notifications') return wrapped(INBOX)
    if (path === '/vendor-portal/me') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ME) })
    if (path === '/vendor-portal/inbox') return wrapped([])
    if (path === '/me/privileges') return wrapped(privileges)
    return wrapped(null)
  })
}

test('agency: typing finds a client, Enter opens the pipeline', async ({ page }) => {
  await stubApi(page, AGENCY_PRIVILEGES)
  await signIn(page, { userId: OWNER, eventId: 'none', lang: 'en', roles: ['AGENCY', 'USER'] })
  await page.goto('/en/agency/tasks')

  const box = page.getByRole('combobox', { name: 'Search events, clients, team…' })
  await box.fill('мари')

  const list = page.getByRole('listbox')
  await expect(list.getByRole('option')).toHaveCount(2)
  await expect(list).toContainText('Events')
  await expect(list).toContainText('Clients')
  expect(queries).toEqual(['мари'])

  await box.press('ArrowDown')
  await box.press('Enter')
  await expect(page).toHaveURL(/\/en\/agency\/pipeline$/)
  await expect(list).toHaveCount(0)
})

test('agency: an event hit selects the event and opens its workspace', async ({ page }) => {
  await stubApi(page, AGENCY_PRIVILEGES)
  await signIn(page, { userId: OWNER, eventId: 'none', lang: 'en', roles: ['AGENCY', 'USER'] })
  await page.goto('/en/agency/pipeline')

  const box = page.getByRole('combobox', { name: 'Search events, clients, team…' })
  await box.fill('марија')
  await expect(page.getByRole('option')).toHaveCount(2)
  await box.press('Enter')

  await expect(page).toHaveURL(/\/en\/dashboard\/events\/overview/)
})

test('vendor: an inquiry hit opens that inquiry in the inbox, and the bell rings without an event', async ({ page }) => {
  await stubApi(page, VENDOR_PRIVILEGES)
  await signIn(page, { userId: VENDOR_USER, eventId: 'none', lang: 'en', roles: ['VENDOR', 'USER'] })
  await page.goto('/en/vendor/packages')

  await page.getByRole('button', { name: 'Notifications' }).click()
  await expect(page.locator('.wbell-list')).toContainText('New inquiry from Ивана Петрова')
  await page.keyboard.press('Escape')

  const box = page.getByRole('combobox', { name: 'Search enquiries, quotes, messages…' })
  await box.fill('ивана')
  await expect(page.getByRole('option')).toHaveCount(2)
  await box.press('Enter')

  await expect(page).toHaveURL(/\/en\/vendor\/inbox\?inquiry=i-1$/)
})
