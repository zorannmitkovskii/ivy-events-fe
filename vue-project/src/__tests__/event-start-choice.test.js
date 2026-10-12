import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-101 — the first choice of making an invitation: the type of event, and
 * whether to continue an unfinished draft or start a new invitation. Continue
 * is offered only when a draft really exists; the category filters the designs
 * and decides the fields; the choice survives Back/Forward; empty and error
 * states are explained in every language and never replaced by another
 * category without a word.
 */

const push = vi.fn()
const route = { params: { lang: 'en' }, query: {} }
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => route,
  useRouter: () => ({ push, back: vi.fn(), resolve: (to) => ({ href: typeof to === 'string' ? to : to.path }) }),
  RouterLink: { props: ['to'], template: '<a class="router-link"><slot /></a>' },
}))
vi.mock('@/services/auth.service', () => ({ isAuthenticated: () => false, getUsername: () => null }))
vi.mock('@/services/events.service', () => ({ eventsService: { create: vi.fn(), updateInvitation: vi.fn() } }))

const WEDDING_CARD = { category: 'WEDDING', order: 1, available: true, featured: true, tint: '', sample: { en: 'Elena & Nikola' }, types: ['WEDDING'] }
const BIRTHDAY_CARD = { category: 'BIRTHDAY', order: 2, available: true, featured: false, tint: 'rose', sample: { en: 'Mia turns 8' }, types: ['BIRTHDAY_ADULT', 'BIRTHDAY_CHILD'] }
const CORPORATE_SOON = { category: 'CORPORATE', order: 3, available: false, featured: false, tint: 'night', sample: { en: 'Annual gala' }, types: [] }

let catalog = vi.fn()
vi.mock('@/services/publicCatalog.service', () => ({
  publicCatalogService: { eventCategories: () => catalog(), vendorTypes: () => Promise.resolve({ data: [] }) },
}))

const listByCategory = vi.fn()
vi.mock('@/services/invitationTemplate.service', () => ({
  invitationTemplateService: { listByCategory: (...args) => listByCategory(...args) },
}))

const { findResumableDraft, getStartChoice, setStartChoice, START_CHOICE } = await import('@/utils/creationDraft')
const { validateBasics, coupleNameKeys } = await import('@/utils/eventBasics')
const { eventStepProblems } = await import('@/utils/creationSteps')
const { __resetPublicCatalog } = await import('@/composables/usePublicCatalog')
const {
  onboardingStore, setSelectedCategory, setSelectedTypeCode, setEventDetails, setInvitationName, setInvitationPath, setEventId,
} = await import('@/store/onboarding.store')
const draft = await import('@/store/invitationDraft.store')
const EventCategoryPage = (await import('@/pages/onboarding/EventCategoryPage.vue')).default
const EventInvitationsPage = (await import('@/pages/onboarding/EventInvitationsPage.vue')).default
const EventBasicsPage = (await import('@/pages/onboarding/EventBasicsPage.vue')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })
const global = { plugins: [i18n], stubs: { OnboardingFooterLinks: true } }

const BASICS = {
  brideName: 'Ана', groomName: 'Марко', title: '', date: '2099-06-12', time: '17:30',
  timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' },
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  draft.clearDraft()
  __resetPublicCatalog()
  catalog = vi.fn(async () => ({ data: [WEDDING_CARD, BIRTHDAY_CARD, CORPORATE_SOON] }))
  listByCategory.mockReset()
  listByCategory.mockImplementation(async () => [
    { id: 't1', name: 'Coastal Breeze', path: 'invitations/coastal-breeze', active: true },
  ])
  push.mockReset()
  route.query = {}
  setEventId('')
  setSelectedCategory('')
  setSelectedTypeCode('')
  setEventDetails(null)
  setInvitationName('')
  setInvitationPath('')
  i18n.global.locale.value = 'en'
})

async function mountCategoryPage() {
  const wrapper = mount(EventCategoryPage, { global, attachTo: document.body })
  await flushPromises()
  return wrapper
}

