import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent, h, ref } from 'vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-401 — help texts and examples for location, programme, story and the
 * RSVP message.
 *
 * Each says whether it is required, what the guests will see and gives an
 * example. An example is never a value of the field: it is static text marked
 * "Example:" in words, in its own box, and linked to the field as its
 * description; the field keeps its own label. A design's examples shown in an
 * empty section of an existing event are marked and never saved as the
 * person's content. The RSVP line in the preview follows what is entered.
 */

vi.mock('@/services/auth.service', () => ({
  isAuthenticated: () => false,
  getUsername: () => '',
  getEventId: () => null,
}))

const { isExampleItem, isUnsavedExample, withoutUnsavedExamples } = await import('@/utils/creationSteps')
const { rsvpReplyByDate } = await import('@/utils/eventBasics')
const { buildEventFullPayload } = await import('@/utils/buildEventFullPayload')
const { DESIGN_PRESETS } = await import('@/config/designPresets/index.js')
const FieldGuide = (await import('@/components/invitations/shared/FieldGuide.vue')).default
const EditInfoPanel = (await import('@/components/invitations/shared/EditInfoPanel.vue')).default
const EditAgendaModal = (await import('@/components/modals/EditAgendaModal.vue')).default
const AddAgendaItemModal = (await import('@/components/modals/AddAgendaItemModal.vue')).default
const EditOurStoryModal = (await import('@/components/modals/EditOurStoryModal.vue')).default
const AddOurStoryModal = (await import('@/components/modals/AddOurStoryModal.vue')).default
const EditDetailsModal = (await import('@/components/modals/EditDetailsModal.vue')).default
const EditRsvpModal = (await import('@/components/modals/EditRsvpModal.vue')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })
const EXAMPLES = DESIGN_PRESETS['coastal-breeze'].defaultItems

beforeEach(() => {
  localStorage.clear()
  i18n.global.locale.value = 'en'
  document.body.innerHTML = ''
})

// Panels are rendered inline in the editor's sidebar (no teleport).
const mountPanel = (component, props) =>
  mount(component, {
    props,
    attachTo: document.body,
    global: { plugins: [i18n], provide: { editPanelMode: ref(true) } },
  })

/** The element(s) an aria-describedby points at. */
const describedBy = (wrapper, el) =>
  (el.attributes('aria-describedby') || '').split(/\s+/).filter(Boolean)
    .map((id) => wrapper.find(`[id="${id}"]`))

/* ------------------------------------------------------------------ */
/*  Examples that are only on screen                                   */
/* ------------------------------------------------------------------ */

describe("a design's examples are not saved as the person's content", () => {
  const shownOnly = (section) => EXAMPLES[section].map((x) => ({ ...x }))

  it('an untouched example without any id is only on screen', () => {
    for (const section of ['eventDetails', 'agenda', 'ourStory']) {
      for (const item of shownOnly(section)) expect(isUnsavedExample(item, section)).toBe(true)
    }
  })

  it('a changed example, a saved entry and a draft entry are content', () => {
    const [first] = shownOnly('agenda')
    expect(isUnsavedExample({ ...first, time: '14:15' }, 'agenda')).toBe(false)
    expect(isUnsavedExample({ ...first, id: 'a-1' }, 'agenda')).toBe(false)
    expect(isUnsavedExample({ ...first, id: '_local_1', _localId: '_local_1' }, 'agenda')).toBe(false)
    // …though a draft entry still counts as an example for the stepper (INV-102).
    expect(isExampleItem({ ...first, _localId: '_local_1' }, 'agenda')).toBe(true)
  })

  it('the save payload of an existing event with empty sections carries no examples', () => {
    const own = { type: 'CEREMONY', time: '17:00', description: 'Венчавка на брегот' }
    const payload = buildEventFullPayload({
      config: { brideName: 'Ана', groomName: 'Марко', weddingDateTime: '2099-06-12T17:30:00' },
      eventDetailItems: withoutUnsavedExamples(shownOnly('eventDetails'), 'eventDetails'),
      agendaItems: withoutUnsavedExamples([...shownOnly('agenda'), own], 'agenda'),
      ourStoryItems: withoutUnsavedExamples(shownOnly('ourStory'), 'ourStory'),
    })
    expect(payload.eventDetails).toEqual([])
    expect(payload.agendas).toEqual([expect.objectContaining({ type: 'CEREMONY', time: '17:00', description: 'Венчавка на брегот' })])
    expect(payload.ourStories).toEqual([])
    expect(JSON.stringify(payload)).not.toContain(EXAMPLES.ourStory[0].description)
  })
})

