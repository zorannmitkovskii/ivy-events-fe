import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'

/**
 * An event's own invitation address, set from the event's settings.
 */

const api = vi.hoisted(() => ({ get: vi.fn(), availability: vi.fn(), save: vi.fn() }))

vi.mock('@/services/eventAddress.service', async () => ({
  ...(await vi.importActual('@/services/eventAddress.service')),
  eventAddressService: api,
}))
vi.mock('@/services/vendorHost', () => ({ platformDomain: () => 'ivyevents.mk' }))

const EventAddressSection = (await import('@/components/dashboard/settings/EventAddressSection.vue')).default
const { invitationLinkFor } = await vi.importActual('@/services/eventAddress.service')

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const EVENT = 'e-1'

function render() {
  return mount(EventAddressSection, { props: { eventId: EVENT }, global: { plugins: [i18n] } })
}

const free = (label) => ({ label, available: true, reason: null, suggestion: null })

beforeEach(() => {
  vi.useFakeTimers()
  Object.values(api).forEach((fn) => fn.mockReset())
})

afterEach(() => vi.useRealTimers())

describe('the invitation address section', () => {
  it('offers the suggestion when the event has no address yet', async () => {
    api.get.mockResolvedValue({ label: null, enabled: false, suggestion: 'ana-marko' })
    api.availability.mockResolvedValue(free('ana-marko'))

    const wrapper = render()
    await flushPromises()

    expect(wrapper.find('input.addr-input').element.value).toBe('ana-marko')
    expect(wrapper.text()).toContain('"ana-marko" is free.')
    expect(wrapper.find('.addr-copy').exists()).toBe(false)
  })

  it('checks a typed label once typing stops, and offers the free alternative when taken', async () => {
    api.get.mockResolvedValue({ label: null, enabled: false, suggestion: 'ana-marko' })
    api.availability.mockResolvedValueOnce(free('ana-marko'))
      .mockResolvedValueOnce({ label: 'studio', available: false, reason: 'TAKEN', suggestion: 'studio-2026' })
      .mockResolvedValueOnce(free('studio-2026'))

    const wrapper = render()
    await flushPromises()
    await wrapper.find('input.addr-input').setValue('studio')
    expect(api.availability).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(400)
    await flushPromises()

    expect(api.availability).toHaveBeenLastCalledWith(EVENT, 'studio')
    expect(wrapper.text()).toContain('"studio" is taken.')
    expect(wrapper.find('.addr-save').attributes('disabled')).toBeDefined()

    await wrapper.find('.addr-link').trigger('click')
    await flushPromises()
    expect(wrapper.find('input.addr-input').element.value).toBe('studio-2026')
    expect(wrapper.find('.addr-save').attributes('disabled')).toBeUndefined()
  })

  it('saves the label with the switch, then shows the live link to copy', async () => {
    api.get.mockResolvedValue({ label: null, enabled: false, suggestion: 'ana-marko' })
    api.availability.mockResolvedValue(free('ana-marko'))
    api.save.mockResolvedValue({ label: 'ana-marko', enabled: true, host: 'ana-marko.ivyevents.mk', url: 'https://ana-marko.ivyevents.mk/' })

    const wrapper = render()
    await flushPromises()
    await wrapper.find('.addr-switch input').setValue(true)
    await wrapper.find('.addr-save').trigger('click')
    await flushPromises()

    expect(api.save).toHaveBeenCalledWith(EVENT, 'ana-marko', true)
    expect(wrapper.find('.addr-open').attributes('href')).toBe('https://ana-marko.ivyevents.mk/')
    expect(wrapper.text()).toContain('This is your address.')
  })

  it('says why a save was refused', async () => {
    api.get.mockResolvedValue({ label: null, enabled: false, suggestion: 'ana-marko' })
    api.availability.mockResolvedValue(free('ana-marko'))
    api.save.mockRejectedValue(new Error('„ana-marko“ е зафатена.'))

    const wrapper = render()
    await flushPromises()
    await wrapper.find('.addr-save').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('зафатена')
  })

  it('shows an existing, switched-on address as saved', async () => {
    api.get.mockResolvedValue({ label: 'ana-marko', enabled: true, url: 'https://ana-marko.ivyevents.mk/' })
    api.availability.mockResolvedValue(free('ana-marko'))

    const wrapper = render()
    await flushPromises()

    expect(wrapper.find('.addr-switch input').element.checked).toBe(true)
    expect(wrapper.find('.addr-copy').exists()).toBe(true)
  })
})

describe('the link guests are given', () => {
  it('is the event address while it is on, the ordinary one otherwise', () => {
    const ordinary = 'https://ivyevents.mk/mk/invitations/coastal?eventId=1'
    expect(invitationLinkFor({ enabled: true, url: 'https://ana-marko.ivyevents.mk/' }, ordinary)).toBe('https://ana-marko.ivyevents.mk/')
    expect(invitationLinkFor({ enabled: false, url: 'https://ana-marko.ivyevents.mk/' }, ordinary)).toBe(ordinary)
    expect(invitationLinkFor(null, ordinary)).toBe(ordinary)
    expect(invitationLinkFor(null, undefined)).toBe('')
  })
})
