import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * IVY-INV-301 — a retried save must not make a second event or a second set
 * of sections.
 *
 * <p>An existing event is saved with PUT /events/full/{id}, a full replacement
 * the server applies the same way twice. A new one is created with POST, which
 * is only safe to repeat because it carries a key chosen once per draft: the
 * server answers a repeat with the event the first request made. These tests
 * pin the client half of that — the same key on every attempt, a fresh key
 * after the draft became an event, and section ids taken from the answer so
 * the next edit addresses rows that exist.
 */

const createFull = vi.fn()
const updateFull = vi.fn()

vi.mock('@/services/eventFull.service', () => ({
  eventFullService: {
    createFull: (...a) => createFull(...a),
    updateFull: (...a) => updateFull(...a),
  },
}))

const route = { query: { edit: 'true' }, params: { design: 'coastal-breeze' } }
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({}) }))

let authenticated = true
vi.mock('@/services/auth.service', () => ({
  isAuthenticated: () => authenticated,
  getUsername: () => null,
}))

const draft = await import('@/store/invitationDraft.store')
const { onboardingStore, setEventId } = await import('@/store/onboarding.store')
const { syncDraftToBackend } = await import('@/composables/useDraftSync')
const { useInvitationEditMode } = await import('@/composables/useInvitationEditMode')

function created(id = 'ev-1') {
  return { success: true, data: { event: { id }, eventDetails: [], agendas: [], ourStories: [] } }
}

beforeEach(() => {
  localStorage.clear()
  draft.clearDraft()
  createFull.mockReset()
  updateFull.mockReset()
  setEventId('')
  route.query = { edit: 'true' }
  authenticated = true
})

describe('the draft idempotency key', () => {
  it('is chosen once, survives a reload and is dropped with the draft', () => {
    const key = draft.getDraftClientRequestId()
    expect(key).toMatch(/^[0-9a-f-]{36}$/)
    expect(draft.getDraftClientRequestId()).toBe(key)

    draft.loadDraft()
    expect(draft.getDraftClientRequestId()).toBe(key)
    // A key alone is not a draft: nothing to sync after sign-in.
    expect(draft.hasDraft()).toBe(false)

    draft.clearDraft()
    expect(draft.getDraftClientRequestId()).not.toBe(key)
  })
})

describe('syncDraftToBackend (after sign-in)', () => {
  it('sends the same key when a failed sync is tried again', async () => {
    draft.setDraftFullPayload({ name: 'Ана & Марко', categoryType: 'WEDDING' })
    createFull.mockRejectedValueOnce(new Error('Network Error'))
    createFull.mockResolvedValueOnce(created('ev-9'))

    expect(await syncDraftToBackend()).toBeNull()
    // The draft is kept for the retry.
    expect(draft.hasDraft()).toBe(true)

    await syncDraftToBackend()
    expect(createFull).toHaveBeenCalledTimes(2)
    const [first, second] = createFull.mock.calls.map((c) => c[0].clientRequestId)
    expect(first).toBeTruthy()
    expect(second).toBe(first)
    expect(onboardingStore.eventId).toBe('ev-9')
    expect(draft.hasDraft()).toBe(false)
  })
})

describe('saveFullEvent', () => {
  it('creates with the key, and updates (never creates) once the event exists', async () => {
    createFull.mockResolvedValue(created('ev-2'))
    updateFull.mockResolvedValue(created('ev-2'))
    const edit = useInvitationEditMode()

    await edit.saveFullEvent({ name: 'x' }, {}, { clientRequestId: 'key-1' })
    expect(createFull.mock.calls[0][0]).toEqual({ name: 'x', clientRequestId: 'key-1' })
    expect(onboardingStore.eventId).toBe('ev-2')

    // A retry after the create landed goes to PUT for that event.
    await edit.saveFullEvent({ name: 'x' }, {}, { clientRequestId: 'key-1' })
    expect(createFull).toHaveBeenCalledTimes(1)
    expect(updateFull).toHaveBeenCalledWith('ev-2', { name: 'x' }, {})
  })

  it('does not clear "unsaved changes" itself — only a confirmed, current save may', async () => {
    setEventId('ev-3')
    updateFull.mockResolvedValue(created('ev-3'))
    const edit = useInvitationEditMode()
    edit.markDirty()
    await edit.saveFullEvent({ name: 'x' })
    expect(edit.dirty.value).toBe(true)
  })
})

describe('adoptSavedIds', () => {
  it('gives in-memory sections the ids the server answered with', () => {
    const edit = useInvitationEditMode()
    edit.eventDetails.items.value = [
      { id: '_local_a', _localId: '_local_a', type: 'CHURCH' },
      { id: '_local_b', _localId: '_local_b', type: 'RECEPTION' },
    ]
    // Own entry (16:30) — a design's untouched example (CEREMONY 16:00) is not
    // sent at all (INV-401).
    edit.agenda.items.value = [{ type: 'CEREMONY', time: '16:30' }]
    edit.ourStory.items.value = [{ type: 'HOW_WE_MET' }, { type: 'PROPOSAL' }]
    const sent = {
      eventDetails: [{ type: 'CHURCH' }, { type: 'RECEPTION' }],
      agendas: [{ type: 'CEREMONY' }],
      ourStories: [{ type: 'HOW_WE_MET', displayOrder: 1 }, { type: 'PROPOSAL', displayOrder: 2 }],
    }
    edit.adoptSavedIds({
      eventDetails: [{ id: 'd1', type: 'CHURCH' }, { id: 'd2', type: 'RECEPTION' }],
      agendas: [{ id: 'a1', type: 'CEREMONY' }],
      // upsert answers updated rows first — matched by displayOrder, not position
      ourStories: [{ id: 's2', type: 'PROPOSAL', displayOrder: 2 }, { id: 's1', type: 'HOW_WE_MET', displayOrder: 1 }],
    }, sent)

    expect(edit.eventDetails.items.value.map((x) => x.id)).toEqual(['d1', 'd2'])
    expect(edit.eventDetails.items.value[0]._localId).toBeUndefined()
    expect(edit.agenda.items.value[0].id).toBe('a1')
    expect(edit.ourStory.items.value.map((x) => x.id)).toEqual(['s1', 's2'])
  })

  it('leaves the lists alone when they changed after the save was sent', () => {
    const edit = useInvitationEditMode()
    edit.eventDetails.items.value = [{ id: '_local_a', type: 'CHURCH' }, { id: '_local_c', type: 'RECEPTION' }]
    edit.adoptSavedIds(
      { eventDetails: [{ id: 'd1', type: 'CHURCH' }] },
      { eventDetails: [{ type: 'CHURCH' }] },
    )
    expect(edit.eventDetails.items.value.map((x) => x.id)).toEqual(['_local_a', '_local_c'])
  })
})

describe('unsynced copy of an existing event', () => {
  it('is kept per event until cleared', () => {
    draft.saveUnsyncedSnapshot('ev-5', { name: 'x' })
    expect(draft.getUnsyncedSnapshot('ev-5').payload).toEqual({ name: 'x' })
    expect(draft.getUnsyncedSnapshot('ev-6')).toBeNull()
    draft.clearUnsyncedSnapshot('ev-5')
    expect(draft.getUnsyncedSnapshot('ev-5')).toBeNull()
  })
})
