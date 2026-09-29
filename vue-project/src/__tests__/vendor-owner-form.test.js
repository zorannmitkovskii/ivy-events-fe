import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'

/**
 * The admin giving a vendor its owner account. The endpoint existed; no screen
 * called it, so a vendor could not get an account at all.
 */

const service = vi.hoisted(() => ({ allVendors: vi.fn(), createOwner: vi.fn() }))
vi.mock('@/services/vendorDirectory.service', () => ({ vendorApplicationService: service }))

const VendorOwnerForm = (await import('@/components/admin/VendorOwnerForm.vue')).default
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const VENDORS = [
  { id: 'v-2', name: 'Studio Lumière' },
  { id: 'v-1', name: 'Кетеринг Вардар' },
]

async function render(props = {}) {
  service.allVendors.mockResolvedValue(VENDORS)
  const wrapper = mount(VendorOwnerForm, { props, global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper
}

beforeEach(() => vi.clearAllMocks())

describe('setting a vendor owner', () => {
  it('lists every vendor to choose from', async () => {
    const wrapper = await render()

    const options = wrapper.findAll('[data-testid="owner-vendor"] option').map((o) => o.text())
    expect(options).toContain('Studio Lumière')
    expect(options).toContain('Кетеринг Вардар')
  })

  it('creates the owner for the chosen vendor and says a temporary password was emailed', async () => {
    service.createOwner.mockResolvedValue({ data: { email: 'owner@lumiere.mk' } })
    const wrapper = await render({ preselect: 'v-2' })

    await wrapper.find('[data-testid="owner-email"]').setValue('owner@lumiere.mk')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(service.createOwner).toHaveBeenCalledWith('v-2', { email: 'owner@lumiere.mk', firstName: null, lastName: null })
    expect(wrapper.find('[data-testid="owner-done"]').text()).toContain('owner@lumiere.mk')
    expect(wrapper.find('[data-testid="owner-done"]').text()).toContain('Studio Lumière')
  })

  it("shows the server's refusal when the vendor already has an account", async () => {
    service.createOwner.mockRejectedValue({ status: 409, detail: 'Вендорот веќе има сметка' })
    const wrapper = await render({ preselect: 'v-1' })

    await wrapper.find('[data-testid="owner-email"]').setValue('second@vardar.mk')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[data-testid="owner-error"]').text()).toBe('Вендорот веќе има сметка')
    expect(wrapper.find('[data-testid="owner-done"]').exists()).toBe(false)
  })
})
