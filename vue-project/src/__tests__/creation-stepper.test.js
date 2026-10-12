import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-102 — the stepper of a new invitation: Event, Design, Details, RSVP,
 * Preview. Statuses come from saved data and validity, going back keeps what
 * was typed, optional steps can be skipped and a missing required field is
 * where a click leads.
 */

const push = vi.fn()
const route = { params: { lang: 'en' }, query: {} }
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => route,
  useRouter: () => ({ push, back: vi.fn(), resolve: (to) => ({ href: typeof to === 'string' ? to : to.path }) }),
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
}))
vi.mock('@/services/auth.service', () => ({ isAuthenticated: () => false, getUsername: () => null }))
vi.mock('@/services/events.service', () => ({ eventsService: { create: vi.fn(), updateInvitation: vi.fn() } }))
vi.mock('@/services/invitationTemplate.service', () => ({
  invitationTemplateService: {
    listByCategory: vi.fn(async () => [
      { id: 't1', name: 'Coastal Breeze', path: 'invitations/coastal-breeze', active: true },
    ]),
  },
}))

const { computeCreationSteps, blockingStep, hasOwnDetails, editorCurrentStep } = await import('@/utils/creationSteps')
const { onboardingStore, setSelectedCategory, setEventDetails, setInvitationName, setInvitationPath } = await import('@/store/onboarding.store')
const draft = await import('@/store/invitationDraft.store')
const CreationStepper = (await import('@/components/onboarding/CreationStepper.vue')).default
const EventBasicsPage = (await import('@/pages/onboarding/EventBasicsPage.vue')).default
const EventInvitationsPage = (await import('@/pages/onboarding/EventInvitationsPage.vue')).default
const coastal = (await import('@/config/designPresets/coastal-breeze.js')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })
const global = { plugins: [i18n], stubs: { OnboardingFooterLinks: true } }

const NOW = Date.parse('2026-10-10T10:00:00Z')
const BASICS = {
  brideName: 'Ана', groomName: 'Марко', date: '2099-06-12', time: '17:30',
  timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' },
}
const byKey = (steps) => Object.fromEntries(steps.map((s) => [s.key, s]))

beforeEach(() => {
  localStorage.clear()
  draft.clearDraft()
  push.mockReset()
  route.query = {}
  setSelectedCategory('WEDDING')
  setEventDetails(null)
  setInvitationName('')
  setInvitationPath('')
})

describe('step statuses', () => {
  it('has the five steps in the INV-104 order', () => {
    const steps = computeCreationSteps({ current: 'event', category: 'WEDDING', basics: {}, now: NOW })
    expect(steps.map((s) => s.key)).toEqual(['event', 'design', 'details', 'rsvp', 'preview'])
    expect(steps.filter((s) => s.required).map((s) => s.key)).toEqual(['event', 'design'])
  })

  it('names what the Event step is missing, first field first', () => {
    const s = byKey(computeCreationSteps({ current: 'event', category: 'WEDDING', basics: { brideName: 'Ана' }, now: NOW }))
    expect(s.event.status).toBe('incomplete')
    expect(s.event.current).toBe(true)
    expect(s.event.problems.map((p) => p.field)).toEqual(['groomName', 'date', 'time', 'location'])
    expect(s.design.status).toBe('incomplete')
    expect(s.details.status).toBe('optional')
    expect(s.rsvp.status).toBe('optional')
  })

  it('asks for the category first, and a title rather than names where the event has one', () => {
    expect(computeCreationSteps({ current: 'event', category: '', basics: BASICS, now: NOW })[0].problems)
      .toEqual([{ field: 'category', labelKey: 'creationSteps.fields.category' }])
    const birthday = computeCreationSteps({ current: 'event', category: 'BIRTHDAY', typeRequired: true, basics: BASICS, now: NOW })[0]
    expect(birthday.problems.map((p) => p.field)).toEqual(['type', 'title'])
  })

  it('is complete only on valid data — a date already past in the event zone is not', () => {
    const ok = byKey(computeCreationSteps({ current: 'details', category: 'WEDDING', basics: BASICS, hasDesign: true, now: NOW }))
    expect(ok.event.status).toBe('complete')
    expect(ok.design.status).toBe('complete')

    const past = byKey(computeCreationSteps({ current: 'details', category: 'WEDDING', basics: { ...BASICS, date: '2001-01-01' }, hasDesign: true, now: NOW }))
    // Left behind with a problem: an error, not "done".
    expect(past.event.status).toBe('error')
    expect(past.event.problems.map((p) => p.field)).toEqual(['date'])
  })

  it('marks an optional step passed without content as skipped, and done once it has some', () => {
    const skipped = byKey(computeCreationSteps({ current: 'preview', category: 'WEDDING', basics: BASICS, hasDesign: true, now: NOW }))
    expect(skipped.details.status).toBe('skipped')
    expect(skipped.rsvp.status).toBe('skipped')
    expect(skipped.preview.current).toBe(true)

    const done = byKey(computeCreationSteps({
      current: 'preview', category: 'WEDDING', basics: BASICS, hasDesign: true, hasDetails: true, rsvpDeadline: '2099-05-01', now: NOW,
    }))
    expect(done.details.status).toBe('complete')
    expect(done.rsvp.status).toBe('complete')
  })

  it('reports an RSVP deadline after the event as an error on the RSVP step', () => {
    const s = byKey(computeCreationSteps({
      current: 'details', category: 'WEDDING', basics: BASICS, hasDesign: true, rsvpDeadline: '2099-07-01', now: NOW,
    }))
    expect(s.rsvp.status).toBe('error')
    expect(s.rsvp.problems[0]).toMatchObject({ field: 'rsvpDeadline', reason: 'afterEvent' })
  })

  it('never lets an optional step block, but sends a later step to an unfinished required one', () => {
    const steps = computeCreationSteps({ current: 'design', category: 'WEDDING', basics: { brideName: 'Ана' }, hasDesign: true, now: NOW })
    expect(blockingStep(steps, 'details').key).toBe('event')
    expect(blockingStep(steps, 'event').key).toBe('event')

    const ready = computeCreationSteps({ current: 'event', category: 'WEDDING', basics: BASICS, hasDesign: true, now: NOW })
    expect(blockingStep(ready, 'preview').key).toBe('preview')
  })

  it("reads the editor's step from its state", () => {
    expect(editorCurrentStep({})).toBe('details')
    expect(editorCurrentStep({ activeSection: 'rsvp' })).toBe('rsvp')
    expect(editorCurrentStep({ preview: true, activeSection: 'rsvp' })).toBe('preview')
  })
})

