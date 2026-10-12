import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-303 — the draft a guest made is joined to their account after sign-up /
 * verification, and every acceptance criterion is pinned here:
 *
 *  - idempotent: one key per draft; a create whose answer was lost is resent
 *    with that key (the server replays the first event), also on a later
 *    sign-in of the same account, which then is not mistaken for a conflict;
 *  - the local copy stays until the server confirmed the event;
 *  - retry after a partial failure sends only what is still missing;
 *  - an account that already has an event or a draft gets a safe choice that
 *    names what is there (name, type, last change) — nothing is merged or
 *    overwritten; a key that another account on this device already used is
 *    not retried forever, it is replaced and the person is asked;
 *  - the verify-email page (code and Google) leads into all of the above.
 */

const createFull = vi.fn()
const getAll = vi.fn()
const workspace = vi.fn()
const createDetail = vi.fn()
const createAgenda = vi.fn()
const createStory = vi.fn()

vi.mock('@/services/eventFull.service', () => ({
  eventFullService: { createFull: (...a) => createFull(...a), updateFull: vi.fn() },
}))
vi.mock('@/services/events.service', () => ({
  eventsService: { getAll: (...a) => getAll(...a), workspace: (...a) => workspace(...a) },
}))
vi.mock('@/services/eventDetails.service', () => ({ eventDetailsService: { create: (...a) => createDetail(...a) } }))
vi.mock('@/services/agenda.service', () => ({ agendaApi: { createItem: (...a) => createAgenda(...a) } }))
vi.mock('@/services/ourStory.service', () => ({ ourStoryApi: { create: (...a) => createStory(...a) } }))

const auth = vi.hoisted(() => ({
  verifyEmail: vi.fn(),
  loginWithCredentials: vi.fn(),
  assignRole: vi.fn(),
  refreshAccessToken: vi.fn(),
  exchangeOAuthCode: vi.fn(),
  isAuthenticated: vi.fn(() => true),
  getUsername: () => null,
}))
vi.mock('@/services/auth.service', () => auth)

// The signed-in account is the token's subject.
const session = vi.hoisted(() => ({ sub: 'user-a' }))
vi.mock('@/services/jwt', () => ({
  decodeJwtPayload: (token) => (token ? { sub: session.sub, email: `${session.sub}@example.com`, realm_access: { roles: ['USER'] } } : null),
}))

const route = vi.hoisted(() => ({ params: { lang: 'en' }, query: {} }))
const push = vi.hoisted(() => vi.fn())
const replace = vi.hoisted(() => vi.fn())
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => route,
  useRouter: () => ({ push, replace }),
}))
vi.mock('@/router/landing', () => ({ landingAfterAuth: vi.fn(async () => ({ name: 'dashboard.overview' })) }))

const draft = await import('@/store/invitationDraft.store')
const { onboardingStore, setEventId, setEmail, setTempPassword } = await import('@/store/onboarding.store')
const { resumeDraftAfterAuth, syncDraftToBackend, RESUME_CONFLICT } = await import('@/composables/useDraftSync')
const AuthVerifyEmailPage = (await import('@/pages/auth/AuthVerifyEmailPage.vue')).default
const InvitationAuthDialog = (await import('@/components/invitations/shared/InvitationAuthDialog.vue')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })

const payload = {
  name: 'Ана & Марко', categoryType: 'WEDDING', date: '2099-06-12', time: '17:30',
  timezone: 'Europe/Skopje', invitationName: 'coastal-breeze',
}
const answer = (id) => ({ data: { data: { event: { id }, eventDetails: [], agendas: [], ourStories: [] } } })
const networkError = () => Object.assign(new Error('Network Error'), {})
const claimedError = () => Object.assign(new Error('clientRequestId already used'), { status: 409, errorCode: 'CONFLICT_OBJECT_ALREADY_EXISTS' })

