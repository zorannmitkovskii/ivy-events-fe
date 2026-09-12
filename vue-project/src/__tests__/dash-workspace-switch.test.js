import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import DashTopBar from '@/components/dashboard/shell/DashTopBar.vue'
import en from '@/i18n/locales/en.json'

/**
 * The workspace switch in the dashboard top bar (2026 design).
 *
 * <p>The mockup draws all four — my event, organiser, supplier, admin —
 * because it has no session behind it. Rendering that verbatim would offer a
 * couple planning their wedding a link to the admin console: a 403 dressed as
 * navigation, and the kind of thing people report as a security hole whether or
 * not the server refuses.
 */

const roles = vi.hoisted(() => ({ current: [] }))

vi.mock('@/services/auth.service', () => ({
  hasRole: (role) => roles.current.includes(role),
}))

vi.mock('@/components/dashboard/shell/NotificationBell.vue', () => ({
  default: { template: '<div class="bell-stub" />' },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en' } }),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function render(current = 'event') {
  return mount(DashTopBar, {
    props: { current },
    global: {
      plugins: [i18n],
      stubs: {
        RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        ThemeToggle: true,
      },
    },
  })
}

const switchHrefs = (wrapper) => wrapper.findAll('.roles a').map((a) => a.attributes('href'))

beforeEach(() => {
  roles.current = []
})

describe('which workspaces are offered', () => {
  it('offers no switch at all to somebody who only has their own event', () => {
    // One destination is not a choice, and a row of one reads as a tab bar
    // with three missing.
    expect(render().find('.roles').exists()).toBe(false)
  })

  it('offers the organiser workspace to an organiser', () => {
    roles.current = ['ORGANIZER']

    expect(switchHrefs(render())).toEqual(['/en/dashboard/events/overview', '/en/organizer'])
  })

  it('offers the agency workspace to an agency owner, who is not an ORGANIZER', () => {
    // Signing up as an agency grants ORG_ADMIN and USER but not ORGANIZER —
    // the exact gap that once sent agency owners to the single-event dashboard.
    roles.current = ['ORG_ADMIN']

    expect(switchHrefs(render())).toContain('/en/organizer')
  })

  it('never offers the admin console to somebody without the role', () => {
    roles.current = ['ORGANIZER', 'VENDOR']

    expect(switchHrefs(render())).not.toContain('/en/admin/dashboard')
  })

  it('offers all four to somebody who really is all four', () => {
    roles.current = ['ORGANIZER', 'VENDOR', 'ADMIN']

    expect(switchHrefs(render())).toEqual([
      '/en/dashboard/events/overview',
      '/en/organizer',
      '/en/vendor/calendar',
      '/en/admin/dashboard',
    ])
  })
})

describe('which one is marked', () => {
  it('marks the workspace being looked at, and only that one', () => {
    roles.current = ['ADMIN']
    const marked = render('admin')
      .findAll('.roles a')
      .filter((a) => a.attributes('aria-current') === 'page')

    expect(marked).toHaveLength(1)
    expect(marked[0].attributes('href')).toBe('/en/admin/dashboard')
  })

  it('keeps the language of the URL rather than sending everyone to Macedonian', () => {
    roles.current = ['ADMIN']

    expect(switchHrefs(render()).every((href) => href.startsWith('/en/'))).toBe(true)
  })
})
