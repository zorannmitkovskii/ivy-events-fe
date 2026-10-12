import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-302 — coming back to an unfinished invitation: the draft on this device
 * (INV-101's detector, extended) and the drafts saved in the account are
 * offered with what is known about them; "start new" with a local draft and
 * "discard" delete only after a confirmation that names exactly what goes;
 * an expired, unreadable or partly-read draft is explained and never breaks
 * the page, and nothing already deleted is promised back.
 */

const push = vi.fn()
const route = { params: { lang: 'en' }, query: {} }
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => route,
  useRouter: () => ({ push, back: vi.fn(), resolve: (to) => ({ href: typeof to === 'string' ? to : to.path }) }),
  RouterLink: { props: ['to'], template: '<a class="router-link"><slot /></a>' },
}))

let signedIn = false
vi.mock('@/services/auth.service', () => ({ isAuthenticated: () => signedIn, getUsername: () => null }))
const workspace = vi.fn()
vi.mock('@/services/events.service', () => ({
  eventsService: { create: vi.fn(), updateInvitation: vi.fn(), workspace: (...a) => workspace(...a) },
}))

const WEDDING_CARD = { category: 'WEDDING', order: 1, available: true, featured: true, tint: '', sample: { en: 'Elena & Nikola' }, types: ['WEDDING'] }
vi.mock('@/services/publicCatalog.service', () => ({
  publicCatalogService: { eventCategories: async () => ({ data: [WEDDING_CARD] }), vendorTypes: () => Promise.resolve({ data: [] }) },
}))

const {
  findResumableDraft, discardLocalDraft, serverDraftsFrom, draftRecoveryNotice, getStartChoice, SERVER_DRAFT_LIMIT,
} = await import('@/utils/creationDraft')
const { __resetPublicCatalog } = await import('@/composables/usePublicCatalog')
const {
  onboardingStore, setSelectedCategory, setSelectedTypeCode, setEventDetails, setInvitationName, setInvitationPath, setEventId,
} = await import('@/store/onboarding.store')
const draft = await import('@/store/invitationDraft.store')
const EventCategoryPage = (await import('@/pages/onboarding/EventCategoryPage.vue')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })
const global = { plugins: [i18n], stubs: { OnboardingFooterLinks: true } }

const BASICS = {
  brideName: 'Ана', groomName: 'Марко', title: '', date: '2099-06-12', time: '17:30',
  timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' },
}
const DAY = 24 * 60 * 60 * 1000

function event(id, extra = {}) {
  return {
    event: {
      id, name: `Event ${id}`, categoryType: 'WEDDING', status: 'DRAFT',
      updatedAt: '2026-10-01T10:00:00', invitation: { invitationName: 'coastal-breeze' }, ...extra,
    },
    pinned: false,
  }
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  draft.clearDraft()
  draft.clearDraftNotice()
  __resetPublicCatalog()
  push.mockReset()
  workspace.mockReset()
  workspace.mockResolvedValue({ success: true, data: [] })
  signedIn = false
  route.query = {}
  setEventId('')
  setSelectedCategory('')
  setSelectedTypeCode('')
  setEventDetails(null)
  setInvitationName('')
  setInvitationPath('')
  i18n.global.locale.value = 'en'
  document.body.innerHTML = ''
})

async function mountPage() {
  const wrapper = mount(EventCategoryPage, { global, attachTo: document.body })
  await flushPromises()
  return wrapper
}

function seedLocalDraft() {
  setSelectedCategory('WEDDING')
  setEventDetails(BASICS)
  setInvitationName('t1')
  setInvitationPath('invitations/coastal-breeze')
  draft.seedDraftInfo({ brideName: 'Ана', groomName: 'Марко' })
  draft.addDraftItem('agenda', { title: 'Моја церемонија', time: '17:00' })
  draft.addDraftItem('agenda', { title: 'Мојата вечера', time: '20:00' })
}

/* ------------------------------------------------------------------ */

