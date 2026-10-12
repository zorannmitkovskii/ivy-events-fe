import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-402 — empty states of the optional sections (programme, story,
 * details), skipping and hiding them, and editing a design's example in an
 * existing event.
 *
 * Bug carried from INV-401: in an existing event, the examples shown in an
 * empty programme or details section have no id, and a change to one was
 * dropped (the update needs an id). Changing an example now makes it a real
 * new entry, created once even when the next change comes before the answer.
 */

const route = { query: { edit: 'true', eventId: 'ev-9' }, params: { design: 'coastal-breeze' } }
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({}) }))
let authenticated = true
vi.mock('@/services/auth.service', () => ({
  isAuthenticated: () => authenticated,
  getUsername: () => null,
  getEventId: () => null,
  hasRole: () => false,
}))

const deferred = () => {
  let resolve
  const promise = new Promise((r) => { resolve = r })
  return { promise, resolve }
}

const api = {
  agendaCreate: vi.fn(), agendaUpdate: vi.fn(), agendaDelete: vi.fn(),
  detailCreate: vi.fn(), detailUpdate: vi.fn(),
  storyCreate: vi.fn(), storyUpdate: vi.fn(),
}
vi.mock('@/services/agenda.service.js', () => ({
  agendaApi: {
    list: async () => [],
    createItem: (...a) => api.agendaCreate(...a),
    updateItem: (...a) => api.agendaUpdate(...a),
    deleteItem: (...a) => api.agendaDelete(...a),
  },
}))
vi.mock('@/services/eventDetails.service.js', () => ({
  eventDetailsService: {
    listByEvent: async () => [],
    create: (...a) => api.detailCreate(...a),
    update: (...a) => api.detailUpdate(...a),
    remove: vi.fn(),
  },
}))
vi.mock('@/services/ourStory.service.js', () => ({
  ourStoryApi: {
    listWithImages: async () => ({ stories: [], images: [] }),
    create: (...a) => api.storyCreate(...a),
    update: (...a) => api.storyUpdate(...a),
    remove: vi.fn(),
  },
}))

const { useInvitationEditMode } = await import('@/composables/useInvitationEditMode')
const { withoutUnsavedExamples } = await import('@/utils/creationSteps')
const draft = await import('@/store/invitationDraft.store')
const { DESIGN_PRESETS } = await import('@/config/designPresets/index.js')
const EditAgendaModal = (await import('@/components/modals/EditAgendaModal.vue')).default
const EditDetailsModal = (await import('@/components/modals/EditDetailsModal.vue')).default
const EditOurStoryModal = (await import('@/components/modals/EditOurStoryModal.vue')).default
const EditSidebar = (await import('@/components/invitations/shared/EditSidebar.vue')).default

const EXAMPLES = DESIGN_PRESETS['coastal-breeze'].defaultItems
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })

beforeEach(() => {
  localStorage.clear()
  draft.clearDraft()
  authenticated = true
  route.query = { edit: 'true', eventId: 'ev-9' }
  i18n.global.locale.value = 'en'
  document.body.innerHTML = ''
  Object.values(api).forEach((fn) => fn.mockReset())
  api.agendaCreate.mockImplementation(async (eventId, payload) => ({ id: 'a-new', ...payload }))
  api.agendaUpdate.mockImplementation(async (eventId, id, payload) => ({ id, ...payload }))
  api.detailCreate.mockImplementation(async (payload) => ({ id: 'd-new', ...payload }))
  api.storyCreate.mockImplementation(async (payload) => ({ id: 's-new', ...payload }))
  api.storyUpdate.mockImplementation(async (id, payload) => ({ id, ...payload }))
})

/* ------------------------------------------------------------------ */
/*  Editing an example of an existing event                            */
/* ------------------------------------------------------------------ */

