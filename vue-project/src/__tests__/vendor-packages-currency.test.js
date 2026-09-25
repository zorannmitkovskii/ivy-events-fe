import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import VendorPackagesPage from '@/pages/vendorDashboard/VendorPackagesPage.vue'
import en from '@/i18n/locales/en.json'

/** A new package starts in the currency the vendor already prices in. */

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }))

vi.mock('@/services/vendorPortal.service', () => ({ vendorPortalService: { listPackages: listMock } }))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

async function newPackageCurrency(packages) {
  listMock.mockResolvedValue(packages)
  const wrapper = mount(VendorPackagesPage, { global: { plugins: [i18n], stubs: { PageHeader: { template: '<div><slot name="actions" /></div>' } } } })
  await flushPromises()
  await wrapper.find('.btn-primary').trigger('click')
  return wrapper.find('.editor select:not(.course)').element.value
}

describe('a new package', () => {
  it('is priced in the currency of the vendor\'s existing packages', async () => {
    expect(await newPackageCurrency([{ id: 'p-1', name: 'Gold', currency: 'EUR', items: [] }])).toBe('EUR')
  })

  it('is priced in denars when the vendor has nothing priced yet', async () => {
    expect(await newPackageCurrency([])).toBe('MKD')
  })
})
