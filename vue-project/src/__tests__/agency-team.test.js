import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AgencyTeamPage from '@/pages/dashboard/AgencyTeamPage.vue'
import AdminUsersPage from '@/pages/adminDashboard/AdminUsersPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The agency's team screen (IVY-1203).
 *
 * <p>What is pinned here is what an agency owner may do, not how the table
 * looks. The screen shares its component and its endpoints with the platform
 * administrator's — the server is what narrows the answer to one organization —
 * so the properties worth a test are the ones that differ between the two
 * callers, plus the one that must never differ: no organization id is ever
 * sent.
 */

const { getAdminUsers, getAdminUser, createAdminUser, updateAdminUser, deleteUser, getAll } =
  vi.hoisted(() => ({
    getAdminUsers: vi.fn(),
    getAdminUser: vi.fn(),
    createAdminUser: vi.fn(),
    updateAdminUser: vi.fn(),
    deleteUser: vi.fn(),
    getAll: vi.fn()
  }))

vi.mock('@/services/userService', () => ({
  getAllAdminUsers: (...args) => getAdminUsers(...args),
  getAdminUser: (...args) => getAdminUser(...args),
  createAdminUser: (...args) => createAdminUser(...args),
  updateAdminUser: (...args) => updateAdminUser(...args),
  deleteUser: (...args) => deleteUser(...args)
}))

vi.mock('@/services/events.service', () => ({
  eventsService: { getAll: (...args) => getAll(...args) }
}))

vi.mock('@/services/backendApi', () => ({ subscribeToDiscounts: vi.fn() }))

// The workload panel above the accounts reads the agency home; empty here so
// every row these tests count is the accounts table's.
vi.mock('@/services/agencyWorkspace.service', () => ({
  agencyWorkspaceService: { home: vi.fn().mockResolvedValue({ data: { team: { members: [], unassignedOverdue: 0 }, kpis: {}, events: [] } }) },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en' }, query: {} }),
  useRouter: () => ({ replace: vi.fn() }),
  RouterLink: { props: ['to'], template: '<a :href="String(to)"><slot /></a>' }
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const TEAM = [
  { id: '1', firstName: 'Ana', lastName: 'Ivanova', email: 'ana@agency.mk', roles: ['AGENCY_MEMBER'], eventIds: [] },
  { id: '2', firstName: 'Owner', lastName: 'Person', email: 'owner@agency.mk', roles: ['AGENCY'], eventIds: [] }
]

beforeEach(() => {
  getAdminUsers.mockReset().mockResolvedValue(TEAM)
  getAdminUser.mockReset().mockResolvedValue(TEAM[0])
  createAdminUser.mockReset().mockResolvedValue({ id: '3' })
  updateAdminUser.mockReset().mockResolvedValue({ id: '1' })
  deleteUser.mockReset().mockResolvedValue(undefined)
  getAll.mockReset().mockResolvedValue([])
})

async function render(component = AgencyTeamPage) {
  const wrapper = mount(component, { global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper
}

describe('scope', () => {
  it('asks for users without naming an organization — the server reads it from the token', async () => {
    await render()

    expect(getAdminUsers).toHaveBeenCalledTimes(1)
    const [params] = getAdminUsers.mock.calls[0]
    expect(params).not.toHaveProperty('orgId')
  })

  it('never asks for a package filter, which is a platform concern', async () => {
    const wrapper = await render()

    expect(wrapper.text()).not.toContain('All Packages')
    const [params] = getAdminUsers.mock.calls[0]
    expect(params).not.toHaveProperty('packageType')
  })
})

describe('the roles an agency may hand out', () => {
  it('offers ORGANIZER and USER, and neither ADMIN nor ORG_ADMIN', async () => {
    const wrapper = await render()
    const options = wrapper.findAll('.filter-select option').map((o) => o.text())

    expect(options).toContain('AGENCY_MEMBER')
    expect(options).toContain('USER')
    expect(options).not.toContain('ADMIN')
    expect(options).not.toContain('AGENCY')
  })

  it('starts a new user as an ORGANIZER, since that is what an agency hires', async () => {
    const wrapper = await render()
    await wrapper.find('.btn-create').trigger('click')
    await flushPromises()

    const checked = wrapper.findAll('.checkbox-group input[type="checkbox"]')
      .filter((input) => input.element.checked)
      .map((input) => input.attributes('value'))

    expect(checked).toEqual(['AGENCY_MEMBER'])
  })
})

describe('who can be removed', () => {
  it('offers no delete for the agency owner, who cannot be re-created here', async () => {
    const wrapper = await render()
    const rows = wrapper.findAll('tbody tr')

    expect(rows[0].find('.action-btn--danger').exists()).toBe(true)
    expect(rows[1].find('.action-btn--danger').exists()).toBe(false)
  })
})

describe('a failed load', () => {
  it('says so instead of rendering an empty table that reads as "no team"', async () => {
    getAdminUsers.mockRejectedValueOnce(new Error('Network Error'))
    const wrapper = await render()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('could not be loaded')
    expect(wrapper.find('table').exists()).toBe(false)
  })
})

describe('the platform screen still gets what only it has', () => {
  it('keeps every role, the packages filter and the discount action', async () => {
    const wrapper = await render(AdminUsersPage)
    const options = wrapper.findAll('.filter-select option').map((o) => o.text())

    expect(options).toContain('ADMIN')
    expect(wrapper.text()).toContain('All Packages')
    expect(wrapper.text()).toContain('Discount Subscribe')
  })
})