describe('reading the draft on this device', () => {
  it('an unreadable draft is removed with a note, and nothing throws', () => {
    localStorage.setItem('invitation_draft_v1', '{not json')
    expect(() => draft.loadDraft()).not.toThrow()
    expect(localStorage.getItem('invitation_draft_v1')).toBeNull()
    expect(draftRecoveryNotice()).toEqual({ kind: 'unreadable', updatedAt: null })
    expect(findResumableDraft(onboardingStore, draft.draftStore)).toBeNull()
  })

  it('an expired draft is removed with the type/basics/design chosen for it, and says when it was last changed', () => {
    setSelectedCategory('WEDDING')
    setEventDetails(BASICS)
    setInvitationPath('invitations/coastal-breeze')
    const old = new Date(Date.now() - 31 * DAY).toISOString()
    localStorage.setItem('invitation_draft_v1', JSON.stringify({ agenda: [{ title: 'x' }], updatedAt: old }))
    draft.loadDraft()

    expect(localStorage.getItem('invitation_draft_v1')).toBeNull()
    expect(draft.draftStore.agenda).toEqual([])
    expect(onboardingStore.selectedCategory).toBe('')
    expect(onboardingStore.eventDetails.brideName).toBe('')
    expect(onboardingStore.invitationPath).toBe('')
    expect(draftRecoveryNotice()).toEqual({ kind: 'expired', updatedAt: old })
    expect(findResumableDraft(onboardingStore, draft.draftStore)).toBeNull()
  })

  it('expiry keeps what describes a saved event (eventId): only the typed basics go', () => {
    setEventId('ev-1')
    setSelectedCategory('GALLERY')
    setInvitationPath('invitations/coastal-breeze')
    setEventDetails(BASICS)
    localStorage.setItem('invitation_draft_v1', JSON.stringify({ agenda: [{ title: 'x' }], updatedAt: new Date(Date.now() - 40 * DAY).toISOString() }))
    draft.loadDraft()
    expect(onboardingStore.selectedCategory).toBe('GALLERY')
    expect(onboardingStore.invitationPath).toBe('invitations/coastal-breeze')
    expect(onboardingStore.eventDetails.brideName).toBe('')
  })

  it('a partly damaged draft opens what it can and notes the rest', () => {
    localStorage.setItem('invitation_draft_v1', JSON.stringify({
      eventDetails: 'oops', agenda: [{ title: 'Моја церемонија' }, null, 7], theme: 'red', updatedAt: new Date().toISOString(),
    }))
    draft.loadDraft()
    expect(draft.draftStore.eventDetails).toEqual([])
    expect(draft.draftStore.agenda).toEqual([{ title: 'Моја церемонија' }])
    expect(draft.draftStore.theme).toBeNull()
    expect(draftRecoveryNotice().kind).toBe('partial')
    expect(findResumableDraft(onboardingStore, draft.draftStore)).not.toBeNull()
  })

  it('basics of the wrong type do not break the detector', () => {
    setEventDetails({ brideName: 5, groomName: null, title: {}, date: 20990612, location: { name: 3 } })
    expect(() => findResumableDraft(onboardingStore, draft.draftStore)).not.toThrow()
    expect(findResumableDraft(onboardingStore, draft.draftStore)).toBeNull()
  })

  it('summarises what is known: names from the editor copy, last change, expiry, own entries only', () => {
    draft.seedDraftInfo({ brideName: 'Ана', groomName: 'Марко' })
    draft.addDraftItem('agenda', { title: 'Моја церемонија' })
    const found = findResumableDraft(onboardingStore, draft.draftStore)
    expect(found.name).toBe('Ана & Марко')
    expect(found.category).toBe('')
    expect(found.counts).toEqual({ details: 0, agenda: 1, story: 0 })
    expect(new Date(found.expiresAt).getTime() - new Date(found.updatedAt).getTime()).toBe(draft.DRAFT_TTL_MS)
  })
})

describe('discarding the draft on this device', () => {
  it('deletes the draft and its progress, never the unsynced copies of saved events', () => {
    seedLocalDraft()
    draft.saveUnsyncedSnapshot('ev-9', { name: 'kept' })
    discardLocalDraft()
    expect(localStorage.getItem('invitation_draft_v1')).toBeNull()
    expect(onboardingStore.selectedCategory).toBe('')
    expect(onboardingStore.invitationPath).toBe('')
    expect(onboardingStore.eventDetails.brideName).toBe('')
    expect(draft.getUnsyncedSnapshot('ev-9')).not.toBeNull()
    expect(findResumableDraft(onboardingStore, draft.draftStore)).toBeNull()
  })
})

