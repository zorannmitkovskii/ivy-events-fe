import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AgencyTasksPage from '@/pages/dashboard/AgencyTasksPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The agency task screen (2026 agency design): every task with who has it,
 * as a list or as a board moved by dragging. An owner opens on their own
 * and the unassigned tasks, widens to the team with Mine/All, and reassigns; a
 * member opens on their own tasks and cannot hand work out. Finished tasks sit
 * at the bottom of the list.
 */

const { tasksMock, moveMock, assignMock } = vi.hoisted(() => ({
  tasksMock: vi.fn(),
  moveMock: vi.fn(),
  assignMock: vi.fn(),
}))
const roles = new Set()

vi.mock('@/services/agencyWorkspace.service', () => ({ agencyWorkspaceService: { tasks: tasksMock } }))
vi.mock('@/services/taskBoard.service', () => ({ taskBoardService: { move: moveMock, assign: assignMock } }))
vi.mock('@/services/auth.service', () => ({
  hasRole: (role) => roles.has(role),
  getUserId: () => 'u-ivana',
  getFullName: () => 'Ивана Организатор',
}))
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => ({ params: { lang: 'en' } }),
  useRouter: () => ({ push: vi.fn() }),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const IVANA = { id: 'u-ivana', name: 'Ивана' }
const MAJA = { id: 'u-maja', name: 'Маја' }

const board = () => ({
  viewer: 'OWNER',
  tasks: [
    { id: 't-1', eventId: 'e-1', eventName: 'Марија & Филип', title: 'Catering', status: 'PENDING', dueAt: '2020-01-01T12:00:00', overdue: true, sortOrder: 1, assignee: IVANA },
    { id: 't-2', eventId: 'e-2', eventName: 'Forum', title: 'Stage', status: 'IN_PROGRESS', dueAt: '2099-01-01T12:00:00', overdue: false, sortOrder: 1, assignee: MAJA },
    { id: 't-3', eventId: 'e-1', eventName: 'Марија & Филип', title: 'Flowers', status: 'PENDING', dueAt: null, overdue: false, sortOrder: 2, assignee: null },
  ],
  team: [IVANA, MAJA],
  events: [{ eventId: 'e-1', name: 'Марија & Филип' }, { eventId: 'e-2', name: 'Forum' }],
})

