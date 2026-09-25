import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import DashTopBar from '@/components/dashboard/shell/DashTopBar.vue'
import en from '@/i18n/locales/en.json'

/**
 * The workspace switch in the dashboard top bar (2026 design, IVY-908).
 *
 * <p>The mockup draws all four — my event, organiser, supplier, admin —
 * because it has no session behind it. Rendering that verbatim would offer a
 * couple planning their wedding a link to the admin console: a 403 dressed as
 * navigation. And since every account carries USER, the reverse happened too:
 * the platform administrator was offered "My event".
 *
 * <p>The administrator's switch is the tabs of the admin console (IVY-912).
 */

const roles = vi.hoisted(() => ({ current: [] }))

vi.mock('@/services/auth.service', () => ({
  hasRole: (role) => roles.current.includes(role),
}))

vi.mock('@/components/dashboard/shell/NotificationBell.vue', () => ({
  default: { template: '<div class="bell-stub" />' },
}))

vi.mock('@/components/dashboard/shell/WorkspaceNotificationBell.vue', () => ({
  default: { template: '<div class="workspace-bell-stub" />' },
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
    roles.current = ['USER']

    expect(render().find('.roles').exists()).toBe(false)
  })

  it('offers an organiser the agency workspace, not a wedding of their own', () => {
    // "My event" is the couple's tab. An organiser opens a client's event from
    // their panel; a tab of the same name in their own bar reads as if one of
    // the weddings on the platform belonged to them.
    roles.current = ['AGENCY_MEMBER', 'USER']

    // Members share the agency shell with the owner since 2026-09.
    expect(switchHrefs(render())).toEqual(['/en/agency/dashboard'])
  })

  it('offers a supplier their portal and nothing of somebody else\'s wedding', () => {
    roles.current = ['VENDOR_MEMBER', 'USER']

    expect(switchHrefs(render())).toEqual(['/en/vendor/home'])
  })

  it('offers the platform administrator the tabs of the admin console, and nothing of events', () => {
    // Every account carries USER; the administrator's does too, which is how
    // "My event" appeared on the platform console.
    roles.current = ['ADMIN', 'USER', 'AGENCY_MEMBER']

    expect(switchHrefs(render('admin'))).toEqual([
      '/en/admin/dashboard', '/en/admin/users', '/en/admin/events', '/en/admin/blog', '/en/admin/contacts',
    ])
  })

  it('offers an agency owner no switch inside the agency panel', () => {
    roles.current = ['AGENCY', 'USER']

    expect(render('agency').find('.roles').exists()).toBe(false)
  })

  it('gives an agency owner working in a client\'s event the way back to the agency, and only that', () => {
    roles.current = ['AGENCY', 'USER']

    expect(switchHrefs(render('event'))).toEqual(['/en/agency/dashboard'])
  })

  it('offers an agency owner who also supplies services both of their workspaces', () => {
    roles.current = ['AGENCY', 'USER', 'VENDOR_MEMBER']

    expect(switchHrefs(render('agency'))).toEqual(['/en/agency/dashboard', '/en/vendor/home'])
  })

  it('never offers the admin console to somebody without the role', () => {
    roles.current = ['AGENCY_MEMBER', 'VENDOR_MEMBER', 'USER']

    expect(switchHrefs(render())).not.toContain('/en/admin/dashboard')
    expect(switchHrefs(render())).toEqual(['/en/agency/dashboard', '/en/vendor/home'])
  })

  it('offers "my event" to the couple and to nobody who works here', () => {
    // The one table this rule is really about. USER cannot be the test — every
    // account carries it — so the absence of a working role is.
    const eventTab = '/en/dashboard/events/overview'

    roles.current = ['USER']
    expect(render('event').vm.workspaces.map((space) => space.to)).toContain(eventTab)

    for (const working of ['ADMIN', 'AGENCY', 'AGENCY_MEMBER', 'VENDOR_MEMBER']) {
      roles.current = [working, 'USER']
      expect(switchHrefs(render('event')))
        .not.toContain(eventTab)
    }
  })
})

describe('which one is marked', () => {
  it('marks the workspace being looked at, and only that one', () => {
    roles.current = ['ADMIN']
    const marked = render('content')
      .findAll('.roles a')
      .filter((a) => a.attributes('aria-current') === 'page')

    expect(marked).toHaveLength(1)
    expect(marked[0].attributes('href')).toBe('/en/admin/blog')
  })

  it('keeps the language of the URL rather than sending everyone to Macedonian', () => {
    roles.current = ['ADMIN']

    expect(switchHrefs(render('admin')).every((href) => href.startsWith('/en/'))).toBe(true)
  })
})

describe('which bell', () => {
  it('keeps the per-event bell in the event workspace', () => {
    roles.current = ['USER']

    expect(render('event').find('.bell-stub').exists()).toBe(true)
  })

  it('gives the agency and vendor consoles the workspace bell, which needs no event', () => {
    roles.current = ['AGENCY', 'USER']
    const wrapper = mount(DashTopBar, {
      props: { current: 'agency', workspaceNotifications: true },
      global: { plugins: [i18n], stubs: { RouterLink: true, ThemeToggle: true } },
    })

    expect(wrapper.find('.workspace-bell-stub').exists()).toBe(true)
    expect(wrapper.find('.bell-stub').exists()).toBe(false)
  })
})
