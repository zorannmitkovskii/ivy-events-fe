import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import EventCategories from '@/components/landingPage/EventCategories.vue'
import EventCategoryPage from '@/pages/onboarding/EventCategoryPage.vue'
import { __resetPublicCatalog } from '@/composables/usePublicCatalog'
import { clearOnboarding, setSelectedCategory } from '@/store/onboarding.store'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'

/**
 * The category cards and the types under them are the server's
 * (`GET /public/event-categories`): order, badge, which ones are open, the
 * sample name in each language, and a birthday's adult / child choice.
 */

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }))

const CARDS = [
  { category: 'WEDDING', order: 1, available: true, featured: true, tint: '', sample: { mk: 'Елена & Никола', en: 'Elena & Nikola' }, types: ['WEDDING'] },
  { category: 'BIRTHDAY', order: 2, available: true, featured: false, tint: 'rose', sample: { mk: 'Миа полни 8' }, types: ['BIRTHDAY_ADULT', 'BIRTHDAY_CHILD'] },
  { category: 'GRADUATION', order: 4, available: false, featured: false, tint: 'lav', sample: { mk: 'Генерација 2026', en: 'Class of 2026' }, types: ['GRADUATION'] },
]

vi.mock('@/services/publicCatalog.service', () => ({
  publicCatalogService: { vendorTypes: vi.fn(), eventCategories: () => Promise.resolve({ success: true, data: CARDS }) },
}))
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => ({ params: { lang: 'en' }, query: {} }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))
vi.mock('@/services/auth.service', () => ({ isAuthenticated: () => true, getUsername: () => 'e2e@example.com' }))
vi.mock('@/services/events.service', () => ({ eventsService: { create: createMock } }))

const i18nIn = (locale) => createI18n({ legacy: false, locale, messages: { en, mk } })
const stubs = { RouterLink: { template: '<a><slot /></a>' }, OnboardingFooterLinks: true }

beforeEach(() => {
  __resetPublicCatalog()
  clearOnboarding()
  createMock.mockReset().mockResolvedValue({ id: 'e-1' })
})

describe('the category cards', () => {
  async function render(locale = 'en') {
    const wrapper = mount(EventCategories, { global: { plugins: [i18nIn(locale)], stubs } })
    await flushPromises()
    return wrapper
  }

  it('draws the cards in the server order, with the category name and the sample in the page language', async () => {
    const cards = (await render()).findAll('.cat')

    expect(cards.map((card) => card.find('.type').text())).toEqual(['Weddings', 'Birthdays & Parties', 'Graduations'])
    expect(cards[0].find('.title').text()).toBe('Elena & Nikola')
    expect(cards[2].classes()).toContain('lav')
  })

  it('falls back to the Macedonian sample when the page language has none', async () => {
    expect((await render()).findAll('.cat')[1].find('.title').text()).toBe('Миа полни 8')
  })

  it('badges only the featured card, and marks a category the server has not opened as coming soon', async () => {
    const cards = (await render()).findAll('.cat')

    expect(cards.filter((card) => card.find('.badge-gold').exists())).toHaveLength(1)
    expect(cards[2].element.tagName).toBe('SPAN')
    expect(cards[2].text()).toContain('Coming Soon')
    expect(cards[1].element.tagName).toBe('BUTTON')
  })

  it('emits the card id the onboarding flow maps back to the category', async () => {
    const wrapper = await render()
    await wrapper.findAll('.cat')[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['birthdays'])
  })
})

describe('the category page', () => {
  async function render() {
    const wrapper = mount(EventCategoryPage, { global: { plugins: [i18nIn('en')], stubs } })
    await flushPromises()
    return wrapper
  }

  it('asks adult or child for a birthday, from the types the server lists', async () => {
    setSelectedCategory('BIRTHDAY')
    const wrapper = await render()

    expect(wrapper.findAll('.type-option').map((option) => option.text())).toEqual(["An adult's", "A child's"])
  })

  it('asks nothing for a category with a single type', async () => {
    setSelectedCategory('WEDDING')

    expect((await render()).find('.type-choice').exists()).toBe(false)
  })

  it('names a new gallery by the category, in the page language', async () => {
    setSelectedCategory('GALLERY')
    const wrapper = await render()

    await wrapper.find('.action-btn').trigger('click')
    await flushPromises()

    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Photo Gallery', categoryType: 'GALLERY' }))
  })
})
