import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import TeamWorkloadPanel from '@/components/dashboard/TeamWorkloadPanel.vue'
import en from '@/i18n/locales/en.json'

/**
 * Team workload on the agency dashboard (IVY-1202, item 5).
 *
 * <p>The item was held back until an organizer directory existed, because the
 * shortcut — grouping by who created the event — answers a different question.
 * So the assertions are about where the numbers come from and how the panel
 * behaves when they do not arrive.
 */

const { workload } = vi.hoisted(() => ({ workload: vi.fn() }))

vi.mock('@/services/agencyTeam.service', () => ({
  agencyTeamService: { workload: (...a) => workload(...a) },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en' }, query: {} }),
  RouterLink: { props: ['to'], template: '<a :href="String(to)"><slot /></a>' },
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const ROWS = [
  { id: 'u-1', firstName: 'Ana', lastName: 'Ivanova', activeEvents: 4, overdueTasks: 9 },
  { id: 'u-2', firstName: 'Boris', lastName: 'Petrov', activeEvents: 2, overdueTasks: 0 },
]

beforeEach(() => {
  workload.mockReset().mockResolvedValue({ data: { rows: ROWS, total: 2 } })
})

async function render() {
  const wrapper = mount(TeamWorkloadPanel, { global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper
}

describe('scope', () => {
  it('asks the agency endpoint without naming an organization', async () => {
    await render()

    expect(workload).toHaveBeenCalledTimes(1)
    expect(workload.mock.calls[0][0]).not.toHaveProperty('orgId')
  })
})

describe('what it shows', () => {
  it('puts each organizer beside what they are carrying', async () => {
    const wrapper = await render()
    const first = wrapper.findAll('.rows li')[0]

    expect(first.text()).toContain('Ana Ivanova')
    expect(first.text()).toContain('4 active events')
    expect(first.text()).toContain('9 overdue')
  })

  it('marks late work rather than leaving it as one number among others', async () => {
    const wrapper = await render()
    const rows = wrapper.findAll('.rows li')

    expect(rows[0].find('.late').exists()).toBe(true)
    expect(rows[1].find('.late').exists()).toBe(false)
  })

  it('says it is ordered by late work, since a dashboard is read for what needs attention', async () => {
    const wrapper = await render()

    expect(wrapper.text()).toContain('Ordered by late work')
  })

  it('offers a way to add the first organizer when there is nobody', async () => {
    workload.mockResolvedValueOnce({ data: { rows: [], total: 0 } })
    const wrapper = await render()

    expect(wrapper.text()).toContain('Nobody on the team yet')
    expect(wrapper.find('a[href="/en/org/users"]').exists()).toBe(true)
  })

  it('says how many it is showing when the roster is longer', async () => {
    workload.mockResolvedValueOnce({ data: { rows: ROWS, total: 11 } })
    const wrapper = await render()

    expect(wrapper.text()).toContain('Showing 2 of 11')
  })

  it('states a failed load instead of reading as an empty team', async () => {
    workload.mockRejectedValueOnce(new Error('Service Unavailable'))
    const wrapper = await render()

    expect(wrapper.find('[role="alert"]').text()).toContain('could not be loaded')
    expect(wrapper.find('.rows').exists()).toBe(false)
  })
})
