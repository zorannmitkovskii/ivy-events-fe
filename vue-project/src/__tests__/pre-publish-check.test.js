import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-601 — the check before publishing.
 *
 * The editor's preview notes (INV-602) are weighed: a missing or wrong basic
 * (by event type, judged in the event's timezone) and a wrong RSVP deadline
 * block; an optional section hidden or empty, or a design's example, is only
 * advice. The server repeats the blockers when the publish (the package
 * payment) starts, and each one leads to its control in the editor.
 */

const initPayment = vi.fn()
vi.mock('@/services/cpay.service', () => ({ cpayService: { initPayment: (...a) => initPayment(...a) } }))
const getById = vi.fn()
vi.mock('@/services/events.service', () => ({ eventsService: { getById: (...a) => getById(...a) } }))
vi.mock('@/services/package.service', () => ({
  packageService: {
    listByCategory: async () => [
      { id: 'p1', packageType: 'INV_PRO', name: 'Pro', price: 1500, currency: 'MKD', features: [] },
    ],
  },
}))
vi.mock('@/services/auth.service', () => ({
  getUserId: () => 'u1',
  getPackages: () => [],
  isAuthenticated: () => true,
  getUsername: () => 'ana',
  getEventId: () => null,
  hasRole: () => false,
}))
vi.mock('@/composables/useAuthUser', async () => {
  const { ref } = await import('vue')
  return { useAuthUser: () => ({ user: ref({ email: 'a@b.c' }), eventId: ref('ev-1') }) }
})
const redirect = vi.fn()
vi.mock('@/utils/redirectToCpay', () => ({ redirectToCpay: (...a) => redirect(...a) }))

const { guestPreviewNotes, basicsProblems, NOTE_KINDS } = await import('@/utils/guestPreviewNotes')
const { validateBasics, rsvpDeadlineProblem } = await import('@/utils/eventBasics')
const {
  prePublishCheck, publishSeverity, serverPublishProblems, fixTarget, editorFixLocation,
  PUBLISH_SEVERITY, NOT_READY_ERROR_CODE,
} = await import('@/utils/prePublishCheck')
const { ApiError } = await import('@/services/apiError')
const GuestPreviewBar = (await import('@/components/invitations/shared/GuestPreviewBar.vue')).default
const DashboardPackagesPage = (await import('@/pages/dashboard/DashboardPackagesPage.vue')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })

// 2026-10-10 10:00 in Skopje (UTC+2 in October).
const NOW = Date.UTC(2026, 9, 10, 8, 0)
const SKOPJE = 'Europe/Skopje'

const basics = (over = {}) => ({
  brideName: 'Ана', groomName: 'Марко', title: '',
  date: '2027-06-12', time: '17:00', timezone: SKOPJE,
  location: { name: 'Охрид', address: '' },
  ...over,
})

/** The notes the editor builds, with every optional part present. */
const notesFor = ({ category = 'WEDDING', b = basics(), deadline = '', ...over } = {}) =>
  guestPreviewNotes({
    basicsProblems: basicsProblems(validateBasics(b, category, NOW)),
    visible: { entry: true, details: true, agendaList: true, ourStoryList: true, rsvp: true },
    hasContent: { agendaList: true, ourStoryList: true },
    examples: { agenda: 0, ourStory: 0 },
    ownDetails: 2,
    photos: { heroOwn: true, storyDrawn: 0, storyOwn: 0, collageDrawn: false, collageOwn: 0 },
    showAgenda: false,
    privateLink: true,
    rsvp: { deadlineProblem: rsvpDeadlineProblem(deadline, b.date, b.time, b.timezone, NOW), notOpen: false },
    ...over,
  })