describe("the design's example entries", () => {
  const examples = coastal.defaultItems

  it('do not count as details the person entered', () => {
    const withIds = (list) => list.map((item, i) => ({ ...item, _localId: `_local_${i}`, id: `_local_${i}` }))
    expect(hasOwnDetails({
      eventDetails: withIds(examples.eventDetails),
      agenda: withIds(examples.agenda),
      ourStory: withIds(examples.ourStory),
    })).toBe(false)
  })

  it('an added or changed entry does', () => {
    expect(hasOwnDetails({ eventDetails: [{ ...examples.eventDetails[0], location: { name: 'Св. Климент' } }] })).toBe(true)
    expect(hasOwnDetails({ agenda: [{ type: 'CEREMONY', time: '17:15' }] })).toBe(true)
    expect(hasOwnDetails({ ourStory: [{ ...examples.ourStory[0], description: 'Нашата приказна' }] })).toBe(true)
  })
})

describe('the stepper', () => {
  const steps = computeCreationSteps({ current: 'design', category: 'WEDDING', basics: { brideName: 'Ана' }, now: NOW })

  it('marks the current step and says each status in words, not by colour alone', () => {
    const wrapper = mount(CreationStepper, { props: { steps }, global })
    const nav = wrapper.find('nav')
    expect(nav.attributes('aria-label')).toBe(en.creationSteps.label)

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(5)
    expect(buttons[1].attributes('aria-current')).toBe('step')
    expect(buttons.filter((b) => b.attributes('aria-current')).length).toBe(1)

    // The Event step was left with missing fields: "!" and the fields by name.
    expect(buttons[0].attributes('data-status')).toBe('error')
    expect(buttons[0].text()).toContain('!')
    expect(buttons[0].text()).toContain('Step 1 of 5')
    expect(buttons[0].text()).toContain(en.creationSteps.status.error)
    expect(buttons[0].text()).toContain(en.onboarding.eventBasics.fields.groomName)
    expect(buttons[2].text()).toContain(en.creationSteps.status.optional)
    expect(wrapper.find('[data-testid="creation-stepper-summary"]').text()).toContain('Step 2 of 5: Design')
  })

  it('works from the keyboard: arrows, Home and End move between steps', async () => {
    const wrapper = mount(CreationStepper, { props: { steps }, global, attachTo: document.body })
    const buttons = wrapper.findAll('button')
    buttons[1].element.focus()
    await buttons[1].trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(buttons[2].element)
    await buttons[2].trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(buttons[0].element)
    await buttons[0].trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(buttons[0].element)
    await buttons[0].trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(buttons[4].element)

    await buttons[3].trigger('click')
    expect(wrapper.emitted('go')).toEqual([['rsvp']])
    wrapper.unmount()
  })

  it('has its text in Macedonian, English and Albanian', () => {
    const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj)
    const keys = [
      'creationSteps.label', 'creationSteps.current', 'creationSteps.position', 'creationSteps.progress', 'creationSteps.fix',
      ...['event', 'design', 'details', 'rsvp', 'preview'].map((k) => `creationSteps.steps.${k}`),
      ...['complete', 'error', 'incomplete', 'optional', 'skipped'].map((k) => `creationSteps.status.${k}`),
      ...['category', 'type', 'design', 'rsvpDeadline'].map((k) => `creationSteps.fields.${k}`),
    ]
    for (const locale of [mk, en, sq]) {
      for (const key of keys) expect(typeof get(locale, key), key).toBe('string')
    }
  })
})

