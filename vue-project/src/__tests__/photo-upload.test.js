import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent, h } from 'vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-403 — photo upload with preview, progress and retry.
 *
 * Photos picked in the editor are uploaded with the invitation's save
 * (PUT/POST /events/full). Each slot says what its photo is in; a failed
 * upload is never shown as saved and "Try again" resends it without losing
 * other changes. Two bugs carried over:
 *  - INV-203: story and collage slot photos did not count as a change to
 *    save, so an existing event's autosave left them out unless the hero
 *    photo changed too.
 *  - INV-402 (data loss): when the event itself (/public/invitation-page)
 *    could not be read, the design's demo names/date/place were on screen
 *    and the next autosave PUT wrote them over the event.
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
let signedIn = true
vi.mock('@/services/auth.service', () => ({
  isAuthenticated: () => signedIn,
  getUsername: () => 'ana',
  getEventId: () => null,
  hasRole: () => false,
}))

const { useWeddingInvitation } = await import('@/composables/useWeddingInvitation')
const { getUnsyncedSnapshot } = await import('@/store/invitationDraft.store')
const { setEventId } = await import('@/store/onboarding.store')
const { DESIGN_PRESETS } = await import('@/config/designPresets/index.js')
const { photoProblem, uploadFailureReason, PHOTO_MAX_FILE_BYTES } = await import('@/composables/useInvitationPhotos')
const PhotoSlot = (await import('@/components/invitations/shared/PhotoSlot.vue')).default
const SectionStateNotice = (await import('@/components/invitations/shared/SectionStateNotice.vue')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })
const EVENT = 'ev-403'
const S = (n) => `https://cdn.test/ev-403/story-${n}.jpg?sig=1`
const C = (n) => `https://cdn.test/ev-403/collage-${n}.jpg?sig=1`

const serverPage = (over = {}) => ({
  event: {
    coupleNames: { bride: 'Ана', groom: 'Марко' }, eventCategory: 'WEDDING', timezone: 'Europe/Skopje',
    date: '2099-06-12T17:30:00', heroImageUrl: 'https://cdn.test/ev-403/hero.jpg',
  },
  location: { venueName: 'Охрид' },
  agenda: [], ourStory: [], weddingDetails: [],
  ourStoryImages: [S(1), S(2), S(3), S(4)],
  collageImages: [C(1), C(2)],
  ...over,
})

const saved = (data = {}) => ({ data: { success: true, data: { event: { id: EVENT }, eventDetails: [], agendas: [], ourStories: [], ...data } } })

function failure(status = 500) {
  return Object.assign(new Error(`Request failed with status code ${status}`), { status, name: 'ApiError' })
}

const jpeg = (name = 'new.jpg') => new File(['img'], name, { type: 'image/jpeg' })

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
      inv = useWeddingInvitation(DESIGN_PRESETS['persian-wedding'])
      return () => h('div')
    },
  })
  mount(Harness, { global: { plugins: [i18n, router] } })
  await flushPromises()
  return inv
}

const openEditor = () => mountPage(`/en/invitations/persian-wedding?edit=true&eventId=${EVENT}`)

/** Sends what autosave has waiting (the same path as the debounced save). */
async function save(inv) {
  await inv.retrySave()
  await flushPromises()
}

beforeEach(() => {
  localStorage.clear()
  setEventId('')
  signedIn = true
  i18n.global.locale.value = 'en'
  for (const fn of [updateFull, createFull, agendaList, detailsList, storyList, pageData]) fn.mockReset()
  pageData.mockResolvedValue(serverPage())
  detailsList.mockResolvedValue([])
  agendaList.mockResolvedValue([])
  storyList.mockResolvedValue({ stories: [], images: [S(1), S(2), S(3), S(4)] })
  updateFull.mockResolvedValue(saved())
})

/* ------------------------------------------------------------------ */
/*  INV-203 bug: story / collage slot photos are a change to save      */
/* ------------------------------------------------------------------ */

