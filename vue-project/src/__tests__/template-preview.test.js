import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-202 — a design previewed inside the catalogue, on a phone or a desktop:
 * no new tab, drawn by the page guests open, labelled sample content (RSVP
 * included), usable with the keyboard, and closing it leaves the choice, the
 * draft and the catalogue as they were.
 */

const push = vi.fn()
const route = { name: 'EventInvitationsPage', params: { lang: 'en' }, query: {} }
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => route,
  useRouter: () => ({
    push,
    back: vi.fn(),
    resolve: (to) => {
      if (typeof to === 'string') return { href: to }
      const qs = new URLSearchParams(to.query || {}).toString()
      return { href: qs ? `${to.path}?${qs}` : to.path }
    },
  }),
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
}))
vi.mock('@/services/auth.service', () => ({ isAuthenticated: () => false, getUsername: () => null }))
vi.mock('@/services/events.service', () => ({ eventsService: { create: vi.fn(), updateInvitation: vi.fn() } }))

let templates = []
vi.mock('@/services/invitationTemplate.service', () => ({
  invitationTemplateService: { listByCategory: vi.fn(async () => templates) },
}))

const { onboardingStore, setSelectedCategory, setEventDetails, setInvitationName, setInvitationPath, setEventId } =
  await import('@/store/onboarding.store')
const { draftStore, addDraftItem, clearDraft } = await import('@/store/invitationDraft.store')
const EventInvitationsPage = (await import('@/pages/onboarding/EventInvitationsPage.vue')).default

const KNOWN = [
  { id: 't1', name: 'Coastal Breeze', path: 'invitations/coastal-breeze', active: true },
  { id: 't2', name: 'Persian Wedding', path: 'invitations/persian-wedding', active: true },
]
const BASICS = {
  brideName: 'Ана', groomName: 'Марко', date: '2099-06-12', time: '17:30',
  timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' },
}

function makeI18n(locale = 'en') {
  return createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en, mk, sq } })
}
const mountPage = (locale = 'en') =>
  mount(EventInvitationsPage, { global: { plugins: [makeI18n(locale)], stubs: { OnboardingFooterLinks: true } }, attachTo: document.body })

const cardByName = (wrapper, name) =>
  wrapper.findAll('[data-testid="invitation-card"]').find((c) => c.find('h3').text() === name)
const $ = (testid) => document.querySelector(`[data-testid="${testid}"]`)
const dialog = () => $('template-preview')

async function openPreview(wrapper, name = 'Persian Wedding') {
  const btn = cardByName(wrapper, name).find('[data-testid="invitation-card-preview"]')
  btn.element.focus()
  await btn.trigger('click')
  await flushPromises()
  return btn
}