/* ------------------------------------------------------------------ */
/*  The guide itself                                                   */
/* ------------------------------------------------------------------ */

describe('FieldGuide', () => {
  it('says required / optional / optional section in words and marks the example', () => {
    const req = mountPanel(FieldGuide, { id: 'g1', required: true, guests: 'Guests see it.', example: 'Lake Restaurant' })
    expect(req.find('#g1').exists()).toBe(true)
    expect(req.get('[data-testid="field-guide-req"]').text()).toBe('Required')
    expect(req.text()).toContain('Guests see it.')
    const ex = req.get('[data-testid="field-guide-example"]')
    expect(ex.text()).toContain('Example:')
    expect(ex.find('q').text()).toBe('Lake Restaurant')

    expect(mountPanel(FieldGuide, { id: 'g2' }).get('[data-testid="field-guide-req"]').text()).toBe('Optional')
    expect(mountPanel(FieldGuide, { id: 'g3', section: true }).get('[data-testid="field-guide-req"]').text()).toBe('Optional section')
    expect(mountPanel(FieldGuide, { id: 'g4' }).find('[data-testid="field-guide-example"]').exists()).toBe(false)
  })
})

/* ------------------------------------------------------------------ */
/*  Location                                                           */
/* ------------------------------------------------------------------ */

describe('location in the Info panel', () => {
  it('has its own label, is described by the guide, and the example is not its value', async () => {
    const w = mountPanel(EditInfoPanel, { brideName: 'Ана', groomName: 'Марко', weddingDate: '2099-06-12', weddingTime: '17:30' })
    await flushPromises()
    const field = w.get('[data-info-field="location"]')
    const input = field.get('input[type="text"]')
    const label = field.get(`label[for="${input.attributes('id')}"]`)
    expect(label.text()).toBe('Venue / Location')
    // Not a placeholder standing in for the label.
    expect(input.attributes('placeholder') || '').toBe('')
    const [guide] = describedBy(w, input)
    expect(guide.exists()).toBe(true)
    expect(guide.get('[data-testid="field-guide-req"]').text()).toBe('Required')
    expect(guide.text()).toContain(en.editSection.guide.location.guests)
    expect(guide.text()).toContain(en.editSection.guide.location.example)
    expect(input.element.value).toBe('')

    // Changing a name: the location sent along is the person's (empty), never the example.
    await w.get('[data-info-field="brideName"]').setValue('Ема')
    const last = w.emitted('change').at(-1)[0]
    expect(last.location.name).toBe('')
    expect(JSON.stringify(last)).not.toContain(en.editSection.guide.location.example)
  })

  it('the picked place shown read-only: the edit button has a name and the guide', async () => {
    const w = mountPanel(EditInfoPanel, { location: { name: 'Хотел Метропол', addressLine: 'Охрид', latitude: 41.1, longitude: 20.8 } })
    await flushPromises()
    const btn = w.get('.edit-location-btn')
    expect(btn.attributes('aria-label')).toBe('Edit: Venue / Location')
    expect(describedBy(w, btn)[0].text()).toContain(en.editSection.guide.location.example)
  })

  it('reads in Macedonian and Albanian', async () => {
    i18n.global.locale.value = 'mk'
    let w = mountPanel(EditInfoPanel, {})
    expect(w.text()).toContain('Задолжително')
    expect(w.text()).toContain('Пример:')
    expect(w.text()).toContain(mk.editSection.guide.location.example)
    i18n.global.locale.value = 'sq'
    w = mountPanel(EditInfoPanel, {})
    expect(w.text()).toContain('E detyrueshme')
    expect(w.text()).toContain('Shembull:')
  })
})

/* ------------------------------------------------------------------ */
/*  Programme                                                          */
/* ------------------------------------------------------------------ */

