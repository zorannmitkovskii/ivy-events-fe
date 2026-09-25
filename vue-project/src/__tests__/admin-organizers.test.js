import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AdminOrganizersPage from '@/pages/adminDashboard/AdminOrganizersPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The organizer directory (IVY-1102).
 *
 * <p>What is pinned here is that the screen asks the server the right question.
 * Sorting and searching are server-side by design — ordering the twenty rows in
 * the browser would order the page rather than the platform — so the assertions
 * are about the parameters that leave, not about the order that comes back.
 */

const { list, workload, setStatus, setRole } = vi.hoisted(() => ({
  list: vi.fn(), workload: vi.fn(), setStatus: vi.fn(), setRole: vi.fn(),
}))

vi.mock('@/services/organizers.service', () => ({
  organizersService: {
    list: (...a) => list(...a),
    workload: (...a) => workload(...a),
    setStatus: (...a) => setStatus(...a),
    setRole: (...a) => setRole(...a),
  },
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const ROWS = [
  {
    id: 'u-1', firstName: 'Ana', lastName: 'Ivanova', email: 'ana@agency.mk',
    status: 'ACTIVE', orgId: 'org-1', roles: ['AGENCY_MEMBER'], activeEvents: 4, overdueTasks: 9,
  },
  {
    id: 'u-2', firstName: 'Boris', lastName: 'Petrov', email: 'boris@agency.mk',
    status: 'DISABLED', orgId: 'org-1', roles: ['AGENCY'], activeEvents: 1, overdueTasks: 0,
  },
]

/**
 * Fresh every time. The page updates a row in place after a status change, and
 * a shared fixture would carry that mutation into the next test — which is how
 * this file first "proved" that a refused change still flipped the row.
 */
const payload = (overrides = {}) => ({
  data: {
    rows: ROWS.map((row) => ({ ...row })),
    total: 2, first: 0, max: 20, truncated: false,
    definitions: { activeEvents: 'Granted, not created.', overdueTasks: 'Counted per event.', status: 'From Keycloak.' },
    ...overrides,
  },
})

beforeEach(() => {
  vi.useRealTimers()
  list.mockReset().mockImplementation(() => Promise.resolve(payload()))
  workload.mockReset().mockResolvedValue({ data: { totals: { eventCount: 2, overdueTaskCount: 3 }, events: [] } })
  setStatus.mockReset().mockResolvedValue({})
  setRole.mockReset().mockResolvedValue({})
})

async function render() {
  const wrapper = mount(AdminOrganizersPage, { global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper
}

describe('what the screen asks for', () => {
  it('opens on the most overdue first, which is the question the page is for', async () => {
    await render()

    expect(list).toHaveBeenCalledTimes(1)
    expect(list.mock.calls[0][0]).toMatchObject({ sort: 'OVERDUE_TASKS', direction: 'DESC', first: 0 })
  })

  it('sends the sort to the server rather than reordering the page', async () => {
    const wrapper = await render()
    const activeEventsHeader = wrapper.findAll('.sort')[0]

    await activeEventsHeader.trigger('click')
    await flushPromises()

    expect(list.mock.calls[1][0]).toMatchObject({ sort: 'ACTIVE_EVENTS', direction: 'DESC' })
  })

  it('flips direction when the same column is clicked twice', async () => {
    const wrapper = await render()
    const overdueHeader = wrapper.findAll('.sort')[1]

    await overdueHeader.trigger('click')
    await flushPromises()

    expect(list.mock.calls[1][0]).toMatchObject({ sort: 'OVERDUE_TASKS', direction: 'ASC' })
  })

  it('debounces the search instead of asking on every keystroke', async () => {
    vi.useFakeTimers()
    const wrapper = mount(AdminOrganizersPage, { global: { plugins: [i18n] } })
    await flushPromises()

    // By role, not by class: the search box moved into the Toolbar primitive
    // (IVY-1404) and a class-based selector would keep breaking on every move.
    const input = wrapper.find('input[type="search"]')
    await input.setValue('an')
    await input.setValue('ana')
    expect(list).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(400)
    await flushPromises()

    expect(list).toHaveBeenCalledTimes(2)
    expect(list.mock.calls[1][0]).toMatchObject({ search: 'ana' })
    vi.useRealTimers()
  })
})

describe('what it shows', () => {
  it('states each column definition from the payload, not from a document elsewhere', async () => {
    const wrapper = await render()

    expect(wrapper.text()).toContain('Granted, not created.')
    expect(wrapper.text()).toContain('Counted per event.')
  })

  it('labels overdue work as belonging to the events, since tasks have no assignee', async () => {
    const wrapper = await render()

    expect(wrapper.text()).toContain('Overdue on their events')
  })

  it('shows the two counts against the right people', async () => {
    const wrapper = await render()
    const firstRow = wrapper.findAll('tbody tr')[0]

    expect(firstRow.text()).toContain('Ana')
    expect(firstRow.text()).toContain('4')
    expect(firstRow.text()).toContain('9')
  })

  it('says when the directory was bounded rather than pretending it is everyone', async () => {
    list.mockResolvedValueOnce(payload({ truncated: true }))
    const wrapper = await render()

    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('states a failed load instead of rendering an empty directory', async () => {
    list.mockRejectedValueOnce(new Error('Service Unavailable'))
    const wrapper = await render()

    expect(wrapper.find('[role="alert"]').text()).toContain('could not be loaded')
    expect(wrapper.find('table').exists()).toBe(false)
  })
})

describe('what it changes', () => {
  it('offers only organization roles — never ADMIN', async () => {
    const wrapper = await render()
    const options = wrapper.findAll('.role-select option').map((o) => o.text())

    expect(new Set(options)).toEqual(new Set(['AGENCY', 'AGENCY_MEMBER', 'USER']))
  })

  it('disables an organizer and reflects it without a full reload', async () => {
    const wrapper = await render()
    const callsBefore = list.mock.calls.length

    await wrapper.findAll('.action')[0].trigger('click')
    await flushPromises()

    expect(setStatus).toHaveBeenCalledWith('u-1', false)
    expect(list.mock.calls.length).toBe(callsBefore)
    expect(wrapper.findAll('tbody tr')[0].text()).toContain('Disabled')
  })

  it('surfaces a refused change instead of leaving the row looking changed', async () => {
    setStatus.mockRejectedValueOnce(new Error('Организацијата мора да има барем еден AGENCY'))
    const wrapper = await render()

    await wrapper.findAll('.action')[0].trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('AGENCY')
    expect(wrapper.findAll('tbody tr')[0].text()).toContain('Active')
  })

  it('opens one organizer\'s own events on their name', async () => {
    const wrapper = await render()

    await wrapper.findAll('.name-link')[0].trigger('click')
    await flushPromises()

    expect(workload).toHaveBeenCalledWith('u-1')
    expect(wrapper.find('.dialog').text()).toContain('Ana')
  })
})
