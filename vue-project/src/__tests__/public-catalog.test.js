import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { __resetPublicCatalog, useVendorTypes } from '@/composables/usePublicCatalog'
import VendorApplicationPage from '@/pages/vendorDashboard/VendorApplicationPage.vue'
import en from '@/i18n/locales/en.json'

/** The vendor trades come from the server once, and every screen reads that one list. */

const { vendorTypesMock } = vi.hoisted(() => ({ vendorTypesMock: vi.fn() }))

vi.mock('@/services/publicCatalog.service', () => ({
  publicCatalogService: { vendorTypes: vendorTypesMock, eventCategories: vi.fn() },
}))
vi.mock('@/services/vendorDirectory.service', () => ({
  vendorApplicationService: { mine: () => Promise.resolve(null) },
}))

const TRADES = [{ code: 'PHOTOGRAPHY', capabilities: ['GALLERY'] }, { code: 'HOST_EMCEE', capabilities: [] }, { code: 'OTHER', capabilities: [] }]

beforeEach(() => {
  __resetPublicCatalog()
  vendorTypesMock.mockReset().mockResolvedValue({ success: true, data: TRADES })
})

describe('useVendorTypes', () => {
  it('asks the server once, however many screens load it', async () => {
    const first = useVendorTypes()
    const second = useVendorTypes()
    await Promise.all([first.load(), second.load()])
    await second.load()

    expect(vendorTypesMock).toHaveBeenCalledTimes(1)
    expect(second.codes.value).toEqual(['PHOTOGRAPHY', 'HOST_EMCEE', 'OTHER'])
  })

  it('reports a failed read rather than inventing a list', async () => {
    vendorTypesMock.mockRejectedValue(new Error('offline'))
    const { codes, failed, load } = useVendorTypes()
    await load()

    expect(failed.value).toBe(true)
    expect(codes.value).toEqual([])
  })
})

describe('the vendor application form', () => {
  it('offers every trade the server lists', async () => {
    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
    const wrapper = mount(VendorApplicationPage, { global: { plugins: [i18n] } })
    await flushPromises()

    const values = wrapper.findAll('select option').map((option) => option.attributes('value')).filter(Boolean)
    expect(values).toEqual(['PHOTOGRAPHY', 'HOST_EMCEE', 'OTHER'])
  })
})