describe('an existing event: slot photos are saved', () => {
  it('a story slot photo alone is sent — without a hero change — and only that slot is replaced', async () => {
    const inv = await openEditor()
    expect(inv.photos.slot('story', 1).status).toBe('saved')

    const file = jpeg('second.jpg')
    expect(inv.pickPhoto('story', 1, file)).toBeNull()
    expect(inv.dirty.value).toBe(true)
    expect(inv.photos.slot('story', 1).status).toBe('pending')

    await save(inv)

    // Without the fix nothing marked the files changed: no file part was sent.
    expect(updateFull).toHaveBeenCalledTimes(1)
    const [, payload, files] = updateFull.mock.calls[0]
    expect(files.ourStoryImages).toEqual([file])
    expect(files.heroImage).toBeUndefined()
    // The other three photos stay where they are.
    expect(payload.ourStoryImageSlots).toEqual([S(1), null, S(3), S(4)])
    expect(payload).not.toHaveProperty('collageImageSlots')
  })

  it('a collage slot photo alone is sent too', async () => {
    const inv = await openEditor()
    const file = jpeg('c3.jpg')
    inv.pickPhoto('collage', 2, file)
    await save(inv)
    const [, payload, files] = updateFull.mock.calls[0]
    expect(files.collageImages).toEqual([file])
    expect(payload.collageImageSlots).toEqual([C(1), C(2), null])
  })

  it('photos already saved are not sent again with the next change', async () => {
    const inv = await openEditor()
    inv.pickPhoto('story', 0, jpeg())
    updateFull.mockResolvedValueOnce(saved({ ourStoryImages: [S(9), S(2), S(3), S(4)].map((url) => ({ url })) }))
    await save(inv)
    expect(inv.photos.slot('story', 0)).toMatchObject({ status: 'saved', url: S(9) })

    inv.onInfoChange({ brideName: 'Ема' })
    await save(inv)
    const [, payload, files] = updateFull.mock.calls[1]
    expect(files).toEqual({})
    expect(payload).not.toHaveProperty('ourStoryImageSlots')
  })

  it('removing a saved photo is saved as a layout without it; undo brings it back', async () => {
    const inv = await openEditor()
    inv.removePhoto('collage', 0)
    expect(inv.photos.slot('collage', 0).status).toBe('removed')
    inv.restorePhoto('collage', 0)
    expect(inv.photos.slot('collage', 0).status).toBe('saved')
    inv.removePhoto('collage', 0)

    updateFull.mockResolvedValueOnce(saved({ collageImages: [{ url: C(2) }] }))
    await save(inv)
    const [, payload, files] = updateFull.mock.calls[0]
    expect(payload.collageImageSlots).toEqual([C(2)])
    expect(files.collageImages).toBeUndefined()
    expect(inv.photos.slot('collage', 0)).toMatchObject({ status: 'saved', url: C(2) })
    expect(inv.photos.slot('collage', 1).status).toBe('empty')
  })

  it('removing a photo picked but not saved drops it and shows the saved one again', async () => {
    const inv = await openEditor()
    inv.pickPhoto('story', 2, jpeg())
    inv.removePhoto('story', 2)
    expect(inv.photos.slot('story', 2)).toMatchObject({ status: 'saved', url: S(3) })
  })
})

/* ------------------------------------------------------------------ */
/*  Progress, failure, retry                                          */
/* ------------------------------------------------------------------ */

