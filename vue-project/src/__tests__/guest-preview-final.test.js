import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent, h, ref, nextTick } from 'vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-602 — the final preview as a guest.
 *
 * The editor's own "Preview as guest" (INV-104, ?preview=1) is the same page
 * and state drawn without the editor. It now has a phone / computer view, the
 * public or private link, notes about what guests will not see or what is
 * still an example — each leading to the exact control in the editor — and
 * it draws what guests get: an example only on the editor's screen is not
 * part of it, and an RSVP sent from it is never sent.
 */

const desktop = ref(true)
vi.mock('@/composables/useMediaQuery', () => ({ useMediaQuery: () => desktop }))

vi.mock('@/services/eventFull.service', () => ({
  eventFullService: { createFull: vi.fn(), updateFull: vi.fn() },
}))
vi.mock('@/services/agenda.service.js', () => ({
  agendaApi: { list: async () => [], createItem: vi.fn(), updateItem: vi.fn(), deleteItem: vi.fn() },
}))
vi.mock('@/services/eventDetails.service.js', () => ({
  eventDetailsService: { listByEvent: async () => [], create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}))
vi.mock('@/services/ourStory.service.js', () => ({
  ourStoryApi: { listWithImages: async () => ({ stories: [], images: [] }), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}))
const pageData = vi.fn()
vi.mock('@/services/invitationPage.service', () => ({
  invitationPageService: { getByEventId: (...a) => pageData(...a) },
}))
vi.mock('@/services/events.service', () => ({ eventsService: { getById: async () => ({ invitation: null }) } }))
vi.mock('@/services/media.service', () => ({ mediaService: { list: async () => [] } }))
let authed = true
vi.mock('@/services/auth.service', () => ({
  isAuthenticated: () => authed,
  getUsername: () => 'ana',
  getEventId: () => null,
  hasRole: () => false,
}))

const { guestPreviewNotes, basicsProblems, NOTE_KINDS, NOTE_ACTIONS } = await import('@/utils/guestPreviewNotes')
const { validateBasics } = await import('@/utils/eventBasics')
const GuestPreviewBar = (await import('@/components/invitations/shared/GuestPreviewBar.vue')).default
const InvitationEditLayout = (await import('@/components/invitations/shared/InvitationEditLayout.vue')).default
const EditRsvpModal = (await import('@/components/modals/EditRsvpModal.vue')).default
const { useWeddingInvitation } = await import('@/composables/useWeddingInvitation')
const { setEventId } = await import('@/store/onboarding.store')
const { DESIGN_PRESETS } = await import('@/config/designPresets/index.js')

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })

beforeEach(() => {
  localStorage.clear()
  setEventId('')
  authed = true
  desktop.value = true
  i18n.global.locale.value = 'en'
  pageData.mockReset()
})

/* ------------------------------------------------------------------ */
/*  The notes                                                          */
/* ------------------------------------------------------------------ */

const all = () => ({
  visible: { entry: true, details: true, agendaList: true, ourStoryList: true, rsvp: true },
  hasContent: { agendaList: true, ourStoryList: true },
  examples: { agenda: 0, ourStory: 0 },
  ownDetails: 2,
  photos: { heroOwn: true, storyDrawn: 4, storyOwn: 2, collageDrawn: false, collageOwn: 0 },
  showAgenda: true,
  privateLink: true,
  rsvp: { deadlineProblem: null, notOpen: false },
})

