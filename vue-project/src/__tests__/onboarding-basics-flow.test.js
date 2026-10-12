import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-104 — the order of making an invitation: event type and basics first
 * (no account), then the design shown with those basics, then the editor.
 */

const push = vi.fn()
const route = { params: { lang: 'en' }, query: {} }
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => route,
  useRouter: () => ({ push, back: vi.fn(), resolve: (to) => ({ href: typeof to === 'string' ? to : to.path }) }),
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
}))

let authenticated = false
vi.mock('@/services/auth.service', () => ({
  isAuthenticated: () => authenticated,
  getUsername: () => null,
}))
vi.mock('@/services/events.service', () => ({ eventsService: { create: vi.fn(), updateInvitation: vi.fn() } }))
vi.mock('@/services/invitationTemplate.service', () => ({
  invitationTemplateService: {
    listByCategory: vi.fn(async () => [
      { id: 't1', name: 'Coastal Breeze', path: 'invitations/coastal-breeze', active: true },
      { id: 't2', name: 'Persian', path: 'invitations/persian-wedding', active: true },
    ]),
  },
}))

const { onboardingStore, setSelectedCategory, setEventDetails, setInvitationName, setEventId } = await import('@/store/onboarding.store')
const draft = await import('@/store/invitationDraft.store')
const EventBasicsPage = (await import('@/pages/onboarding/EventBasicsPage.vue')).default
const EventInvitationsPage = (await import('@/pages/onboarding/EventInvitationsPage.vue')).default
const InvitationAuthDialog = (await import('@/components/invitations/shared/InvitationAuthDialog.vue')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })
const global = { plugins: [i18n], stubs: { OnboardingFooterLinks: true } }

beforeEach(() => {
  localStorage.clear()
  draft.clearDraft()
  push.mockReset()
  route.query = {}
  authenticated = false
  setEventId('')
  setSelectedCategory('WEDDING')
  setEventDetails(null)
  setInvitationName('')
})

async function fill(wrapper, values) {
  for (const [id, value] of Object.entries(values)) {
    const el = wrapper.find(`#${id}`)
    await el.setValue(value)
  }
}

describe('the basics page', () => {
  it('lets a guest enter the basics and continue to the designs', async () => {
    const wrapper = mount(EventBasicsPage, { global, attachTo: document.body })
    expect(wrapper.text()).toContain(en.onboarding.eventBasics.noteGuest)

    await fill(wrapper, {
      'basics-bride': 'Ана',
      'basics-groom': 'Марко',
      'basics-date': '2099-06-12',
      'basics-time': '17:30',
      'basics-venue': 'Хотел Александар Палас',
      'basics-address': 'Скопје',
    })
    // Europe/Skopje unless changed.
    expect(wrapper.find('#basics-tz').element.value).toBe('Europe/Skopje')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(push).toHaveBeenCalledWith({ name: 'EventInvitationsPage', params: { lang: 'en' } })
    expect(onboardingStore.eventDetails).toMatchObject({
      brideName: 'Ана', groomName: 'Марко', date: '2099-06-12', time: '17:30',
      timezone: 'Europe/Skopje', location: { name: 'Хотел Александар Палас', address: 'Скопје' },
    })
    // The editor will open with these names, not an older draft's.
    expect(draft.getDraftTheme().info).toMatchObject({ brideName: 'Ана', weddingDateTime: '2099-06-12T17:30:00' })
    wrapper.unmount()
  })

  it('shows what is missing and moves focus to the first field to fix', async () => {
    const wrapper = mount(EventBasicsPage, { global, attachTo: document.body })
    await fill(wrapper, { 'basics-bride': 'Ана' })

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(push).not.toHaveBeenCalled()
    expect(wrapper.find('#basics-groom').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('#basics-groom').attributes('aria-describedby')).toBe('basics-groom-err')
    expect(document.activeElement?.id).toBe('basics-groom')
    wrapper.unmount()
  })

  it('refuses a start that has already passed in the event timezone', async () => {
    const wrapper = mount(EventBasicsPage, { global, attachTo: document.body })
    await fill(wrapper, {
      'basics-bride': 'Ана', 'basics-groom': 'Марко',
      'basics-date': '2001-01-01', 'basics-time': '12:00', 'basics-venue': 'Охрид',
    })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(push).not.toHaveBeenCalled()
    expect(wrapper.find('#basics-date-err').text()).toContain('Europe/Skopje')
    wrapper.unmount()
  })

  it('asks for a title, not a couple, for a birthday', async () => {
    setSelectedCategory('BIRTHDAY')
    const wrapper = mount(EventBasicsPage, { global })
    expect(wrapper.find('#basics-title').exists()).toBe(true)
    expect(wrapper.find('#basics-bride').exists()).toBe(false)
  })
})