describe('upload progress, failure and retry', () => {
  it('shows how far the upload is while the save runs', async () => {
    const inv = await openEditor()
    let seen
    updateFull.mockImplementationOnce(async (id, payload, files, opts) => {
      opts.onUploadProgress({ loaded: 30, total: 60 })
      seen = { ...inv.photos.slot('story', 0) }
      return saved()
    })
    inv.pickPhoto('story', 0, jpeg())
    await save(inv)
    expect(seen).toMatchObject({ status: 'uploading', progress: 50 })
    expect(inv.photos.slot('story', 0).status).toBe('saved')
  })

  it('a failed upload is marked not saved (never as saved), keeps the text changes, and "Try again" resends it', async () => {
    const inv = await openEditor()
    const file = jpeg()
    inv.onInfoChange({ brideName: 'Ема' })
    inv.pickPhoto('story', 0, file)
    updateFull.mockRejectedValueOnce(failure(500))
    await save(inv)

    const slot = inv.photos.slot('story', 0)
    expect(slot.status).toBe('failed')
    expect(slot.error).toBe('failed')
    // The picked photo stays here for the retry; the saved one is not claimed.
    expect(slot.url).not.toBe(S(1))
    expect(inv.saveStatus.value).toBe('error')
    expect(inv.config.brideName).toBe('Ема')
    expect(inv.dirty.value).toBe(true)

    updateFull.mockResolvedValueOnce(saved({ ourStoryImages: [S(7), S(2), S(3), S(4)].map((url) => ({ url })) }))
    await save(inv)
    expect(updateFull).toHaveBeenCalledTimes(2)
    const [, payload, files] = updateFull.mock.calls[1]
    expect(files.ourStoryImages).toEqual([file])
    expect(payload.brideName).toBe('Ема')
    expect(inv.photos.slot('story', 0)).toMatchObject({ status: 'saved', url: S(7) })
    expect(inv.saveStatus.value).toBe('synced')
  })

  it('a too-large request (413) and no connection are explained', () => {
    expect(uploadFailureReason(failure(413))).toBe('uploadTooLarge')
    expect(uploadFailureReason(Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }))).toBe('offline')
    expect(uploadFailureReason(failure(500))).toBe('failed')
  })

  it('a hero photo that failed is not drawn as the saved hero once removed', async () => {
    const inv = await openEditor()
    inv.pickPhoto('hero', 0, jpeg('hero.jpg'))
    updateFull.mockRejectedValueOnce(failure(413))
    await save(inv)
    expect(inv.photos.slot('hero', 0)).toMatchObject({ status: 'failed', error: 'uploadTooLarge' })
    inv.removePhoto('hero', 0)
    expect(inv.photos.slot('hero', 0)).toMatchObject({ status: 'saved', url: 'https://cdn.test/ev-403/hero.jpg' })
    expect(inv.config.heroPhotoUrl).toBe('https://cdn.test/ev-403/hero.jpg')
  })
})

/* ------------------------------------------------------------------ */
/*  Files refused before sending                                      */
/* ------------------------------------------------------------------ */