describe('guestPreviewNotes', () => {
  it('nothing to say about an invitation with everything of the person\'s own', () => {
    expect(guestPreviewNotes(all())).toEqual([])
  })

  it('hidden and empty sections are said, each pointing at its section', () => {
    const s = all()
    s.visible.details = false
    s.visible.entry = false
    s.hasContent.ourStoryList = false
    const notes = guestPreviewNotes(s)
    expect(notes.map((n) => [n.kind, n.section, n.textKey])).toEqual([
      [NOTE_KINDS.HIDDEN, 'entry', 'hiddenEntry'],
      [NOTE_KINDS.HIDDEN, 'details', 'hidden'],
      [NOTE_KINDS.EMPTY, 'ourStoryList', 'empty'],
    ])
    expect(notes.every((n) => n.action === NOTE_ACTIONS.EDIT)).toBe(true)
  })

  it('a hidden section is not also called empty or an example', () => {
    const s = all()
    s.visible.agendaList = false
    s.hasContent.agendaList = false
    s.examples.agenda = 3
    expect(guestPreviewNotes(s).map((n) => n.textKey)).toEqual(['hidden'])
  })

  it('example entries, example photos and the design\'s demo basics', () => {
    const s = all()
    s.examples.agenda = 2
    s.photos.heroOwn = false
    s.photos.storyOwn = 0
    s.ownDetails = 0
    s.demoBasics = true
    s.nameField = 'title'
    const notes = guestPreviewNotes(s)
    expect(notes.map((n) => [n.section, n.textKey])).toEqual([
      ['info', 'demoBasics'],
      ['hero', 'heroPhoto'],
      ['details', 'detailsDefault'],
      ['agendaList', 'exampleItems'],
      ['ourStoryImages', 'storyPhotos'],
    ])
    expect(notes[0].field).toBe('title')
    expect(notes[3].params.count).toBe(2)
    expect(notes.every((n) => n.kind === NOTE_KINDS.EXAMPLE)).toBe(true)
  })

  it('story photos are not asked for where the design draws none, or the story is not shown', () => {
    const s = all()
    s.photos.storyOwn = 0
    s.photos.storyDrawn = 0
    expect(guestPreviewNotes(s)).toEqual([])
    s.photos.storyDrawn = 4
    s.hasContent.ourStoryList = false
    expect(guestPreviewNotes(s).map((n) => n.textKey)).toEqual(['empty'])
  })

  it('the collage photos only with the gallery opening shown', () => {
    const s = all()
    s.photos.collageDrawn = true
    expect(guestPreviewNotes(s).map((n) => n.section)).toEqual(['collage'])
    s.visible.entry = false
    expect(guestPreviewNotes(s).map((n) => n.textKey)).toEqual(['hiddenEntry'])
  })

  it('the programme on the public link: said, with the private link to look at', () => {
    const s = all()
    s.privateLink = false
    const [n] = guestPreviewNotes(s)
    expect(n).toMatchObject({ kind: NOTE_KINDS.INFO, section: 'agendaList', textKey: 'privateOnly', action: NOTE_ACTIONS.PRIVATE_LINK })
    s.showAgenda = false
    expect(guestPreviewNotes(s)).toEqual([])
  })

  it('RSVP: switched off, a deadline problem (to the deadline field), not open yet', () => {
    const s = all()
    s.rsvp = { deadlineProblem: 'past', notOpen: true }
    expect(guestPreviewNotes(s).map((n) => [n.kind, n.textKey, n.field, n.action])).toEqual([
      [NOTE_KINDS.MISSING, 'deadlinePast', 'deadline', NOTE_ACTIONS.EDIT],
      [NOTE_KINDS.INFO, 'rsvpNotOpen', '', null],
    ])
    s.visible.rsvp = false
    expect(guestPreviewNotes(s).map((n) => [n.kind, n.textKey])).toEqual([[NOTE_KINDS.HIDDEN, 'rsvpHidden']])
  })

  it('basics problems name the Info field, first field first; content a design does not draw', () => {
    const errors = validateBasics({ brideName: 'Ана', groomName: '', date: '', time: '18:00', timezone: 'Europe/Skopje', location: { name: '' } }, 'WEDDING')
    const s = all()
    s.basicsProblems = basicsProblems(errors)
    s.designHidden = [{ kind: 'chapterPhotos', count: 2 }]
    const notes = guestPreviewNotes(s)
    expect(notes.map((n) => [n.section, n.field])).toEqual([
      ['info', 'groomName'], ['info', 'date'], ['info', 'location'], ['design', 'chapterPhotos'],
    ])
    expect(notes[0].params.messageKey).toBe('onboarding.eventBasics.errors.groomName')
    expect(new Set(notes.map((n) => n.id)).size).toBe(notes.length)
  })

  it('follows the order of the invitation, whatever order the checks run in', () => {
    const s = all()
    s.visible.rsvp = false
    s.designHidden = [{ kind: 'storyDates', count: 1 }]
    s.photos.heroOwn = false
    s.basicsProblems = [{ field: 'date', messageKey: 'onboarding.eventBasics.errors.date' }]
    expect(guestPreviewNotes(s).map((n) => n.section)).toEqual(['info', 'hero', 'rsvp', 'design'])
  })
})