describe('an example changed in an existing event becomes a real entry', () => {
  it('programme: the changed example is created in its place; the others stay examples', async () => {
    const edit = useInvitationEditMode()
    await edit.loadEditData()
    const list = edit.agenda.items.value
    const example = list[3] // CEREMONY 16:00

    // Without the fix this did nothing at all (the update needs an id).
    await edit.handleAgendaUpdate({ id: undefined, type: 'CEREMONY', time: '16:30' }, example)

    expect(api.agendaCreate).toHaveBeenCalledTimes(1)
    const [eventId, sent] = api.agendaCreate.mock.calls[0]
    expect(eventId).toBe('ev-9')
    expect(sent).toEqual({ type: 'CEREMONY', time: '16:30' })
    const after = edit.agenda.items.value
    expect(after).toHaveLength(EXAMPLES.agenda.length)
    expect(after[3]).toEqual(expect.objectContaining({ id: 'a-new', type: 'CEREMONY', time: '16:30' }))
    // It is now the event's content (it goes with the full save); the rest
    // are still only on screen.
    expect(withoutUnsavedExamples(after, 'agenda')).toEqual([after[3]])
    expect(edit.dirty.value).toBe(true)
  })

  it('a second change made before the first one is answered updates that entry — no second create', async () => {
    const created = deferred()
    api.agendaCreate.mockReturnValueOnce(created.promise)
    const edit = useInvitationEditMode()
    await edit.loadEditData()
    const example = edit.agenda.items.value[0]

    const first = edit.handleAgendaUpdate({ type: 'START_GROOM', time: '13:00' }, example)
    const second = edit.handleAgendaUpdate({ type: 'START_GROOM', time: '13:30' }, example)
    created.resolve({ id: 'a-1', type: 'START_GROOM', time: '13:00' })
    await Promise.all([first, second])

    expect(api.agendaCreate).toHaveBeenCalledTimes(1)
    expect(api.agendaUpdate).toHaveBeenCalledTimes(1)
    expect(api.agendaUpdate.mock.calls[0][1]).toBe('a-1')
    expect(api.agendaUpdate.mock.calls[0][2]).toEqual({ type: 'START_GROOM', time: '13:30' })
    expect(edit.agenda.items.value[0]).toEqual(expect.objectContaining({ id: 'a-1', time: '13:30' }))
    expect(edit.agenda.items.value.filter((x) => x.id === 'a-1')).toHaveLength(1)
  })

  it('details and story work the same way', async () => {
    const edit = useInvitationEditMode()
    await edit.loadEditData()
    const detail = edit.eventDetails.items.value[0]
    await edit.handleEventDetailUpdate({ id: undefined, type: 'CHURCH', time: '15:30', eventDate: null, location: null }, detail)
    expect(api.detailCreate).toHaveBeenCalledWith(expect.objectContaining({ type: 'CHURCH', time: '15:30', visibility: 'PUBLIC', eventId: 'ev-9' }))
    expect(edit.eventDetails.items.value[0]).toEqual(expect.objectContaining({ id: 'd-new', time: '15:30' }))
    expect(edit.eventDetails.items.value).toHaveLength(EXAMPLES.eventDetails.length)

    const story = edit.ourStory.items.value[1]
    await edit.handleOurStoryUpdate({ id: undefined, type: 'FIRST_DATE', description: 'Наше' }, null, story)
    expect(api.storyCreate).toHaveBeenCalledTimes(1)
    expect(edit.ourStory.items.value[1]).toEqual(expect.objectContaining({ id: 's-new', description: 'Наше' }))
    // The first story example was not touched.
    expect(edit.ourStory.items.value[0].id).toBeUndefined()
  })

  it('removing an example only takes it off the screen — nothing is sent', async () => {
    const edit = useInvitationEditMode()
    await edit.loadEditData()
    const example = edit.agenda.items.value[5]
    await edit.handleAgendaDelete(undefined, example)
    expect(api.agendaDelete).not.toHaveBeenCalled()
    expect(edit.agenda.items.value).toHaveLength(EXAMPLES.agenda.length - 1)
    expect(edit.agenda.items.value.some((x) => x.type === 'FIRST_DANCE')).toBe(false)
  })

  it('the programme panel passes the example it changed and keeps it open once it has an id', async () => {
    const items = EXAMPLES.agenda.map((x) => ({ ...x }))
    const w = mountPanel(EditAgendaModal, { open: true, items })
    await w.findAll('.item-card-header')[3].trigger('click')
    await w.findAll('.item-card-body select')[1].setValue('17')
    const [payload, original] = w.emitted('update')[0]
    expect(payload).toEqual({ id: undefined, type: 'CEREMONY', time: '17:00' })
    expect(original).toEqual(items[3])

    // The parent puts the created entry in its place: still expanded.
    const next = [...items]
    next[3] = { id: 'a-1', type: 'CEREMONY', time: '17:00' }
    await w.setProps({ items: next })
    expect(w.findAll('.item-card-body')).toHaveLength(1)
    expect(w.find('.item-card-body select').exists()).toBe(true)

    await w.findAll('.icon-btn--danger')[5].trigger('click')
    expect(w.emitted('delete')[0]).toEqual([undefined, items[5]])
  })
})