/* ------------------------------------------------------------------ */

describe('is there a draft to continue', () => {
  it('is not a draft when nothing, or only a category, was chosen', () => {
    expect(findResumableDraft(onboardingStore, draft.draftStore)).toBeNull()
    setSelectedCategory('WEDDING')
    expect(findResumableDraft(onboardingStore, draft.draftStore)).toBeNull()
  })

  it('is a draft once basics are typed or a design is chosen', () => {
    setSelectedCategory('WEDDING')
    setEventDetails({ ...BASICS, groomName: '', date: '' })
    const found = findResumableDraft(onboardingStore, draft.draftStore)
    expect(found).toMatchObject({ category: 'WEDDING', name: 'Ана', hasDesign: false })

    setEventDetails(null)
    setInvitationPath('invitations/coastal-breeze')
    expect(findResumableDraft(onboardingStore, draft.draftStore)).toMatchObject({ hasDesign: true })
  })

  it('is a draft when the local invitation draft has content, with its last change', () => {
    draft.seedDraftInfo({ brideName: 'Ана' })
    const found = findResumableDraft(onboardingStore, draft.draftStore)
    expect(found).not.toBeNull()
    expect(found.updatedAt).toBe(draft.draftStore.updatedAt)
  })

  it('is not a draft when what is left already became an event', () => {
    setSelectedCategory('WEDDING')
    setEventDetails(BASICS)
    setInvitationPath('invitations/coastal-breeze')
    setEventId('ev-1')
    expect(findResumableDraft(onboardingStore, draft.draftStore)).toBeNull()
  })

  it('keeps the start choice for this tab only, and survives a refused storage', () => {
    expect(getStartChoice()).toBeNull()
    setStartChoice(START_CHOICE.NEW)
    expect(getStartChoice()).toBe('new')
    sessionStorage.setItem('invitation_start_choice_v1', 'garbage')
    expect(getStartChoice()).toBeNull()

    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    expect(getStartChoice()).toBeNull()
    spy.mockRestore()
  })
})

