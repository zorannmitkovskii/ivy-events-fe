import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'
import AgencyCalendarPage from '@/pages/dashboard/AgencyCalendarPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The agency calendar (Agency-Organizer design): events and the deadlines of
 * their tasks on one grid, and a "this week" list of both.
 */

const { tasksMock } = vi.hoisted(() => ({ tasksMock: vi.fn() }))
const roles = new Set()

const inDays = (n) => {
  const day = new Date()
  day.setDate(day.getDate() + n)
  return day
}
const isoDay = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

vi.mock('@/composables/useWorkspaceEvents', () => ({
  default: () => ({
    rows: ref([{ event: { id: 'e-1', name: 'Марија & Филип', date: `${isoDay(inDays(3))}T12:00:00` } }]),
    error: ref(null),
    load: vi.fn(),
  }),
}))
vi.mock('@/services/agencyWorkspace.service', () => ({ agencyWorkspaceService: { tasks: tasksMock } }))
vi.mock('@/services/auth.service', () => ({ hasRole: (role) => roles.has(role) }))
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => ({ params: { lang: 'en' } }),
  useRouter: () => ({ push: vi.fn() }),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

async function render() {
  const wrapper = mount(AgencyCalendarPage, {
    global: { plugins: [i18n], stubs: { CreateEventOnDayModal: true } },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  roles.clear()
  tasksMock.mockReset().mockResolvedValue({
    data: {
      tasks: [
        { id: 't-1', title: 'Confirm catering', eventName: 'Марија & Филип', status: 'PENDING', dueAt: `${isoDay(inDays(2))}T12:00:00`, assignee: { id: 'u', name: 'Ивана' } },
        { id: 't-2', title: 'Done already', eventName: 'Марија & Филип', status: 'DONE', dueAt: `${isoDay(inDays(2))}T12:00:00`, assignee: null },
      ],
    },
  })
})

describe('the agency calendar', () => {
  it('names itself for the role', async () => {
    roles.add('AGENCY_MEMBER')
    expect((await render()).find('h1').text()).toBe('My calendar')
  })

  it('draws open deadlines on the grid beside the events, and leaves done ones off', async () => {
    roles.add('AGENCY')
    const wrapper = await render()

    expect(wrapper.findAll('.cal-task').map((chip) => chip.text())).toContain('Confirm catering')
    expect(wrapper.text()).not.toContain('Done already')
  })

  it('reads "soon" from the risk window sent with the tasks', async () => {
    roles.add('AGENCY')
    tasksMock.mockResolvedValue({ data: { riskWindowDays: 45, tasks: [] } })

    expect((await render()).text()).toContain('Next 45 days')
  })

  it('lists the week with who owns each deadline', async () => {
    roles.add('AGENCY')
    const wrapper = await render()

    await wrapper.findAll('.view-switch button').at(1).trigger('click')

    const items = wrapper.findAll('.week-item').map((item) => item.text())
    expect(items[0]).toContain('Confirm catering')
    expect(items[0]).toContain('Ивана')
    expect(items[1]).toContain('Марија & Филип')
  })
})