/* ------------------------------------------------------------------ */
/*  Empty, hidden and unread sections in the panels                    */
/* ------------------------------------------------------------------ */

function mountPanel(component, props) {
  return mount(component, {
    props,
    attachTo: document.body,
    global: { plugins: [i18n], provide: { editPanelMode: ref(true) } },
  })
}

const PANELS = [
  ['programme', EditAgendaModal, 'agenda', 'agenda'],
  ['details', EditDetailsModal, 'details', 'eventDetails'],
  ['story', EditOurStoryModal, 'story', 'ourStory'],
]

describe.each(PANELS)('the %s panel', (_name, Panel, kind, section) => {
  const empty = en.editSection.sectionStates.empty

  it('empty: a short explanation, one action to add the first entry, and a way to skip', async () => {
    const w = mountPanel(Panel, { open: true, items: [], noAdd: kind === 'details' })
    const state = w.get('[data-testid="section-state"]')
    expect(state.attributes('data-state')).toBe('empty')
    expect(state.text()).toContain(empty[kind].title)
    expect(state.text()).toContain(empty[kind].body)
    expect(state.text()).toContain(empty.guestsNote)
    // One add action: the footer's own "Add" is not shown next to it.
    const addButtons = w.findAll('button').filter((b) => /add/i.test(b.text()))
    expect(addButtons.map((b) => b.text())).toEqual([empty[kind].add])

    await w.get('[data-testid="section-empty-add"]').trigger('click')
    expect(w.emitted('add')).toHaveLength(1)
    await w.get('[data-testid="section-skip"]').trigger('click')
    expect(w.emitted('skip')).toHaveLength(1)
  })

  it("only the design's examples (an existing event): still empty, examples listed below", () => {
    const w = mountPanel(Panel, { open: true, items: EXAMPLES[section].map((x) => ({ ...x })) })
    expect(w.get('[data-testid="section-state"]').attributes('data-state')).toBe('empty')
    expect(w.findAll('[data-testid="example-badge"]')).toHaveLength(EXAMPLES[section].length)
  })

  it('with entries of its own: no empty state', () => {
    const items = [{ ...EXAMPLES[section][0], id: 'x-1' }]
    const w = mountPanel(Panel, { open: true, items })
    expect(w.find('[data-testid="section-state"]').exists()).toBe(false)
  })

  it('hidden: says the guests do not see it and the entries are kept, with "Show it again"', async () => {
    const items = [{ ...EXAMPLES[section][0], id: 'x-1' }]
    const w = mountPanel(Panel, { open: true, items, hidden: true })
    const state = w.get('[data-testid="section-state"]')
    expect(state.attributes('data-state')).toBe('hidden')
    expect(state.text()).toContain(en.editSection.sectionStates.hidden.body)
    // The entries are still there to edit.
    expect(w.findAll('.item-card')).toHaveLength(1)
    await w.get('[data-testid="section-show"]').trigger('click')
    expect(w.emitted('show')).toHaveLength(1)
  })

  it('hidden and empty: no second "skip"', () => {
    const w = mountPanel(Panel, { open: true, items: [], hidden: true })
    expect(w.findAll('[data-testid="section-state"]').map((s) => s.attributes('data-state'))).toEqual(['hidden', 'empty'])
    expect(w.find('[data-testid="section-skip"]').exists()).toBe(false)
  })

  it('could not be read: an alert with "Try again", and nothing to edit or add', async () => {
    const w = mountPanel(Panel, { open: true, items: [], loadState: 'failed' })
    const alert = w.get('[role="alert"]')
    expect(alert.text()).toContain(en.editSection.sectionStates.loadFailed.body)
    expect(alert.text()).toContain(en.editSection.sectionStates.names[section])
    expect(w.find('[data-testid="section-empty-add"]').exists()).toBe(false)
    expect(w.findAll('.item-card')).toHaveLength(0)
    await w.get('[data-testid="section-retry"]').trigger('click')
    expect(w.emitted('retry-load')).toHaveLength(1)
  })

  it('being read: says so, nothing to edit', () => {
    const w = mountPanel(Panel, { open: true, items: [], loadState: 'loading' })
    expect(w.get('[data-testid="section-state"]').attributes('data-state')).toBe('loading')
    expect(w.get('[role="status"]').text()).toBe(en.editSection.sectionStates.loadFailed.loading)
  })
})

