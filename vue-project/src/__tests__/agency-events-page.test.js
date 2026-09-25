import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AgencyEventsPage from '@/pages/dashboard/AgencyEventsPage.vue'
import en from '@/i18n/locales/en.json'

/** The agency's event list, per role (2026 design, "events by role"). */

const { eventsMock } = vi.hoisted(() => ({ eventsMock: vi.fn() }))
const roles = new Set()

vi.mock('@/services/agencyWorkspace.service', () => ({ agencyWorkspaceService: { events: eventsMock } }))
vi.mock('@/services/auth.service', () => ({ hasRole: (role) => roles.has(role) }))
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => ({ params: { lang: 'en' } }),
  useRouter: () => ({ push: vi.fn() }),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const row = (overrides) => ({
  eventId: 'e-1', name: 'Марија & Филип', categoryType: 'WEDDING', status: 'ACTIVE', date: '2026-10-03',
  daysUntil: 9, location: 'Скопје', client: null, lead: { id: 'u-ivana', name: 'Ивана' }, myRole: null,
  tasksTotal: 10, tasksDone: 5, overdueTasks: 2, myOverdueTasks: null, guestCount: 30, confirmedCount: 20,
  declinedCount: 1, awaitingCount: 9, responseRate: 70, plannedBudget: 300000, spentBudget: 309000,
  vendorsAwaiting: 0, nextStep: null, ...overrides,
})

async function render(data) {
  eventsMock.mockResolvedValue({ data: { data } })
  const wrapper = mount(AgencyEventsPage, { global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  roles.clear()
  eventsMock.mockReset()
  localStorage.clear()
})

describe('the owner\'s list', () => {
  beforeEach(() => roles.add('AGENCY'))

  const data = () => ({
    viewer: 'OWNER',
    available: 2,
    rows: [row({}), row({ eventId: 'e-2', name: 'Forum', lead: { id: 'u-maja', name: 'Маја' }, overdueTasks: 1, plannedBudget: 0, spentBudget: 0 })],
    organizers: [{ id: 'u-ivana', name: 'Ивана' }, { id: 'u-maja', name: 'Маја' }],
  })

  it('filters by lead organizer on the server', async () => {
    const wrapper = await render(data())

    const leadSelect = wrapper.findAll('select').at(2)
    await leadSelect.setValue('u-maja')
    await flushPromises()

    expect(eventsMock).toHaveBeenLastCalledWith(expect.objectContaining({ leadId: 'u-maja' }))
  })

  it('computes its cards from the rows shown', async () => {
    const wrapper = await render(data())
    const values = wrapper.findAll('.kpi strong').map((s) => s.text())

    // shown, next 30 days, overdue (2 + 1), over budget (one of two)
    expect(values).toEqual(['2', '2', '3', '1'])
  })

  it('counts "soon" over the risk window the agency set, not a fixed month', async () => {
    const wrapper = await render({ ...data(), riskWindowDays: 5 })

    expect(wrapper.findAll('.kpi strong').at(1).text()).toBe('0')
    expect(wrapper.text()).toContain('Next 5 days')
    expect(wrapper.find('tbody .sub.urgent').exists()).toBe(false)
  })

  it('shows who leads each event and how the agency is spread', async () => {
    const wrapper = await render(data())

    expect(wrapper.text()).toContain('Agency distribution')
    expect(wrapper.find('thead').text()).toContain('Lead organizer')
  })
})

describe('a member\'s list', () => {
  beforeEach(() => roles.add('AGENCY_MEMBER'))

  const data = () => ({
    viewer: 'MEMBER',
    available: 1,
    rows: [row({ myRole: 'ASSISTANT', myOverdueTasks: 1, plannedBudget: null, spentBudget: null })],
    organizers: null,
  })

  it('filters by the member\'s own role instead of by lead', async () => {
    const wrapper = await render(data())

    expect(wrapper.text()).not.toContain('All organizers')
    const roleSelect = wrapper.findAll('select').at(2)
    await roleSelect.setValue('LEAD')
    await flushPromises()

    expect(eventsMock).toHaveBeenLastCalledWith(expect.objectContaining({ myRole: 'LEAD' }))
  })

  it('shows no budget anywhere and counts only the member\'s overdue work', async () => {
    const wrapper = await render(data())

    expect(wrapper.find('thead').text()).not.toContain('Budget')
    expect(wrapper.text()).toContain('My overdue tasks')
    expect(wrapper.findAll('.kpi strong').map((s) => s.text())[2]).toBe('1')
  })

  it('remembers the chosen view', async () => {
    const wrapper = await render(data())

    await wrapper.findAll('.view-toggle button').at(1).trigger('click')

    expect(localStorage.getItem('ivy.agencyEvents.view')).toBe('cards')
    expect(wrapper.find('.ec-grid').exists()).toBe(true)
  })
})
