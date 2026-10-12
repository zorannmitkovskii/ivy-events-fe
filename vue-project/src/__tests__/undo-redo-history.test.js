import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent, h, nextTick, reactive, ref } from 'vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-801 — undo / redo in this visit.
 *
 * One operation is undone and redo brings the same one back; a new change
 * after undo drops the redo path; history has a limit; undo is never a saved
 * version — it is saved like any other change (the device copy, or the next
 * PUT /events/full, which replaces the lists, so an entry the server already
 * created goes again), and "Saved" only follows the server's answer. Loads
 * from the server, ids a save gives and photos are not steps.
 */

const updateFull = vi.fn()
const createFull = vi.fn()
vi.mock('@/services/eventFull.service', () => ({
  eventFullService: {
    createFull: (...a) => createFull(...a),
    updateFull: (...a) => updateFull(...a),
  },
}))
const agendaList = vi.fn()
const agendaCreate = vi.fn()
const agendaUpdate = vi.fn()
const agendaDelete = vi.fn()
vi.mock('@/services/agenda.service.js', () => ({
  agendaApi: {
    list: (...a) => agendaList(...a),
    createItem: (...a) => agendaCreate(...a),
    updateItem: (...a) => agendaUpdate(...a),
    deleteItem: (...a) => agendaDelete(...a),
  },
}))
vi.mock('@/services/eventDetails.service.js', () => ({
  eventDetailsService: { listByEvent: async () => [{ id: 'd-1', type: 'CHURCH', time: '16:00' }], create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}))
vi.mock('@/services/ourStory.service.js', () => ({
  ourStoryApi: { listWithImages: async () => ({ stories: [{ id: 's-1', type: 'HOW_WE_MET', description: 'Кафе' }], images: [] }), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
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

const { createEditHistory, historyShortcut, isTextEditingTarget, HISTORY_LIMIT } = await import('@/composables/useEditHistory')
const { useWeddingInvitation } = await import('@/composables/useWeddingInvitation')
const { draftStore } = await import('@/store/invitationDraft.store')
const { setEventId } = await import('@/store/onboarding.store')
const { DESIGN_PRESETS } = await import('@/config/designPresets/index.js')
const HistoryControls = (await import('@/components/invitations/shared/HistoryControls.vue')).default
const EditFontsModal = (await import('@/components/modals/EditFontsModal.vue')).default
const EditEntryModal = (await import('@/components/modals/EditEntryModal.vue')).default
const EditRsvpModal = (await import('@/components/modals/EditRsvpModal.vue')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })
const EVENT = 'ev-801'

const serverPage = () => ({
  event: { coupleNames: { bride: 'Ана', groom: 'Марко' }, eventCategory: 'WEDDING', timezone: 'Europe/Skopje' },
  agenda: [], ourStory: [], weddingDetails: [], ourStoryImages: [], collageImages: [],
})
const saved = (agendas = []) => ({ data: { success: true, data: { event: { id: EVENT }, eventDetails: [{ id: 'd-1', type: 'CHURCH' }], agendas, ourStories: [{ id: 's-1', type: 'HOW_WE_MET', displayOrder: 1 }] } } })
const sentPayload = (call) => call[1]
const failure = () => Object.assign(new Error('Request failed with status code 500'), { status: 500, name: 'ApiError' })
const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

let wrappers = []

async function mountEditor(url) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/:lang/invitations/:design', name: 'weddingInvitation', component: { render: () => null } },
      { path: '/:lang/dashboard', name: 'dashboard.overview', component: { render: () => null } },
    ],
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
  wrappers.push(wrapper)
  await flushPromises()
  return { inv, router, wrapper }
}

const openEvent = () => mountEditor(`/en/invitations/coastal-breeze?edit=true&eventId=${EVENT}`)
const openDraft = () => mountEditor('/en/invitations/coastal-breeze?edit=true&new=1')

/** Lets the editor see a change (Vue's flush) — as between two key presses. */
async function settle() {
  await flushPromises()
  await nextTick()
  await nextTick()
}

beforeEach(() => {
  localStorage.clear()
  setEventId('')
  authed = true
  i18n.global.locale.value = 'en'
  for (const fn of [updateFull, createFull, pageData, agendaList, agendaCreate, agendaUpdate, agendaDelete]) fn.mockReset()
  pageData.mockResolvedValue(serverPage())
  agendaList.mockResolvedValue([{ id: 'a-1', type: 'CEREMONY', time: '16:00' }])
  draftStore.agenda = []
  draftStore.eventDetails = []
  draftStore.ourStory = []
  draftStore.seeded = null
})

afterEach(() => {
  wrappers.forEach((w) => { try { w.unmount() } catch { /* already gone */ } })
  wrappers = []
  vi.restoreAllMocks()
})

/* ------------------------------------------------------------------ */
/*  The history model                                                  */
/* ------------------------------------------------------------------ */

describe('createEditHistory', () => {
  function setup(opts = {}) {
    const state = reactive({ title: 'A', color: '#fff', items: [{ id: 'x-1', text: 'one' }] })
    let clock = 0
    const restored = []
    const history = createEditHistory({
      fields: {
        title: { read: () => state.title, write: (v) => { state.title = v } },
        color: { read: () => state.color, write: (v) => { state.color = v } },
        items: {
          read: () => state.items,
          content: (list) => list.map(({ id, ...rest }) => rest),
          write: (v) => { state.items = v },
        },
      },
      now: () => clock,
      onRestored: (step, dir) => restored.push(dir),
      ...opts,
    })
    history.start()
    const edit = async (fn, advance = 5000) => {
      clock += advance
      fn()
      history.noteEdit()
      await settle()
    }
    return { state, history, edit, restored, tick: (ms) => { clock += ms } }
  }

  it('one change is undone, and redo brings the same change back', async () => {
    const { state, history, edit, restored } = setup()
    expect(history.canUndo.value).toBe(false)
    expect(history.canRedo.value).toBe(false)
    await edit(() => { state.title = 'B' })
    expect(history.canUndo.value).toBe(true)
    history.undo()
    expect(state.title).toBe('A')
    expect(history.canUndo.value).toBe(false)
    expect(history.canRedo.value).toBe(true)
    history.redo()
    expect(state.title).toBe('B')
    expect(restored).toEqual(['undo', 'redo'])
    await settle()
    // The restore itself is not a new step.
    expect(history.sizes()).toEqual({ undo: 1, redo: 0 })
  })

  it('typing a word is one step; another field or a pause starts a new one', async () => {
    const { state, history, edit } = setup()
    await edit(() => { state.title = 'Al' })
    await edit(() => { state.title = 'Ali' }, 200)
    await edit(() => { state.title = 'Alis' }, 200)
    expect(history.sizes().undo).toBe(1)
    await edit(() => { state.color = '#000' }, 200)
    expect(history.sizes().undo).toBe(2)
    await edit(() => { state.title = 'Alisa' }, 5000)
    expect(history.sizes().undo).toBe(3)
    history.undo()
    history.undo()
    expect(state.color).toBe('#fff')
    expect(state.title).toBe('Alis')
    history.undo()
    expect(state.title).toBe('A')
  })

  it('a new change after undo clears the redo path', async () => {
    const { state, history, edit } = setup()
    await edit(() => { state.title = 'B' })
    await edit(() => { state.title = 'C' })
    history.undo()
    await settle()
    expect(history.canRedo.value).toBe(true)
    await edit(() => { state.color = '#111' })
    expect(history.canRedo.value).toBe(false)
    expect(state.title).toBe('B')
    history.undo()
    history.undo()
    expect(state.title).toBe('A')
    expect(state.color).toBe('#fff')
  })

  it('keeps at most the limit; the oldest steps go first', async () => {
    const { state, history, edit } = setup({ limit: 3 })
    for (const t of ['B', 'C', 'D', 'E']) await edit(() => { state.title = t })
    expect(history.sizes().undo).toBe(3)
    while (history.undo()) { /* all of them */ }
    expect(state.title).toBe('B')
    expect(HISTORY_LIMIT).toBeGreaterThanOrEqual(20)
  })

  it('a change that is not an edit (a load) is no step, and drops the steps about that field', async () => {
    const { state, history, edit } = setup()
    await edit(() => { state.title = 'B' })
    await edit(() => { state.color = '#000' })
    state.title = 'From the server'
    await settle()
    expect(history.sizes().undo).toBe(1)
    history.undo()
    expect(state.color).toBe('#fff')
    // The loaded value stays: undo touches only the step's own fields.
    expect(state.title).toBe('From the server')
  })

  it('new ids from a save are not a change; content is', async () => {
    const { state, history, edit } = setup()
    await edit(() => { state.items = [...state.items, { id: 'x-2', text: 'two' }] })
    state.items = state.items.map((i, n) => ({ ...i, id: `saved-${n}` }))
    await settle()
    expect(history.sizes().undo).toBe(1)
    history.undo()
    expect(state.items.map((i) => i.text)).toEqual(['one'])
  })

  it('an edit that waits for a request is one step; undo waits until it is done', async () => {
    const { state, history } = setup()
    const req = deferred()
    const running = history.track(async () => {
      await req.promise
      state.items = [...state.items, { id: 'x-9', text: 'created on the server' }]
      await settle()
    })
    expect(history.canUndo.value).toBe(false)
    req.resolve()
    await running
    expect(history.sizes().undo).toBe(1)
    expect(history.canUndo.value).toBe(true)
    history.undo()
    expect(state.items).toHaveLength(1)
  })

  it('a step whose field may not be written back now cannot be undone', async () => {
    const locked = ref(false)
    const { state, history, edit } = setup({ isRestorable: (k) => !(k === 'title' && locked.value) })
    await edit(() => { state.title = 'B' })
    locked.value = true
    expect(history.canUndo.value).toBe(false)
    expect(history.undo()).toBeNull()
    expect(state.title).toBe('B')
    locked.value = false
    expect(history.canUndo.value).toBe(true)
  })

  it('typed and deleted again within one step leaves nothing to undo', async () => {
    const { state, history, edit } = setup()
    await edit(() => { state.title = 'AB' })
    await edit(() => { state.title = 'A' }, 100)
    expect(history.canUndo.value).toBe(false)
  })

  it('forget drops the steps of the given fields and keeps the others', async () => {
    const { state, history, edit } = setup()
    await edit(() => { state.title = 'B' })
    await edit(() => { state.color = '#000' })
    state.color = '#123'
    history.forget(['color'])
    await settle()
    expect(history.sizes().undo).toBe(1)
    history.undo()
    expect(state.title).toBe('A')
    expect(state.color).toBe('#123')
  })
})

describe('shortcuts', () => {
  const key = (k, o = {}) => ({ key: k, code: o.code || `Key${k.toUpperCase()}`, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...o })
  it('Ctrl/⌘+Z undo, Ctrl/⌘+Shift+Z and Ctrl+Y redo', () => {
    expect(historyShortcut(key('z', { ctrlKey: true }))).toBe('undo')
    expect(historyShortcut(key('z', { metaKey: true }))).toBe('undo')
    expect(historyShortcut(key('Z', { ctrlKey: true, shiftKey: true }))).toBe('redo')
    expect(historyShortcut(key('z', { metaKey: true, shiftKey: true }))).toBe('redo')
    expect(historyShortcut(key('y', { ctrlKey: true }))).toBe('redo')
    expect(historyShortcut(key('z'))).toBeNull()
    expect(historyShortcut(key('z', { ctrlKey: true, altKey: true }))).toBeNull()
    expect(historyShortcut(key('a', { ctrlKey: true }))).toBeNull()
  })
  it('a Cyrillic layout (by the physical key) and QWERTZ (by the letter) work', () => {
    expect(historyShortcut(key('з', { code: 'KeyZ', ctrlKey: true }))).toBe('undo')
    // Albanian QWERTZ: the key labelled Y is where Z is on QWERTY.
    expect(historyShortcut(key('y', { code: 'KeyZ', ctrlKey: true }))).toBe('redo')
    expect(historyShortcut(key('z', { code: 'KeyY', ctrlKey: true }))).toBe('undo')
  })
  it('typing in a text field keeps the field\'s own undo', () => {
    const el = (tag, type) => { const e = document.createElement(tag); if (type) e.setAttribute('type', type); return e }
    expect(isTextEditingTarget(el('input'))).toBe(true)
    expect(isTextEditingTarget(el('input', 'text'))).toBe(true)
    expect(isTextEditingTarget(el('textarea'))).toBe(true)
    expect(isTextEditingTarget(el('input', 'color'))).toBe(false)
    expect(isTextEditingTarget(el('input', 'checkbox'))).toBe(false)
    expect(isTextEditingTarget(el('button'))).toBe(false)
    expect(isTextEditingTarget(document.body)).toBe(false)
  })
})

/* ------------------------------------------------------------------ */
/*  In the editor: drafts                                              */
/* ------------------------------------------------------------------ */

describe('a draft (guest)', () => {
  beforeEach(() => { authed = false })

  it('undo puts the name back, redo the new one; each is written to this device', async () => {
    const { inv } = await openDraft()
    inv.onInfoChange({ brideName: 'Ема', groomName: inv.config.groomName })
    await settle()
    expect(inv.historyState.value.canUndo).toBe(true)
    expect(inv.historyState.value.undoWhat).toBe('Names')
    const before = inv.editHistory.nextUndo.value.before.names.value.brideName
    inv.undoEdit()
    expect(inv.config.brideName).toBe(before)
    await inv.retrySave()
    expect(JSON.parse(localStorage.getItem('invitation_draft_v1')).theme.info.brideName).toBe(before)
    inv.redoEdit()
    await inv.retrySave()
    expect(inv.config.brideName).toBe('Ема')
    expect(JSON.parse(localStorage.getItem('invitation_draft_v1')).theme.info.brideName).toBe('Ема')
    // Undo of a draft is "saved on this device", like any change — not "saved to your account".
    expect(inv.saveStatus.value).toBe('local')
  })

  it('an added programme entry: undo removes it from the list and from the draft, redo brings it back', async () => {
    const { inv } = await openDraft()
    const starter = inv.agenda.items.value.length
    await inv.handleAgendaSave({ type: 'FIRST_DANCE', time: '21:15' })
    await settle()
    expect(inv.agenda.items.value).toHaveLength(starter + 1)
    expect(inv.historyState.value.undoWhat).toBe('Programme')
    inv.undoEdit()
    expect(inv.agenda.items.value).toHaveLength(starter)
    expect(draftStore.agenda.some((a) => a.time === '21:15')).toBe(false)
    inv.redoEdit()
    expect(inv.agenda.items.value.some((a) => a.time === '21:15')).toBe(true)
    expect(draftStore.agenda.some((a) => a.time === '21:15' && a._localId)).toBe(true)
  })

  it('hiding a section: undo shows it again', async () => {
    const { inv } = await openDraft()
    inv.setSectionShown('ourStoryList', false)
    await settle()
    expect(inv.isSectionVisible('ourStoryList')).toBe(false)
    expect(inv.historyState.value.undoWhat).toBe('Shown sections')
    inv.undoEdit()
    expect(inv.isSectionVisible('ourStoryList')).toBe(true)
  })

  it('colours and fonts: undo restores the earlier style', async () => {
    const { inv } = await openDraft()
    const accent = inv.palette.accent
    const heading = inv.fonts.heading
    inv.onColorsChange({ accent: '#123456' })
    await settle()
    inv.onFontsChange({ heading: 'Lora', body: 'Inter' })
    await settle()
    expect(inv.historyState.value.undoWhat).toBe('Fonts')
    inv.undoEdit()
    expect(inv.fonts.heading).toBe(heading)
    expect(inv.palette.accent).toBe('#123456')
    inv.undoEdit()
    expect(inv.palette.accent).toBe(accent)
  })

  it('a picked photo is not a step: nothing to undo, the photo stays', async () => {
    const { inv } = await openDraft()
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'a.png', { type: 'image/png' })
    inv.pickPhoto('story', 1, file)
    await settle()
    expect(inv.historyState.value.canUndo).toBe(false)
    expect(inv.photos.slot('story', 1).own).toBe(true)
  })

  it('outside the editor (the guest preview) undo does nothing', async () => {
    const { inv, router } = await openDraft()
    inv.onInfoChange({ brideName: 'Ема', groomName: '' })
    await settle()
    await router.push('/en/invitations/coastal-breeze?new=1&preview=1')
    await settle()
    expect(inv.undoEdit()).toBeNull()
    expect(inv.config.brideName).toBe('Ема')
  })
})

/* ------------------------------------------------------------------ */
/*  In the editor: an existing event                                   */
/* ------------------------------------------------------------------ */

describe('an existing event', () => {
  it('what was read from the server is not a step', async () => {
    const { inv } = await openEvent()
    expect(inv.config.brideName).toBe('Ана')
    expect(inv.agenda.items.value.map((a) => a.id)).toEqual(['a-1'])
    expect(inv.historyState.value.canUndo).toBe(false)
  })

  it('undo of an entry the server already created: the next PUT replaces the list without it; "Saved" only after the server answers', async () => {
    agendaCreate.mockResolvedValue({ id: 'a-9', type: 'FIRST_DANCE', time: '21:00' })
    const put = deferred()
    updateFull.mockReturnValueOnce(put.promise).mockResolvedValue(saved([{ id: 'a-10', type: 'CEREMONY' }, { id: 'a-11', type: 'FIRST_DANCE' }]))
    const { inv } = await openEvent()
    await inv.handleAgendaSave({ type: 'FIRST_DANCE', time: '21:00' })
    await settle()
    expect(agendaCreate).toHaveBeenCalledTimes(1)
    expect(inv.agenda.items.value.map((a) => a.id)).toEqual(['a-1', 'a-9'])

    inv.undoEdit()
    expect(inv.agenda.items.value.map((a) => a.id)).toEqual(['a-1'])
    // Not shown as saved: the server still has the entry until the PUT is answered.
    expect(inv.saveStatus.value).toBe('saving')
    expect(inv.historyState.value.canRedo).toBe(true)
    await settle()
    expect(updateFull).toHaveBeenCalledTimes(1)
    expect(sentPayload(updateFull.mock.calls[0]).agendas.map((a) => a.type)).toEqual(['CEREMONY'])
    expect(inv.saveStatus.value).toBe('saving')
    put.resolve(saved([{ id: 'a-10', type: 'CEREMONY' }]))
    await settle()
    expect(inv.saveStatus.value).toBe('synced')

    inv.redoEdit()
    await settle()
    expect(updateFull).toHaveBeenCalledTimes(2)
    expect(sentPayload(updateFull.mock.calls[1]).agendas.map((a) => a.type)).toEqual(['CEREMONY', 'FIRST_DANCE'])
    // The kept entry under the id the last save gave it.
    expect(sentPayload(updateFull.mock.calls[1]).agendas[0].id).toBe('a-10')
  })

  it('a failed save after undo is an error, never "saved"; the change stays unsaved', async () => {
    updateFull.mockRejectedValue(failure())
    const { inv } = await openEvent()
    inv.setSectionShown('agendaList', false)
    await settle()
    inv.undoEdit()
    await settle()
    expect(inv.isSectionVisible('agendaList')).toBe(true)
    expect(inv.saveStatus.value).toBe('error')
    expect(inv.leavePrompt.open).toBe(false)
    expect(inv.dirty.value).toBe(true)
    // The device copy holds the undone state for "Try again".
    expect(JSON.parse(localStorage.getItem(`invitation_unsynced_v1:${EVENT}`)).payload.showAgenda).toBe(true)
  })

  it('undo of a change that was saved: saved again, not taken as the earlier saved state', async () => {
    updateFull.mockResolvedValue(saved())
    const { inv } = await openEvent()
    inv.onInfoChange({ brideName: 'Ема', groomName: 'Марко' })
    await inv.retrySave()
    await settle()
    expect(inv.saveStatus.value).toBe('synced')
    inv.undoEdit()
    expect(inv.config.brideName).toBe('Ана')
    expect(inv.saveStatus.value).toBe('saving')
    await settle()
    expect(updateFull).toHaveBeenCalledTimes(2)
    expect(sentPayload(updateFull.mock.calls[1]).brideName).toBe('Ана')
  })

  it('the design\'s examples (INV-401): undo of the first own entry brings them back; they are never sent', async () => {
    agendaList.mockResolvedValue([])
    agendaCreate.mockResolvedValue({ id: 'a-5', type: 'CEREMONY', time: '17:30' })
    updateFull.mockResolvedValue(saved())
    const { inv } = await openEvent()
    const examples = inv.agenda.items.value.length
    expect(examples).toBeGreaterThan(0)
    await inv.handleAgendaSave({ type: 'CEREMONY', time: '17:30' })
    await settle()
    expect(inv.agenda.items.value.map((a) => a.id)).toEqual(['a-5'])
    inv.undoEdit()
    expect(inv.agenda.items.value).toHaveLength(examples)
    await settle()
    expect(sentPayload(updateFull.mock.calls.at(-1)).agendas).toEqual([])
  })

  it('an entry changed on the server, then given a new id by a save: undo puts the old text back under the new id', async () => {
    agendaUpdate.mockResolvedValue({ id: 'a-1', type: 'CEREMONY', time: '18:00' })
    updateFull.mockResolvedValue(saved([{ id: 'a-2', type: 'CEREMONY' }]))
    const { inv } = await openEvent()
    await inv.handleAgendaUpdate({ id: 'a-1', type: 'CEREMONY', time: '18:00' }, inv.agenda.items.value[0])
    await settle()
    await inv.retrySave()
    await settle()
    expect(inv.agenda.items.value[0].id).toBe('a-2')
    inv.undoEdit()
    expect(inv.agenda.items.value).toEqual([expect.objectContaining({ id: 'a-2', time: '16:00' })])
  })

  it('a section that could not be read: its steps cannot be undone (they would be saved over it)', async () => {
    updateFull.mockResolvedValue(saved())
    agendaCreate.mockResolvedValue({ id: 'a-9', type: 'FIRST_DANCE', time: '21:00' })
    const { inv } = await openEvent()
    await inv.handleAgendaSave({ type: 'FIRST_DANCE', time: '21:00' })
    await settle()
    expect(inv.historyState.value.canUndo).toBe(true)
    inv.sectionLoad.agenda = 'failed'
    await settle()
    expect(inv.historyState.value.canUndo).toBe(false)
  })

  it('another design: steps about the old style go, content steps stay', async () => {
    updateFull.mockResolvedValue(saved())
    const { inv } = await openEvent()
    inv.onInfoChange({ brideName: 'Ема', groomName: 'Марко' })
    await settle()
    inv.onColorsChange({ accent: '#abcdef' })
    await settle()
    inv.resetToPreset(DESIGN_PRESETS['persian-wedding'], { from: 'coastal-breeze', to: 'persian-wedding' })
    inv.markDirty()
    inv.forgetStyleHistory()
    await settle()
    expect(inv.historyState.value.undoWhat).toBe('Names')
    inv.undoEdit()
    expect(inv.config.brideName).toBe('Ана')
    expect(inv.palette.accent).toBe(DESIGN_PRESETS['persian-wedding'].palette.accent)
  })

  it('says what was undone in a live region text (and that it is saved like any change)', async () => {
    updateFull.mockResolvedValue(saved())
    const { inv } = await openEvent()
    inv.onRsvpChange({ deadline: '2099-05-01' })
    await settle()
    inv.undoEdit()
    await nextTick()
    expect(inv.historyState.value.announcement).toBe('Undone: RSVP. Saving this like any other change.')
  })
})

/* ------------------------------------------------------------------ */
/*  The controls                                                       */
/* ------------------------------------------------------------------ */

describe('HistoryControls', () => {
  const mountControls = (state, opts = {}) => mount(HistoryControls, { props: { state, ...opts }, global: { plugins: [i18n] } })

  it('disabled when there is nothing to undo / redo, and says so', () => {
    const w = mountControls({ canUndo: false, canRedo: false })
    const [undo, redo] = [w.get('[data-testid="history-undo"]'), w.get('[data-testid="history-redo"]')]
    expect(undo.attributes('disabled')).toBeDefined()
    expect(redo.attributes('disabled')).toBeDefined()
    expect(undo.attributes('aria-label')).toBe('Nothing to undo')
    expect(redo.attributes('aria-label')).toBe('Nothing to redo')
  })

  it('names the change, shows the shortcuts, emits, and says it is only this visit', async () => {
    const w = mountControls({ canUndo: true, canRedo: true, undoWhat: 'Programme', redoWhat: 'Colors' })
    const undo = w.get('[data-testid="history-undo"]')
    const redo = w.get('[data-testid="history-redo"]')
    expect(undo.attributes('aria-label')).toBe('Undo: Programme')
    expect(redo.attributes('aria-label')).toBe('Redo: Colors')
    expect(undo.attributes('aria-keyshortcuts')).toContain('Control+Z')
    expect(redo.attributes('aria-keyshortcuts')).toContain('Control+Shift+Z')
    expect(undo.attributes('title')).toContain('Ctrl+Z')
    const group = w.get('[role="group"]')
    expect(group.attributes('aria-label')).toBe('Undo and redo')
    expect(w.get('#' + group.attributes('aria-describedby')).text()).toContain('not a saved version')
    await undo.trigger('click')
    await redo.trigger('click')
    expect(w.emitted('undo')).toHaveLength(1)
    expect(w.emitted('redo')).toHaveLength(1)
  })

  it('in Macedonian and Albanian', () => {
    i18n.global.locale.value = 'mk'
    let w = mountControls({ canUndo: true, canRedo: false, undoWhat: 'Програма' })
    expect(w.get('[data-testid="history-undo"]').attributes('aria-label')).toBe('Поништи: Програма')
    expect(w.text()).toContain('Поништи')
    i18n.global.locale.value = 'sq'
    w = mountControls({ canUndo: false, canRedo: true, redoWhat: 'Programi' })
    expect(w.get('[data-testid="history-redo"]').attributes('aria-label')).toBe('Ribëj: Programi')
  })

  it('every new text exists in mk, en and sq', () => {
    const keysOf = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keysOf(v, p + k + '.') : [p + k]))
    const enKeys = keysOf(en.editSection.history).sort()
    expect(keysOf(mk.editSection.history).sort()).toEqual(enKeys)
    expect(keysOf(sq.editSection.history).sort()).toEqual(enKeys)
    for (const lang of [en, mk, sq]) {
      expect(lang.editSection.history.undoWhat).toContain('{what}')
      expect(lang.editSection.history.undone).toContain('{what}')
    }
  })
})

