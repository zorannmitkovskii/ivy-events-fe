import { DashIcons } from '@/utils/dashIcons.js'

/**
 * The admin console, grouped into the tabs of its top bar (IVY-912).
 *
 * <p>One definition feeds both the tabs and the sidebar, so a screen cannot be
 * in a tab without being in that tab's sidebar. A tab opens on its first item.
 * Sixteen screens in one sidebar had become a list nobody scanned; each tab
 * keeps at most four.
 */

/*
  The privilege is derived from the path rather than written out, because the
  two are the same list and a second copy of a list is a list that drifts.
  `admin:site-analytics` is the wire name the backend stores for the screen
  at `site-analytics`.
*/
const item = (key, path, icon) => ({
  key,
  path,
  privilege: `admin:${path}`,
  labelKey: `admin.sidebar.${key}`,
  icon,
})

export const ADMIN_SECTIONS = [
  {
    key: 'admin',
    items: [
      item('dashboard', 'dashboard', DashIcons.overview),
      item('siteAnalytics', 'site-analytics', DashIcons.reports),
      item('settings', 'settings', DashIcons.settings),
    ],
  },
  {
    key: 'users',
    items: [
      item('users', 'users', DashIcons.guests),
      item('organizers', 'organizers', DashIcons.team),
      item('vendorQueue', 'vendor-queue', DashIcons.vendors),
      item('reviews', 'reviews', DashIcons.reviews),
    ],
  },
  {
    key: 'events',
    items: [
      item('events', 'events', DashIcons.calendar),
      item('packages', 'packages', DashIcons.packages),
      item('payments', 'payments', DashIcons.payments),
      item('invitationTemplates', 'invitation-templates', DashIcons.gallery),
    ],
  },
  {
    // An article belongs to the site, not to somebody's wedding (EPIC-09).
    key: 'content',
    items: [
      item('blog', 'blog', DashIcons.quotes),
      item('tags', 'tags', DashIcons.link),
      item('contentAnalytics', 'content-analytics', DashIcons.reports),
      item('faq', 'faq', DashIcons.support),
    ],
  },
  {
    key: 'messages',
    items: [
      item('contacts', 'contacts', DashIcons.messages),
      item('emailTemplates', 'email-templates', DashIcons.postEvent),
      item('emailSend', 'email-send', DashIcons.messages),
    ],
  },
]

const ADMIN_PREFIX = '/admin/'

/** The first path segment after `/admin/`: `blog` for `/mk/admin/blog/42`. */
export function adminSegment(path) {
  const value = String(path || '')
  const start = value.indexOf(ADMIN_PREFIX)
  if (start < 0) return ''
  return value.slice(start + ADMIN_PREFIX.length).split(/[/?#]/)[0]
}

/** The tab a path belongs to; the console's own tab for anything unknown. */
export function adminSectionFor(path) {
  const segment = adminSegment(path)
  return ADMIN_SECTIONS.find((section) => section.items.some((entry) => entry.path === segment)) ?? ADMIN_SECTIONS[0]
}
