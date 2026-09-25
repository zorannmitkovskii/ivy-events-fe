import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AgencyHomePage from '@/pages/dashboard/AgencyHomePage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The agency home, drawn for an owner and for a member (2026 design).
 *
 * <p>The server already leaves the owner's sections out of a member's
 * response; what this file guards is the page's side of that — a member never
 * sees a team or budget panel, a "lead" column, or the owner's wording.
 */

const { homeMock } = vi.hoisted(() => ({ homeMock: vi.fn() }))
const roles = new Set()

vi.mock('@/services/agencyWorkspace.service', () => ({ agencyWorkspaceService: { home: homeMock } }))
vi.mock('@/services/auth.service', () => ({
  getFullName: () => 'Ирена Агенција',
  hasRole: (role) => roles.has(role),
}))
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => ({ params: { lang: 'en' } }),
  useRouter: () => ({ push: vi.fn() }),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const row = (overrides = {}) => ({
  eventId: 'e-1',
  name: 'Марија & Филип',
  categoryType: 'WEDDING',
  status: 'ACTIVE',
  date: '2026-10-03',
  daysUntil: 9,
  location: 'Скопје',
  client: 'Марија & Филип',
  lead: { id: 'u-ivana', name: 'Ивана' },
  myRole: null,
  tasksTotal: 10,
  tasksDone: 7,
  overdueTasks: 5,
  myOverdueTasks: null,
  guestCount: 30,
  confirmedCount: 21,
  declinedCount: 0,
  awaitingCount: 9,
  responseRate: 70,
  plannedBudget: 300000,
  spentBudget: 252000,
  vendorsAwaiting: 1,
  nextStep: { title: 'Потврди кетеринг', dueAt: '2026-09-28T12:00:00' },
  ...overrides,
})

const ownerHome = () => ({
  viewer: 'OWNER',
  today: '2026-09-24',
  rangeDays: 7,
  riskWindowDays: 30,
  kpis: { activeEvents: 1, activeEventsSoon: 1, overdueTasks: 5, myOverdueTasks: null, awaitingRsvp: 9, vendorsAwaiting: 1, vendorsAwaitingEvents: 1, overBudgetEvents: 0 },
  attention: [{ eventId: 'e-1', eventName: 'Марија & Филип', kind: 'TASKS', count: 5, daysUntil: 9, lead: { id: 'u-ivana', name: 'Ивана' }, subjects: [] }],
  deadlines: [{ date: '2026-09-26', kind: 'TASK', title: 'Потсетник за покани', eventId: 'e-1', eventName: 'Марија & Филип', assignee: { id: 'u-ivana', name: 'Ивана' } }],
  events: [row()],
  vendorDecisions: [{ bookingId: 'b-1', vendorName: 'Кетеринг Вардар', title: 'Вечера', stage: 'TENTATIVE', eventId: 'e-1', eventName: 'Марија & Филип', eventDate: '2026-10-03' }],
  team: { members: [{ id: 'u-ivana', name: 'Ивана', activeEvents: 1, tasksThisWeek: 2, overdueTasks: 5 }], unassignedOverdue: 0 },
  budget: { planned: 300000, spent: 252000, overBudgetEvents: 0, events: [{ eventId: 'e-1', name: 'Марија & Филип', planned: 300000, spent: 252000 }] },
})

const memberHome = () => ({
  ...ownerHome(),
  viewer: 'MEMBER',
  kpis: { ...ownerHome().kpis, myOverdueTasks: 3, overBudgetEvents: null },
  events: [row({ myRole: 'LEAD', myOverdueTasks: 3, plannedBudget: null, spentBudget: null })],
  team: null,
  budget: null,
})

async function render(payload) {
  homeMock.mockResolvedValue({ data: { data: payload } })
  const wrapper = mount(AgencyHomePage, {
    global: { plugins: [i18n], stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  roles.clear()
  homeMock.mockReset()
})

describe('the owner\'s home', () => {
  beforeEach(() => roles.add('AGENCY'))

  it('shows the team, the budget and who leads each event', async () => {
    const wrapper = await render(ownerHome())

    expect(wrapper.text()).toContain('Team workload')
    expect(wrapper.text()).toContain('Event budgets')
    expect(wrapper.find('thead').text()).toContain('Lead organizer')
    expect(wrapper.find('thead').text()).toContain('Budget')
  })

  it('shows the four owner figures of the design, ending with events over budget', async () => {
    const wrapper = await render(ownerHome())

    expect(wrapper.findAll('.kpi > span').map((s) => s.text())).toEqual([
      'Events in progress', 'Next 30 days', 'Overdue tasks', 'Over budget',
    ])
  })

  it('counts "soon" over the risk window the agency set', async () => {
    const wrapper = await render({ ...ownerHome(), riskWindowDays: 60 })

    expect(wrapper.findAll('.kpi > span').map((s) => s.text())).toContain('Next 60 days')
    expect(wrapper.find('tbody .sub.urgent').exists()).toBe(true)
  })

  it('splits the overdue figure by team member', async () => {
    const wrapper = await render(ownerHome())

    expect(wrapper.text()).toContain('5 Ивана · 0 unassigned')
  })

  it('does not repeat the client when it is the event\'s own name', async () => {
    const wrapper = await render(ownerHome())

    expect(wrapper.find('tbody .sub').text()).toBe('Wedding · Скопје')
  })
})

describe('a member\'s home', () => {
  beforeEach(() => roles.add('AGENCY_MEMBER'))

  it('shows the four member figures, ending with guests who have not answered', async () => {
    const wrapper = await render(memberHome())

    expect(wrapper.findAll('.kpi > span').map((s) => s.text())).toEqual([
      'My events', 'Next 30 days', 'My overdue tasks', 'No RSVP answer',
    ])
  })

  it('leaves out everything that is only the owner\'s', async () => {
    const wrapper = await render(memberHome())

    expect(wrapper.text()).not.toContain('Team workload')
    expect(wrapper.text()).not.toContain('Event budgets')
    expect(wrapper.find('thead').text()).not.toContain('Budget')
    expect(wrapper.find('thead').text()).not.toContain('Lead organizer')
  })

  it('counts the member\'s own overdue work and states their role on each event', async () => {
    const wrapper = await render(memberHome())

    expect(wrapper.text()).toContain('My overdue tasks')
    expect(wrapper.find('tbody').text()).toContain('Lead organizer')
    expect(wrapper.find('tbody').text()).toContain('3 of mine overdue')
  })

  it('offers their next step and the guests still out, where the owner has team and budget', async () => {
    const wrapper = await render(memberHome())

    expect(wrapper.text()).toContain('My next step')
    expect(wrapper.text()).toContain('Guests awaiting an answer')
  })

  it('explains an empty workspace instead of drawing zeros', async () => {
    const wrapper = await render({ ...memberHome(), events: [], deadlines: [], attention: [] })

    expect(wrapper.text()).toContain('You are not on any event yet')
  })
})

describe('the range', () => {
  it('asks again when "this week" is widened to fourteen days', async () => {
    roles.add('AGENCY')
    const wrapper = await render(ownerHome())

    await wrapper.find('.deadlines select').setValue('14')
    await flushPromises()

    expect(homeMock).toHaveBeenLastCalledWith(14)
  })
})
