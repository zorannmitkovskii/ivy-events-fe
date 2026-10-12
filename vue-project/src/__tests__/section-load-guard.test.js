import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent, h } from 'vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-402 — sections that could not be read, and empty or hidden sections on
 * the invitation guests open.
 *
 * Bug carried from INV-401 (data loss): an existing event is saved with
 * PUT /events/full/{id}, a full replacement. When reading the programme (or
 * details, or story) failed, the editor held an empty list and the autosave
 * sent it — the server then deleted the event's programme. Now a section that
 * was not read is never sent, the save is held back with a clear message, and
 * "Try again" reads it first and only then saves.
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
vi.mock('@/services/agenda.service.js', () => ({
  agendaApi: { list: (...a) => agendaList(...a), createItem: vi.fn(), updateItem: vi.fn(), deleteItem: vi.fn() },
}))
const detailsList = vi.fn()
vi.mock('@/services/eventDetails.service.js', () => ({
  eventDetailsService: { listByEvent: (...a) => detailsList(...a), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}))
const storyList = vi.fn()
vi.mock('@/services/ourStory.service.js', () => ({
  ourStoryApi: { listWithImages: (...a) => storyList(...a), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}))
const pageData = vi.fn()
vi.mock('@/services/invitationPage.service', () => ({
  invitationPageService: { getByEventId: (...a) => pageData(...a) },
}))
vi.mock('@/services/events.service', () => ({ eventsService: { getById: async () => ({ invitation: null }) } }))
vi.mock('@/services/media.service', () => ({ mediaService: { list: async () => [] } }))
vi.mock('@/services/auth.service', () => ({
  isAuthenticated: () => true,
  getUsername: () => 'ana',
  getEventId: () => null,
  hasRole: () => false,
}))

const { useWeddingInvitation } = await import('@/composables/useWeddingInvitation')
const { buildEventFullPayload } = await import('@/utils/buildEventFullPayload')
const { getUnsyncedSnapshot } = await import('@/store/invitationDraft.store')
const { setEventId } = await import('@/store/onboarding.store')
const { DESIGN_PRESETS } = await import('@/config/designPresets/index.js')
const SaveStatus = (await import('@/components/invitations/shared/SaveStatus.vue')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })
const EVENT = 'ev-402'

const serverPage = (over = {}) => ({
  event: { coupleNames: { bride: 'Ана', groom: 'Марко' }, eventCategory: 'WEDDING', timezone: 'Europe/Skopje' },
  agenda: [], ourStory: [], weddingDetails: [], ourStoryImages: [], collageImages: [],
  ...over,
})

const saved = (data) => ({ data: { success: true, data: { event: { id: EVENT }, eventDetails: [], agendas: [], ourStories: [], ...data } } })

function failure() {
  return Object.assign(new Error('Request failed with status code 500'), { status: 500, name: 'ApiError' })
}

function deferred() {
  let resolve
  const promise = new Promise((r) => { resolve = r })
  return { promise, resolve }
}

async function mountPage(url) {
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
  mount(Harness, { global: { plugins: [i18n, router] } })
  await flushPromises()
  return inv
}

const openEditor = () => mountPage(`/en/invitations/coastal-breeze?edit=true&eventId=${EVENT}`)

beforeEach(() => {
  localStorage.clear()
  setEventId('')
  i18n.global.locale.value = 'en'
  for (const fn of [updateFull, createFull, agendaList, detailsList, storyList, pageData]) fn.mockReset()
  pageData.mockResolvedValue(serverPage())
  detailsList.mockResolvedValue([{ id: 'd1', type: 'CHURCH', time: '15:00' }])
  agendaList.mockResolvedValue([{ id: 'a1', type: 'CEREMONY', time: '17:00' }])
  storyList.mockResolvedValue({ stories: [{ id: 's1', type: 'HOW_WE_MET', description: 'Наше' }], images: [] })
})

/* ------------------------------------------------------------------ */
/*  A section that could not be read is never saved over               */
/* ------------------------------------------------------------------ */

describe('an existing event whose programme could not be read', () => {
  it('saves nothing to the server, says why, and keeps no empty programme even on this device', async () => {
    agendaList.mockRejectedValue(failure())
    const inv = await openEditor()
    expect(inv.sectionLoad.agenda).toBe('failed')
    expect(inv.failedSections.value).toEqual(['agenda'])
    // No design examples stand in for what the server has.
    expect(inv.agenda.items.value).toEqual([])

    inv.onInfoChange({ brideName: 'Ема' })
    await inv.onGlobalSave()

    // Without the fix this PUT went out with "agendas": [] and the server
    // deleted the event's programme.
    expect(updateFull).not.toHaveBeenCalled()
    expect(inv.saveStatus.value).toBe('error')
    expect(inv.saveStatusDetail.value).toBe('sectionsNotLoaded')
    expect(inv.dirty.value).toBe(true)

    // The copy kept for "Sync now" leaves the programme out (the server
    // keeps it), while the sections that were read travel as usual.
    const local = getUnsyncedSnapshot(EVENT)
    expect(local.payload.brideName).toBe('Ема')
    expect(local.payload).not.toHaveProperty('agendas')
    expect(local.payload.eventDetails).toHaveLength(1)
    expect(local.payload.ourStories).toHaveLength(1)
  })

  it('"Try again" reads the programme first, then saves it with the change', async () => {
    agendaList.mockRejectedValueOnce(failure())
    const inv = await openEditor()
    inv.onInfoChange({ brideName: 'Ема' })
    await inv.onGlobalSave()
    expect(updateFull).not.toHaveBeenCalled()

    agendaList.mockResolvedValue([{ id: 'a1', type: 'CEREMONY', time: '17:00' }])
    updateFull.mockResolvedValue(saved({ agendas: [{ id: 'a9', type: 'CEREMONY' }] }))
    await inv.retrySave()
    await flushPromises()

    expect(inv.sectionLoad.agenda).toBe('loaded')
    expect(updateFull).toHaveBeenCalledTimes(1)
    const [id, payload] = updateFull.mock.calls[0]
    expect(id).toBe(EVENT)
    expect(payload.brideName).toBe('Ема')
    expect(payload.agendas).toEqual([expect.objectContaining({ id: 'a1', type: 'CEREMONY', time: '17:00' })])
    expect(inv.saveStatus.value).toBe('synced')
  })

  it('a failed retry keeps holding the save back', async () => {
    agendaList.mockRejectedValue(failure())
    const inv = await openEditor()
    inv.onInfoChange({ brideName: 'Ема' })
    await inv.retrySave()
    await flushPromises()
    expect(agendaList).toHaveBeenCalledTimes(2)
    expect(updateFull).not.toHaveBeenCalled()
    expect(inv.saveStatusDetail.value).toBe('sectionsNotLoaded')
  })

  it('the same holds for details and the story', async () => {
    detailsList.mockRejectedValue(failure())
    storyList.mockRejectedValue(failure())
    const inv = await openEditor()
    expect(inv.failedSections.value).toEqual(['eventDetails', 'ourStory'])
    expect(inv.eventDetails.items.value).toEqual([])
    expect(inv.ourStory.items.value).toEqual([])
    inv.onInfoChange({ brideName: 'Ема' })
    await inv.onGlobalSave()
    expect(updateFull).not.toHaveBeenCalled()
  })

  it('a save made while a section is still being read waits for it and never sends an unread list', async () => {
    const slow = deferred()
    agendaList.mockReturnValue(slow.promise)
    updateFull.mockResolvedValue(saved())
    const inv = await openEditor()
    expect(inv.sectionLoad.agenda).toBe('loading')

    inv.onInfoChange({ brideName: 'Ема' })
    const saving = inv.onGlobalSave()
    await flushPromises()
    expect(updateFull).not.toHaveBeenCalled()

    slow.resolve([{ id: 'a1', type: 'CEREMONY', time: '17:00' }])
    await saving
    expect(updateFull).toHaveBeenCalledTimes(1)
    // Built before the programme arrived: left out, so the server keeps it.
    // (undefined is not in the JSON sent)
    expect(updateFull.mock.calls[0][1].agendas).toBeUndefined()
    expect(updateFull.mock.calls[0][1].eventDetails).toHaveLength(1)
  })

  it('when everything was read, the save is the usual full one', async () => {
    updateFull.mockResolvedValue(saved())
    const inv = await openEditor()
    inv.onInfoChange({ brideName: 'Ема' })
    await inv.onGlobalSave()
    expect(updateFull).toHaveBeenCalledTimes(1)
    const payload = updateFull.mock.calls[0][1]
    expect(payload.agendas).toHaveLength(1)
    expect(payload.eventDetails).toHaveLength(1)
    expect(payload.ourStories).toHaveLength(1)
  })
})

describe('buildEventFullPayload', () => {
  it('leaves out a section given as null, and sends an empty list only when it is one', () => {
    const base = { config: { brideName: 'А', weddingDateTime: '2099-06-12T17:30:00' } }
    const omitted = JSON.parse(JSON.stringify(buildEventFullPayload({ ...base, eventDetailItems: null, agendaItems: null, ourStoryItems: null })))
    expect(omitted).not.toHaveProperty('agendas')
    expect(omitted).not.toHaveProperty('eventDetails')
    expect(omitted).not.toHaveProperty('ourStories')

    const empty = buildEventFullPayload({ ...base, eventDetailItems: [], agendaItems: [], ourStoryItems: [] })
    expect(empty.agendas).toEqual([])
    // Callers that pass nothing keep the old shape (a new event's create).
    expect(buildEventFullPayload(base).agendas).toEqual([])
  })
})

describe('the save status', () => {
  it('names the held-back save and offers to load again', () => {
    const w = mount(SaveStatus, { props: { status: 'error', detail: 'sectionsNotLoaded' }, global: { plugins: [i18n] } })
    expect(w.get('[role="status"]').text()).toBe(en.editSection.saveStatus.sectionsNotLoaded)
    expect(w.get('[data-testid="save-status-retry"]').text()).toBe('Load again')

    i18n.global.locale.value = 'mk'
    const m = mount(SaveStatus, { props: { status: 'error', detail: 'sectionsNotLoaded' }, global: { plugins: [i18n] } })
    expect(m.get('[data-testid="save-status-retry"]').text()).toBe('Вчитај повторно')
  })
})

/* ------------------------------------------------------------------ */
/*  Hiding keeps the content                                           */
/* ------------------------------------------------------------------ */

describe('hiding an optional section', () => {
  it('keeps its entries in the editor and in the save; showing it again brings them back', async () => {
    updateFull.mockResolvedValue(saved())
    const inv = await openEditor()

    inv.setSectionShown('agendaList', false)
    expect(inv.isSectionVisible('agendaList')).toBe(false)
    expect(inv.agenda.items.value).toEqual([expect.objectContaining({ id: 'a1' })])
    await inv.onGlobalSave()
    let payload = updateFull.mock.calls.at(-1)[1]
    expect(payload.sectionVisibility.agendaList).toBe(false)
    expect(payload.showAgenda).toBe(false)
    expect(payload.agendas).toEqual([expect.objectContaining({ id: 'a1', time: '17:00' })])

    inv.setSectionShown('agendaList', true)
    expect(inv.isSectionVisible('agendaList')).toBe(true)
    await inv.onGlobalSave()
    payload = updateFull.mock.calls.at(-1)[1]
    expect(payload.sectionVisibility.agendaList).toBe(true)
    expect(payload.agendas).toEqual([expect.objectContaining({ id: 'a1', time: '17:00' })])
    expect(inv.config.scheduleEvents).toHaveLength(1)
  })
})

/* ------------------------------------------------------------------ */
/*  The invitation guests open: no empty blocks                        */
/* ------------------------------------------------------------------ */

describe('the invitation guests open', () => {
  const openPublic = () => mountPage(`/en/invitations/coastal-breeze?eventId=${EVENT}&isPrivate=true`)

  it("has no programme or story block when the event has none — not the design's demo", async () => {
    pageData.mockResolvedValue(serverPage())
    const inv = await openPublic()
    expect(inv.config.scheduleEvents).toEqual([])
    expect(inv.config.stories).toEqual([])
    expect(inv.sectionHasContent.value).toEqual({ agendaList: false, ourStoryList: false })
  })

  it("shows the event's own programme and story", async () => {
    pageData.mockResolvedValue(serverPage({
      agenda: [{ id: 'a1', agendaType: 'CEREMONY', time: '17:00' }],
      ourStory: [{ id: 's1', storyType: 'HOW_WE_MET', description: 'Наше' }],
    }))
    const inv = await openPublic()
    expect(inv.config.scheduleEvents).toEqual([expect.objectContaining({ time: '17:00' })])
    expect(inv.config.stories).toEqual([expect.objectContaining({ description: 'Наше' })])
    expect(inv.sectionHasContent.value).toEqual({ agendaList: true, ourStoryList: true })
  })

  it('a story of photos only is not empty', async () => {
    pageData.mockResolvedValue(serverPage({ ourStoryImages: ['https://cdn/ev/1.jpg'] }))
    const inv = await openPublic()
    expect(inv.sectionHasContent.value.ourStoryList).toBe(true)
  })

  it('in the editor an emptied programme is empty in the preview too', async () => {
    updateFull.mockResolvedValue(saved())
    const inv = await openEditor()
    expect(inv.sectionHasContent.value.agendaList).toBe(true)
    inv.agenda.items.value = []
    await flushPromises()
    expect(inv.config.scheduleEvents).toEqual([])
    expect(inv.sectionHasContent.value.agendaList).toBe(false)
  })
})