describe('the design picker', () => {
  const basics = {
    brideName: 'Ана', groomName: 'Марко', date: '2099-06-12', time: '17:30',
    timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' },
  }

  it("draws the user's names, date and place on every design", async () => {
    setEventDetails(basics)
    const wrapper = mount(EventInvitationsPage, { global })
    await flushPromises()

    const cards = wrapper.findAll('[data-testid="invitation-card-personal"]')
    expect(cards).toHaveLength(2)
    expect(cards[0].text()).toContain('Ана & Марко')
    expect(cards[0].text()).toContain('Охрид')
    expect(wrapper.find('[data-testid="basics-summary"]').text()).toContain('Ана & Марко')
  })

  it('opens the chosen design in the editor as a new event — no account asked yet', async () => {
    setEventDetails(basics)
    setEventId('somebody-elses-current-event')
    const wrapper = mount(EventInvitationsPage, { global })
    await flushPromises()

    await wrapper.findAll('[data-testid="invitation-card-use"]')[1].trigger('click')
    // Newest first: the second card is the older template.
    expect(onboardingStore.invitationName).toBe('t1')

    await wrapper.findComponent({ name: 'ButtonMain' }).trigger('click')
    await flushPromises()

    expect(push).toHaveBeenCalledWith({
      path: '/en/invitations/coastal-breeze',
      query: { new: '1', edit: 'true' },
    })
  })
})

describe('the account dialog at the final action', () => {
  it('says the draft is only in this browser and offers sign-up, sign-in or more editing', async () => {
    const wrapper = mount(InvitationAuthDialog, {
      props: { open: true, mode: 'gate', photoCount: 2 },
      global,
      attachTo: document.body,
    })
    await flushPromises()
    const dialog = document.querySelector('[data-testid="invitation-auth-dialog"]')
    expect(dialog.getAttribute('role')).toBe('dialog')
    expect(dialog.textContent).toContain(en.editSection.authGate.body)
    expect(dialog.textContent).toContain('2 photos')
    expect(document.activeElement?.dataset.testid).toBe('auth-gate-signup')

    document.querySelector('[data-testid="auth-gate-login"]').click()
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('login')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    wrapper.unmount()
  })

  it('offers a safe choice when the account already has an event', async () => {
    const wrapper = mount(InvitationAuthDialog, {
      props: { open: true, mode: 'choose' },
      global,
      attachTo: document.body,
    })
    await flushPromises()
    document.querySelector('[data-testid="resume-save-new"]').click()
    // INV-302: discarding asks first, naming what goes.
    document.querySelector('[data-testid="resume-discard"]').click()
    await flushPromises()
    expect(wrapper.emitted('discard')).toBeUndefined()
    expect(document.querySelector('[data-testid="discard-scope"]')).not.toBeNull()
    document.querySelector('[data-testid="discard-confirm"]').click()
    expect(wrapper.emitted('save-new')).toHaveLength(1)
    expect(wrapper.emitted('discard')).toHaveLength(1)
    wrapper.unmount()
  })
})

describe('new UI text', () => {
  const keys = [
    'onboarding.eventBasics.lead', 'onboarding.eventBasics.fields.timezone', 'onboarding.eventBasics.errors.past',
    'onboarding.invitations.basicsMissing', 'editSection.authGate.body', 'editSection.resume.body',
    'editSection.resume.failed', 'editSection.previewAsGuest', 'editSection.rsvpDeadlineProblem.past', 'auth.draftNotice.text',
  ]
  const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj)

  it('exists in Macedonian, English and Albanian', () => {
    for (const locale of [mk, en, sq]) {
      for (const key of keys) expect(typeof get(locale, key), key).toBe('string')
    }
  })
})
