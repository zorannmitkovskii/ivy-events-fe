import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { h } from 'vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-702 — share the published invitation: copy the link (with a fallback and
 * an accessible confirmation/error), a downloadable QR code of the same link,
 * and the native share sheet where the browser has one. Only the event's public
 * guest link is ever copied, encoded or shared.
 */

const toDataURL = vi.fn()
vi.mock('qrcode', () => ({ default: { toDataURL: (...a) => toDataURL(...a) }, toDataURL: (...a) => toDataURL(...a) }))

const InvitationShare = (await import('@/components/payment/InvitationShare.vue')).default
const PublishedInvitation = (await import('@/components/payment/PublishedInvitation.vue')).default
const { copyText } = await import('@/utils/copyText')

const EVENT = '7b0c9d2e-1f3a-4b5c-8d6e-9f0a1b2c3d4e'
const PUBLIC = `https://ivyevents.mk/mk/invitations/persian-wedding?eventId=${EVENT}`
const PNG = 'data:image/png;base64,iVBORw0KGgo='

const wait = (ms = 40) => new Promise((r) => setTimeout(r, ms))

function makeI18n(locale = 'en') {
  return createI18n({ legacy: false, locale, messages: { en, mk, sq } })
}

function setNavigator(name, value) {
  Object.defineProperty(window.navigator, name, { value, configurable: true, writable: true })
}

async function mountShare(props = {}, locale = 'en') {
  const field = document.createElement('input')
  field.id = 'published-link'
  field.value = props.url ?? PUBLIC
  document.body.appendChild(field)
  const wrapper = mount(InvitationShare, {
    props: { url: PUBLIC, eventId: EVENT, fieldId: 'published-link', ...props },
    global: { plugins: [makeI18n(locale)] },
    attachTo: document.body,
  })
  await flushPromises()
  await wait(0)
  await flushPromises()
  return { wrapper, field }
}

beforeEach(() => {
  toDataURL.mockReset().mockResolvedValue(PNG)
  setNavigator('clipboard', undefined)
  setNavigator('share', undefined)
  setNavigator('canShare', undefined)
  document.execCommand = vi.fn(() => false)
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('INV-702 copy link', () => {
  it('copies the public link with the Clipboard API and confirms it in a polite live region', async () => {
    const writeText = vi.fn().mockResolvedValue()
    setNavigator('clipboard', { writeText })
    const { wrapper } = await mountShare()

    const button = wrapper.get('[data-testid="copy-link"]')
    expect(button.text()).toBe('Copy link')
    await button.trigger('click')
    await flushPromises()
    await wait()

    expect(writeText).toHaveBeenCalledWith(PUBLIC)
    expect(document.execCommand).not.toHaveBeenCalled()
    const status = wrapper.get('[data-testid="share-status"]')
    expect(status.attributes('role')).toBe('status')
    expect(status.attributes('aria-live')).toBe('polite')
    expect(status.text()).toBe('Link copied')
    expect(button.text()).toBe('Link copied')
    expect(wrapper.find('[data-testid="share-error"]').exists()).toBe(false)
  })

  it('falls back to a selected textarea + execCommand when the Clipboard API refuses', async () => {
    setNavigator('clipboard', { writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) })
    let copiedValue = null
    document.execCommand = vi.fn((cmd) => {
      const area = document.activeElement
      copiedValue = cmd === 'copy' && area?.tagName === 'TEXTAREA' ? area.value : null
      return true
    })
    const { wrapper } = await mountShare()
    const button = wrapper.get('[data-testid="copy-link"]')
    button.element.focus()
    await button.trigger('click')
    await flushPromises()
    await wait()

    expect(document.execCommand).toHaveBeenCalledWith('copy')
    expect(copiedValue).toBe(PUBLIC)
    expect(document.querySelector('textarea')).toBeNull()
    // Focus is back on the button the user pressed.
    expect(document.activeElement).toBe(button.element)
    expect(wrapper.get('[data-testid="share-status"]').text()).toBe('Link copied')
  })

  it('uses the fallback when there is no Clipboard API at all', async () => {
    document.execCommand = vi.fn(() => true)
    expect(await copyText(PUBLIC)).toBe(true)
    expect(document.execCommand).toHaveBeenCalledWith('copy')
    expect(await copyText('')).toBe(false)
  })

  it('when copying fails: an alert with what to do, and the link field focused and selected', async () => {
    document.execCommand = vi.fn(() => false)
    const { wrapper, field } = await mountShare({}, 'mk')
    await wrapper.get('[data-testid="copy-link"]').trigger('click')
    await flushPromises()
    await wait()

    const error = wrapper.get('[data-testid="share-error"]')
    expect(error.attributes('role')).toBe('alert')
    expect(error.text()).toContain('Не успеавме автоматски да го копираме')
    expect(wrapper.get('[data-testid="share-status"]').text()).toBe('')
    expect(wrapper.get('[data-testid="copy-link"]').text()).toBe('Копирај линк')
    expect(document.activeElement).toBe(field)
    expect(field.selectionStart).toBe(0)
    expect(field.selectionEnd).toBe(PUBLIC.length)
  })
})

describe('INV-702 QR code', () => {
  it('encodes exactly the public link, print-friendly, with alt text and a PNG download', async () => {
    const { wrapper } = await mountShare()
    expect(toDataURL).toHaveBeenCalledTimes(1)
    const [encoded, options] = toDataURL.mock.calls[0]
    expect(encoded).toBe(PUBLIC)
    expect(options).toMatchObject({ errorCorrectionLevel: 'M', margin: 4, color: { dark: '#000000', light: '#ffffff' } })

    const img = wrapper.get('[data-testid="qr-image"]')
    expect(img.attributes('src')).toBe(PNG)
    expect(img.attributes('alt')).toBe('QR code of the public invitation link')
    expect(img.attributes('data-qr-url')).toBe(PUBLIC)
    const download = wrapper.get('[data-testid="qr-download"]')
    expect(download.attributes('href')).toBe(PNG)
    expect(download.attributes('download')).toBe('ivy-invitation-qr-7b0c9d2e.png')
    expect(download.text()).toContain('Download QR code (PNG)')
  })

  it('a QR that cannot be created says so, offers no download, and the link still works', async () => {
    toDataURL.mockRejectedValue(new Error('too long'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { wrapper } = await mountShare()
    expect(wrapper.find('[data-testid="qr-image"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="qr-download"]').exists()).toBe(false)
    expect(wrapper.text()).toContain("The QR code couldn't be created")
    expect(wrapper.find('[data-testid="copy-link"]').exists()).toBe(true)
    spy.mockRestore()
  })
})

describe('INV-702 native share', () => {
  it('is offered only when the browser has a share sheet', async () => {
    const { wrapper } = await mountShare()
    expect(wrapper.find('[data-testid="native-share"]').exists()).toBe(false)
  })

  it('opens the sheet with only a title and the public link — nothing is sent for the user', async () => {
    const share = vi.fn().mockResolvedValue()
    setNavigator('share', share)
    setNavigator('canShare', vi.fn(() => true))
    const { wrapper } = await mountShare()
    await wrapper.get('[data-testid="native-share"]').trigger('click')
    await flushPromises()
    expect(share).toHaveBeenCalledWith({ title: 'Invitation', url: PUBLIC })
  })

  it('closing the sheet is not an error; a real failure is announced', async () => {
    const share = vi.fn().mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'AbortError' }))
      .mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'NotAllowedError' }))
    setNavigator('share', share)
    const { wrapper } = await mountShare()
    const button = wrapper.get('[data-testid="native-share"]')
    await button.trigger('click')
    await flushPromises()
    await wait()
    expect(wrapper.find('[data-testid="share-error"]').exists()).toBe(false)
    await button.trigger('click')
    await flushPromises()
    await wait()
    expect(wrapper.get('[data-testid="share-error"]').text()).toContain("Sharing didn't work")
  })

  it('is not offered when the browser says it cannot share a URL', async () => {
    setNavigator('share', vi.fn())
    setNavigator('canShare', vi.fn(() => false))
    const { wrapper } = await mountShare()
    expect(wrapper.find('[data-testid="native-share"]').exists()).toBe(false)
  })
})