describe('programme', () => {
  it('the list explains the section and marks on-screen examples with a worded badge', async () => {
    const items = [...EXAMPLES.agenda.map((x) => ({ ...x })), { id: 'a-9', type: 'AFTER_PARTY', time: '23:00' }]
    const w = mountPanel(EditAgendaModal, { open: true, items })
    const guide = w.get('[data-testid="field-guide"]')
    expect(guide.get('[data-testid="field-guide-req"]').text()).toBe('Optional section')
    expect(guide.text()).toContain(en.editSection.guide.programme.example)
    expect(w.get('[data-testid="examples-note"]').text()).toBe(en.editSection.guide.examples.note)
    const cards = w.findAll('.item-card')
    expect(cards.filter((c) => c.attributes('data-example') === 'true')).toHaveLength(EXAMPLES.agenda.length)
    expect(cards.at(-1).find('[data-testid="example-badge"]').exists()).toBe(false)
    expect(cards[0].get('[data-testid="example-badge"]').text()).toBe('Example')

    // Opening one example opens that one, not every entry without an id.
    await cards[0].get('.item-card-header').trigger('click')
    expect(w.findAll('.item-card-body')).toHaveLength(1)
  })

  it("a new invitation's draft entries and saved entries carry no badge and no note", () => {
    const items = EXAMPLES.agenda.map((x, i) => ({ ...x, id: `_local_${i}`, _localId: `_local_${i}` }))
    const w = mountPanel(EditAgendaModal, { open: true, items })
    expect(w.find('[data-testid="example-badge"]').exists()).toBe(false)
    expect(w.find('[data-testid="examples-note"]').exists()).toBe(false)
  })

  it('adding an entry: labelled controls, described by the guide; the example is not submitted', async () => {
    const w = mountPanel(AddAgendaItemModal, { open: true, items: [] })
    const select = w.get('form select')
    expect(w.get(`label[for="${select.attributes('id')}"]`).text()).toContain('Type')
    const [guide] = describedBy(w, select)
    expect(guide.text()).toContain(en.editSection.guide.programme.example)
    const group = w.get('[role="group"]')
    expect(w.get(`#${group.attributes('aria-labelledby')}`).text()).toContain('Start')
    expect(group.attributes('aria-describedby')).toBe(guide.attributes('id'))

    await w.findAll('button').find((b) => b.text() === en.agenda.addDialog.create).trigger('click')
    const sent = w.emitted('submit')?.[0]?.[0]
    expect(sent).toBeTruthy()
    expect(JSON.stringify(sent)).not.toContain(en.editSection.guide.programme.example)
  })
})

/* ------------------------------------------------------------------ */
/*  Story                                                              */
/* ------------------------------------------------------------------ */

describe('story', () => {
  it('the text field is labelled, described by the guide, and starts empty', async () => {
    const w = mountPanel(AddOurStoryModal, { open: true, items: [] })
    const area = w.get('textarea')
    expect(area.element.value).toBe('')
    expect(w.get(`label[for="${area.attributes('id')}"]`).text()).toBeTruthy()
    const [guide] = describedBy(w, area)
    expect(guide.text()).toContain(en.editSection.guide.story.guests)
    expect(guide.get('[data-testid="field-guide-example"]').text()).toContain(en.editSection.guide.story.example)
  })

  it('the list: optional section, example chapters badged, each text box described', async () => {
    const items = EXAMPLES.ourStory.map((x) => ({ ...x }))
    const w = mountPanel(EditOurStoryModal, { open: true, items })
    expect(w.get('[data-testid="field-guide-req"]').text()).toBe('Optional section')
    expect(w.findAll('[data-testid="example-badge"]')).toHaveLength(items.length)
    await w.findAll('.item-card-header')[1].trigger('click')
    expect(w.findAll('.item-card-body')).toHaveLength(1)
    const area = w.get('textarea')
    expect(w.get(`label[for="${area.attributes('id')}"]`).exists()).toBe(true)
    expect(describedBy(w, area)[0].text()).toContain(en.editSection.guide.story.example)
  })

  it('details list badges its on-screen examples too', () => {
    const w = mountPanel(EditDetailsModal, { open: true, items: EXAMPLES.eventDetails.map((x) => ({ ...x })) })
    expect(w.findAll('[data-testid="example-badge"]')).toHaveLength(EXAMPLES.eventDetails.length)
    expect(w.find('[data-testid="examples-note"]').exists()).toBe(true)
  })
})

/* ------------------------------------------------------------------ */
/*  RSVP message                                                       */
/* ------------------------------------------------------------------ */