/* ------------------------------------------------------------------ */
/*  The bar                                                            */
/* ------------------------------------------------------------------ */

function mountBar(props = {}) {
  return mount(GuestPreviewBar, {
    props: { notes: [], device: 'desktop', privateLink: false, timezone: 'Europe/Skopje', ...props },
    global: { plugins: [i18n] },
    attachTo: document.body,
  })
}

describe('GuestPreviewBar', () => {
  it('back to editing, the view and the link — chosen ones pressed and ticked', async () => {
    const w = mountBar({ device: 'mobile' })
    await w.get('[data-testid="preview-back-to-editor"]').trigger('click')
    expect(w.emitted('back')).toHaveLength(1)

    const phone = w.get('[data-device="mobile"]')
    const computer = w.get('[data-device="desktop"]')
    expect(w.get('[data-testid="preview-device"]').attributes('aria-label')).toBe('View')
    expect(phone.attributes('aria-pressed')).toBe('true')
    expect(phone.text()).toContain('✓')
    expect(computer.attributes('aria-pressed')).toBe('false')
    await computer.trigger('click')
    expect(w.emitted('set-device')).toEqual([['desktop']])

    expect(w.get('[data-link="public"]').attributes('aria-pressed')).toBe('true')
    await w.get('[data-link="private"]').trigger('click')
    expect(w.emitted('set-private')).toEqual([[true]])
    w.unmount()
  })

  it('the notes: a toggle with the count, each note with its kind in words and the way to it', async () => {
    const s = all()
    s.visible.details = false
    s.privateLink = false
    s.basicsProblems = [{ field: 'date', messageKey: 'onboarding.eventBasics.errors.past' }]
    const notes = guestPreviewNotes(s)
    const w = mountBar({ notes })
    const toggle = w.get('[data-testid="preview-notes-toggle"]')
    expect(toggle.text()).toContain('Notes (3)')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(w.get('[data-testid="preview-notes"]').isVisible()).toBe(false)
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(toggle.attributes('aria-controls')).toBe(w.get('[data-testid="preview-notes"]').attributes('id'))

    const items = w.findAll('[data-testid="preview-note"]')
    expect(items.map((i) => i.find('.gp-note__kind').text())).toEqual(['Check', 'Hidden', 'Info'])
    expect(items[0].text()).toContain('This date and time have already passed in Europe/Skopje')
    expect(items[1].text()).toContain('“Event details” is hidden')
    const edit = items[1].get('[data-testid="preview-note-edit"]')
    expect(edit.attributes('aria-label')).toBe('Open “Event details” in the editor')
    await edit.trigger('click')
    expect(w.emitted('note-action')[0][0]).toMatchObject({ section: 'details' })
    await items[2].get('[data-testid="preview-note-private"]').trigger('click')
    expect(w.emitted('set-private')).toEqual([[true]])
    w.unmount()
  })

  it('no notes is said, not left blank; Macedonian and Albanian', async () => {
    const w = mountBar()
    await w.get('[data-testid="preview-notes-toggle"]').trigger('click')
    expect(w.get('[data-testid="preview-notes-none"]').text()).toContain('No notes')
    i18n.global.locale.value = 'mk'
    await nextTick()
    expect(w.text()).toContain('Назад кон уредување')
    expect(w.get('[data-device="mobile"]').text()).toContain('Телефон')
    expect(w.get('[data-link="private"]').text()).toContain('Приватен линк')
    i18n.global.locale.value = 'sq'
    await nextTick()
    expect(w.get('[data-device="desktop"]').text()).toContain('Kompjuter')
    w.unmount()
  })

  it('content a design does not draw is named the way the design switcher names it', async () => {
    const w = mountBar({ notes: guestPreviewNotes({ ...all(), designHidden: [{ kind: 'storyPhotos', count: 3, shown: 1 }] }) })
    await w.get('[data-testid="preview-notes-toggle"]').trigger('click')
    expect(w.get('[data-testid="preview-note"]').text()).toContain(
      'Kept, but not shown in this design: ' + i18n.global.t('editSection.designSwitch.hidden.storyPhotosSome', { count: 3, shown: 1 }),
    )
    w.unmount()
  })
})