describe('prePublishCheck: blockers and recommendations', () => {
  it('a complete invitation is ready, with nothing to fix', () => {
    const check = prePublishCheck(notesFor({ deadline: '2027-05-30' }))
    expect(check).toEqual({ blockers: [], recommendations: [], ready: true })
  })

  it('required fields depend on the event type: names for a wedding, a title for a birthday', () => {
    const wedding = prePublishCheck(notesFor({ b: basics({ brideName: '', groomName: ' ' }) }))
    expect(wedding.ready).toBe(false)
    expect(wedding.blockers.map((n) => n.field)).toEqual(['brideName', 'groomName'])

    const birthday = prePublishCheck(notesFor({ category: 'BIRTHDAY', b: basics({ brideName: '', groomName: '', title: '' }) }))
    expect(birthday.blockers.map((n) => n.field)).toEqual(['title'])
    const titled = prePublishCheck(notesFor({ category: 'BIRTHDAY', b: basics({ brideName: '', groomName: '', title: 'Мила 30' }) }))
    expect(titled.ready).toBe(true)
  })

  it('date, time, timezone and place are blockers, each naming its field', () => {
    const check = prePublishCheck(notesFor({ b: basics({ date: '', time: '', timezone: 'Mars/Base', location: { name: '' } }) }))
    expect(check.blockers.map((n) => n.field)).toEqual(['date', 'time', 'timezone', 'location'])
    expect(check.blockers.every((n) => n.section === 'info' && n.action === 'edit')).toBe(true)
  })

  it('"already past" is judged in the event\'s timezone, to the minute', () => {
    const past = prePublishCheck(notesFor({ b: basics({ date: '2026-10-10', time: '09:59' }) }))
    expect(past.blockers).toHaveLength(1)
    expect(past.blockers[0]).toMatchObject({ field: 'date', params: { messageKey: 'onboarding.eventBasics.errors.past' } })

    expect(prePublishCheck(notesFor({ b: basics({ date: '2026-10-10', time: '10:01' }) })).ready).toBe(true)
    // 09:59 in New York is still hours ahead.
    expect(prePublishCheck(notesFor({ b: basics({ date: '2026-10-10', time: '09:59', timezone: 'America/New_York' }) })).ready).toBe(true)
  })

  it('the RSVP deadline: today is fine, yesterday or after the event blocks, at the RSVP deadline field', () => {
    expect(prePublishCheck(notesFor({ deadline: '2026-10-10' })).ready).toBe(true)
    expect(prePublishCheck(notesFor({ deadline: '2027-06-12' })).ready).toBe(true)
    const past = prePublishCheck(notesFor({ deadline: '2026-10-09' }))
    expect(past.blockers).toEqual([expect.objectContaining({ section: 'rsvp', field: 'deadline', textKey: 'deadlinePast' })])
    const after = prePublishCheck(notesFor({ deadline: '2027-06-13' }))
    expect(after.blockers).toEqual([expect.objectContaining({ section: 'rsvp', textKey: 'deadlineAfterEvent' })])
  })

  it('a hidden optional section, an empty one, example photos and entries are advice, never blockers', () => {
    const notes = notesFor({
      visible: { entry: true, details: false, agendaList: true, ourStoryList: false, rsvp: true },
      hasContent: { agendaList: false, ourStoryList: true },
      ownDetails: 0,
      photos: { heroOwn: false, storyDrawn: 0, storyOwn: 0, collageDrawn: false, collageOwn: 0 },
      designHidden: [{ kind: 'storyPhotos', count: 2, shown: 0 }],
    })
    const check = prePublishCheck(notes)
    expect(check.ready).toBe(true)
    expect(check.blockers).toEqual([])
    expect(check.recommendations.map((n) => n.kind)).toEqual(
      expect.arrayContaining([NOTE_KINDS.HIDDEN, NOTE_KINDS.EMPTY, NOTE_KINDS.EXAMPLE]),
    )
    expect(check.recommendations).toHaveLength(notes.length)
  })

  it('a switched-off RSVP is not a blocker even with a past deadline; the design\'s demo names are', () => {
    const hidden = prePublishCheck(notesFor({
      deadline: '2020-01-01',
      visible: { entry: true, details: true, agendaList: true, ourStoryList: true, rsvp: false },
    }))
    expect(hidden.ready).toBe(true)
    expect(hidden.recommendations.map((n) => n.textKey)).toEqual(['rsvpHidden'])

    const demo = prePublishCheck(guestPreviewNotes({ demoBasics: true, nameField: 'brideName' }))
    expect(demo.blockers.map((n) => n.textKey)).toEqual(['demoBasics'])
  })

  it('notes that only explain the preview weigh nothing', () => {
    expect(publishSeverity({ kind: NOTE_KINDS.INFO, textKey: 'privateOnly' })).toBeNull()
    expect(publishSeverity({ kind: NOTE_KINDS.INFO, textKey: 'rsvpNotOpen' })).toBeNull()
    expect(publishSeverity({ kind: NOTE_KINDS.MISSING })).toBe(PUBLISH_SEVERITY.BLOCKER)
    expect(publishSeverity(null)).toBeNull()
  })
})