describe('drafts saved in the account', () => {
  it('lists DRAFT invitations only, newest first, at most a few, with an unsynced copy flagged', () => {
    draft.saveUnsyncedSnapshot('b', { name: 'x' })
    const rows = [
      event('a', { updatedAt: '2026-09-01T10:00:00' }),
      event('b', { updatedAt: '2026-10-05T08:00:00' }),
      event('c', { status: 'ACTIVE' }),
      event('d', { categoryType: 'GALLERY' }),
      event('e', { name: 'New Event', invitation: { brideName: 'Ема', groomName: 'Иван', invitationName: 'invitations/persian-wedding' }, updatedAt: '2026-09-20T00:00:00' }),
      event('f', { updatedAt: '2025-01-01T00:00:00', invitation: null }),
    ]
    const drafts = serverDraftsFrom(rows)
    expect(drafts.map((d) => d.id)).toEqual(['b', 'e', 'a'])
    expect(drafts).toHaveLength(SERVER_DRAFT_LIMIT)
    expect(drafts[0]).toMatchObject({ name: 'Event b', category: 'WEDDING', updatedOn: '2026-10-05', design: 'coastal-breeze' })
    expect(drafts[0].unsyncedAt).toBeTruthy()
    expect(drafts[1]).toMatchObject({ name: 'Ема & Иван', design: 'persian-wedding', unsyncedAt: null })
  })

  it('survives rows it does not understand', () => {
    expect(serverDraftsFrom(null)).toEqual([])
    expect(serverDraftsFrom([null, {}, { event: { id: 'x', status: 'DRAFT' } }])).toEqual([
      expect.objectContaining({ id: 'x', name: '', category: '', updatedOn: '', design: '' }),
    ])
  })
})

/* ------------------------------------------------------------------ */