/* ------------------------------------------------------------------ */
/*  The phone / computer view (InvitationEditLayout)                   */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { key: 'hero', label: 'Cover photo', tab: 'sections', group: 'content', mandatory: true, icon: '' },
  { key: 'ourStoryImages', label: 'Story photos', tab: 'sections', group: 'content', panel: true, switch: false, icon: '' },
  { key: 'rsvp', label: 'RSVP', tab: 'sections', group: 'rsvp', mandatory: true, icon: '' },
]

let stageSize = { width: 1400, height: 900 }
const realWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth')
const realHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight')

function mountLayout(props = {}) {
  Object.defineProperty(Element.prototype, 'clientWidth', {
    configurable: true,
    get() { return this.classList?.contains('inv-layout__preview') ? stageSize.width : 0 },
  })
  Object.defineProperty(Element.prototype, 'clientHeight', {
    configurable: true,
    get() { return this.classList?.contains('inv-layout__preview') ? stageSize.height : 0 },
  })
  const layout = ref(null)
  const wrapper = mount({
    render: () => h(InvitationEditLayout, { ref: layout, editMode: false, sections: SECTIONS, ...props }, {
      default: () => h('div', { 'data-testid': 'invitation' }, 'Ана & Марко'),
      toolbar: () => h('div', { 'data-testid': 'toolbar' }, 'bar'),
      'section-ourStoryImages': () => h('p', { 'data-testid': 'story-images-panel' }, 'slots'),
    }),
  }, { global: { plugins: [i18n] }, attachTo: document.body })
  return { wrapper, layout }
}