function guestDraft() {
  const key = draft.getDraftClientRequestId()
  draft.setDraftFullPayload({ ...payload, clientRequestId: key })
  return key
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  draft.clearDraft()
  setEventId('')
  session.sub = 'user-a'
  localStorage.setItem('access_token', 'token-user-a')
  for (const fn of [createFull, getAll, workspace, createDetail, createAgenda, createStory, push, replace]) fn.mockReset()
  for (const fn of Object.values(auth)) if (typeof fn?.mockReset === 'function') fn.mockReset()
  auth.isAuthenticated.mockReturnValue(true)
  route.query = {}
})

describe('idempotent sync after registration', () => {
  it('resends a create whose answer was lost with the same key, without asking — on a later sign-in too', async () => {
    const key = guestDraft()
    getAll.mockResolvedValue([])
    // The server made the event, the browser never saw the answer.
    createFull.mockRejectedValueOnce(networkError())

    const first = await resumeDraftAfterAuth('en')
    expect(first.query).toMatchObject({ resume: 'failed', new: '1' })
    // Kept on this device, with the trace that the create went out for this account.
    const stored = JSON.parse(localStorage.getItem('invitation_draft_v1'))
    expect(stored.fullPayload).toMatchObject(payload)
    expect(stored.createSent).toMatchObject({ account: 'user-a' })

    // A reload, then the same account signs in again: it now has one event —
    // the one made from this very draft. Not a conflict: the same create is
    // resent and the server replays the first event.
    draft.loadDraft()
    getAll.mockResolvedValue([{ id: 'ev-1' }])
    createFull.mockResolvedValueOnce(answer('ev-1'))

    const second = await resumeDraftAfterAuth('en')

    expect(getAll).toHaveBeenCalledTimes(1)
    expect(second).toEqual({ path: '/en/invitations/coastal-breeze', query: { edit: 'true', eventId: 'ev-1' } })
    expect(createFull.mock.calls.map((c) => c[0].clientRequestId)).toEqual([key, key])
    expect(onboardingStore.eventId).toBe('ev-1')
    // Confirmed: only now the local copy goes.
    expect(localStorage.getItem('invitation_draft_v1')).toBeNull()
  })

  it('does not treat another account\'s pending create as its own: that account is checked and asked', async () => {
    guestDraft()
    getAll.mockResolvedValue([])
    createFull.mockRejectedValueOnce(networkError())
    await resumeDraftAfterAuth('en')

    session.sub = 'user-b'
    getAll.mockResolvedValue([{ id: 'b-event' }])

    const target = await resumeDraftAfterAuth('en')

    expect(target.query).toMatchObject({ resume: 'choose', conflict: RESUME_CONFLICT.EVENTS })
    expect(createFull).toHaveBeenCalledTimes(1)
  })

  it('keeps the local copy when the server answers without the event', async () => {
    guestDraft()
    getAll.mockResolvedValue([])
    createFull.mockResolvedValueOnce({ data: { data: null } })

    const target = await resumeDraftAfterAuth('en')

    expect(target.query.resume).toBe('failed')
    expect(draft.getDraftFullPayload()).toMatchObject(payload)
    expect(onboardingStore.eventId).toBe('')
  })

  it('asks — and replaces the key — when the key belongs to another account\'s event', async () => {
    const key = guestDraft()
    getAll.mockResolvedValue([])
    createFull.mockRejectedValueOnce(claimedError())

    const target = await resumeDraftAfterAuth('en')

    expect(target.query).toMatchObject({ resume: 'choose', conflict: RESUME_CONFLICT.CLAIMED, new: '1' })
    // The draft is still here, with a new key in both places.
    const newKey = draft.getDraftClientRequestId()
    expect(newKey).not.toBe(key)
    expect(draft.getDraftFullPayload()).toMatchObject({ ...payload, clientRequestId: newKey })
    expect(draft.getDraftCreateSent()).toBeNull()

    // "Save as a new event" then: one create, with the new key.
    getAll.mockResolvedValue([])
    createFull.mockResolvedValueOnce(answer('ev-b'))
    const again = await resumeDraftAfterAuth('en')
    expect(again.query.eventId).toBe('ev-b')
    expect(createFull.mock.calls[1][0].clientRequestId).toBe(newKey)
  })

  it('says why it asks: an account with events, or one that could not be checked', async () => {
    guestDraft()
    getAll.mockResolvedValueOnce({ data: [{ id: 'x' }] })
    expect((await resumeDraftAfterAuth('en')).query.conflict).toBe('events')
    getAll.mockRejectedValueOnce(new Error('offline'))
    expect((await resumeDraftAfterAuth('en')).query.conflict).toBe('unchecked')
    expect(createFull).not.toHaveBeenCalled()
  })

  it('reads a damaged create trace as none, without breaking the draft', () => {
    localStorage.setItem('invitation_draft_v1', JSON.stringify({
      fullPayload: payload, clientRequestId: 'k', createSent: 'yes', updatedAt: new Date().toISOString(),
    }))
    draft.loadDraft()
    expect(draft.getDraftCreateSent()).toBeNull()
    expect(draft.getDraftFullPayload()).toMatchObject(payload)
    draft.clearDraftNotice()
  })
})

