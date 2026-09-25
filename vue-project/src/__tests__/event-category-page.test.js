import { describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import EventCategoryPage from '@/pages/onboarding/EventCategoryPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The category cards are the landing page's, styled in `ivy/site.css` under
 * `.ivy-site`. Without that wrapper this page rendered them as a line of raw
 * text and full-size SVG leaves — which is what "the page is broken" was.
 */

vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => ({ params: { lang: 'en' }, query: {} }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))
vi.mock('@/services/auth.service', () => ({ isAuthenticated: () => true, getUsername: () => 'e2e@example.com' }))
vi.mock('@/services/events.service', () => ({ eventsService: {} }))
vi.mock('@/services/publicCatalog.service', () => ({ publicCatalogService: { eventCategories: () => Promise.resolve({ data: [] }) } }))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

describe('the event category page', () => {
  it('renders inside the site design scope the category cards are styled under', () => {
    const wrapper = shallowMount(EventCategoryPage, { global: { plugins: [i18n] } })

    expect(wrapper.classes()).toContain('ivy-site')
    expect(wrapper.find('.ivy-site > .category-page').exists()).toBe(true)
  })
})