describe('the guest preview view', () => {
  afterEach(() => {
    Object.defineProperty(Element.prototype, 'clientWidth', realWidth)
    Object.defineProperty(Element.prototype, 'clientHeight', realHeight)
    document.body.innerHTML = ''
  })

  it('phone on a wide screen: a 390px invitation in a phone frame, the bar above it, outside the frame', async () => {
    stageSize = { width: 1400, height: 900 }
    const { wrapper } = mountLayout({ guestDevice: 'mobile' })
    await flushPromises()
    const frame = wrapper.get('.preview-frame')
    expect(wrapper.get('[data-testid="toolbar"]').element.closest('.preview-frame')).toBeNull()
    expect(frame.attributes('data-guest-device')).toBe('mobile')
    expect(frame.classes()).toContain('preview-frame--constrained')
    // 390px of invitation inside a 12px bezel on both sides
    expect(frame.element.style.width).toBe('414px')
    expect(frame.element.style.height).toBe(`${900 - 48}px`)
    expect(frame.get('[data-testid="invitation"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('computer on a narrower screen: drawn 1280px wide and scaled to fit; at full width, not scaled', async () => {
    stageSize = { width: 640, height: 800 }
    const { wrapper } = mountLayout({ guestDevice: 'desktop' })
    await flushPromises()
    const frame = wrapper.get('.preview-frame')
    expect(frame.element.style.width).toBe('1280px')
    expect(frame.attributes('data-guest-scale')).toBe('0.5')
    expect(frame.element.style.transform).toBe('scale(0.5)')
    // no taller than a computer's screen
    expect(frame.element.style.height).toBe('900px')
    wrapper.unmount()

    stageSize = { width: 1440, height: 900 }
    const wide = mountLayout({ guestDevice: 'desktop' })
    await flushPromises()
    expect(wide.wrapper.get('.preview-frame').attributes('data-guest-scale')).toBe('1')
    expect(wide.wrapper.get('.preview-frame').element.style.width).toBe('1440px')
    wide.wrapper.unmount()
  })

  it('phone on a phone: the screen itself, no frame drawn', async () => {
    stageSize = { width: 390, height: 700 }
    const { wrapper } = mountLayout({ guestDevice: 'mobile' })
    await flushPromises()
    const frame = wrapper.get('.preview-frame')
    expect(frame.classes()).not.toContain('preview-frame--constrained')
    expect(frame.element.style.width).toBe('390px')
    wrapper.unmount()
  })

  it('no guest view in the editor, or without one (a guest\'s own visit): no bar, no frame', async () => {
    const editor = mountLayout({ guestDevice: 'mobile', editMode: true })
    await flushPromises()
    expect(editor.wrapper.find('[data-testid="toolbar"]').exists()).toBe(false)
    expect(editor.wrapper.get('.preview-frame').attributes('data-guest-device')).toBeUndefined()
    editor.wrapper.unmount()
    const visit = mountLayout({ guestDevice: null })
    await flushPromises()
    expect(visit.wrapper.find('[data-testid="toolbar"]').exists()).toBe(false)
    visit.wrapper.unmount()
  })

  it('on a phone, a note about photos opens their panel in the sheet', async () => {
    desktop.value = false
    const { wrapper, layout } = mountLayout({ editMode: true })
    await flushPromises()
    layout.value.requestSection('ourStoryImages', { focus: true })
    await flushPromises()
    await nextTick()
    expect(document.querySelector('[data-testid="mobile-sheet"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="story-images-panel"]')).not.toBeNull()
    wrapper.unmount()
  })
})

/* ------------------------------------------------------------------ */
/*  RSVP switched off: the way back on, where the note leads           */
/* ------------------------------------------------------------------ */

describe('EditRsvpModal hidden', () => {
  it('says the form is hidden and offers to show it again', async () => {
    const w = mount(EditRsvpModal, { props: { open: true, hidden: true }, global: { plugins: [i18n] }, attachTo: document.body })
    const notice = document.querySelector('[data-state="hidden"]')
    expect(notice?.textContent).toContain('This section is hidden')
    document.querySelector('[data-testid="section-show"]').click()
    expect(w.emitted('show')).toHaveLength(1)
    w.unmount()
    const shown = mount(EditRsvpModal, { props: { open: true }, global: { plugins: [i18n] }, attachTo: document.body })
    expect(document.querySelector('[data-state="hidden"]')).toBeNull()
    shown.unmount()
  })
})

/* ------------------------------------------------------------------ */
/*  The page's state: what the preview draws, and back to editing       */
/* ------------------------------------------------------------------ */

async function mountInvitation(url) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:lang/invitations/:design', name: 'weddingInvitation', component: { render: () => null } }],
  })
  await router.push(url)
  let inv
  const Harness = defineComponent({
    setup() {
      inv = useWeddingInvitation(DESIGN_PRESETS['coastal-breeze'])
      return () => h('div')
    },
  })
  const wrapper = mount(Harness, { global: { plugins: [i18n, router] } })
  await flushPromises()
  return { inv, router, wrapper }
}