describe('the stepper on the basics page', () => {
  const stepButton = (wrapper, key) => wrapper.find(`[data-testid="creation-stepper"] [data-step="${key}"]`)

  it('keeps what was typed when going back a step', async () => {
    const wrapper = mount(EventBasicsPage, { global, attachTo: document.body })
    await wrapper.find('#basics-bride').setValue('Ана')
    await wrapper.find('#basics-date').setValue('2099-06-12')
    await flushPromises()

    // Whatever way the page is left, the half-typed answers are already kept,
    // valid or not — and are there on coming back to the step.
    expect(onboardingStore.eventDetails).toMatchObject({ brideName: 'Ана', date: '2099-06-12' })

    const again = mount(EventBasicsPage, { global, attachTo: document.body })
    expect(again.find('#basics-bride').element.value).toBe('Ана')
    expect(again.find('#basics-date').element.value).toBe('2099-06-12')
    wrapper.unmount()
    again.unmount()
  })

  it('leads a later step to the first missing field instead of skipping the Event step', async () => {
    const wrapper = mount(EventBasicsPage, { global, attachTo: document.body })
    await wrapper.find('#basics-bride').setValue('Ана')

    await stepButton(wrapper, 'details').trigger('click')
    await flushPromises()

    expect(push).not.toHaveBeenCalled()
    expect(document.activeElement?.id).toBe('basics-groom')
    expect(wrapper.find('#basics-groom').attributes('aria-invalid')).toBe('true')
    wrapper.unmount()
  })

  it('goes on to the design once the basics are valid, with the draft following them', async () => {
    const wrapper = mount(EventBasicsPage, { global, attachTo: document.body })
    for (const [id, value] of Object.entries({
      'basics-bride': 'Ана', 'basics-groom': 'Марко', 'basics-date': '2099-06-12',
      'basics-time': '17:30', 'basics-venue': 'Охрид',
    })) await wrapper.find(`#${id}`).setValue(value)

    expect(stepButton(wrapper, 'event').attributes('data-status')).toBe('complete')
    await stepButton(wrapper, 'design').trigger('click')
    await flushPromises()

    expect(push).toHaveBeenCalledWith({ name: 'EventInvitationsPage', params: { lang: 'en' } })
    expect(draft.getDraftTheme().info).toMatchObject({ brideName: 'Ана', groomName: 'Марко', venue: 'Охрид' })
    wrapper.unmount()
  })

  it('opens at the field the stepper sent it to, with the error shown', async () => {
    route.query = { focus: 'date' }
    const wrapper = mount(EventBasicsPage, { global, attachTo: document.body })
    await flushPromises()
    expect(document.activeElement?.id).toBe('basics-date')
    expect(wrapper.find('#basics-date-err').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('the stepper on the design page', () => {
  const stepButton = (wrapper, key) => wrapper.find(`[data-testid="creation-stepper"] [data-step="${key}"]`)

  it('skips straight to RSVP or the preview once there is a design — Details is optional', async () => {
    setEventDetails(BASICS)
    const wrapper = mount(EventInvitationsPage, { global, attachTo: document.body })
    await flushPromises()
    await wrapper.find('[data-testid="invitation-card-use"]').trigger('click')
    expect(onboardingStore.invitationPath).toBe('invitations/coastal-breeze')

    await stepButton(wrapper, 'rsvp').trigger('click')
    await flushPromises()
    expect(push).toHaveBeenLastCalledWith({
      path: '/en/invitations/coastal-breeze', query: { new: '1', edit: 'true', step: 'rsvp' },
    })

    await stepButton(wrapper, 'preview').trigger('click')
    await flushPromises()
    expect(push).toHaveBeenLastCalledWith({
      path: '/en/invitations/coastal-breeze', query: { new: '1', preview: '1' },
    })
    wrapper.unmount()
  })

  it('without a design, a later step points at the designs instead', async () => {
    setEventDetails(BASICS)
    const wrapper = mount(EventInvitationsPage, { global, attachTo: document.body })
    await flushPromises()

    expect(stepButton(wrapper, 'design').attributes('aria-current')).toBe('step')
    await stepButton(wrapper, 'details').trigger('click')
    await flushPromises()
    expect(push).not.toHaveBeenCalled()
    expect(document.activeElement?.dataset.testid).toBe('invitation-card-use')
    wrapper.unmount()
  })

  it('goes back to the Event step at the field that is missing', async () => {
    setEventDetails({ ...BASICS, location: { name: '', address: '' } })
    const wrapper = mount(EventInvitationsPage, { global })
    await flushPromises()

    await stepButton(wrapper, 'event').trigger('click')
    await flushPromises()
    expect(push).toHaveBeenCalledWith({ name: 'EventBasicsPage', params: { lang: 'en' }, query: { focus: 'location' } })
  })
})
