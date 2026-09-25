import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AgencyPipelinePage from '@/pages/dashboard/AgencyPipelinePage.vue'
import AgencyVendorsPage from '@/pages/dashboard/AgencyVendorsPage.vue'
import AgencyTeamPage from '@/pages/dashboard/AgencyTeamPage.vue'
import AgencyReportsPage from '@/pages/dashboard/AgencyReportsPage.vue'
import AgencySettingsPage from '@/pages/dashboard/AgencySettingsPage.vue'
import WorkspacePrivilegesPage from '@/pages/dashboard/WorkspacePrivilegesPage.vue'
import { __resetPrivileges } from '@/composables/usePrivileges'
import en from '@/i18n/locales/en.json'

/**
 * The agency owner's screens in the 2026 agency design: clients, vendors,
 * team, permissions, reports and settings. Each keeps what it already did;
 * what is pinned here is the new frame and, where it matters, the difference
 * between an owner and a member.
 */

const mocks = vi.hoisted(() => ({
  home: vi.fn(),
  vendors: vi.fn(),
  exportEvents: vi.fn(),
  events: vi.fn(),
  pipeline: vi.fn(),
  search: vi.fn(),
  agency: vi.fn(),
  riskWindow: vi.fn(),
  setRiskWindow: vi.fn(),
  branding: vi.fn(),
  saveBranding: vi.fn(),
  plan: vi.fn(),
  agencySettings: vi.fn().mockResolvedValue({ data: null }),
  mine: vi.fn(),
  catalogue: vi.fn(),
  members: vi.fn(),
  users: vi.fn(),
}))
const roles = new Set()