describe('RSVP message', () => {
  it('the reply-by date: the deadline, else 14 days before the event', () => {
    expect(rsvpReplyByDate('2099-05-30', '2099-06-12T17:30:00')).toBe('2099-05-30')
    expect(rsvpReplyByDate('', '2099-03-05T17:30:00')).toBe('2099-02-19')
    expect(rsvpReplyByDate('', '2099-01-10')).toBe('2098-12-27')
    expect(rsvpReplyByDate('', '')).toBe('')
    expect(rsvpReplyByDate('2099-05-30T23:59:00', '')).toBe('2099-05-30')
  })

  it('the panel shows what guests will read, and says so when there is nothing yet', () => {
    let w = mountPanel(EditRsvpModal, { open: true, liveEdit: true, guestMessage: 'Please respond by May 30, 2099' })
    const guide = w.get('[data-testid="field-guide"]')
    expect(guide.text()).toContain('Guests will see:')
    expect(guide.find('q').text()).toBe('Please respond by May 30, 2099')
    expect(guide.text()).toContain(en.editSection.guide.rsvp.guests)
    expect(w.get('[data-testid="rsvp-deadline-default"]').text()).toBe(en.editSection.guide.rsvp.deadlineDefault)

    w = mountPanel(EditRsvpModal, { open: true, liveEdit: true, guestMessage: '', rsvpDeadline: '2099-05-30' })
    expect(w.find('[data-testid="field-guide-example"]').exists()).toBe(false)
    expect(w.get('[data-testid="rsvp-guide-empty"]').text()).toBe(en.editSection.guide.rsvp.noMessage)
    expect(w.find('[data-testid="rsvp-deadline-default"]').exists()).toBe(false)
  })
})

/* ------------------------------------------------------------------ */
/*  The preview follows what is entered                                */
/* ------------------------------------------------------------------ */

const { useWeddingInvitation } = await import('@/composables/useWeddingInvitation')
const { loadDraft } = await import('@/store/invitationDraft.store')

async function mountEditor() {
  localStorage.setItem('invitation_draft_v1', JSON.stringify({
    eventDetails: [], agenda: [], ourStory: [],
    theme: {
      info: { brideName: 'Ана', groomName: 'Марко', weddingDateTime: '2099-06-12T17:30:00', eventTimezone: 'Europe/Skopje', venue: 'Охрид', location: '' },
      rsvpConfig: { deadline: '', maxGuests: 3, showDietary: false, borderRadius: '8px' },
    },
    updatedAt: new Date().toISOString(),
  }))
  loadDraft()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:lang/invitations/:design', name: 'weddingInvitation', component: { render: () => null } }],
  })
  await router.push('/en/invitations/coastal-breeze?new=1&edit=true')
  let inv
  const Harness = defineComponent({
    setup() {
      inv = useWeddingInvitation(DESIGN_PRESETS['coastal-breeze'])
      return () => h('div')
    },
  })
  mount(Harness, { global: { plugins: [i18n, router] } })
  await flushPromises()
  return inv
}

describe('the RSVP line in the preview', () => {
  it('follows the deadline and the event date as they are entered, in the page language', async () => {
    const inv = await mountEditor()
    // No deadline: 14 days before the event.
    expect(inv.config.rsvpMessage).toBe('Please respond by May 29, 2099')

    inv.onRsvpChange({ deadline: '2099-05-20' })
    await flushPromises()
    expect(inv.config.rsvpMessage).toBe('Please respond by May 20, 2099')

    inv.onRsvpChange({ deadline: '' })
    inv.config.weddingDateTime = '2099-07-01T12:00:00'
    await flushPromises()
    expect(inv.config.rsvpMessage).toBe('Please respond by June 17, 2099')

    i18n.global.locale.value = 'mk'
    await flushPromises()
    expect(inv.config.rsvpMessage.startsWith('Ве молиме одговорете до')).toBe(true)
  })
})

/* ------------------------------------------------------------------ */
/*  Locales                                                            */
/* ------------------------------------------------------------------ */

describe('locales', () => {
  it('every new text exists in mk, en and sq, and none uses i18n special characters', () => {
    const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]))
    const base = keys(en.editSection.guide).sort()
    expect(keys(mk.editSection.guide).sort()).toEqual(base)
    expect(keys(sq.editSection.guide).sort()).toEqual(base)
    for (const lang of [en, mk, sq]) {
      for (const k of base) {
        const v = k.split('.').reduce((o, x) => o[x], lang.editSection.guide)
        expect(typeof v === 'string' && v.trim().length > 0).toBe(true)
        expect(/[|@{}]/.test(v)).toBe(false)
      }
    }
  })

  it('the examples differ per language (they are translated, not copied)', () => {
    for (const k of ['location', 'programme', 'story']) {
      const set = new Set([en, mk, sq].map((l) => l.editSection.guide[k].example))
      expect(set.size).toBe(3)
    }
  })
})
