import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent, h, nextTick } from 'vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'
import editModeSource from '@/composables/useInvitationEditMode.js?raw'

/**
 * INV-502 — unsaved changes and the exit guard.
 *
 * Before: the editor's guard was a `window.confirm` in English, it asked
 * whenever `dirty` was true — which an existing event is from the moment it
 * opens — and it was never removed, so every editor visit added another
 * router guard and `beforeunload` listener for the rest of the session.
 *
 * Now: one localized dialog (Save and exit / Discard changes / Keep editing)
 * only when leaving would lose something; a pending change is saved first and
 * a confirmed save asks nothing; staying on the page (preview, query, design
 * switch) never asks; the guard and the listener go when the editor unmounts.
 */

const updateFull = vi.fn()
const createFull = vi.fn()
vi.mock('@/services/eventFull.service', () => ({
  eventFullService: {
    createFull: (...a) => createFull(...a),
    updateFull: (...a) => updateFull(...a),
  },
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

const { useWeddingInvitation } = await import('@/composables/useWeddingInvitation')
const { getUnsyncedSnapshot } = await import('@/store/invitationDraft.store')
const { setEventId } = await import('@/store/onboarding.store')
const { DESIGN_PRESETS } = await import('@/config/designPresets/index.js')
const UnsavedChangesDialog = (await import('@/components/invitations/shared/UnsavedChangesDialog.vue')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })
const EVENT = 'ev-502'

const serverPage = () => ({
  event: { coupleNames: { bride: 'Ана', groom: 'Марко' }, eventCategory: 'WEDDING', timezone: 'Europe/Skopje' },
  agenda: [], ourStory: [], weddingDetails: [], ourStoryImages: [], collageImages: [],
})
const saved = () => ({ data: { success: true, data: { event: { id: EVENT }, eventDetails: [], agendas: [], ourStories: [] } } })
const storedDraft = () => JSON.parse(localStorage.getItem('invitation_draft_v1') || 'null')
const failure = () => Object.assign(new Error('Request failed with status code 500'), { status: 500, name: 'ApiError' })

let wrappers = []

async function mountEditor(url) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/:lang/invitations/:design', name: 'weddingInvitation', component: { render: () => null } },
      { path: '/:lang/dashboard', name: 'dashboard.overview', component: { render: () => null } },
      { path: '/:lang/event-basics', name: 'eventBasics', component: { render: () => null } },
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

/** A navigation that may wait on the dialog: started, not awaited. */
function leave(router, to = '/en/dashboard') {
  const done = router.push(to)
  return flushPromises().then(() => done)
}

beforeEach(() => {
  localStorage.clear()
  setEventId('')
  authed = true
  i18n.global.locale.value = 'en'
  for (const fn of [updateFull, createFull, pageData]) fn.mockReset()
  pageData.mockResolvedValue(serverPage())
})

afterEach(() => {
  wrappers.forEach((w) => { try { w.unmount() } catch { /* already gone */ } })
  wrappers = []
  vi.restoreAllMocks()
})

/* ------------------------------------------------------------------ */
/*  When it asks — and when it does not                                */
/* ------------------------------------------------------------------ */

describe('leaving the editor', () => {
  it('an existing event opened and left untouched: no question', async () => {
    const { inv, router } = await openEvent()
    expect(inv.dirty.value).toBe(true) // the Save button is enabled, as before
    await router.push('/en/dashboard')
    expect(inv.leavePrompt.open).toBe(false)
    expect(router.currentRoute.value.name).toBe('dashboard.overview')
    expect(updateFull).not.toHaveBeenCalled()
  })

  it('a pending change is saved first; a confirmed save asks nothing', async () => {
    updateFull.mockResolvedValue(saved())
    const { inv, router } = await openEvent()
    inv.setSectionShown('agenda', false)
    await router.push('/en/dashboard')
    expect(updateFull).toHaveBeenCalledTimes(1)
    expect(inv.leavePrompt.open).toBe(false)
    expect(router.currentRoute.value.name).toBe('dashboard.overview')
  })

  it('a change the server did not confirm opens the dialog; "Keep editing" stays', async () => {
    updateFull.mockRejectedValue(failure())
    const { inv, router } = await openEvent()
    inv.setSectionShown('agenda', false)
    const nav = leave(router)
    await flushPromises()
    expect(inv.leavePrompt.open).toBe(true)
    expect(inv.leavePrompt.kind).toBe('event')
    inv.stayInEditor()
    await nav
    expect(router.currentRoute.value.name).toBe('weddingInvitation')
    expect(inv.leavePrompt.open).toBe(false)
    // The change is still there and still on this device.
    expect(getUnsyncedSnapshot(EVENT)).toBeTruthy()
  })

  it('"Save and exit" leaves only after the server confirmed the save', async () => {
    updateFull.mockRejectedValueOnce(failure()).mockResolvedValue(saved())
    const { inv, router } = await openEvent()
    inv.setSectionShown('agenda', false)
    const nav = leave(router)
    await flushPromises()
    expect(inv.leavePrompt.open).toBe(true)
    await inv.saveAndLeave()
    await nav
    expect(updateFull).toHaveBeenCalledTimes(2)
    expect(router.currentRoute.value.name).toBe('dashboard.overview')
    expect(inv.leavePrompt.open).toBe(false)
  })

  it('"Save and exit" that fails keeps the dialog open with the error; "Discard" then leaves and drops the device copy', async () => {
    updateFull.mockRejectedValue(failure())
    const { inv, router } = await openEvent()
    inv.setSectionShown('agenda', false)
    const nav = leave(router)
    await flushPromises()
    await inv.saveAndLeave()
    expect(inv.leavePrompt.open).toBe(true)
    expect(inv.leavePrompt.failed).toBe(true)
    expect(inv.leavePrompt.busy).toBe(false)
    expect(router.currentRoute.value.name).toBe('weddingInvitation')
    expect(getUnsyncedSnapshot(EVENT)).toBeTruthy()

    inv.discardAndLeave()
    await nav
    expect(router.currentRoute.value.name).toBe('dashboard.overview')
    expect(getUnsyncedSnapshot(EVENT)).toBeNull()
    expect(updateFull).toHaveBeenCalledTimes(2) // nothing sent after discarding
  })

  it('a second navigation while the dialog is open is refused — one dialog, not two', async () => {
    updateFull.mockRejectedValue(failure())
    const { inv, router } = await openEvent()
    inv.setSectionShown('agenda', false)
    const first = leave(router)
    await flushPromises()
    expect(inv.leavePrompt.open).toBe(true)
    await router.push('/en/event-basics')
    expect(router.currentRoute.value.name).toBe('weddingInvitation')
    inv.stayInEditor()
    await first
    expect(router.currentRoute.value.name).toBe('weddingInvitation')
  })

  it('staying on the page (preview, query change) never asks', async () => {
    updateFull.mockRejectedValue(failure())
    const { inv, router } = await openEvent()
    inv.setSectionShown('agenda', false)
    await router.push({ path: router.currentRoute.value.path, query: { eventId: EVENT, preview: '1' } })
    await flushPromises()
    expect(inv.leavePrompt.open).toBe(false)
    expect(router.currentRoute.value.query.preview).toBe('1')
  })

  it('after the explicit Save went through, leaving asks nothing', async () => {
    updateFull.mockResolvedValue(saved())
    const { inv, router } = await openEvent()
    inv.setSectionShown('agenda', false)
    await inv.onGlobalSave()
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('dashboard.overview')
    expect(inv.leavePrompt.open).toBe(false)
  })

  it('a guest draft is written to this device and left without a question', async () => {
    authed = false
    const { inv, router } = await openDraft()
    inv.setSectionShown('agenda', false)
    await router.push('/en/event-basics')
    expect(inv.leavePrompt.open).toBe(false)
    expect(router.currentRoute.value.name).toBe('eventBasics')
    expect(storedDraft()?.fullPayload).toBeTruthy()
    expect(createFull).not.toHaveBeenCalled()
  })

  it('a draft that could not be written to this device asks (kind "draft")', async () => {
    authed = false
    const { inv, router } = await openDraft()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError') })
    inv.setSectionShown('agenda', false)
    const nav = leave(router, '/en/event-basics')
    await flushPromises()
    expect(inv.leavePrompt.open).toBe(true)
    expect(inv.leavePrompt.kind).toBe('draft')
    inv.discardAndLeave()
    await nav
    expect(router.currentRoute.value.name).toBe('eventBasics')
  })
})

/* ------------------------------------------------------------------ */
/*  Closing the tab, and removing the guard                            */
/* ------------------------------------------------------------------ */

function unloadEvent() {
  const e = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(e)
  return e
}

describe('browser unload and cleanup', () => {
  it('closing the tab with an unconfirmed change asks the browser (best effort); without one it does not', async () => {
    updateFull.mockRejectedValue(failure())
    const { inv } = await openEvent()
    expect(unloadEvent().defaultPrevented).toBe(false)
    inv.setSectionShown('agenda', false)
    const e = unloadEvent()
    expect(e.defaultPrevented).toBe(true)
    // The change was written to this device synchronously on the way out.
    expect(getUnsyncedSnapshot(EVENT)).toBeTruthy()
  })

  it('a guest draft: the change is written on unload and the browser is not asked', async () => {
    authed = false
    const { inv } = await openDraft()
    inv.setSectionShown('agenda', false)
    expect(unloadEvent().defaultPrevented).toBe(false)
    expect(storedDraft()?.fullPayload).toBeTruthy()
  })

  it('unmounting the editor removes the router guard and the unload listener', async () => {
    updateFull.mockRejectedValue(failure())
    const removed = vi.spyOn(window, 'removeEventListener')
    const { inv, router, wrapper } = await openEvent()
    inv.setSectionShown('agenda', false)
    await flushPromises()
    wrapper.unmount()
    expect(removed.mock.calls.some(([type]) => type === 'beforeunload')).toBe(true)
    expect(unloadEvent().defaultPrevented).toBe(false)
    await router.push('/en/dashboard')
    expect(router.currentRoute.value.name).toBe('dashboard.overview')
    expect(inv.leavePrompt.open).toBe(false)
  })

  it('two visits to the editor leave one guard, not two', async () => {
    updateFull.mockRejectedValue(failure())
    const first = await openEvent()
    first.wrapper.unmount()
    const { inv, router } = await openEvent()
    inv.setSectionShown('agenda', false)
    const nav = leave(router)
    await flushPromises()
    expect(inv.leavePrompt.open).toBe(true)
    expect(first.inv.leavePrompt.open).toBe(false)
    inv.stayInEditor()
    await nav
  })

  it('the old hardcoded English confirm is gone', () => {
    const src = editModeSource
    expect(src).not.toMatch(/You have unsaved changes/)
  })
})

/* ------------------------------------------------------------------ */
/*  The dialog                                                         */
/* ------------------------------------------------------------------ */

function mountDialog(props = {}) {
  return mount(UnsavedChangesDialog, {
    props: { open: true, kind: 'event', ...props },
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
}

describe('UnsavedChangesDialog', () => {
  afterEach(() => { document.body.innerHTML = '' })

  it('is an alertdialog with three choices; focus starts on "Keep editing"', async () => {
    const w = mountDialog()
    await flushPromises()
    const dialog = document.querySelector('[data-testid="unsaved-dialog"]')
    expect(dialog.getAttribute('role')).toBe('alertdialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent).toBe('Unsaved changes')
    expect(document.querySelector('[data-testid="unsaved-save"]').textContent.trim()).toBe('Save and exit')
    expect(document.querySelector('[data-testid="unsaved-discard"]').textContent.trim()).toBe('Discard changes')
    expect(document.activeElement).toBe(document.querySelector('[data-testid="unsaved-stay"]'))
    expect(document.activeElement.textContent.trim()).toBe('Keep editing')
    w.unmount()
  })

  it('discarding says what is lost, and the discard button is described by it', async () => {
    const w = mountDialog()
    await flushPromises()
    const btn = document.querySelector('[data-testid="unsaved-discard"]')
    const hint = document.getElementById(btn.getAttribute('aria-describedby'))
    expect(hint.textContent).toMatch(/lost/)
    expect(hint.textContent).toMatch(/this device/)
    await w.setProps({ kind: 'draft' })
    expect(document.querySelector('[data-testid="unsaved-discard-hint"]').textContent).toMatch(/last saved on this device/)
    w.unmount()
  })

  it('emits each choice; Escape keeps editing; Tab stays inside', async () => {
    const w = mountDialog()
    await flushPromises()
    document.querySelector('[data-testid="unsaved-save"]').click()
    document.querySelector('[data-testid="unsaved-discard"]').click()
    const dialog = document.querySelector('[data-testid="unsaved-dialog"]')
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(w.emitted('save')).toHaveLength(1)
    expect(w.emitted('discard')).toHaveLength(1)
    expect(w.emitted('stay')).toHaveLength(1)
    const save = document.querySelector('[data-testid="unsaved-save"]')
    save.focus()
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.activeElement).toBe(document.querySelector('[data-testid="unsaved-stay"]'))
    w.unmount()
  })

  it('while saving the choices wait; a failure is announced', async () => {
    const w = mountDialog({ busy: true })
    await flushPromises()
    expect(document.querySelector('[data-testid="unsaved-save"]').disabled).toBe(true)
    expect(document.querySelector('[data-testid="unsaved-save"]').textContent.trim()).toBe('Saving…')
    const dialog = document.querySelector('[data-testid="unsaved-dialog"]')
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(w.emitted('stay')).toBeUndefined()
    await w.setProps({ busy: false, failed: true })
    await nextTick()
    expect(document.querySelector('[data-testid="unsaved-save-failed"]').getAttribute('role')).toBe('alert')
    w.unmount()
  })

  it('speaks Macedonian and Albanian', async () => {
    i18n.global.locale.value = 'mk'
    const w = mountDialog()
    await flushPromises()
    expect(document.querySelector('[data-testid="unsaved-save"]').textContent.trim()).toBe('Зачувај и излези')
    expect(document.querySelector('[data-testid="unsaved-discard"]').textContent.trim()).toBe('Отфрли измени')
    expect(document.querySelector('[data-testid="unsaved-stay"]').textContent.trim()).toBe('Продолжи со уредување')
    w.unmount()
    document.body.innerHTML = ''
    i18n.global.locale.value = 'sq'
    const s = mountDialog()
    await flushPromises()
    expect(document.querySelector('[data-testid="unsaved-save"]').textContent.trim()).toBe('Ruaj dhe dil')
    s.unmount()
  })

  it('has the same keys in mk, en and sq', () => {
    const keys = (o) => Object.keys(o).sort()
    expect(keys(mk.editSection.leaveGuard)).toEqual(keys(en.editSection.leaveGuard))
    expect(keys(sq.editSection.leaveGuard)).toEqual(keys(en.editSection.leaveGuard))
    for (const l of [en, mk, sq]) {
      for (const v of Object.values(l.editSection.leaveGuard)) expect(v.trim()).not.toBe('')
    }
  })
})