describe('skip and show keep the keyboard in the panel', () => {
  it('after skipping, focus is on "Show it again"; after showing, on the add action', async () => {
    const w = mountPanel(EditAgendaModal, { open: true, items: [] })
    await w.get('[data-testid="section-skip"]').trigger('click')
    await w.setProps({ hidden: true })
    await flushPromises()
    expect(document.activeElement?.dataset.testid).toBe('section-show')

    await w.get('[data-testid="section-show"]').trigger('click')
    await w.setProps({ hidden: false })
    await flushPromises()
    expect(document.activeElement?.dataset.testid).toBe('section-empty-add')
  })
})

describe('in Macedonian and Albanian', () => {
  it('the empty programme speaks the page language', () => {
    i18n.global.locale.value = 'mk'
    let w = mountPanel(EditAgendaModal, { open: true, items: [] })
    expect(w.text()).toContain('Сè уште нема програма')
    expect(w.get('[data-testid="section-skip"]').text()).toBe('Прескокни — сокриј го делот')
    i18n.global.locale.value = 'sq'
    w = mountPanel(EditAgendaModal, { open: true, items: [] })
    expect(w.text()).toContain('Ende nuk ka program')
  })
})

/* ------------------------------------------------------------------ */
/*  A draft section emptied by the person stays empty                  */
/* ------------------------------------------------------------------ */

describe('a new invitation (draft)', () => {
  beforeEach(() => {
    authenticated = false
    route.query = { edit: 'true', new: '1' }
  })

  it('gets the starter entries once; a section the person emptied is not filled again on reopening', async () => {
    let edit = useInvitationEditMode()
    await edit.loadEditData()
    expect(edit.agenda.items.value).toHaveLength(EXAMPLES.agenda.length)
    expect(draft.isDraftSectionSeeded('agenda')).toBe(true)

    for (const item of [...edit.agenda.items.value]) await edit.handleAgendaDelete(item.id)
    expect(draft.getDraftItems('agenda')).toEqual([])

    // Reopened (a reload): the draft is read again from storage.
    draft.loadDraft()
    edit = useInvitationEditMode()
    await edit.loadEditData()
    expect(edit.agenda.items.value).toEqual([])
    // The other sections keep their starter entries.
    expect(edit.ourStory.items.value).toHaveLength(EXAMPLES.ourStory.length)
  })

  it('a draft saved before this change (no marker) is filled as before, once', async () => {
    localStorage.setItem('invitation_draft_v1', JSON.stringify({
      eventDetails: [], agenda: [], ourStory: [], theme: { info: { brideName: 'Ана' } }, updatedAt: new Date().toISOString(),
    }))
    draft.loadDraft()
    const edit = useInvitationEditMode()
    await edit.loadEditData()
    expect(edit.agenda.items.value).toHaveLength(EXAMPLES.agenda.length)
    expect(JSON.parse(localStorage.getItem('invitation_draft_v1')).seeded).toEqual({ eventDetails: true, agenda: true, ourStory: true })
  })

  it("the guest preview of a draft shows an emptied section empty, not the design's examples", async () => {
    let edit = useInvitationEditMode()
    await edit.loadEditData()
    for (const item of [...edit.agenda.items.value]) await edit.handleAgendaDelete(item.id)

    route.query = { new: '1', preview: '1' }
    draft.loadDraft()
    edit = useInvitationEditMode()
    await edit.loadEditData()
    expect(edit.agenda.items.value).toEqual([])
    expect(edit.eventDetails.items.value).toHaveLength(EXAMPLES.eventDetails.length)
  })
})