describe('the server\'s answer and the way to each control', () => {
  it('server reasons become the same notes, unknown fields dropped', () => {
    const notes = serverPublishProblems({
      location: 'missing', date: 'past', brideName: 'missing', rsvpDeadline: 'afterEvent', somethingNew: 'missing',
    })
    expect(notes.map((n) => [n.section, n.field, n.textKey])).toEqual([
      ['info', 'brideName', 'missingField'],
      ['info', 'date', 'missingField'],
      ['info', 'location', 'missingField'],
      ['rsvp', 'deadline', 'deadlineAfterEvent'],
    ])
    expect(notes[1].params.messageKey).toBe('onboarding.eventBasics.errors.past')
    expect(notes[0].params.messageKey).toBe('onboarding.eventBasics.errors.brideName')
    expect(prePublishCheck(notes).blockers).toHaveLength(4)
    expect(serverPublishProblems(null)).toEqual([])
  })

  it('fix targets and the editor address stay on this site', () => {
    expect(fixTarget({ section: 'info', field: 'time' })).toBe('time')
    expect(fixTarget({ section: 'rsvp', field: 'deadline' })).toBe('rsvpDeadline')
    expect(fixTarget({ section: 'ourStoryList', field: '' })).toBe('')

    expect(editorFixLocation('https://ivy.example/mk/invitations/coastal-breeze?eventId=ev-1', 'location')).toEqual({
      path: '/mk/invitations/coastal-breeze', query: { edit: 'true', eventId: 'ev-1', fix: 'location' },
    })
    expect(editorFixLocation('/en/gallery?eventId=1', 'date')).toBe('')
    expect(editorFixLocation('', 'date')).toBe('')
  })
})

/* ------------------------------------------------------------------ */

function mountBar(props = {}) {
  return mount(GuestPreviewBar, {
    props: { notes: [], device: 'desktop', privateLink: false, timezone: SKOPJE, ...props },
    global: { plugins: [i18n] },
    attachTo: document.body,
  })
}

describe('GuestPreviewBar: the check before publishing', () => {
  beforeEach(() => { i18n.global.locale.value = 'en' })

  it('blockers first, then advice, then what is only explained; the readiness said in words', async () => {
    const notes = notesFor({
      b: basics({ date: '2026-10-10', time: '09:00' }),
      visible: { entry: true, details: false, agendaList: true, ourStoryList: true, rsvp: true },
      showAgenda: true,
      privateLink: false,
    })
    const w = mountBar({ notes })
    const readiness = w.get('[data-testid="publish-readiness"]')
    expect(readiness.attributes('data-ready')).toBe('false')
    expect(readiness.text()).toContain('To fix before publishing: 1')

    await w.get('[data-testid="preview-notes-toggle"]').trigger('click')
    const groups = w.findAll('[class="gp-bar__group-notes"]')
    expect(groups.map((g) => g.attributes('data-testid'))).toEqual([
      'publish-group-blockers', 'publish-group-recommendations', 'publish-group-info',
    ])
    expect(groups[0].get('h3').text()).toBe('Must be fixed before publishing (1)')
    expect(groups[0].get('ul').attributes('aria-labelledby')).toBe(groups[0].get('h3').attributes('id'))
    expect(groups[0].text()).toContain('This date and time have already passed in Europe/Skopje')
    expect(groups[1].get('[data-testid="preview-note"]').attributes('data-severity')).toBe('recommendations')
    expect(groups[1].text()).toContain('“Event details” is hidden')

    // Each blocker leads to its exact control.
    await groups[0].get('[data-testid="preview-note-edit"]').trigger('click')
    expect(w.emitted('note-action')[0][0]).toMatchObject({ section: 'info', field: 'date' })
    w.unmount()
  })

  it('nothing blocking is said as ready; Macedonian and Albanian', async () => {
    const w = mountBar({ notes: notesFor({ visible: { entry: true, details: false, agendaList: true, ourStoryList: true, rsvp: true } }) })
    expect(w.get('[data-testid="publish-readiness"]').attributes('data-ready')).toBe('true')
    expect(w.get('[data-testid="publish-readiness"]').text()).toContain('Nothing blocks publishing')
    i18n.global.locale.value = 'mk'
    await nextTick()
    expect(w.get('[data-testid="publish-readiness"]').text()).toContain('Нема пречки за објава')
    i18n.global.locale.value = 'sq'
    await nextTick()
    expect(w.get('[data-testid="publish-readiness"]').text()).toContain('Asgjë nuk e pengon publikimin')
    w.unmount()
  })
})

