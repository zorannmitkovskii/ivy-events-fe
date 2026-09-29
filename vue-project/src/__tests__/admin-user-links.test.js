import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import UserDirectory from '@/components/users/UserDirectory.vue'
import en from '@/i18n/locales/en.json'

/**
 * The platform administrator's user editor with every role.
 *
 * <p>An agency role needs an agency and a vendor role a vendor — without the
 * link the account signs in to a workspace with nothing in it. So the fields
 * appear with the role, the common mistakes are named before saving, and the
 * link travels with the roles.
 */

const svc = vi.hoisted(() => ({
  getAllAdminUsers: vi.fn(),
  getAdminUser: vi.fn(),
  createAdminUser: vi.fn(),
  updateAdminUser: vi.fn(),
  deleteUser: vi.fn(),
  getAllAgencies: vi.fn(),
}))
const vendorsApi = vi.hoisted(() => ({ allVendors: vi.fn() }))

vi.mock('@/services/userService', () => svc)
vi.mock('@/services/vendorDirectory.service', () => ({ vendorApplicationService: vendorsApi }))
vi.mock('@/services/events.service', () => ({ eventsService: { getAll: () => Promise.resolve([]) } }))

const ROLES = ['ADMIN', 'AGENCY', 'AGENCY_MEMBER', 'VENDOR', 'VENDOR_MEMBER', 'USER']
const AGENCY = { id: 'org-1', name: 'Ивена', ownerEmail: 'owner@ivena.mk' }
const STUDIO = { id: 'v-1', name: 'Studio Lumière', type: 'PHOTOGRAPHY' }
const CATERING = { id: 'v-2', name: 'Кетеринг Вардар', type: 'CATERING' }

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

async function openCreate() {
  const wrapper = mount(UserDirectory, {
    props: { title: 'Users', roleOptions: ROLES, linkRoles: true },
    global: { plugins: [i18n] },
  })
  await flushPromises()
  await wrapper.find('.btn-create').trigger('click')
  await flushPromises()
  const inputs = wrapper.findAll('.dialog .form-input')
  await inputs[0].setValue('Ана')
  await inputs[1].setValue('Петрова')
  await inputs[2].setValue('ana@example.mk')
  return wrapper
}

async function tick(wrapper, role, on = true) {
  await wrapper.find(`.dialog input[type="checkbox"][value="${role}"]`).setValue(on)
}

beforeEach(() => {
  vi.clearAllMocks()
  svc.getAllAdminUsers.mockResolvedValue([])
  svc.createAdminUser.mockResolvedValue({})
  svc.updateAdminUser.mockResolvedValue({})
  svc.getAllAgencies.mockResolvedValue([AGENCY])
  vendorsApi.allVendors.mockResolvedValue([STUDIO, CATERING])
})

