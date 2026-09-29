import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'

/**
 * A guest answering the invitation.
 *
 * <p>Two things used to go wrong: the form thanked the guest before — and
 * regardless of whether — the reply was stored, and the allergies it asked for
 * never left the browser.
 */

const publicApi = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('@/services/backendApi', () => ({ default: publicApi }))

const RsvpForm = (await import('@/components/invitations/shared/RsvpForm.vue')).default
const { rsvpService } = await import('@/services/rsvp.service')

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function render(send) {
  return mount(RsvpForm, { props: { send }, global: { plugins: [i18n] } })
}

async function answer(wrapper, { name = 'Ana Petrova', allergies = 'Walnuts' } = {}) {
  await wrapper.find('input.field-input[type="text"], input.field-input:not([type])').setValue(name)
  const allergyField = wrapper.findAll('input, textarea').find((el) => el.element.value === '' && el.attributes('placeholder') === en.invitation.allergiesPlaceholder)
  if (allergyField) await allergyField.setValue(allergies)
  await wrapper.find('input[type="radio"][value="accept"]').setValue(true)
}

beforeEach(() => vi.clearAllMocks())

describe('sending an RSVP', () => {
  it('thanks the guest only after the reply was stored', async () => {
    let resolve
    const send = vi.fn(() => new Promise((r) => { resolve = r }))
    const wrapper = render(send)
    await answer(wrapper)

    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).not.toContain(en.invitation.rsvpSuccess)

    resolve()
    await flushPromises()
    expect(wrapper.text()).toContain(en.invitation.rsvpSuccess)
  })

  it('says it failed, and keeps what was typed, when the server refuses', async () => {
    const send = vi.fn().mockRejectedValue({ status: 500 })
    const wrapper = render(send)
    await answer(wrapper, { name: 'Ana Petrova' })

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain(en.invitation.rsvpError)
    expect(wrapper.text()).not.toContain(en.invitation.rsvpSuccess)
    expect(wrapper.find('.submit-message--error').exists()).toBe(true)
    const nameInput = wrapper.findAll('input').find((el) => el.element.value === 'Ana Petrova')
    expect(nameInput).toBeTruthy()
  })

  it('says to wait when the network has sent too many replies', async () => {
    const wrapper = render(vi.fn().mockRejectedValue({ response: { status: 429 } }))
    await answer(wrapper)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain(en.invitation.rsvpTooMany)
  })

  it('hands each guest\'s allergies to the sender', async () => {
    const send = vi.fn().mockResolvedValue()
    const wrapper = render(send)
    await answer(wrapper, { allergies: 'Walnuts' })

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(send.mock.calls[0][0].guests[0]).toMatchObject({ fullName: 'Ana Petrova', allergies: 'Walnuts' })
  })
})

describe('the RSVP request', () => {
  it('carries each guest\'s allergies to the server', async () => {
    publicApi.post.mockResolvedValue({ data: {} })

    await rsvpService.submitRsvp('e-1', {
      attendance: 'accept',
      guests: [
        { fullName: 'Ana Petrova', isChild: false, dietary: '', allergies: ' Walnuts ' },
        { fullName: 'Marko Petrov', isChild: false, dietary: '', allergies: '' },
      ],
    })

    const payload = publicApi.post.mock.calls[0][1]
    expect(payload.guests).toEqual([
      { name: 'Ana Petrova', isChild: false, dietary: null, allergies: 'Walnuts' },
      { name: 'Marko Petrov', isChild: false, dietary: null, allergies: null },
    ])
    expect(payload.inviteStatus).toBe('CONFIRMED')
  })

  it('lets a failed request reach the form', async () => {
    publicApi.post.mockRejectedValue({ status: 500 })

    await expect(rsvpService.submitRsvp('e-1', { attendance: 'accept', guests: [{ fullName: 'Ana' }] }))
      .rejects.toMatchObject({ status: 500 })
  })
})
