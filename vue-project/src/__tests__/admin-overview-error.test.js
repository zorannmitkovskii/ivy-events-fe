import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AdminOverviewPage from '@/pages/adminDashboard/AdminOverviewPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The dashboard when the request fails (IVY-1101).
 *
 * <p>Its own file rather than a case in {@code admin-overview.test.js}: the
 * rejection is reported as unhandled when it shares a module mock with tests
 * that resolve, and the resulting failure says nothing about the component. In
 * isolation the assertion is exactly what it looks like.
 *
 * <p>What it pins: a refused or broken request must say so. An admin looking at
 * a dashboard that quietly rendered nothing would read it as a quiet platform,
 * which is the opposite of the truth.
 */

const { adminMock } = vi.hoisted(() => ({ adminMock: vi.fn() }))

vi.mock('@/services/analytics.service', () => ({
  analyticsService: { admin: adminMock }
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en' }, query: {} }),
  useRouter: () => ({ replace: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' }
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

describe('failure is visible', () => {
  it('shows the message instead of an empty dashboard', async () => {
    adminMock.mockImplementation(() => Promise.reject(new Error('Access is denied')))

    const wrapper = mount(AdminOverviewPage, { global: { plugins: [i18n] } })
    await flushPromises()

    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('Access is denied')
    // No cards, rather than cards full of zeroes that look like real numbers.
    expect(wrapper.find('.cards').exists()).toBe(false)
  })
})