describe('files refused before sending', () => {
  it('uses the server limits: an image up to 50 MB', () => {
    expect(photoProblem(jpeg())).toBeNull()
    expect(photoProblem(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toBe('type')
    const big = jpeg('big.jpg')
    Object.defineProperty(big, 'size', { value: PHOTO_MAX_FILE_BYTES + 1 })
    expect(photoProblem(big)).toBe('tooLarge')
  })

  it('a refused or unreadable file is never drawn nor sent', async () => {
    const inv = await openEditor()
    expect(inv.pickPhoto('collage', 3, new File(['x'], 'a.txt', { type: 'text/plain' }))).toBe('type')
    expect(inv.photos.slot('collage', 3)).toMatchObject({ status: 'invalid', url: '', error: 'type' })

    inv.pickPhoto('story', 0, jpeg('heic-like.jpg'))
    inv.brokenPhoto('story', 0)
    expect(inv.photos.slot('story', 0)).toMatchObject({ status: 'invalid', url: '', error: 'unreadable' })

    inv.onInfoChange({ brideName: 'Ема' })
    await save(inv)
    const [, , files] = updateFull.mock.calls[0]
    expect(files.ourStoryImages).toBeUndefined()
    expect(files.collageImages).toBeUndefined()
  })
})

describe('a draft not in an account yet', () => {
  it('a picked photo is "only on this device" until the event is created', async () => {
    signedIn = false
    const inv = await mountPage('/en/invitations/persian-wedding?new=1&edit=true')
    inv.pickPhoto('story', 0, jpeg())
    expect(inv.photos.slot('story', 0).status).toBe('local')
    expect(inv.unsavedPhotoCount.value).toBe(1)
  })
})

/* ------------------------------------------------------------------ */
/*  INV-402 risk: the event itself could not be read                   */
/* ------------------------------------------------------------------ */

describe('an existing event that could not be read', () => {
  it('never saves the design\'s demo names, date and place over it — saving waits for "Load again"', async () => {
    pageData.mockRejectedValue(failure(500))
    const inv = await openEditor()
    expect(inv.eventLoad.value).toBe('failed')
    // On screen: the design's demo couple, not the event's.
    expect(inv.config.brideName).not.toBe('Ана')

    inv.onRsvpChange({ maxGuests: 4 })
    await inv.onGlobalSave()
    await flushPromises()

    // Without the fix this PUT carried the demo names, date and place.
    expect(updateFull).not.toHaveBeenCalled()
    expect(inv.saveStatus.value).toBe('error')
    expect(inv.saveStatusDetail.value).toBe('sectionsNotLoaded')

    // Not even the copy kept on this device for "Sync now" carries them.
    const local = getUnsyncedSnapshot(EVENT)
    for (const key of ['name', 'brideName', 'groomName', 'date', 'time', 'timezone', 'location', 'message', 'rsvpConfig', 'theme']) {
      expect(local.payload).not.toHaveProperty(key)
    }
  })

  it('"Load again" reads the event, then saves with its own names', async () => {
    pageData.mockRejectedValueOnce(failure(500))
    const inv = await openEditor()
    inv.onRsvpChange({ maxGuests: 4 })
    await inv.onGlobalSave()
    expect(updateFull).not.toHaveBeenCalled()

    pageData.mockResolvedValue(serverPage())
    await save(inv)
    expect(inv.eventLoad.value).toBe('loaded')
    expect(updateFull).toHaveBeenCalledTimes(1)
    const [, payload] = updateFull.mock.calls[0]
    expect(payload.brideName).toBe('Ана')
    expect(payload.groomName).toBe('Марко')
    expect(payload.date).toBe('2099-06-12')
    expect(inv.saveStatus.value).toBe('synced')
  })

  it('a failed "Load again" keeps holding the save back', async () => {
    pageData.mockRejectedValue(failure(500))
    const inv = await openEditor()
    inv.onRsvpChange({ maxGuests: 4 })
    await save(inv)
    expect(pageData).toHaveBeenCalledTimes(2)
    expect(updateFull).not.toHaveBeenCalled()
    expect(inv.saveStatusDetail.value).toBe('sectionsNotLoaded')
  })

  it('a photo picked meanwhile waits (not marked failed) and is sent once the event is read', async () => {
    pageData.mockRejectedValueOnce(failure(500))
    const inv = await openEditor()
    const file = jpeg()
    inv.pickPhoto('story', 0, file)
    await inv.onGlobalSave()
    expect(inv.photos.slot('story', 0).status).toBe('pending')
    pageData.mockResolvedValue(serverPage())
    await save(inv)
    expect(updateFull.mock.calls[0][2].ourStoryImages).toEqual([file])
  })

  it('a re-read that fails after a good read does not block saving', async () => {
    const inv = await openEditor()
    pageData.mockRejectedValue(failure(500))
    await inv.refreshAllData()
    expect(inv.eventLoad.value).toBe('loaded')
    inv.onInfoChange({ brideName: 'Ема' })
    await save(inv)
    expect(updateFull).toHaveBeenCalledTimes(1)
  })
})

/* ------------------------------------------------------------------ */
/*  The slot component: names, keyboard, states                       */
/* ------------------------------------------------------------------ */

const mountSlot = (photo, props = {}) =>
  mount(PhotoSlot, { props: { photo, label: 'Story photo 2', ...props }, global: { plugins: [i18n] }, attachTo: document.body })

describe('PhotoSlot', () => {
  it('has an accessible name and a keyboard-operable button that opens the file picker', async () => {
    const w = mountSlot({ status: 'example', url: 'https://x/demo.jpg', own: false })
    const group = w.get('[data-testid="photo-slot"]')
    expect(group.attributes('role')).toBe('group')
    expect(document.getElementById(group.attributes('aria-labelledby')).textContent).toBe('Story photo 2')
    const pick = w.get('[data-testid="photo-slot-pick"]')
    expect(pick.element.tagName).toBe('BUTTON')
    expect(pick.attributes('aria-label')).toBe('Story photo 2: choose a photo')
    expect(document.getElementById(pick.attributes('aria-describedby')).textContent)
      .toBe('Example photo of the design — choose your own.')
    const click = vi.spyOn(w.get('[data-testid="photo-slot-input"]').element, 'click')
    await pick.trigger('click')
    expect(click).toHaveBeenCalled()
    w.unmount()
  })

  it('emits the chosen file', async () => {
    const w = mountSlot({ status: 'empty', url: '', own: false })
    const input = w.get('[data-testid="photo-slot-input"]')
    const file = jpeg()
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    expect(w.emitted('pick')[0]).toEqual([file])
    w.unmount()
  })

  it('a failed upload: says so and why, offers "Try again" and "Remove", no saved badge', async () => {
    const w = mountSlot({ status: 'failed', url: 'blob:x', error: 'failed', own: true })
    expect(w.get('[data-testid="photo-slot-status"]').text())
      .toBe('Not saved. The upload failed. Your other changes are kept — try again.')
    const retry = w.get('[data-testid="photo-slot-retry"]')
    expect(retry.attributes('aria-label')).toBe('Try again — Story photo 2')
    await retry.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
    await w.get('[data-testid="photo-slot-remove"]').trigger('click')
    expect(w.emitted('remove')).toHaveLength(1)
    expect(w.find('.story-img-badge--saved').exists()).toBe(false)
    expect(w.get('[data-testid="photo-slot-pick"]').attributes('aria-label')).toBe('Story photo 2: replace the photo')
    w.unmount()
  })

  it('a refused file draws no image; uploading shows the progress and cannot be replaced meanwhile', async () => {
    const bad = mountSlot({ status: 'invalid', url: '', error: 'tooLarge', own: false })
    expect(bad.find('img').exists()).toBe(false)
    expect(bad.get('[data-testid="photo-slot-status"]').text()).toBe('This photo is larger than 50 MB. Choose a smaller one.')
    bad.unmount()

    const up = mountSlot({ status: 'uploading', url: 'blob:x', progress: 40, own: true })
    expect(up.get('progress').attributes('value')).toBe('40')
    expect(up.get('[data-testid="photo-slot-status"]').text()).toBe('Uploading… 40%')
    expect(up.get('[data-testid="photo-slot-pick"]').attributes('disabled')).toBeDefined()
    expect(up.find('[data-testid="photo-slot-remove"]').exists()).toBe(false)
    up.unmount()
  })

  it('a picked photo that cannot be drawn is reported; a saved one only says it cannot be shown', async () => {
    const picked = mountSlot({ status: 'pending', url: 'blob:x', own: true })
    await picked.get('img').trigger('error')
    expect(picked.emitted('broken')).toHaveLength(1)
    picked.unmount()

    const savedSlot = mountSlot({ status: 'saved', url: 'https://x/a.jpg', own: true })
    await savedSlot.get('img').trigger('error')
    expect(savedSlot.emitted('broken')).toBeUndefined()
    expect(savedSlot.find('img').exists()).toBe(false)
    expect(savedSlot.get('[data-testid="photo-slot-status"]').text()).toBe('Saved, but this photo can’t be shown right now.')
    savedSlot.unmount()
  })

  it('the hero: a saved photo is replaced, not removed', () => {
    const w = mountSlot({ status: 'saved', url: 'https://x/h.jpg', own: true }, { removableSaved: false })
    expect(w.find('[data-testid="photo-slot-remove"]').exists()).toBe(false)
    w.unmount()
  })

  it('speaks Macedonian', () => {
    i18n.global.locale.value = 'mk'
    const w = mountSlot({ status: 'local', url: 'blob:x', own: true }, { label: 'Фотографија 1 за приказната' })
    expect(w.get('[data-testid="photo-slot-status"]').text()).toContain('само на овој уред')
    expect(w.get('[data-testid="photo-slot-pick"]').attributes('aria-label')).toBe('Фотографија 1 за приказната: заменете ја фотографијата')
    w.unmount()
  })

  it('the notice for an event that could not be read names it', () => {
    const w = mount(SectionStateNotice, { props: { kind: 'event', state: 'failed' }, global: { plugins: [i18n] } })
    expect(w.text()).toContain("We couldn't load: Event information")
    expect(w.get('[role="alert"]').exists()).toBe(true)
  })
})

describe('i18n', () => {
  const keys = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`])

  it('every photo string is in mk, en and sq', () => {
    const enKeys = keys(en.editSection.photos).sort()
    expect(enKeys.length).toBeGreaterThan(20)
    expect(keys(mk.editSection.photos).sort()).toEqual(enKeys)
    expect(keys(sq.editSection.photos).sort()).toEqual(enKeys)
    for (const l of [en, mk, sq]) expect(l.editSection.sectionStates.names.event).toBeTruthy()
  })
})
