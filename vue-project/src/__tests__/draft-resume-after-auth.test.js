import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * INV-104 — a guest builds an invitation, presses Save, signs up or signs in,
 * and lands back on the same invitation:
 *  - a new account gets exactly one event, created from the draft with the
 *    draft's idempotency key, and the same design reopens on it;
 *  - an account that already has events gets nothing created or merged on its
 *    own — the editor reopens on the draft and asks;
 *  - a failed create keeps the draft and says so;
 *  - photos picked as a guest are counted, so they can be asked for again.
 */

const createFull = vi.fn()
const getAll = vi.fn()

vi.mock('@/services/eventFull.service', () => ({
  eventFullService: { createFull: (...a) => createFull(...a), updateFull: vi.fn() },
}))
vi.mock('@/services/events.service', () => ({
  eventsService: { getAll: (...a) => getAll(...a) },
}))
vi.mock('@/services/auth.service', () => ({ isAuthenticated: () => true, getUsername: () => null }))

const draft = await import('@/store/invitationDraft.store')
const { onboardingStore, setEventId } = await import('@/store/onboarding.store')
const { resumeDraftAfterAuth, hasPendingDraft, pendingDraftDesign } = await import('@/composables/useDraftSync')

const payload = {
  name: 'Ана & Марко', categoryType: 'WEDDING', date: '2027-06-12', time: '17:30',
  timezone: 'Europe/Skopje', invitationName: 'coastal-breeze',
}

function guestDraft(extra = {}) {
  const key = draft.getDraftClientRequestId()
  draft.setDraftFullPayload({ ...payload, ...extra, clientRequestId: key })
  return key
}

beforeEach(() => {
  localStorage.clear()
  draft.clearDraft()
  setEventId('')
  createFull.mockReset()
  getAll.mockReset()
})

describe('resuming a guest draft after sign-up / sign-in', () => {
  it('does nothing without a draft — the usual landing applies', async () => {
    expect(hasPendingDraft()).toBe(false)
    expect(await resumeDraftAfterAuth('mk')).toBeNull()
    expect(getAll).not.toHaveBeenCalled()
    expect(createFull).not.toHaveBeenCalled()
  })

  it('creates one event from the draft for a new account and reopens the same design on it', async () => {
    const key = guestDraft()
    getAll.mockResolvedValue({ data: [] })
    createFull.mockResolvedValue({ data: { data: { event: { id: 'ev-9' } } } })

    const target = await resumeDraftAfterAuth('mk')

    expect(createFull).toHaveBeenCalledTimes(1)
    expect(createFull.mock.calls[0][0]).toMatchObject({ ...payload, clientRequestId: key })
    expect(target).toEqual({ path: '/mk/invitations/coastal-breeze', query: { edit: 'true', eventId: 'ev-9' } })
    expect(onboardingStore.eventId).toBe('ev-9')
    // Cleared only after the server answered with the event.
    expect(hasPendingDraft()).toBe(false)
  })

  it('never creates or merges on its own when the account already has an event', async () => {
    guestDraft()
    getAll.mockResolvedValue({ data: [{ id: 'existing' }] })

    const target = await resumeDraftAfterAuth('en')

    expect(createFull).not.toHaveBeenCalled()
    expect(target).toEqual({
      path: '/en/invitations/coastal-breeze',
      query: { edit: 'true', new: '1', resume: 'choose', conflict: 'events' },
    })
    expect(hasPendingDraft()).toBe(true)
  })

  it('asks rather than guesses when the events cannot be listed', async () => {
    guestDraft()
    getAll.mockRejectedValue(new Error('Network Error'))

    const target = await resumeDraftAfterAuth('mk')

    expect(createFull).not.toHaveBeenCalled()
    expect(target.query.resume).toBe('choose')
    expect(target.query.conflict).toBe('unchecked')
  })

  it('keeps the draft and says so when the create fails; a retry sends the same key', async () => {
    const key = guestDraft()
    getAll.mockResolvedValue([])
    createFull.mockRejectedValueOnce(new Error('Network Error'))

    const first = await resumeDraftAfterAuth('mk')
    expect(first.query).toEqual({ edit: 'true', new: '1', resume: 'failed' })
    expect(hasPendingDraft()).toBe(true)

    createFull.mockResolvedValueOnce({ data: { data: { event: { id: 'ev-1' } } } })
    const second = await resumeDraftAfterAuth('mk')
    expect(second.query.eventId).toBe('ev-1')
    expect(createFull.mock.calls.map((c) => c[0].clientRequestId)).toEqual([key, key])
  })

  it('carries the count of photos that could not be kept', async () => {
    guestDraft()
    draft.setDraftPendingFiles({ hero: 1, story: 2, collage: 0 })
    getAll.mockResolvedValue({ data: [] })
    createFull.mockResolvedValue({ data: { data: { event: { id: 'ev-2' } } } })

    const target = await resumeDraftAfterAuth('mk')

    expect(target.query).toEqual({ edit: 'true', photos: '3', eventId: 'ev-2' })
  })

  it('reopens the builder for an unknown design name', () => {
    guestDraft({ invitationName: 'invitations/persian-wedding' })
    expect(pendingDraftDesign()).toBe('persian-wedding')
    guestDraft({ invitationName: '../evil' })
    expect(pendingDraftDesign()).toBe('my-wedding')
  })
})

describe('the basics seed the draft', () => {
  it('writes the info block without touching the saved design', () => {
    draft.setDraftTheme({ palette: { accent: '#123456' }, info: { brideName: 'Old' } })
    draft.seedDraftInfo({ brideName: 'Ана', groomName: 'Марко' })
    draft.loadDraft()
    expect(draft.getDraftTheme()).toEqual({
      palette: { accent: '#123456' },
      info: { brideName: 'Ана', groomName: 'Марко' },
    })
  })
})
