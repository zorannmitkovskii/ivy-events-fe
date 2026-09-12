import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AgencySidebarNav from '@/components/layout/AgencySidebarNav.vue'
import en from '@/i18n/locales/en.json'

/**
 * The agency console's navigation (IVY-1401).
 *
 * <p>These screens had no shell, so the dashboard's tile grid was the only way
 * between them — and the redesign removed the tiles on the strength of a claim
 * that a sidebar already held the same links. It did not. This file is where
 * that guarantee now lives, so the tiles can never be removed again without
 * something failing.
 */

vi.mock('@/services/auth.service', () => ({
  getFullName: () => 'Zoran Mitkovski',
  logout: vi.fn(),
}))

// The context card asks for the plan on mount. Not what this file is about,
// and an unmocked call would reach the network from a unit test.
vi.mock('@/services/crm.service', () => ({
  crmService: { plan: () => Promise.resolve({ tier: 'PRO', activeEventCount: 3 }) },
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const render = (path = '/en/org/dashboard') =>
  mount(AgencySidebarNav, {
    global: {
      plugins: [i18n],
      mocks: { $route: { params: { lang: 'en' }, path } },
      stubs: {
        RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        SidebarAccount: true,
        // The shell renders the dark chrome around the rows; what this file
        // guards is the rows, so the shell is a passthrough for its slots.
        DashSide: {
          template: '<div><slot name="context" /><slot name="nav" /><slot name="promo" /><slot name="account" /></div>',
        },
        DashNavItem: {
          props: ['to', 'label', 'icon', 'active'],
          template: '<a class="nav-item" :href="to" :data-active="active">{{ label }}</a>',
        },
      },
    },
  })

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRoute: () => ({ params: { lang: 'en' }, path: currentPath }),
    useRouter: () => ({ push: vi.fn() }),
  }
})

let currentPath = '/en/org/dashboard'

describe('what the agency can reach', () => {
  it('offers every agency screen, so none is reachable only by typing the URL', () => {
    const hrefs = render().findAll('.nav-item').map((a) => a.attributes('href'))

    expect(hrefs).toContain('/en/org/dashboard')
    expect(hrefs).toContain('/en/organizer')
    expect(hrefs).toContain('/en/org/users')
    expect(hrefs).toContain('/en/org/settings')
  })

  it('offers the pipeline, which belongs to the agency and not to an event', () => {
    const hrefs = render().findAll('.nav-item').map((a) => a.attributes('href'))

    expect(hrefs).toContain('/en/org/pipeline')
  })

  it('marks the screen being looked at, so the reader knows where they are', () => {
    currentPath = '/en/org/users'
    const active = render().findAll('.nav-item').filter((a) => a.attributes('data-active') === 'true')

    expect(active).toHaveLength(1)
    expect(active[0].attributes('href')).toBe('/en/org/users')
    currentPath = '/en/org/dashboard'
  })

  it('keeps the language of the URL, rather than sending everyone to Macedonian', () => {
    const hrefs = render().findAll('.nav-item').map((a) => a.attributes('href'))

    expect(hrefs.every((href) => href.startsWith('/en/'))).toBe(true)
  })
})