describe('the category page: how to start', () => {
  it('without a draft offers only a new invitation — no "continue"', async () => {
    const wrapper = await mountCategoryPage()
    expect(wrapper.find('[data-testid="start-choice"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="resume-draft"]').exists()).toBe(false)
    expect(wrapper.find('#category-picker').exists()).toBe(true)
    // Only the available categories are buttons; the "coming soon" one is not.
    const buttons = wrapper.findAll('#category-picker button.cat')
    expect(buttons).toHaveLength(2)
    expect(wrapper.text()).toContain(en.eventCategories.comingSoon)
    wrapper.unmount()
  })

  it('a visit that began without a draft is not asked about its own progress on Back', async () => {
    const first = await mountCategoryPage()
    expect(getStartChoice()).toBe('fresh')
    first.unmount()
    // Basics typed in this visit, then Back to the first page.
    setSelectedCategory('WEDDING')
    setEventDetails(BASICS)
    const again = await mountCategoryPage()
    expect(again.find('[data-testid="start-choice"]').exists()).toBe(false)
    expect(again.find('[data-testid="start-new-note"]').exists()).toBe(false)
    expect(again.find('.cat.active').exists()).toBe(true)
    again.unmount()
  })

  it('with a draft asks first: continue (with its summary) or start new', async () => {
    setSelectedCategory('WEDDING')
    setEventDetails(BASICS)
    draft.seedDraftInfo({ brideName: 'Ана' })
    const wrapper = await mountCategoryPage()

    const choice = wrapper.find('[data-testid="start-choice"]')
    expect(choice.exists()).toBe(true)
    expect(choice.text()).toContain(en.onboarding.category.start.resumeTitle)
    expect(choice.text()).toContain(en.onboarding.category.start.newTitle)
    expect(choice.text()).toContain('Weddings')
    expect(choice.text()).toContain('Ана & Марко')
    expect(choice.text()).toContain('2099')
    expect(choice.text()).toContain(en.onboarding.category.start.summary.updatedAt)
    // The categories wait for the answer.
    expect(wrapper.find('#category-picker').exists()).toBe(false)
    expect(wrapper.find('.sticky-footer').exists()).toBe(false)
    wrapper.unmount()
  })

  it('"start new" with a draft on this device asks before deleting it, then opens the categories and is remembered', async () => {
    // INV-302: the device has one draft slot, so "start new" = discard, confirmed.
    setSelectedCategory('WEDDING')
    setEventDetails(BASICS)
    const wrapper = await mountCategoryPage()

    const startNew = wrapper.find('[data-testid="start-new"]')
    expect(startNew.attributes('aria-expanded')).toBe('false')
    await startNew.trigger('click')
    await flushPromises()
    expect(document.querySelector('[data-testid="discard-draft-dialog"]')).not.toBeNull()
    expect(onboardingStore.eventDetails.brideName).toBe('Ана')
    document.querySelector('[data-testid="discard-confirm"]').click()
    await flushPromises()

    expect(wrapper.find('#category-picker').exists()).toBe(true)
    expect(document.activeElement?.classList.contains('cat')).toBe(true)
    expect(onboardingStore.eventDetails.brideName).toBe('')
    expect(getStartChoice()).toBe('new')
    wrapper.unmount()
    setSelectedCategory('WEDDING')

    // Coming back to the page (Back from the basics, browser Back/Forward).
    const again = await mountCategoryPage()
    expect(again.find('[data-testid="start-choice"]').exists()).toBe(false)
    expect(again.find('#category-picker').exists()).toBe(true)
    expect(again.find('.cat.active').exists()).toBe(true)
    again.unmount()
  })

  it('"continue" resumes where the draft was left: the editor when type, basics and design are done', async () => {
    setSelectedCategory('WEDDING')
    setEventDetails(BASICS)
    setInvitationName('t1')
    setInvitationPath('invitations/coastal-breeze')
    const wrapper = await mountCategoryPage()

    await wrapper.find('[data-testid="resume-draft"]').trigger('click')
    await flushPromises()
    expect(push).toHaveBeenCalledWith({ path: '/en/invitations/coastal-breeze', query: { new: '1', edit: 'true' } })
    expect(getStartChoice()).toBe('resume')
    wrapper.unmount()
  })

  it('"continue" goes to the first missing thing — here the basics', async () => {
    setSelectedCategory('WEDDING')
    setEventDetails({ ...BASICS, time: '' })
    const wrapper = await mountCategoryPage()

    await wrapper.find('[data-testid="resume-draft"]').trigger('click')
    await flushPromises()
    expect(push).toHaveBeenCalledTimes(1)
    expect(push.mock.calls[0][0]).toMatchObject({ name: 'EventBasicsPage' })
    wrapper.unmount()
  })

  it('"continue" on a draft without a type asks for the type instead of guessing one', async () => {
    draft.seedDraftInfo({ brideName: 'Ана' })
    const wrapper = await mountCategoryPage()
    // INV-302: only what is known is shown — no "type: not chosen" placeholder.
    expect(wrapper.find('[data-testid="start-choice"]').text()).not.toContain(en.onboarding.category.start.summary.category)

    await wrapper.find('[data-testid="resume-draft"]').trigger('click')
    await flushPromises()
    expect(push).not.toHaveBeenCalled()
    expect(wrapper.find('#category-picker').exists()).toBe(true)
    expect(onboardingStore.selectedCategory).toBe('')
    wrapper.unmount()
  })
})

