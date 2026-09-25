import { describe, it, expect } from 'vitest'
import { ADMIN_SECTIONS, adminSectionFor, adminSegment } from '@/components/layout/adminSections.js'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * The admin console's tabs and their sidebars (IVY-912).
 *
 * <p>The sidebar had grown to sixteen rows. Grouping it is only an improvement
 * if no screen falls out of the navigation on the way, and no tab quietly grows
 * back into the long list.
 */

const ADMIN_SCREENS = [
  'dashboard', 'events', 'packages', 'payments', 'users', 'organizers', 'settings', 'reviews',
  'vendor-queue', 'contacts', 'faq', 'invitation-templates', 'email-templates', 'email-send',
  'blog', 'tags', 'content-analytics', 'site-analytics',
]

const MAX_ITEMS_PER_TAB = 4

const allPaths = () => ADMIN_SECTIONS.flatMap((section) => section.items.map((item) => item.path))

describe('the grouping', () => {
  it('keeps every admin screen reachable from exactly one tab', () => {
    expect([...allPaths()].sort()).toEqual([...ADMIN_SCREENS].sort())
  })

  it('keeps every tab short', () => {
    for (const section of ADMIN_SECTIONS) {
      expect(section.items.length, section.key).toBeLessThanOrEqual(MAX_ITEMS_PER_TAB)
    }
  })

  it('has the agreed tabs, in order', () => {
    expect(ADMIN_SECTIONS.map((section) => section.key)).toEqual(['admin', 'users', 'events', 'content', 'messages'])
  })

  it('names every tab and every item in all three languages', () => {
    for (const messages of [en, mk, sq]) {
      for (const section of ADMIN_SECTIONS) {
        expect(messages.dash.workspaces[section.key], section.key).toBeTruthy()
        for (const item of section.items) {
          expect(messages.admin.sidebar[item.key], item.key).toBeTruthy()
        }
      }
    }
  })
})

describe('which tab a page belongs to', () => {
  it.each([
    ['/mk/admin/dashboard', 'admin'],
    ['/en/admin/vendor-queue', 'users'],
    ['/en/admin/payments', 'events'],
    ['/sq/admin/email-send', 'messages'],
  ])('%s is in %s', (path, key) => {
    expect(adminSectionFor(path).key).toBe(key)
  })

  it('keeps the tab on pages below a screen, like one blog post', () => {
    expect(adminSectionFor('/en/admin/blog/3f1c9a').key).toBe('content')
    expect(adminSectionFor('/en/admin/blog/new').key).toBe('content')
  })

  it('ignores a query or a fragment', () => {
    expect(adminSectionFor('/en/admin/users?page=2').key).toBe('users')
    expect(adminSectionFor('/en/admin/dashboard#charts').key).toBe('admin')
  })

  it('falls back to the console tab for a page it does not know', () => {
    expect(adminSectionFor('/en/admin/something-new').key).toBe('admin')
    expect(adminSectionFor('').key).toBe('admin')
  })
})

describe('the screen segment', () => {
  it('is the whole first segment, never a prefix of another', () => {
    expect(adminSegment('/en/admin/email-templates')).toBe('email-templates')
    expect(adminSegment('/en/admin/email-send')).toBe('email-send')
  })

  it('is empty outside the admin console', () => {
    expect(adminSegment('/en/dashboard/events/overview')).toBe('')
  })
})