describe('the preview draws what guests get', () => {
  it('an existing event\'s empty programme: examples in the editor, none in the guest preview, back again in the editor', async () => {
    pageData.mockResolvedValue({
      event: { coupleNames: { bride: 'Ана', groom: 'Марко' }, eventCategory: 'WEDDING', timezone: 'Europe/Skopje', status: 'ACTIVE' },
      agenda: [], ourStory: [], weddingDetails: [], ourStoryImages: [], collageImages: [],
    })
    const { inv, router, wrapper } = await mountInvitation('/en/invitations/coastal-breeze?edit=true&eventId=ev-602')
    expect(inv.agenda.items.value.length).toBeGreaterThan(0)
    expect(inv.config.scheduleEvents.length).toBeGreaterThan(0)

    await inv.openGuestPreview()
    await flushPromises()
    expect(router.currentRoute.value.query.preview).toBe('1')
    expect(inv.config.scheduleEvents).toEqual([])
    expect(inv.sectionHasContent.value.agendaList).toBe(false)
    expect(inv.config.stories).toEqual([])

    await inv.backToEditor()
    await flushPromises()
    expect(inv.config.scheduleEvents.length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('a new invitation\'s starter entries are its content: drawn in the preview too', async () => {
    authed = false
    const { inv, wrapper } = await mountInvitation('/en/invitations/coastal-breeze?edit=true&new=1')
    const n = inv.config.scheduleEvents.length
    expect(n).toBeGreaterThan(0)
    await inv.openGuestPreview()
    await flushPromises()
    expect(inv.config.scheduleEvents.length).toBe(n)
    wrapper.unmount()
  })

  it('back to editing keeps what was typed and the draft; the private-link view is dropped', async () => {
    authed = false
    const { inv, router, wrapper } = await mountInvitation('/en/invitations/coastal-breeze?edit=true&new=1')
    inv.onInfoChange({ brideName: 'Ема', groomName: 'Филип' })
    await inv.openGuestPreview()
    await flushPromises()
    const draftBefore = localStorage.getItem('invitation_draft_v1')
    expect(JSON.parse(draftBefore).theme.info.brideName).toBe('Ема')
    await router.replace({ path: router.currentRoute.value.path, query: { ...router.currentRoute.value.query, isPrivate: 'true' } })
    expect(inv.isPrivate.value).toBe(true)

    await inv.backToEditor()
    await flushPromises()
    const q = router.currentRoute.value.query
    expect(q.edit).toBe('true')
    expect(q.preview).toBeUndefined()
    expect(q.isPrivate).toBeUndefined()
    expect(q.new).toBe('1')
    expect(inv.config.brideName).toBe('Ема')
    expect(JSON.parse(localStorage.getItem('invitation_draft_v1')).theme.info.brideName).toBe('Ема')
    wrapper.unmount()
  })
})

/* ------------------------------------------------------------------ */
/*  Texts                                                              */
/* ------------------------------------------------------------------ */

function keys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`])
}

describe('i18n', () => {
  it('editSection.guestPreview is in mk, en and sq with the same keys, translated, without special characters', () => {
    const [e, m, a] = [en, mk, sq].map((l) => l.editSection.guestPreview)
    expect(keys(m)).toEqual(keys(e))
    expect(keys(a)).toEqual(keys(e))
    for (const k of keys(e)) {
      const get = (o) => k.split('.').reduce((x, p) => x[p], o)
      for (const o of [e, m, a]) expect(get(o)).not.toMatch(/[|@]/)
      expect(get(m)).not.toBe(get(e))
    }
  })

  it('every note text the notes can produce exists', () => {
    const textKeys = ['demoBasics', 'hidden', 'hiddenEntry', 'heroPhoto', 'detailsDefault', 'empty', 'exampleItems',
      'privateOnly', 'storyPhotos', 'collagePhotos', 'rsvpHidden', 'deadlinePast', 'deadlineAfterEvent', 'rsvpNotOpen', 'designHidden']
    for (const l of [en, mk, sq]) {
      for (const k of textKeys) expect(l.editSection.guestPreview.notes[k], k).toBeTruthy()
      for (const kind of Object.values(NOTE_KINDS)) expect(l.editSection.guestPreview.kinds[kind]).toBeTruthy()
    }
  })
})
