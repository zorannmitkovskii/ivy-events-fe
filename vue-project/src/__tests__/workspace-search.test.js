import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import WorkspaceSearch from '@/components/dashboard/shell/WorkspaceSearch.vue'
import { agencyRouteFor, vendorRouteFor } from '@/utils/workspaceSearchRoutes.js'
import { unwrapHits } from '@/services/workspaceSearch.service'
import en from '@/i18n/locales/en.json'

/**
 * The console top-bar search (audit item 2): a real combobox where the design
 * drew a static pill. The server scopes the hits; what is proved here is the
 * typing, grouping, keyboard and where a hit leads.
 */

const DEBOUNCE_MS = 250
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const HITS = [
  { kind: 'TASK', id: 't1', title: 'Cake tasting', subtitle: 'Maria & Philip', eventId: 'e1' },
  { kind: 'EVENT', id: 'e1', title: 'Maria & Philip', subtitle: '2026-10-10 · Skopje', eventId: 'e1' },
  { kind: 'LEAD', id: 'l1', title: 'Maria Petrova', subtitle: 'maria@example.com' },
]

function render(search = vi.fn().mockResolvedValue(HITS)) {
  const wrapper = mount(WorkspaceSearch, { props: { search }, global: { plugins: [i18n] }, attachTo: document.body })
  return { wrapper, search }
}

async function type(wrapper, text) {
  await wrapper.find('input').setValue(text)
  await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)
  await nextTick()
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('typing', () => {
  it('does not ask the server about one letter', async () => {
    const { wrapper, search } = render()
    await type(wrapper, 'm')

    expect(search).not.toHaveBeenCalled()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('asks once per pause, with the trimmed query', async () => {
    const { wrapper, search } = render()
    await wrapper.find('input').setValue('ma')
    await wrapper.find('input').setValue('mar')
    await type(wrapper, ' mari ')

    expect(search).toHaveBeenCalledTimes(1)
    expect(search).toHaveBeenCalledWith('mari')
  })

  it('groups the hits by kind, events first', async () => {
    const { wrapper } = render()
    await type(wrapper, 'maria')

    expect(wrapper.findAll('.wsearch-kind').map((node) => node.text())).toEqual(['Events', 'Tasks', 'Clients'])
    expect(wrapper.findAll('[role="option"]').map((node) => node.find('.wsearch-title').text()))
      .toEqual(['Maria & Philip', 'Cake tasting', 'Maria Petrova'])
  })

  it('says so when nothing matched', async () => {
    const { wrapper } = render(vi.fn().mockResolvedValue([]))
    await type(wrapper, 'zzz')

    expect(wrapper.text()).toContain('Nothing found')
  })

  it('shows nothing from a failed call rather than an error', async () => {
    const { wrapper } = render(vi.fn().mockRejectedValue(new Error('500')))
    await type(wrapper, 'maria')

    expect(wrapper.findAll('[role="option"]')).toHaveLength(0)
  })

  it('keeps the answer to the latest query when an older one arrives late', async () => {
    let answerOld
    const search = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { answerOld = resolve }))
      .mockResolvedValueOnce([HITS[2]])
    const { wrapper } = render(search)
    await type(wrapper, 'mar')
    await type(wrapper, 'maria p')
    answerOld(HITS)
    await vi.advanceTimersByTimeAsync(0)

    expect(wrapper.findAll('[role="option"]')).toHaveLength(1)
  })
})

describe('the keyboard', () => {
  it('moves with the arrows, wraps, and marks the active option for assistive tech', async () => {
    const { wrapper } = render()
    await type(wrapper, 'maria')
    const input = wrapper.find('input')

    expect(input.attributes('role')).toBe('combobox')
    expect(input.attributes('aria-expanded')).toBe('true')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowDown' })

    const active = wrapper.find('[aria-selected="true"]')
    expect(active.find('.wsearch-title').text()).toBe('Maria & Philip')
    expect(input.attributes('aria-activedescendant')).toBe(active.attributes('id'))

    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.find('[aria-selected="true"] .wsearch-title').text()).toBe('Maria Petrova')
  })

  it('opens the active hit on Enter and clears the field', async () => {
    const { wrapper } = render()
    await type(wrapper, 'maria')
    const input = wrapper.find('input')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('select')[0][0]).toMatchObject({ kind: 'TASK', id: 't1' })
    expect(input.element.value).toBe('')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('closes on Escape without choosing anything', async () => {
    const { wrapper } = render()
    await type(wrapper, 'maria')
    await wrapper.find('input').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(wrapper.emitted('select')).toBeUndefined()
  })
})

describe('where a hit leads', () => {
  it('agency: an event opens the event workspace, a task the board, a client the pipeline', () => {
    expect(agencyRouteFor({ kind: 'EVENT', id: 'e1' }, 'en')).toBe('/en/dashboard/events/overview')
    expect(agencyRouteFor({ kind: 'TASK', id: 't1' }, 'en')).toBe('/en/agency/tasks')
    expect(agencyRouteFor({ kind: 'LEAD', id: 'l1' }, 'en')).toBe('/en/agency/pipeline')
    expect(agencyRouteFor({ kind: 'PACKAGE' }, 'en')).toBeNull()
  })

  it('vendor: an inquiry opens itself in the inbox, a package the packages, a booking the calendar', () => {
    expect(vendorRouteFor({ kind: 'INQUIRY', id: 'i1' }, 'mk')).toEqual({ path: '/mk/vendor/inbox', query: { inquiry: 'i1' } })
    expect(vendorRouteFor({ kind: 'PACKAGE', id: 'p1' }, 'mk')).toBe('/mk/vendor/packages')
    expect(vendorRouteFor({ kind: 'BOOKING', id: 'b1' }, 'mk')).toBe('/mk/vendor/calendar')
    expect(vendorRouteFor({ kind: 'EVENT' }, 'mk')).toBeNull()
  })

  it('reads the hits out of the ApiResponse', () => {
    expect(unwrapHits({ success: true, data: HITS })).toHaveLength(3)
    expect(unwrapHits(null)).toEqual([])
  })
})
