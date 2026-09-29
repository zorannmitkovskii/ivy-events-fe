import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'

/**
 * A guest finding their table from the invitation link.
 *
 * <p>The page used to download the whole guest list on load and filter it in
 * the browser. It now asks the server for the name being typed — at least
 * three letters — and shows only what comes back.
 */

const api = vi.hoisted(() => ({ getTableInfo: vi.fn() }))
vi.mock('@/services/backendApi', () => api)
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => ({ query: { eventId: 'e-1' } }),
}))

const TableLookupPage = (await import('@/pages/TableLookupPage.vue')).default
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function render() {
  return mount(TableLookupPage, { global: { plugins: [i18n] } })
}

async function type(wrapper, text) {
  await wrapper.find('input').setValue(text)
  vi.advanceTimersByTime(400)
  await flushPromises()
}

beforeEach(() => {
  vi.useFakeTimers()
  api.getTableInfo.mockReset()
})

afterEach(() => vi.useRealTimers())

describe('the table lookup', () => {
  it('downloads nothing on load', async () => {
    render()
    await flushPromises()

    expect(api.getTableInfo).not.toHaveBeenCalled()
  })

  it('asks for more letters instead of searching on two', async () => {
    const wrapper = render()
    await type(wrapper, 'An')

    expect(api.getTableInfo).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain(en.tableLookup.hint.replace('{n}', '3'))
  })

  it('asks the server for the typed name and shows only what comes back', async () => {
    api.getTableInfo.mockResolvedValue({ data: [{ name: 'Ana Petrova', tableNumber: 'Table 4' }] })
    const wrapper = render()
    await type(wrapper, ' Petr ')

    expect(api.getTableInfo).toHaveBeenCalledWith('e-1', 'Petr')
    expect(wrapper.findAll('.result-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Ana Petrova')
  })

  it('says when the guest has no table yet', async () => {
    api.getTableInfo.mockResolvedValue({ data: [{ name: 'Ana Petrova', tableNumber: null }] })
    const wrapper = render()
    await type(wrapper, 'Petr')

    expect(wrapper.text()).toContain(en.tableLookup.noTable)
  })

  it('explains a rate limit rather than a generic failure', async () => {
    api.getTableInfo.mockRejectedValue({ response: { status: 429 } })
    const wrapper = render()
    await type(wrapper, 'Petr')

    expect(wrapper.text()).toContain(en.tableLookup.tooMany)
  })
})