describe('the links a role needs', () => {
  it('offers every role, and asks for nothing extra until an agency or vendor role is ticked', async () => {
    const wrapper = await openCreate()

    const offered = wrapper.findAll('.dialog input[type="checkbox"]').map((box) => box.attributes('value'))
    expect(offered).toEqual(expect.arrayContaining(ROLES))
    expect(wrapper.find('[data-testid="link-agency"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="link-vendor"]').exists()).toBe(false)

    await tick(wrapper, 'AGENCY_MEMBER')
    expect(wrapper.find('[data-testid="link-agency"]').text()).toContain('Ивена')
    // An organizer joins an agency; only an owner may bring a new one.
    expect(wrapper.find('[data-testid="link-agency"] input[type="radio"]').exists()).toBe(false)

    await tick(wrapper, 'AGENCY_MEMBER', false)
    await tick(wrapper, 'VENDOR_MEMBER')
    expect(wrapper.find('[data-testid="link-vendor"]').text()).toContain('Studio Lumière')
  })

  it('names a missing agency or vendor before sending anything', async () => {
    const wrapper = await openCreate()
    await tick(wrapper, 'USER', false)
    await tick(wrapper, 'AGENCY_MEMBER')
    await wrapper.find('.btn-save').trigger('click')
    expect(wrapper.find('.form-error').text()).toBe(en.userDirectory.links.agencyRequired)

    await tick(wrapper, 'AGENCY_MEMBER', false)
    await tick(wrapper, 'VENDOR')
    await wrapper.find('.btn-save').trigger('click')
    expect(wrapper.find('.form-error').text()).toBe(en.userDirectory.links.vendorRequired)

    await tick(wrapper, 'AGENCY')
    await wrapper.find('.btn-save').trigger('click')
    expect(wrapper.find('.form-error').text()).toBe(en.userDirectory.links.agencyAndVendor)

    expect(svc.createAdminUser).not.toHaveBeenCalled()
  })

  it('sends an organizer with the chosen agency, and nothing for a vendor', async () => {
    const wrapper = await openCreate()
    await tick(wrapper, 'USER', false)
    await tick(wrapper, 'AGENCY_MEMBER')
    await wrapper.find('[data-testid="link-agency"] select').setValue('org-1')
    await wrapper.find('.btn-save').trigger('click')
    await flushPromises()

    expect(svc.createAdminUser).toHaveBeenCalledWith(expect.objectContaining({
      roles: ['AGENCY_MEMBER'], orgId: 'org-1', newOrganizationName: null, vendorId: null,
    }))
  })

  it('lets a new owner bring a new agency by name', async () => {
    const wrapper = await openCreate()
    await tick(wrapper, 'USER', false)
    await tick(wrapper, 'AGENCY')
    await wrapper.find('[data-testid="link-agency"] input[value="new"]').setValue(true)
    await wrapper.find('[data-testid="link-agency"] input[type="text"]').setValue('  Нова агенција ')
    await wrapper.find('.btn-save').trigger('click')
    await flushPromises()

    expect(svc.createAdminUser).toHaveBeenCalledWith(expect.objectContaining({
      roles: ['AGENCY'], orgId: null, newOrganizationName: 'Нова агенција',
    }))
  })

  it('finds a vendor by name and sends it with VENDOR', async () => {
    const wrapper = await openCreate()
    await tick(wrapper, 'USER', false)
    await tick(wrapper, 'VENDOR')
    await wrapper.find('[data-testid="link-vendor"] input[type="text"]').setValue('варда')

    const shown = wrapper.findAll('[data-testid="link-vendor"] option').map((option) => option.text())
    expect(shown.some((name) => name.includes('Кетеринг Вардар'))).toBe(true)
    expect(shown.some((name) => name.includes('Studio Lumière'))).toBe(false)

    await wrapper.find('[data-testid="link-vendor"] select').setValue('v-2')
    await wrapper.find('.btn-save').trigger('click')
    await flushPromises()

    expect(svc.createAdminUser).toHaveBeenCalledWith(expect.objectContaining({ roles: ['VENDOR'], vendorId: 'v-2', orgId: null }))
  })

  it('shows the links a user already has when editing', async () => {
    svc.getAllAdminUsers.mockResolvedValue([{ id: 'u1', firstName: 'Ана', lastName: 'П', email: 'a@x.mk', roles: ['VENDOR_MEMBER'], enabled: true }])
    svc.getAdminUser.mockResolvedValue({ id: 'u1', firstName: 'Ана', lastName: 'П', email: 'a@x.mk', roles: ['VENDOR_MEMBER'], vendorId: 'v-1' })
    const wrapper = mount(UserDirectory, {
      props: { title: 'Users', roleOptions: ROLES, linkRoles: true },
      global: { plugins: [i18n] },
    })
    await flushPromises()

    await wrapper.find('.action-btn--edit').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="link-vendor"] select').element.value).toBe('v-1')
  })

  it('stays out of the way on an agency owner\'s team screen', async () => {
    const wrapper = mount(UserDirectory, {
      props: { title: 'Team', roleOptions: ['AGENCY_MEMBER', 'USER'] },
      global: { plugins: [i18n] },
    })
    await flushPromises()
    await wrapper.find('.btn-create').trigger('click')
    await tick(wrapper, 'AGENCY_MEMBER')

    expect(wrapper.find('[data-testid="link-agency"]').exists()).toBe(false)
    expect(svc.getAllAgencies).not.toHaveBeenCalled()
  })
})