describe('the category page: choosing a category', () => {
  it('changing the category drops the design chosen for the old one, not the draft', async () => {
    setSelectedCategory('WEDDING')
    setInvitationName('t1')
    setInvitationPath('invitations/coastal-breeze')
    setStartChoice(START_CHOICE.NEW)
    draft.seedDraftInfo({ brideName: 'Ана' })
    const wrapper = await mountCategoryPage()

    const birthday = wrapper.findAll('#category-picker button.cat')[1]
    await birthday.trigger('click')
    await flushPromises()

    expect(onboardingStore.selectedCategory).toBe('BIRTHDAY')
    expect(onboardingStore.invitationName).toBe('')
    expect(onboardingStore.invitationPath).toBe('')
    expect(draft.draftStore.theme?.info?.brideName).toBe('Ана')
    // A birthday asks whose it is before it can go on.
    expect(wrapper.find('.sticky-footer').exists()).toBe(false)
    await wrapper.findAll('.type-option')[1].trigger('click')
    expect(wrapper.find('.sticky-footer').exists()).toBe(true)
    wrapper.unmount()
  })

  it('a remembered category that is no longer offered is said, not silently kept or swapped', async () => {
    setSelectedCategory('CORPORATE')
    const wrapper = await mountCategoryPage()
    const warn = wrapper.find('[data-testid="category-unavailable"]')
    expect(warn.exists()).toBe(true)
    expect(warn.text()).toBe('“Corporate Events” is not available right now. Choose another type of event.')
    expect(wrapper.find('.sticky-footer').exists()).toBe(false)
    expect(onboardingStore.selectedCategory).toBe('CORPORATE')
    wrapper.unmount()
  })

  it('a failed catalogue says so, in the page language, with a retry', async () => {
    catalog = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: [WEDDING_CARD] })
    i18n.global.locale.value = 'mk'
    const wrapper = await mountCategoryPage()

    const error = wrapper.find('[data-testid="categories-error"]')
    expect(error.attributes('role')).toBe('alert')
    expect(error.text()).toContain(mk.onboarding.category.loadError)
    await error.find('button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="categories-error"]').exists()).toBe(false)
    expect(wrapper.findAll('#category-picker button.cat')).toHaveLength(1)
    wrapper.unmount()
  })

  it('no open category explains it and offers the designs instead', async () => {
    catalog = vi.fn(async () => ({ data: [CORPORATE_SOON] }))
    const wrapper = await mountCategoryPage()
    const empty = wrapper.find('[data-testid="categories-empty"]')
    expect(empty.text()).toContain(en.onboarding.category.empty)
    expect(empty.text()).toContain(en.onboarding.category.emptyAction)
    wrapper.unmount()
  })
})

describe('the designs follow the category', () => {
  it('asks for the category first instead of showing wedding designs', async () => {
    const wrapper = mount(EventInvitationsPage, { global })
    await flushPromises()
    expect(listByCategory).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="designs-no-category"]').text()).toContain(en.onboarding.invitations.noCategory)
    expect(wrapper.find('[data-testid="invitation-card"]').exists()).toBe(false)
    expect(wrapper.find('.quick-actions').exists()).toBe(false)
  })

  it('lists the chosen category’s designs and names the category', async () => {
    setSelectedCategory('BIRTHDAY')
    const wrapper = mount(EventInvitationsPage, { global })
    await flushPromises()
    expect(listByCategory).toHaveBeenCalledWith('BIRTHDAY')
    expect(wrapper.find('[data-testid="designs-category"]').text()).toBe('Designs for: Birthdays & Parties')
  })

  it('drops a design chosen for another category', async () => {
    setSelectedCategory('BIRTHDAY')
    setInvitationName('wedding-only')
    setInvitationPath('invitations/persian-wedding')
    mount(EventInvitationsPage, { global })
    await flushPromises()
    expect(onboardingStore.invitationName).toBe('')
    expect(onboardingStore.invitationPath).toBe('')
  })

  it('an empty category explains it and offers another type', async () => {
    setSelectedCategory('BIRTHDAY')
    listByCategory.mockResolvedValueOnce([])
    const wrapper = mount(EventInvitationsPage, { global })
    await flushPromises()
    const empty = wrapper.find('[data-testid="designs-empty"]')
    expect(empty.text()).toContain('There are no designs for “Birthdays & Parties” yet.')
    expect(empty.text()).toContain(en.onboarding.invitations.chooseOtherCategory)
  })

  it('a failed list is an error with a retry, not "no designs"', async () => {
    setSelectedCategory('WEDDING')
    listByCategory.mockRejectedValueOnce(new Error('500'))
    const wrapper = mount(EventInvitationsPage, { global })
    await flushPromises()
    const error = wrapper.find('[data-testid="designs-error"]')
    expect(error.attributes('role')).toBe('alert')
    expect(wrapper.find('[data-testid="designs-empty"]').exists()).toBe(false)
    await error.find('button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="designs-error"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="invitation-card"]').exists()).toBe(true)
  })
})