describe('retry after a partial failure (item by item, legacy sync)', () => {
  it('sends only what did not arrive, and clears the draft only at the end', async () => {
    setEventId('ev-7')
    draft.addDraftItem('eventDetails', { title: 'Church' })
    draft.addDraftItem('agenda', { title: 'Dinner' })
    draft.addDraftItem('ourStory', { title: 'We met' })
    createDetail.mockResolvedValue({})
    createAgenda.mockRejectedValueOnce(new Error('500'))

    expect(await syncDraftToBackend()).toBeNull()
    // The detail is on the server and left the draft; the rest is kept.
    expect(draft.getDraftItems('eventDetails')).toHaveLength(0)
    expect(draft.getDraftItems('agenda')).toHaveLength(1)
    expect(draft.getDraftItems('ourStory')).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem('invitation_draft_v1')).agenda).toHaveLength(1)

    createAgenda.mockResolvedValue({})
    createStory.mockResolvedValue({})
    await syncDraftToBackend()

    expect(createDetail).toHaveBeenCalledTimes(1)
    expect(createAgenda).toHaveBeenCalledTimes(2)
    expect(createStory).toHaveBeenCalledTimes(1)
    expect(draft.hasDraft()).toBe(false)
  })
})

describe('the verify-email page', () => {
  function render(query = {}) {
    route.query = query
    return mount(AuthVerifyEmailPage, {
      global: { plugins: [i18n], stubs: { AuthShell: { template: '<div><slot /></div>' } } },
    })
  }

  async function verifyWithCode(wrapper) {
    await wrapper.find('input').setValue('123456')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
  }

  beforeEach(() => {
    setEmail('ana@example.com')
    setTempPassword('Secret#123')
    auth.verifyEmail.mockResolvedValue({})
    auth.loginWithCredentials.mockResolvedValue({})
  })

  it('creates exactly one event from the draft for a new account and reopens it', async () => {
    const key = guestDraft()
    getAll.mockResolvedValue([])
    createFull.mockResolvedValue(answer('ev-new'))

    await verifyWithCode(render())

    expect(createFull).toHaveBeenCalledTimes(1)
    expect(createFull.mock.calls[0][0].clientRequestId).toBe(key)
    expect(push).toHaveBeenCalledWith({ path: '/en/invitations/coastal-breeze', query: { edit: 'true', eventId: 'ev-new' } })
    expect(draft.hasDraft()).toBe(false)
  })

  it('asks instead of merging when the verified account already has an event', async () => {
    guestDraft()
    getAll.mockResolvedValue([{ id: 'old' }])

    await verifyWithCode(render())

    expect(createFull).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith(expect.objectContaining({ query: expect.objectContaining({ resume: 'choose', conflict: 'events' }) }))
    expect(draft.getDraftFullPayload()).toMatchObject(payload)
  })

  it('keeps the draft and opens the retry banner when the create fails', async () => {
    guestDraft()
    getAll.mockResolvedValue([])
    createFull.mockRejectedValue(networkError())

    await verifyWithCode(render())

    expect(push).toHaveBeenCalledWith(expect.objectContaining({ query: expect.objectContaining({ resume: 'failed' }) }))
    expect(draft.getDraftFullPayload()).toMatchObject(payload)
  })

  it('sends to sign-in with the draft untouched when the automatic sign-in fails', async () => {
    guestDraft()
    auth.loginWithCredentials.mockRejectedValue(new Error('401'))
    auth.isAuthenticated.mockReturnValue(false)

    await verifyWithCode(render())

    expect(getAll).not.toHaveBeenCalled()
    expect(createFull).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith({ name: 'login', params: { lang: 'en' }, query: { email: 'ana@example.com' } })
    expect(draft.getDraftFullPayload()).toMatchObject(payload)
  })

  it('does the same after a Google sign-up', async () => {
    guestDraft()
    getAll.mockResolvedValue([])
    createFull.mockResolvedValue(answer('ev-g'))
    auth.exchangeOAuthCode.mockResolvedValue({})

    render({ code: 'abc' })
    await flushPromises()

    expect(createFull).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith({ path: '/en/invitations/coastal-breeze', query: { edit: 'true', eventId: 'ev-g' } })
  })
})