let openSpy
beforeEach(() => {
  localStorage.clear()
  clearDraft()
  push.mockReset()
  route.query = {}
  route.name = 'EventInvitationsPage'
  route.params = { lang: 'en' }
  setEventId('')
  setSelectedCategory('WEDDING')
  setEventDetails(null)
  setInvitationName('')
  setInvitationPath('')
  templates = [...KNOWN]
  openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
})
afterEach(() => {
  openSpy.mockRestore()
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('opening the preview', () => {
  it('opens in this page as a labelled modal dialog, with the guest page of the design in it', async () => {
    const wrapper = mountPage()
    await flushPromises()
    await openPreview(wrapper)

    expect(openSpy).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    const d = dialog()
    expect(d.getAttribute('role')).toBe('dialog')
    expect(d.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(d.getAttribute('aria-labelledby')).textContent)
      .toBe(en.onboarding.invitations.previewDialog.title.replace('{name}', 'Persian Wedding'))
    // What is sample content is part of the dialog's description.
    expect(d.getAttribute('aria-describedby')).toBe($('template-preview-legend').id)

    // The same renderer guests open — a new invitation, previewed, embedded.
    const src = new URL($('template-preview-frame').getAttribute('src'), 'http://x')
    expect(src.pathname).toBe('/en/invitations/persian-wedding')
    expect(Object.fromEntries(src.searchParams)).toEqual({ new: '1', preview: '1', embed: '1' })
    expect($('template-preview-frame').getAttribute('title')).toContain('Persian Wedding')

    // Focus moves into the dialog; the catalogue underneath does not scroll.
    expect(document.activeElement).toBe($('template-preview-close'))
    expect(document.body.style.overflow).toBe('hidden')
    wrapper.unmount()
  })

  it('switches between phone and desktop, said with aria-pressed, at the device widths', async () => {
    const wrapper = mountPage()
    await flushPromises()
    await openPreview(wrapper)

    const mobile = $('template-preview-mobile')
    const desktop = $('template-preview-desktop')
    expect(mobile.closest('[role="group"]').getAttribute('aria-label')).toBe(en.onboarding.invitations.previewDialog.device)

    mobile.click()
    await flushPromises()
    expect(mobile.getAttribute('aria-pressed')).toBe('true')
    expect(desktop.getAttribute('aria-pressed')).toBe('false')
    expect(dialog().dataset.device).toBe('mobile')
    expect($('template-preview-frame').style.width).toBe('390px')
    expect($('template-preview-frame').getAttribute('title')).toBe(
      en.onboarding.invitations.previewDialog.frame.mobile.replace('{name}', 'Persian Wedding'))

    desktop.click()
    await flushPromises()
    expect(desktop.getAttribute('aria-pressed')).toBe('true')
    expect(dialog().dataset.device).toBe('desktop')
    expect($('template-preview-frame').style.width).toBe('1280px')
    wrapper.unmount()
  })

  it('keeps Tab inside the dialog and closes on Escape', async () => {
    const wrapper = mountPage()
    await flushPromises()
    await openPreview(wrapper)

    const use = $('template-preview-use')
    use.focus()
    use.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    // Last control → back to the first one in the dialog.
    expect(document.activeElement).toBe($('template-preview-mobile'))

    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await flushPromises()
    expect(dialog()).toBeNull()
    wrapper.unmount()
  })
})

describe('closing leaves everything as it was', () => {
  for (const how of ['close', 'back', 'escape']) {
    it(`by ${how}: the choice, the draft and the focus are back where they were`, async () => {
      setEventDetails(BASICS)
      setInvitationName('t1')
      setInvitationPath('invitations/coastal-breeze')
      const wrapper = mountPage()
      await flushPromises()
      const before = {
        onboarding: localStorage.getItem('onboarding_state_v1'),
        draft: localStorage.getItem('invitation_draft_v1'),
      }
      const opener = await openPreview(wrapper)
      expect(dialog()).not.toBeNull()

      if (how === 'close') $('template-preview-close').click()
      if (how === 'back') $('template-preview-back').click()
      if (how === 'escape') dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await flushPromises()

      expect(dialog()).toBeNull()
      expect(onboardingStore.invitationName).toBe('t1')
      expect(onboardingStore.invitationPath).toBe('invitations/coastal-breeze')
      expect(localStorage.getItem('onboarding_state_v1')).toBe(before.onboarding)
      expect(localStorage.getItem('invitation_draft_v1')).toBe(before.draft)
      expect(cardByName(wrapper, 'Coastal Breeze').attributes('data-selected')).toBe('true')
      expect(cardByName(wrapper, 'Persian Wedding').attributes('data-selected')).toBe('false')
      expect(wrapper.find('[data-testid="invitation-selected-status"]').text()).toBe('')
      expect(document.activeElement).toBe(opener.element)
      expect(document.body.style.overflow).toBe('')
      expect(push).not.toHaveBeenCalled()
      wrapper.unmount()
    })
  }

  it('remembers the device for the next preview', async () => {
    const wrapper = mountPage()
    await flushPromises()
    await openPreview(wrapper)
    $('template-preview-mobile').click()
    $('template-preview-close').click()
    await flushPromises()
    await openPreview(wrapper, 'Coastal Breeze')
    expect(dialog().dataset.device).toBe('mobile')
    wrapper.unmount()
  })

  it('"Use this design" in the preview is the explicit way to pick it', async () => {
    setInvitationName('t1')
    const wrapper = mountPage()
    await flushPromises()
    await openPreview(wrapper)
    expect($('template-preview-use').getAttribute('aria-pressed')).toBe('false')

    $('template-preview-use').click()
    await flushPromises()

    expect(dialog()).toBeNull()
    expect(onboardingStore.invitationName).toBe('t2')
    expect(onboardingStore.invitationPath).toBe('invitations/persian-wedding')
    expect(wrapper.find('[data-testid="invitation-selected-status"]').text())
      .toBe(en.onboarding.invitations.card.selectedStatus.replace('{name}', 'Persian Wedding'))
    wrapper.unmount()
  })
})

describe('sample content is labelled', () => {
  const L = en.onboarding.invitations.previewDialog

  it('nothing entered yet: names, photos, details and the RSVP form are all samples', async () => {
    const wrapper = mountPage()
    await flushPromises()
    await openPreview(wrapper)
    expect($('template-preview-own')).toBeNull()
    const sample = $('template-preview-sample').textContent
    expect(sample).toContain(L.sample)
    for (const item of ['basics', 'photos', 'details', 'rsvp']) expect(sample).toContain(L.items[item])
    wrapper.unmount()
  })

  it('with basics and own details: those are marked as yours, photos and RSVP stay samples', async () => {
    setEventDetails(BASICS)
    addDraftItem('agenda', { _localId: '_local_x', type: 'CUSTOM', time: '19:00', title: 'Our own dinner' })
    const wrapper = mountPage()
    await flushPromises()
    await openPreview(wrapper)
    const own = $('template-preview-own').textContent
    expect(own).toContain(L.yours)
    expect(own).toContain(L.items.basics)
    expect(own).toContain(L.items.details)
    const sample = $('template-preview-sample').textContent
    expect(sample).toContain(L.items.photos)
    expect(sample).toContain(L.items.rsvp)
    expect(sample).not.toContain(L.items.basics)
    expect(sample).not.toContain(L.items.details)
    expect(draftStore.agenda).toHaveLength(1)
    wrapper.unmount()
  })

  it('from the dashboard: the current event in that design, its RSVP not sent', async () => {
    route.name = 'dashboard.invitations'
    setEventId('ev-7')
    const wrapper = mountPage()
    await flushPromises()
    await openPreview(wrapper)
    const src = new URL($('template-preview-frame').getAttribute('src'), 'http://x')
    expect(Object.fromEntries(src.searchParams)).toEqual({ preview: '1', embed: '1', eventId: 'ev-7' })
    expect($('template-preview-legend').textContent).toContain(L.eventContent)
    expect(openSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('is said in Macedonian on a Macedonian page', async () => {
    route.params = { lang: 'mk' }
    const wrapper = mountPage('mk')
    await flushPromises()
    await openPreview(wrapper)
    expect($('template-preview-sample').textContent).toContain(mk.onboarding.invitations.previewDialog.sample)
    expect($('template-preview-mobile').textContent.trim()).toBe(mk.onboarding.invitations.previewDialog.mobile)
    wrapper.unmount()
  })

  it('has every new text in mk, en and sq', () => {
    const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
      v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`])
    for (const pick of [(j) => j.onboarding.invitations.previewDialog, (j) => j.editSection.samplePreview]) {
      const keys = flat(pick(en)).sort()
      expect(keys.length).toBeGreaterThan(0)
      for (const other of [mk, sq]) {
        expect(flat(pick(other)).sort()).toEqual(keys)
        for (const k of keys) {
          const v = k.split('.').reduce((o, s) => o[s], pick(other))
          expect(typeof v === 'string' && v.trim().length > 0).toBe(true)
        }
      }
    }
  })
})