/* ------------------------------------------------------------------ */
/*  The visibility switch in the sidebar                               */
/* ------------------------------------------------------------------ */

describe('the section visibility switch', () => {
  const sections = [
    { key: 'hero', label: 'Hero', tab: 'sections', mandatory: true, icon: '' },
    { key: 'agendaList', label: 'Edit Agenda', tab: 'sections', icon: '' },
  ]

  it('is a named switch whose state is not only a colour, and the hidden section says "Hidden"', async () => {
    const w = mount(EditSidebar, {
      props: { sections, sectionVisibility: { agendaList: false } },
      global: { plugins: [i18n] },
    })
    await w.findAll('.tab-btn').find((b) => b.text() === 'Content').trigger('click')
    const toggle = w.get('[data-section-toggle="agendaList"]')
    expect(toggle.attributes('role')).toBe('switch')
    expect(toggle.attributes('aria-checked')).toBe('false')
    expect(toggle.attributes('aria-label')).toBe('Show “Edit Agenda” on the invitation')
    expect(w.get('[data-testid="section-hidden-badge"]').text()).toBe('Hidden')
    // A mandatory section has no switch.
    expect(w.findAll('[data-section-toggle]')).toHaveLength(1)

    await toggle.trigger('click')
    expect(w.emitted('toggle-visibility')[0]).toEqual(['agendaList'])
    await w.setProps({ sectionVisibility: {} })
    expect(w.get('[data-section-toggle="agendaList"]').attributes('aria-checked')).toBe('true')
    expect(w.find('[data-testid="section-hidden-badge"]').exists()).toBe(false)
  })
})

/* ------------------------------------------------------------------ */
/*  Locales                                                            */
/* ------------------------------------------------------------------ */

describe('locales', () => {
  it('every new text exists in mk, en and sq, and none uses i18n special characters', () => {
    const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]))
    const values = (o) => Object.values(o).flatMap((v) => (typeof v === 'object' ? values(v) : [v]))
    const base = keys(en.editSection.sectionStates).sort()
    for (const loc of [mk, sq]) {
      expect(keys(loc.editSection.sectionStates).sort()).toEqual(base)
      for (const k of ['sectionsNotLoaded', 'reload']) expect(loc.editSection.saveStatus[k]).toBeTruthy()
    }
    for (const loc of [en, mk, sq]) {
      for (const v of [...values(loc.editSection.sectionStates), loc.editSection.saveStatus.sectionsNotLoaded, loc.editSection.saveStatus.reload]) {
        expect(v).not.toMatch(/[|@$]/)
        expect(v.replace(/\{section\}/g, '')).not.toMatch(/[{}]/)
      }
    }
    // Translated, not copied from English.
    expect(mk.editSection.sectionStates.empty.agenda.title).not.toBe(en.editSection.sectionStates.empty.agenda.title)
    expect(sq.editSection.sectionStates.empty.agenda.title).not.toBe(en.editSection.sectionStates.empty.agenda.title)
  })
})