describe('INV-702 never a private or administrative link', () => {
  const bad = [
    ['private link', `https://ivyevents.mk/mk/invitations/persian-wedding/private?eventId=${EVENT}`],
    ['editor address', `https://ivyevents.mk/mk/invitations/persian-wedding?edit=true&eventId=${EVENT}`],
    ['another event', 'https://ivyevents.mk/mk/invitations/persian-wedding?eventId=other'],
    ['dashboard page', `https://ivyevents.mk/mk/dashboard/events/overview?eventId=${EVENT}`],
    ['javascript:', 'javascript:alert(1)'],
  ]
  it.each(bad)('%s: nothing to copy, encode or share', async (_name, url) => {
    const writeText = vi.fn().mockResolvedValue()
    setNavigator('clipboard', { writeText })
    setNavigator('share', vi.fn())
    const { wrapper } = await mountShare({ url })
    expect(wrapper.find('[data-testid="invitation-share"]').exists()).toBe(false)
    expect(toDataURL).not.toHaveBeenCalled()
    expect(writeText).not.toHaveBeenCalled()
  })

  it('switching to an unsafe link drops the QR code made for the old one', async () => {
    const { wrapper } = await mountShare()
    expect(wrapper.find('[data-testid="qr-image"]').exists()).toBe(true)
    await wrapper.setProps({ url: `https://ivyevents.mk/mk/invitations/persian-wedding/private?eventId=${EVENT}` })
    await flushPromises()
    expect(wrapper.find('[data-testid="invitation-share"]').exists()).toBe(false)
    expect(toDataURL).toHaveBeenCalledTimes(1)
  })
})

describe('INV-702 on the success screen', () => {
  it('fills the #share slot of PublishedInvitation with the same public link', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)*', component: { template: '<div />' } }] })
    const wrapper = mount(PublishedInvitation, {
      props: { publicUrl: PUBLIC, eventId: EVENT },
      slots: {
        share: ({ publicUrl }) => h(InvitationShare, { url: publicUrl, eventId: EVENT, fieldId: 'published-link' }),
      },
      global: { plugins: [makeI18n('sq'), router] },
      attachTo: document.body,
    })
    await flushPromises()
    await wait(0)
    await flushPromises()
    expect(wrapper.get('[data-testid="public-url"]').element.value).toBe(PUBLIC)
    expect(wrapper.get('[data-testid="copy-link"]').text()).toBe('Kopjo lidhjen')
    expect(wrapper.get('[data-testid="qr-image"]').attributes('data-qr-url')).toBe(PUBLIC)
    wrapper.unmount()
  })

  it('has every share text in mk, en and sq', () => {
    const keys = Object.keys(en.cpay.publish.share).sort()
    expect(keys.length).toBeGreaterThan(5)
    for (const messages of [mk, sq]) {
      expect(Object.keys(messages.cpay.publish.share).sort()).toEqual(keys)
      for (const k of keys) expect(messages.cpay.publish.share[k]).toBeTruthy()
    }
  })
})