describe('open panels follow undo / redo without making a new change', () => {
  const global = { plugins: [i18n], stubs: { teleport: true } }
  const pressed = (w) => w.findAll('[aria-pressed="true"]').map((b) => b.text().replace('✓', '').trim())

  it('fonts', async () => {
    const w = mount(EditFontsModal, { props: { open: true, liveEdit: true, currentHeading: 'Lora', currentBody: 'Merriweather' }, global })
    await settle()
    await w.setProps({ currentHeading: 'Playfair Display' })
    await settle()
    expect(pressed(w)).toEqual(['Playfair Display', 'Merriweather'])
    expect(w.emitted('change')).toBeUndefined()
    // A choice by the person is still a change.
    await w.findAll('button').find((b) => b.text().includes('Lora')).trigger('click')
    await settle()
    expect(w.emitted('change')).toEqual([[{ heading: 'Lora', body: 'Merriweather' }]])
  })

  it('opening animation', async () => {
    const w = mount(EditEntryModal, { props: { open: true, liveEdit: true, currentType: 'envelop', currentDesign: 'white-gold-seal' }, global })
    await settle()
    await w.setProps({ currentType: 'gallery', currentDesign: 'polaroid' })
    await settle()
    expect(w.get('select').element.value).toBe('gallery')
    // The invitation's own design, not the type's first one.
    expect(pressed(w)).toEqual(['Polaroid'])
    expect(w.emitted('change')).toBeUndefined()
    await w.get('select').setValue('heart')
    await settle()
    expect(w.emitted('change')).toEqual([[{ type: 'heart', design: 'bloom' }]])
  })

  it('RSVP settings', async () => {
    const w = mount(EditRsvpModal, {
      props: { open: true, liveEdit: true, rsvpDeadline: '2099-05-01', maxGuests: 5, borderRadius: '8px', contactMethod: 'email', eventDateTime: '2099-06-01T16:00:00', eventTimezone: 'Europe/Skopje' },
      global,
    })
    await settle()
    const shown = () => w.findAll('[data-rsvp-field="deadline"] input').map((i) => i.element.value).join(' ')
    expect(shown()).toMatch(/2099.?05.?01|01.?05.?2099/)
    await w.setProps({ rsvpDeadline: '2099-04-01', maxGuests: 3 })
    await settle()
    expect(shown()).toMatch(/2099.?04.?01|01.?04.?2099/)
    expect(w.text()).toContain('3')
    expect(w.emitted('change')).toBeUndefined()
  })
})
