import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import PublicInquiryForm from '@/components/vendor/PublicInquiryForm.vue'
import { __resetPublicCatalog } from '@/composables/usePublicCatalog'
import en from '@/i18n/locales/en.json'

/** The event types a visitor can pick are Ivy's categories, not a hand-kept list of four. */

vi.mock('@/services/publicCatalog.service', () => ({
  publicCatalogService: {
    vendorTypes: vi.fn(),
    eventCategories: () => Promise.resolve({
      success: true,
      data: [
        { category: 'WEDDING', order: 1, available: true },
        { category: 'GRADUATION', order: 4, available: false },
      ],
    }),
  },
}))
vi.mock('@/services/vendorWorkspace.service', () => ({ vendorWorkspaceService: { sendInquiry: vi.fn() } }))

beforeEach(() => __resetPublicCatalog())

describe('the inquiry event type', () => {
  it('lists the categories from the catalogue, then "other"', async () => {
    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
    const wrapper = mount(PublicInquiryForm, { props: { slug: 'studio' }, global: { plugins: [i18n] } })
    await flushPromises()

    const labels = wrapper.findAll('select option').map((option) => option.text()).filter(Boolean)
    expect(labels).toEqual(['Weddings', 'Graduations', 'Other event'])
  })
})