async function render() {
  tasksMock.mockResolvedValue({ data: board() })
  const wrapper = mount(AgencyTasksPage, { global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper
}

const rowTitles = (wrapper) => wrapper.findAll('tbody tr[data-task] b').map((b) => b.text())

beforeEach(() => {
  roles.clear()
  tasksMock.mockReset()
  moveMock.mockReset().mockResolvedValue({ data: {} })
  assignMock.mockReset().mockResolvedValue({ data: {} })
  localStorage.clear()
})

describe('an owner', () => {
  beforeEach(() => roles.add('AGENCY'))

  it('opens on their own tasks and the unassigned ones, and can reassign from the list', async () => {
    const wrapper = await render()

    expect(rowTitles(wrapper)).toEqual(['Catering', 'Flowers'])
    const firstSelect = wrapper.find('tbody tr[data-task="t-1"] select')
    expect(firstSelect.element.value).toBe('u-ivana')
    expect(wrapper.find('tbody tr[data-task="t-3"]').text()).toContain('Unassigned')

    await firstSelect.setValue('u-maja')
    await flushPromises()
    expect(assignMock).toHaveBeenCalledWith('e-1', 't-1', 'u-maja')
  })

  it('shows the other members\' tasks once the box is ticked, and remembers it', async () => {
    const wrapper = await render()
    expect(wrapper.findAll('.task-filters select')).toHaveLength(2)

    await wrapper.findAll('.scope-buttons button').at(1).trigger('click')

    expect(rowTitles(wrapper)).toEqual(['Catering', 'Stage', 'Flowers'])
    expect(wrapper.findAll('.task-filters select')).toHaveLength(3)
    expect(localStorage.getItem('ivy.agencyTasks.scope')).toBe('all')

    const again = await render()
    expect(rowTitles(again)).toEqual(['Catering', 'Stage', 'Flowers'])
  })

  it('has one Mine/All switch, and drops a member filter when back on Mine', async () => {
    const wrapper = await render()
    expect(wrapper.findAll('.scope-buttons')).toHaveLength(1)
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
    expect(wrapper.findAll('.scope-buttons button').map((b) => b.text())).toEqual(['Mine', 'All'])
    await wrapper.findAll('.scope-buttons button').at(1).trigger('click')
    await wrapper.findAll('.task-filters select').at(2).setValue('u-maja')
    expect(rowTitles(wrapper)).toEqual(['Stage'])

    await wrapper.findAll('.scope-buttons button').at(0).trigger('click')
    expect(rowTitles(wrapper)).toEqual(['Catering', 'Flowers'])
  })

  it('lists finished tasks last, keeping the rest in due-date order', async () => {
    const data = board()
    data.tasks.unshift({ id: 't-0', eventId: 'e-2', eventName: 'Forum', title: 'Badges', status: 'DONE', dueAt: '2019-01-01T12:00:00', overdue: false, sortOrder: 0, assignee: IVANA })
    tasksMock.mockResolvedValue({ data })
    const wrapper = mount(AgencyTasksPage, { global: { plugins: [i18n] } })
    await flushPromises()
    await wrapper.findAll('.scope-buttons button').at(1).trigger('click')

    expect(rowTitles(wrapper)).toEqual(['Catering', 'Stage', 'Flowers', 'Badges'])
  })

  it('filters by assignee, including nobody', async () => {
    const wrapper = await render()
    await wrapper.findAll('.scope-buttons button').at(1).trigger('click')

    await wrapper.findAll('.task-filters select').at(2).setValue('__none__')
    expect(rowTitles(wrapper)).toEqual(['Flowers'])
  })

  it('filters to the overdue ones', async () => {
    const wrapper = await render()

    await wrapper.findAll('.task-filters select').at(0).setValue('overdue')
    expect(rowTitles(wrapper)).toEqual(['Catering'])
  })

  it('moves a dragged card to the column it is dropped on, and names the assignee on it', async () => {
    const wrapper = await render()
    await wrapper.findAll('.view-switch button').at(1).trigger('click')

    const card = wrapper.find('.task-card[data-task="t-1"]')
    expect(card.text()).toContain('Марија & Филип')
    await card.trigger('dragstart', { dataTransfer: { setData: vi.fn() } })
    await wrapper.find('.lane[data-status="DONE"]').trigger('drop')
    await flushPromises()

    expect(moveMock).toHaveBeenCalledWith('e-1', 't-1', 'DONE', null)
    expect(wrapper.find('.lane[data-status="DONE"]').text()).toContain('Catering')
  })

  it('puts the card back when the server refuses the move', async () => {
    moveMock.mockRejectedValue(new Error('nope'))
    const wrapper = await render()
    await wrapper.findAll('.view-switch button').at(1).trigger('click')

    await wrapper.find('.task-card[data-task="t-1"]').trigger('dragstart', { dataTransfer: { setData: vi.fn() } })
    await wrapper.find('.lane[data-status="DONE"]').trigger('drop')
    await flushPromises()

    expect(wrapper.find('.lane[data-status="PENDING"]').text()).toContain('Catering')
    expect(wrapper.find('[role="alert"]').text()).toContain('The task was not moved')
  })

  it('moves a focused card one column with the arrow keys', async () => {
    const wrapper = await render()
    await wrapper.findAll('.scope-buttons button').at(1).trigger('click')
    await wrapper.findAll('.view-switch button').at(1).trigger('click')

    await wrapper.find('.task-card[data-task="t-2"]').trigger('keydown', { key: 'ArrowRight' })
    await flushPromises()

    expect(moveMock).toHaveBeenCalledWith('e-2', 't-2', 'DONE', null)
  })
})

describe('a member', () => {
  beforeEach(() => roles.add('AGENCY_MEMBER'))

  it('opens on their own tasks and can widen to everything on their events', async () => {
    const wrapper = await render()

    expect(wrapper.find('h1').text()).toBe('My tasks')
    expect(rowTitles(wrapper)).toEqual(['Catering'])

    await wrapper.findAll('.scope-buttons button').at(1).trigger('click')
    expect(rowTitles(wrapper)).toEqual(['Catering', 'Stage', 'Flowers'])
  })

  it('sees who has each task but cannot reassign', async () => {
    const wrapper = await render()
    await wrapper.findAll('.scope-buttons button').at(1).trigger('click')

    expect(wrapper.find('tbody select').exists()).toBe(false)
    expect(wrapper.find('tbody tr[data-task="t-2"]').text()).toContain('Маја')

    await wrapper.findAll('.view-switch button').at(1).trigger('click')
    expect(wrapper.find('.task-card select').exists()).toBe(false)
    expect(wrapper.find('.task-card[data-task="t-2"]').text()).toContain('Маја')
  })
})