/* ------------------------------------------------------------------ */

describe('Packages checkout: the server refuses an invitation that is not ready', () => {
  async function mountPage() {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/:lang/dashboard/events/packages', component: DashboardPackagesPage },
        { path: '/:lang/invitations/:design', component: { template: '<div />' } },
      ],
    })
    await router.push('/en/dashboard/events/packages')
    await router.isReady()
    const w = mount(DashboardPackagesPage, { global: { plugins: [i18n, router] }, attachTo: document.body })
    await flushPromises()
    return { w, router }
  }

  beforeEach(() => {
    i18n.global.locale.value = 'en'
    initPayment.mockReset()
    getById.mockReset()
    redirect.mockReset()
  })

  it('lists every blocker with its fix, charges nothing, and "Fix" opens the editor at the field', async () => {
    initPayment.mockRejectedValue(new ApiError({
      status: 422, errorCode: NOT_READY_ERROR_CODE, detail: 'The invitation is not ready to publish',
      validationErrors: { location: 'missing', rsvpDeadline: 'past' },
    }))
    getById.mockResolvedValue({
      timezone: SKOPJE,
      invitation: { invitationUrl: 'https://ivy.example/en/invitations/coastal-breeze?eventId=ev-1' },
    })
    const { w, router } = await mountPage()
    await w.get('.add-cart-btn').trigger('click')
    await w.get('.cart-checkout-btn').trigger('click')
    await flushPromises()

    expect(redirect).not.toHaveBeenCalled()
    const box = w.get('[data-testid="publish-blockers"]')
    expect(box.attributes('role')).toBe('alert')
    expect(document.activeElement).toBe(box.element)
    expect(box.text()).toContain('The invitation can\'t be published yet')
    const items = w.findAll('[data-testid="publish-blocker"]')
    expect(items.map((i) => i.attributes('data-field'))).toEqual(['location', 'deadline'])
    expect(items[0].text()).toContain('Enter the venue.')
    expect(items[1].text()).toContain('The RSVP deadline has already passed in Europe/Skopje.')
    expect(w.find('.cart-error').exists()).toBe(false)

    await items[1].get('[data-testid="publish-blocker-fix"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/en/invitations/coastal-breeze')
    expect(router.currentRoute.value.query).toEqual({ edit: 'true', eventId: 'ev-1', fix: 'rsvpDeadline' })
    w.unmount()
  })

  it('any other failure is shown as before; a ready invitation goes on to the payment', async () => {
    initPayment.mockRejectedValueOnce(new Error('Network down'))
    const { w } = await mountPage()
    await w.get('.add-cart-btn').trigger('click')
    await w.get('.cart-checkout-btn').trigger('click')
    await flushPromises()
    expect(w.get('.cart-error').text()).toBe('Network down')
    expect(w.find('[data-testid="publish-blockers"]').exists()).toBe(false)

    initPayment.mockResolvedValueOnce({ data: { paymentUrl: 'https://pay', fields: { Details2: 'x' } } })
    await w.get('.cart-checkout-btn').trigger('click')
    await flushPromises()
    expect(redirect).toHaveBeenCalledWith('https://pay', { Details2: 'x' })
    w.unmount()
  })
})

describe('i18n: the new texts exist in all three languages', () => {
  it('editSection.prePublish has the same keys in mk, en and sq', () => {
    const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, p + k + '.') : [p + k]))
    const base = keys(en.editSection.prePublish).sort()
    expect(base.length).toBeGreaterThan(5)
    expect(keys(mk.editSection.prePublish).sort()).toEqual(base)
    expect(keys(sq.editSection.prePublish).sort()).toEqual(base)
  })
})