describe('the start page: a draft on this device', () => {
  it('shows only what is known, when it was last changed and until when it is kept', async () => {
    draft.seedDraftInfo({ brideName: 'Ана' })
    const wrapper = await mountPage()
    const card = wrapper.find('[data-testid="local-draft"]')
    expect(card.text()).toContain('Ана')
    expect(card.text()).not.toContain(en.onboarding.category.start.summary.category)
    expect(card.text()).not.toContain(en.onboarding.category.start.summary.date)
    expect(card.text()).toContain(en.onboarding.category.start.summary.updatedAt)
    expect(card.find('[data-testid="draft-expires"]').exists()).toBe(true)
    expect(card.text()).toContain('30 days')
    wrapper.unmount()
  })

  it('"discard" asks first and names exactly what goes and what stays; cancel deletes nothing', async () => {
    seedLocalDraft()
    const wrapper = await mountPage()
    const button = wrapper.find('[data-testid="discard-draft"]')
    button.element.focus()
    await button.trigger('click')
    await flushPromises()

    const dialog = document.querySelector('[data-testid="discard-draft-dialog"]')
    expect(dialog.getAttribute('role')).toBe('alertdialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const deleted = dialog.querySelector('[data-testid="discard-scope-deleted"]').textContent
    expect(deleted).toContain('Weddings · Ана & Марко')
    expect(deleted).toContain('Coastal Breeze')
    expect(deleted).toContain('2 programme items')
    expect(deleted).toContain(en.onboarding.category.draft.discard.settings)
    expect(dialog.querySelector('[data-testid="discard-scope-kept"]').textContent).toContain(en.onboarding.category.draft.discard.keepGuest)
    expect(dialog.textContent).toContain(en.onboarding.category.draft.discard.irreversible)
    // The safe answer has the focus.
    expect(document.activeElement?.dataset.testid).toBe('discard-cancel')

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(document.querySelector('[data-testid="discard-draft-dialog"]')).toBeNull()
    expect(document.activeElement?.dataset.testid).toBe('discard-draft')
    expect(onboardingStore.eventDetails.brideName).toBe('Ана')
    expect(draft.draftStore.agenda).toHaveLength(2)
    expect(wrapper.find('[data-testid="local-draft"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('confirming deletes it, says so, and opens the categories', async () => {
    seedLocalDraft()
    const wrapper = await mountPage()
    await wrapper.find('[data-testid="discard-draft"]').trigger('click')
    await flushPromises()
    document.querySelector('[data-testid="discard-confirm"]').click()
    await flushPromises()

    expect(localStorage.getItem('invitation_draft_v1')).toBeNull()
    expect(onboardingStore.selectedCategory).toBe('')
    expect(wrapper.find('[data-testid="start-choice"]').exists()).toBe(false)
    expect(wrapper.find('#category-picker').exists()).toBe(true)
    expect(wrapper.find('.cat.active').exists()).toBe(false)
    expect(wrapper.find('[data-testid="start-announce"]').text()).toBe(en.onboarding.category.start.discarded)
    expect(getStartChoice()).toBe('fresh')
    wrapper.unmount()
  })

  it('"start new" with a draft: cancelling keeps the question and the draft', async () => {
    seedLocalDraft()
    const wrapper = await mountPage()
    expect(wrapper.find('[data-testid="start-new"]').attributes('aria-haspopup')).toBe('dialog')
    await wrapper.find('[data-testid="start-new"]').trigger('click')
    await flushPromises()
    expect(document.querySelector('[data-testid="discard-confirm"]').textContent).toContain(en.onboarding.category.draft.discard.confirmStartNew)
    document.querySelector('[data-testid="discard-cancel"]').click()
    await flushPromises()
    expect(wrapper.find('[data-testid="start-choice"]').exists()).toBe(true)
    expect(getStartChoice()).toBeNull()
    expect(draft.draftStore.agenda).toHaveLength(2)
    wrapper.unmount()
  })

  it('a partly read draft says so on its card; the note goes once a choice is made', async () => {
    localStorage.setItem('invitation_draft_v1', JSON.stringify({ agenda: [{ title: 'Моја' }, 'x'], updatedAt: new Date().toISOString() }))
    draft.loadDraft()
    const wrapper = await mountPage()
    expect(wrapper.find('[data-testid="draft-partial"]').text()).toBe(en.onboarding.category.start.partial)
    expect(wrapper.find('[data-testid="draft-notice"]').exists()).toBe(false)
    await wrapper.find('[data-testid="resume-draft"]').trigger('click')
    expect(draftRecoveryNotice()).toBeNull()
    wrapper.unmount()
  })
})

describe('the start page: a draft that is gone', () => {
  it('an expired draft is explained with its last change, without promising it back, and can be dismissed', async () => {
    localStorage.setItem('invitation_draft_v1', JSON.stringify({ agenda: [{ title: 'x' }], updatedAt: '2026-01-02T10:00:00.000Z' }))
    draft.loadDraft()
    const wrapper = await mountPage()
    const notice = wrapper.find('[data-testid="draft-notice"]')
    expect(notice.attributes('data-kind')).toBe('expired')
    expect(notice.text()).toContain('2026')
    expect(notice.text()).toContain('30 days')
    expect(notice.text()).toContain('cannot be restored')
    // Nothing to continue — the categories are there.
    expect(wrapper.find('[data-testid="start-choice"]').exists()).toBe(false)
    expect(wrapper.find('#category-picker').exists()).toBe(true)

    await wrapper.find('[data-testid="draft-notice-dismiss"]').trigger('click')
    expect(wrapper.find('[data-testid="draft-notice"]').exists()).toBe(false)
    expect(draftRecoveryNotice()).toBeNull()
    wrapper.unmount()
  })

  it('an unreadable draft is explained in Macedonian too, and the page works', async () => {
    localStorage.setItem('invitation_draft_v1', '[[[')
    draft.loadDraft()
    i18n.global.locale.value = 'mk'
    route.params.lang = 'mk'
    const wrapper = await mountPage()
    expect(wrapper.find('[data-testid="draft-notice"]').text()).toContain(mk.onboarding.category.draft.notice.unreadable)
    expect(wrapper.findAll('#category-picker button.cat').length).toBeGreaterThan(0)
    wrapper.unmount()
    route.params.lang = 'en'
  })
})

describe('the start page: drafts in the account', () => {
  beforeEach(() => { signedIn = true })

  it('waits for the account, then offers its drafts with what is known', async () => {
    draft.saveUnsyncedSnapshot('b', { name: 'x' })
    let answer
    workspace.mockReturnValue(new Promise((resolve) => { answer = resolve }))
    const wrapper = mount(EventCategoryPage, { global, attachTo: document.body })
    await flushPromises()
    expect(workspace).toHaveBeenCalledWith({ status: 'DRAFT' })
    expect(wrapper.find('[data-testid="server-drafts-checking"]').exists()).toBe(true)
    expect(wrapper.find('#category-picker').exists()).toBe(false)

    answer({ success: true, data: [event('a', { updatedAt: '2026-09-01T10:00:00' }), event('b', { updatedAt: '2026-10-05T08:00:00', invitation: null })] })
    await flushPromises()
    const cards = wrapper.findAll('[data-testid="server-draft"]')
    expect(cards).toHaveLength(2)
    expect(cards[0].text()).toContain('Event b')
    expect(cards[0].text()).toContain('Weddings')
    expect(cards[0].text()).toContain('2026')
    expect(cards[0].find('[data-testid="server-draft-unsynced"]').exists()).toBe(true)
    expect(cards[1].find('[data-testid="server-draft-unsynced"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="local-draft"]').exists()).toBe(false)
    expect(cards[1].find('button').attributes('aria-label')).toBe('Continue the draft Event a')

    // Continue: the editor of that event; one without a design opens its dashboard.
    await cards[1].find('[data-testid="resume-server-draft"]').trigger('click')
    expect(push).toHaveBeenLastCalledWith({ path: '/en/invitations/coastal-breeze', query: { edit: 'true', eventId: 'a' } })
    expect(getStartChoice()).toBe('resume')
    await cards[0].find('[data-testid="resume-server-draft"]').trigger('click')
    expect(onboardingStore.eventId).toBe('b')
    expect(push).toHaveBeenLastCalledWith({ name: 'dashboard.overview', params: { lang: 'en' } })
    wrapper.unmount()
  })

  it('"start new" with only account drafts deletes nothing and says they stay', async () => {
    workspace.mockResolvedValue({ success: true, data: [event('a')] })
    const wrapper = await mountPage()
    await wrapper.find('[data-testid="start-new"]').trigger('click')
    await flushPromises()
    expect(document.querySelector('[data-testid="discard-draft-dialog"]')).toBeNull()
    expect(wrapper.find('#category-picker').exists()).toBe(true)
    expect(wrapper.find('[data-testid="start-new-note"]').text()).toBe(en.onboarding.category.start.newNote)
    wrapper.unmount()
  })

  it('discarding the local draft keeps the account drafts on offer, and says the account is not touched', async () => {
    seedLocalDraft()
    workspace.mockResolvedValue({ success: true, data: [event('a')] })
    const wrapper = await mountPage()
    expect(wrapper.find('[data-testid="local-draft"]').exists()).toBe(true)
    await wrapper.find('[data-testid="discard-draft"]').trigger('click')
    await flushPromises()
    expect(document.querySelector('[data-testid="discard-scope-kept"]').textContent).toContain(en.onboarding.category.draft.discard.keepAccount)
    document.querySelector('[data-testid="discard-confirm"]').click()
    await flushPromises()
    expect(wrapper.find('[data-testid="local-draft"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="server-draft"]')).toHaveLength(1)
    expect(document.activeElement?.id).toBe('start-choice-title')
    wrapper.unmount()
  })

  it('a failed check is said, not read as "no drafts", and can be retried', async () => {
    workspace.mockRejectedValueOnce(new Error('500'))
    const wrapper = await mountPage()
    expect(wrapper.find('[data-testid="server-drafts-error"]').attributes('role')).toBe('alert')
    expect(wrapper.find('#category-picker').exists()).toBe(true)

    workspace.mockResolvedValue({ success: true, data: [event('a')] })
    await wrapper.find('[data-testid="server-drafts-error"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="server-drafts-error"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="server-draft"]')).toHaveLength(1)
    wrapper.unmount()
  })

  it('does not ask the account again once the start was chosen in this tab', async () => {
    sessionStorage.setItem('invitation_start_choice_v1', 'new')
    const wrapper = await mountPage()
    expect(workspace).not.toHaveBeenCalled()
    expect(wrapper.find('#category-picker').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('new UI text', () => {
  const flat = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`])

  it('exists in Macedonian, English and Albanian', () => {
    const keys = (l) => [...flat(l.onboarding.category.draft), ...flat(l.onboarding.category.start)].sort()
    expect(keys(mk)).toEqual(keys(en))
    expect(keys(sq)).toEqual(keys(en))
    expect(en.onboarding.category.start.summary.noCategory).toBeUndefined()
  })
})