describe('the fields follow the category', () => {
  it('a birthday asks for a title, not for a bride and a groom', async () => {
    setSelectedCategory('BIRTHDAY')
    const wrapper = mount(EventBasicsPage, { global })
    expect(wrapper.find('#basics-title').exists()).toBe(true)
    expect(wrapper.find('#basics-bride').exists()).toBe(false)
    expect(wrapper.text()).not.toContain(en.onboarding.eventBasics.fields.brideName)
    expect(validateBasics({ ...BASICS, brideName: '', groomName: '', title: '' }, 'BIRTHDAY', 0)).toEqual({
      title: 'onboarding.eventBasics.errors.title',
    })
  })

  it('an anniversary names two partners, never a bride and a groom', async () => {
    setSelectedCategory('ANNIVERSARY')
    const wrapper = mount(EventBasicsPage, { global })
    expect(wrapper.find('label[for="basics-bride"]').text()).toBe(en.onboarding.eventBasics.fields.partnerOne)
    expect(wrapper.find('label[for="basics-groom"]').text()).toBe(en.onboarding.eventBasics.fields.partnerTwo)
    expect(wrapper.text()).not.toContain('Bride')

    expect(coupleNameKeys('ANNIVERSARY')).toEqual({ first: 'partnerOne', second: 'partnerTwo' })
    const errors = validateBasics({ ...BASICS, brideName: '', groomName: '' }, 'ANNIVERSARY', 0)
    expect(errors.brideName).toBe('onboarding.eventBasics.errors.partnerOne')
    const problems = eventStepProblems({ category: 'ANNIVERSARY', basics: { ...BASICS, brideName: '' }, now: 0 })
    expect(problems[0].labelKey).toBe('onboarding.eventBasics.fields.partnerOne')
    // A wedding keeps its words.
    expect(validateBasics({ ...BASICS, brideName: '' }, 'WEDDING', 0).brideName).toBe('onboarding.eventBasics.errors.brideName')
  })
})

describe('every new text is in all three languages', () => {
  const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj)
  const leaves = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? leaves(v, `${prefix}${k}.`) : [`${prefix}${k}`])
  const keys = [
    ...leaves(en.onboarding.category.start, 'onboarding.category.start.'),
    'onboarding.category.loadError', 'onboarding.category.retry', 'onboarding.category.empty',
    'onboarding.category.emptyAction', 'onboarding.category.unavailable',
    'onboarding.invitations.forCategory', 'onboarding.invitations.noCategory', 'onboarding.invitations.chooseCategory',
    'onboarding.invitations.loadError', 'onboarding.invitations.retry', 'onboarding.invitations.emptyCategory',
    'onboarding.invitations.chooseOtherCategory',
    ...['fields', 'placeholders', 'errors'].flatMap((g) => [`onboarding.eventBasics.${g}.partnerOne`, `onboarding.eventBasics.${g}.partnerTwo`]),
  ]

  it.each(['en', 'mk', 'sq'])('%s has them', (lang) => {
    const messages = { en, mk, sq }[lang]
    for (const key of keys) {
      expect(typeof get(messages, key), key).toBe('string')
      expect(get(messages, key).length, key).toBeGreaterThan(0)
    }
  })
})