describe('the choice when the account already has something', () => {
  function open(props) {
    return mount(InvitationAuthDialog, {
      props: { open: true, mode: 'choose', ...props },
      global: { plugins: [i18n] },
      attachTo: document.body,
    })
  }
  const q = (id) => document.querySelector(`[data-testid="${id}"]`)

  it('names the drafts already in the account, with their last change, and changes none of them', async () => {
    workspace.mockResolvedValue({ data: [
      { id: 's1', name: 'Our first event', categoryType: 'WEDDING', status: 'DRAFT', updatedAt: '2026-09-30T10:00:00' },
      { id: 's2', name: 'New Event', categoryType: 'BIRTHDAY', status: 'DRAFT', updatedAt: '2026-08-01T10:00:00' },
    ] })
    const wrapper = open({ conflict: 'events' })
    await flushPromises()

    expect(workspace).toHaveBeenCalledWith({ status: 'DRAFT' })
    const rows = [...document.querySelectorAll('[data-testid="resume-existing-draft"]')].map((r) => r.textContent)
    expect(rows[0]).toContain('Our first event')
    expect(rows[0]).toContain('September 30, 2026')
    expect(rows[1]).toContain('August 1, 2026')
    expect(q('resume-existing').textContent).toContain(en.editSection.resume.existingStay)
    // The three safe answers, nothing that merges.
    expect(q('resume-save-new')).not.toBeNull()
    expect(q('resume-keep')).not.toBeNull()
    expect(q('resume-discard')).not.toBeNull()
    wrapper.unmount()
  })

  it('says so when the account\'s drafts could not be read — the choice still works', async () => {
    workspace.mockRejectedValue(new Error('500'))
    const wrapper = open({ conflict: 'events' })
    await flushPromises()
    expect(q('resume-existing-failed')).not.toBeNull()
    q('resume-keep').click()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    wrapper.unmount()
  })

  it('explains an account that could not be checked, and a draft another account already saved', async () => {
    let wrapper = open({ conflict: 'unchecked' })
    await flushPromises()
    expect(q('invitation-auth-dialog').textContent).toContain(en.editSection.resume.titleUnchecked)
    expect(workspace).not.toHaveBeenCalled()
    wrapper.unmount()

    wrapper = open({ conflict: 'claimed' })
    await flushPromises()
    expect(q('invitation-auth-dialog').textContent).toContain(en.editSection.resume.bodyClaimed)
    expect(q('invitation-auth-dialog').dataset.conflict).toBe('claimed')
    wrapper.unmount()
  })

  it('has its text in Macedonian, English and Albanian', () => {
    const keys = ['titleUnchecked', 'bodyUnchecked', 'titleClaimed', 'bodyClaimed', 'existingTitle',
      'existingLoading', 'existingFailed', 'existingUpdated', 'existingStay']
    for (const locale of [mk, en, sq]) {
      for (const key of keys) expect(typeof locale.editSection.resume[key], key).toBe('string')
    }
    expect(mk.editSection.resume.existingUpdated).toContain('{date}')
    expect(sq.editSection.resume.existingUpdated).toContain('{date}')
  })
})
