import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AdminSidebarNav from '@/components/layout/AdminSidebarNav.vue'
import en from '@/i18n/locales/en.json'

/**
 * The admin sidebar shows the screens of the tab being looked at (IVY-912),
 * not all sixteen.
 */

const route = vi.hoisted(() => ({ path: '/en/admin/dashboard', params: { lang: 'en' } }))

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/services/auth.service', () => ({
  getFullName: () => 'Ana Admin',
  logout: vi.fn(),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function render(path) {
  route.path = path
  return mount(AdminSidebarNav, {
    global: {
      plugins: [i18n],
      stubs: {
        DashSide: { template: '<div><slot name="nav" /><slot name="account" /></div>' },
        DashNavItem: {
          props: ['to', 'label', 'icon', 'active'],
          template: `<a :href="to" :aria-current="active ? 'page' : null">{{ label }}</a>`,
        },
      },
    },
  })
}

const labels = (wrapper) => wrapper.findAll('a').map((a) => a.text())

beforeEach(() => {
  route.path = '/en/admin/dashboard'
})

describe('the admin sidebar', () => {
  it('shows only the console tab on the dashboard', () => {
    expect(labels(render('/en/admin/dashboard'))).toEqual(['Dashboard', 'Site traffic', 'Settings'])
  })

  it('shows the users tab on the organizers screen', () => {
    expect(labels(render('/en/admin/organizers'))).toEqual(['Users', 'Organizers', 'Professional queue', 'Reviews'])
  })

  it('stays on the content tab while one post is open, with the blog marked', () => {
    const wrapper = render('/en/admin/blog/3f1c9a')

    expect(labels(wrapper)).toEqual(['Blog', 'Tags', 'Conversions', 'FAQ'])
    expect(wrapper.find('a[aria-current="page"]').text()).toBe('Blog')
  })

  it('marks only the screen being looked at, not one sharing its prefix', () => {
    const marked = render('/en/admin/email-send').findAll('a[aria-current="page"]')

    expect(marked.map((a) => a.text())).toEqual(['Send Emails'])
  })

  it('links in the language of the URL', () => {
    const hrefs = render('/en/admin/payments').findAll('a').map((a) => a.attributes('href'))

    expect(hrefs).toEqual(['/en/admin/events', '/en/admin/packages', '/en/admin/payments', '/en/admin/invitation-templates'])
  })
})