vi.mock('@/services/agencyWorkspace.service', () => ({
  agencyWorkspaceService: { home: mocks.home, events: mocks.events, vendors: mocks.vendors, exportEvents: mocks.exportEvents },
}))
vi.mock('@/services/crm.service', () => ({
  crmService: {
    pipeline: mocks.pipeline, branding: mocks.branding, saveBranding: mocks.saveBranding, plan: mocks.plan,
    agencySettings: mocks.agencySettings,
  },
}))
vi.mock('@/services/vendorDirectory.service', () => ({ vendorDirectoryService: { search: mocks.search } }))
vi.mock('@/services/publicCatalog.service', () => ({
  publicCatalogService: { vendorTypes: () => Promise.resolve({ success: true, data: [{ code: 'PHOTOGRAPHY' }, { code: 'HOST_EMCEE' }] }) },
}))
vi.mock('@/services/analytics.service', () => ({
  analyticsService: { agency: mocks.agency, agencyRiskWindow: mocks.riskWindow, setAgencyRiskWindow: mocks.setRiskWindow },
}))
vi.mock('@/services/privileges.service', () => ({
  privilegesService: { mine: mocks.mine, catalogue: mocks.catalogue, members: mocks.members },
}))
vi.mock('@/services/userService', () => ({
  getAdminUsers: (...args) => mocks.users(...args),
  getAdminUser: vi.fn(),
  createAdminUser: vi.fn(),
  updateAdminUser: vi.fn(),
  deleteUser: vi.fn(),
}))
vi.mock('@/services/events.service', () => ({ eventsService: { getAll: vi.fn().mockResolvedValue([]) } }))
vi.mock('@/services/backendApi', () => ({ subscribeToDiscounts: vi.fn() }))
vi.mock('@/services/auth.service', () => ({ hasRole: (role) => roles.has(role), getUserId: () => 'u-owner' }))
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => ({ params: { lang: 'en' }, query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  RouterLink: { props: ['to'], template: '<a :href="String(to)"><slot /></a>' },
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const stubs = { RouterLink: { props: ['to'], template: '<a :href="String(to)"><slot /></a>' } }

async function render(component, props = {}) {
  const wrapper = mount(component, { props, global: { plugins: [i18n], stubs } })
  await flushPromises()
  return wrapper
}

const HOME = {
  kpis: { activeEvents: 3, overdueTasks: 24, awaitingRsvp: 16, overBudgetEvents: 1 },
  team: {
    members: [
      { id: 'u-maja', name: 'Маја', activeEvents: 3, tasksThisWeek: 0, overdueTasks: 12 },
      { id: 'u-ivana', name: 'Ивана', activeEvents: 2, tasksThisWeek: 1, overdueTasks: 0 },
    ],
    unassignedOverdue: 6,
  },
  events: [{ eventId: 'e-1', lead: { id: 'u-maja', name: 'Маја' } }, { eventId: 'e-2', lead: { id: 'u-maja', name: 'Маја' } }],
  vendorDecisions: [{ bookingId: 'b-1', vendorName: 'Кетеринг Вардар', title: 'Вечера', eventName: 'Марија & Филип' }],
  budget: { planned: 1540000, spent: 1111880 },
}

beforeEach(() => {
  Object.values(mocks).forEach((fn) => fn.mockReset())
  roles.clear()
  __resetPrivileges()
  mocks.home.mockResolvedValue({ data: HOME })
  mocks.vendors.mockResolvedValue({ data: { awaiting: 1, confirmed: 1, cancelled: 0, engagements: [
    { bookingId: 'b-1', vendorName: 'Кетеринг Вардар', title: 'Вечера', eventName: 'Марија & Филип', status: 'HELD' },
    { bookingId: 'b-2', vendorName: 'Studio Lumière', title: 'Фото', eventName: 'Марија & Филип', status: 'CONFIRMED' },
  ] } })
  mocks.search.mockResolvedValue({ data: { content: [{ id: 'v-1', slug: 'studio', name: 'Studio Lumière', type: 'PHOTOGRAPHY', city: 'Skopje' }] } })
  mocks.users.mockResolvedValue([])
})

describe('clients', () => {
  it('counts the pipeline and lays it out by stage', async () => {
    mocks.pipeline.mockResolvedValue({ data: [
      { id: 'l-1', name: 'Ана', stage: 'INQUIRY' },
      { id: 'l-2', name: 'Софија', stage: 'PROPOSAL', nextAction: 'Call', nextActionAt: '2000-01-01' },
      { id: 'l-3', name: 'Марија', stage: 'WON', convertedEventId: 'e-1' },
    ] })
    const wrapper = await render(AgencyPipelinePage)

    expect(wrapper.findAll('.kpi strong').map((s) => s.text())).toEqual(['2', '1', '1', '1'])
    expect(wrapper.findAll('.lane')).toHaveLength(5)
    expect(wrapper.text()).toContain('Needs follow-up')
    expect(wrapper.find('.lines').text()).toContain('Софија')
  })
})

describe('vendors', () => {
  it('shows an owner the engagements waiting on confirmation', async () => {
    roles.add('AGENCY')
    const wrapper = await render(AgencyVendorsPage)

    expect(wrapper.find('h1').text()).toBe('Vendors')
    expect(wrapper.find('.engagements').text()).toContain('Кетеринг Вардар')
    expect(wrapper.find('.engagements').text()).not.toContain('Studio Lumière')
  })

  it('lets the owner see confirmed engagements too, not only the held ones', async () => {
    roles.add('AGENCY')
    const wrapper = await render(AgencyVendorsPage)

    await wrapper.findAll('.status-filter button').find((b) => b.text().startsWith('Confirmed')).trigger('click')

    expect(wrapper.find('.engagements .lines').text()).toContain('Studio Lumière')
    expect(wrapper.find('.engagements .lines').text()).not.toContain('Кетеринг Вардар')
  })

  it('offers the trades the server lists as filters, and no others', async () => {
    roles.add('AGENCY')
    const wrapper = await render(AgencyVendorsPage)

    const options = wrapper.findAll('select[aria-label] option').map((option) => option.attributes('value'))
    expect(options).toEqual(['', 'PHOTOGRAPHY', 'HOST_EMCEE'])
  })

  it('shows a member the directory alone, and never asks for engagements', async () => {
    roles.add('AGENCY_MEMBER')
    const wrapper = await render(AgencyVendorsPage)

    expect(wrapper.find('h1').text()).toBe('Vendor directory')
    expect(wrapper.find('.engagements').exists()).toBe(false)
    expect(mocks.vendors).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Studio Lumière')
  })
})

describe('team', () => {
  it('draws who carries the work, with the lead role read from the events', async () => {
    const wrapper = await render(AgencyTeamPage)

    const rows = wrapper.findAll('.engagement tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Lead organizer of 2')
    expect(rows[1].text()).toContain('Team member')
    expect(wrapper.findAll('.kpi strong').map((s) => s.text())).toEqual(['2', '3', '24', '6'])
  })

  it('opens the account form from the header', async () => {
    const wrapper = await render(AgencyTeamPage)

    await wrapper.findAll('button').find((b) => b.text().includes('Invite member')).trigger('click')

    expect(wrapper.find('.checkbox-group').exists()).toBe(true)
  })
})

describe('permissions', () => {
  beforeEach(() => {
    mocks.catalogue.mockResolvedValue({ data: [] })
    mocks.members.mockResolvedValue({ data: [] })
  })

  it('states the agency\'s access model above the per-member editor', async () => {
    mocks.mine.mockResolvedValue({ data: [{ type: 'AGENCY', owner: true, privileges: [] }] })
    const wrapper = await render(WorkspacePrivilegesPage, { workspaceType: 'AGENCY' })

    expect(wrapper.text()).toContain('Access model')
    expect(wrapper.findAll('.matrix tbody tr')).toHaveLength(8)
    expect(wrapper.find('.matrix').text()).toContain('If granted')
  })

  it('leaves the vendor workspace\'s page as it was', async () => {
    mocks.mine.mockResolvedValue({ data: [{ type: 'VENDOR', owner: true, privileges: [] }] })
    const wrapper = await render(WorkspacePrivilegesPage, { workspaceType: 'VENDOR' })

    expect(wrapper.text()).not.toContain('Access model')
    expect(wrapper.find('.matrix').exists()).toBe(false)
  })
})

describe('reports', () => {
  it('reports only what the agency\'s data backs, with the RSVP rate from the rows', async () => {
    mocks.events.mockResolvedValue({ data: { rows: [
      { name: 'A', status: 'ACTIVE', confirmedCount: 20, declinedCount: 5, awaitingCount: 25, lead: { name: 'Маја' } },
      { name: 'B', status: 'DRAFT', confirmedCount: 0, declinedCount: 0, awaitingCount: 0 },
    ] } })
    mocks.agency.mockResolvedValue({ data: { monthly: [{ month: '2026-10', count: 2 }, { month: '2026-11', count: 1 }] } })
    const wrapper = await render(AgencyReportsPage)

    const values = wrapper.findAll('.kpi strong').map((s) => s.text())
    expect(values[0]).toBe('3')
    expect(values[1]).toBe('50%')
    expect(values[2]).toBe('24')
    expect(wrapper.findAll('.month')).toHaveLength(2)
    expect(wrapper.text()).toContain('24 overdue tasks')
  })

  it('exports through the server and hands the file to the browser', async () => {
    mocks.events.mockResolvedValue({ data: { rows: [{ name: 'A', status: 'ACTIVE' }] } })
    mocks.agency.mockResolvedValue({ data: { monthly: [] } })
    mocks.exportEvents.mockResolvedValue(new Blob(['Event\r\nA\r\n'], { type: 'text/csv' }))
    URL.createObjectURL = vi.fn(() => 'blob:csv')
    URL.revokeObjectURL = vi.fn()
    const wrapper = await render(AgencyReportsPage)

    await wrapper.findAll('button').find((b) => b.text().includes('CSV')).trigger('click')
    await flushPromises()

    expect(mocks.exportEvents).toHaveBeenCalled()
    expect(URL.createObjectURL).toHaveBeenCalled()
  })
})

describe('settings', () => {
  beforeEach(() => {
    mocks.riskWindow.mockResolvedValue({ data: { riskWindowDays: 30, isDefault: true } })
    mocks.branding.mockResolvedValue({ data: { senderName: 'Ивена', primaryColor: '#224936' } })
    mocks.plan.mockResolvedValue({ data: { tier: 'PRO', active: true, activeEvents: 3 } })
    mocks.saveBranding.mockResolvedValue({ data: {} })
  })

  it('saves the brand to the agency\'s branding', async () => {
    const wrapper = await render(AgencySettingsPage)
    await wrapper.findAll('.settings-tabs button').at(1).trigger('click')

    await wrapper.find('.brand-form input').setValue('Ивена Агенција')
    await wrapper.find('.brand-form').trigger('submit')
    await flushPromises()

    expect(mocks.saveBranding).toHaveBeenCalledWith(expect.objectContaining({ senderName: 'Ивена Агенција', primaryColor: '#224936' }))
    expect(wrapper.text()).toContain('Brand saved.')
  })

  it('shows the plan read-only, and says where it is changed', async () => {
    const wrapper = await render(AgencySettingsPage)
    await wrapper.findAll('.settings-tabs button').at(3).trigger('click')

    expect(wrapper.text()).toContain('PRO')
    expect(wrapper.text()).toContain('separate billing flow')
  })
})
