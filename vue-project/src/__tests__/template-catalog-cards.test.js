import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-201 — informative cards in the design catalogue: thumbnail, a localized
 * description and traits only where the code really has them, "Preview"
 * separate from "Use this design", and a selected state that is not only a
 * colour.
 */

const push = vi.fn()
const route = { params: { lang: 'en' }, query: {} }
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => route,
  useRouter: () => ({ push, back: vi.fn(), resolve: (to) => ({ href: typeof to === 'string' ? to : to.path }) }),
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
}))
vi.mock('@/services/auth.service', () => ({ isAuthenticated: () => false, getUsername: () => null }))
vi.mock('@/services/events.service', () => ({ eventsService: { create: vi.fn(), updateInvitation: vi.fn() } }))

let templates = []
vi.mock('@/services/invitationTemplate.service', () => ({
  invitationTemplateService: { listByCategory: vi.fn(async () => templates) },
}))

const { onboardingStore, setSelectedCategory, setEventDetails, setInvitationName, setInvitationPath, setEventId } =
  await import('@/store/onboarding.store')
const { templateTraits, presetIdOf, allShareRendererSections, TRAIT_KINDS, FAMILY_TRAITS_FOR_TEST } =
  await import('@/utils/templateCatalog')
const { DESIGN_PRESETS } = await import('@/config/designPresets/index.js')
const { HERO_COMPONENTS, SCHEDULE_COMPONENTS, STORY_COMPONENTS } =
  await import('@/components/invitations/wedding/heroes/index.js')
const EventInvitationsPage = (await import('@/pages/onboarding/EventInvitationsPage.vue')).default

const KNOWN = [
  { id: 't1', name: 'Coastal Breeze', path: 'invitations/coastal-breeze', active: true },
  { id: 't2', name: 'Persian Wedding', path: 'invitations/persian-wedding', active: true, description: 'Typed by an admin' },
]
const UNKNOWN = { id: 't9', name: 'Birthday Balloons', path: 'invitations/birthday-balloons', active: true, description: 'Colourful balloons' }

function makeI18n(locale = 'en') {
  return createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en, mk, sq } })
}
const mountPage = (locale = 'en') =>
  mount(EventInvitationsPage, { global: { plugins: [makeI18n(locale)], stubs: { OnboardingFooterLinks: true } }, attachTo: document.body })

const cardByName = (wrapper, name) =>
  wrapper.findAll('[data-testid="invitation-card"]').find((c) => c.find('h3').text() === name)

let openSpy
beforeEach(() => {
  localStorage.clear()
  push.mockReset()
  route.query = {}
  route.params = { lang: 'en' }
  setEventId('')
  setSelectedCategory('WEDDING')
  setEventDetails(null)
  setInvitationName('')
  setInvitationPath('')
  templates = [...KNOWN]
  openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
})
afterEach(() => {
  openSpy.mockRestore()
  document.body.innerHTML = ''
})

describe('what a design has — only what the code draws', () => {
  it('gives every preset a layout, story, programme and opening, from its family and entry', () => {
    for (const id of Object.keys(DESIGN_PRESETS)) {
      const info = templateTraits(`invitations/${id}`)
      expect(info?.presetId).toBe(id)
      expect(info.traits.map((t) => t.kind)).toEqual(TRAIT_KINDS)
    }
    expect(templateTraits('invitations/persian-wedding').traits).toEqual([
      { kind: 'layout', value: 'glassPanel' },
      { kind: 'story', value: 'textAndPhotos' },
      { kind: 'programme', value: 'vertical' },
      { kind: 'opening', value: 'curtain' },
    ])
    expect(templateTraits('invitations/coastal-breeze').traits.find((t) => t.kind === 'opening').value).toBe('envelope')
    expect(templateTraits('invitations/parisian-wedding').traits.find((t) => t.kind === 'opening').value).toBe('doors')
  })

  it('describes only families the renderer has components for', () => {
    for (const family of Object.keys(FAMILY_TRAITS_FOR_TEST)) {
      expect(HERO_COMPONENTS[family], family).toBeTruthy()
      expect(SCHEDULE_COMPONENTS[family], family).toBeTruthy()
      expect(STORY_COMPONENTS[family], family).toBeTruthy()
    }
    for (const preset of Object.values(DESIGN_PRESETS)) {
      expect(FAMILY_TRAITS_FOR_TEST[preset.family], preset.id).toBeTruthy()
    }
  })

  it('invents nothing for a template the code does not know', () => {
    expect(templateTraits('invitations/birthday-balloons')).toBeNull()
    expect(templateTraits('')).toBeNull()
    expect(presetIdOf('invitations/my-wedding')).toBe('')
    expect(allShareRendererSections(['invitations/coastal-breeze', 'invitations/birthday-balloons'])).toBe(false)
    expect(allShareRendererSections([])).toBe(false)
  })

  it('has every description and trait text in mk, en and sq', () => {
    for (const messages of [en, mk, sq]) {
      const card = messages.onboarding.invitations.card
      for (const key of ['preview', 'use', 'selectedStatus', 'traitsLabel', 'sharedSections']) {
        expect(card[key], key).toBeTruthy()
      }
      for (const id of Object.keys(DESIGN_PRESETS)) {
        expect(card.designs[id], id).toBeTruthy()
        for (const t of templateTraits(`invitations/${id}`).traits) {
          expect(card.traits[t.kind].label).toBeTruthy()
          expect(card.traits[t.kind][t.value], `${t.kind}.${t.value}`).toBeTruthy()
        }
      }
    }
    expect(Object.keys(mk.onboarding.invitations.card.traits.opening).sort())
      .toEqual(Object.keys(en.onboarding.invitations.card.traits.opening).sort())
    expect(Object.keys(sq.onboarding.invitations.card.traits.opening).sort())
      .toEqual(Object.keys(en.onboarding.invitations.card.traits.opening).sort())
  })
})

describe('the cards', () => {
  it('show a localized description and the traits as a labelled list', async () => {
    const wrapper = mountPage('mk')
    await flushPromises()

    const card = cardByName(wrapper, 'Persian Wedding')
    // The localized text wins over the admin's untranslated line.
    expect(card.find('[data-testid="invitation-card-description"]').text()).toBe(mk.onboarding.invitations.card.designs['persian-wedding'])
    const traits = card.find('[data-testid="invitation-card-traits"]')
    expect(traits.element.tagName).toBe('DL')
    expect(traits.attributes('aria-label')).toBe(mk.onboarding.invitations.card.traitsLabel)
    expect(traits.findAll('dt').map((d) => d.text())).toEqual([
      mk.onboarding.invitations.card.traits.layout.label,
      mk.onboarding.invitations.card.traits.story.label,
      mk.onboarding.invitations.card.traits.programme.label,
      mk.onboarding.invitations.card.traits.opening.label,
    ])
    expect(traits.text()).toContain(mk.onboarding.invitations.card.traits.opening.curtain)
    expect(wrapper.find('[data-testid="designs-shared-sections"]').text()).toBe(mk.onboarding.invitations.card.sharedSections)
    wrapper.unmount()
  })

  it('a template the code does not know: the server description as typed, no traits, no shared note', async () => {
    templates = [...KNOWN, UNKNOWN]
    const wrapper = mountPage()
    await flushPromises()

    const card = cardByName(wrapper, 'Birthday Balloons')
    expect(card.find('[data-testid="invitation-card-description"]').text()).toBe('Colourful balloons')
    expect(card.find('[data-testid="invitation-card-traits"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="designs-shared-sections"]').exists()).toBe(false)

    templates = [{ ...UNKNOWN, description: null }]
    const bare = mountPage()
    await flushPromises()
    expect(cardByName(bare, 'Birthday Balloons').find('[data-testid="invitation-card-description"]').exists()).toBe(false)
    wrapper.unmount()
    bare.unmount()
  })

  it('a thumbnail that fails to load becomes a placeholder, not a broken picture', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const card = cardByName(wrapper, 'Coastal Breeze')
    const img = card.find('img.thumbnail')
    expect(img.attributes('src')).toBe('/thumbnails/coastal-breeze.svg')
    expect(img.attributes('alt')).toBe('')
    await img.trigger('error')
    expect(card.find('img.thumbnail').exists()).toBe(false)
    expect(card.find('.thumbnail--placeholder').exists()).toBe(true)
    wrapper.unmount()
  })

  it('are not buttons themselves; Preview and Use are two real buttons named with the design', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const card = cardByName(wrapper, 'Coastal Breeze')
    expect(card.element.tagName).toBe('ARTICLE')
    expect(card.attributes('role')).toBeUndefined()
    expect(card.attributes('tabindex')).toBeUndefined()
    expect(card.findAll('button button')).toHaveLength(0)

    const nameId = card.find('h3').attributes('id')
    expect(card.attributes('aria-labelledby')).toBe(nameId)
    for (const testid of ['invitation-card-preview', 'invitation-card-use']) {
      const btn = card.find(`[data-testid="${testid}"]`)
      expect(btn.element.tagName).toBe('BUTTON')
      expect(btn.attributes('type')).toBe('button')
      expect(btn.attributes('aria-describedby')).toBe(nameId)
    }
    expect(card.find('[data-testid="invitation-card-preview"]').text()).toBe(en.onboarding.invitations.card.preview)
    expect(card.find('[data-testid="invitation-card-use"]').text()).toBe(en.onboarding.invitations.card.use)
    expect(wrapper.find('ul.invitation-grid').attributes('role')).toBe('list')
    wrapper.unmount()
  })
})

describe('choosing and previewing', () => {
  it('"Use this design" picks it: pressed, a check and the word Selected, and it is announced', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const status = wrapper.find('[data-testid="invitation-selected-status"]')
    expect(status.attributes('role')).toBe('status')
    expect(status.text()).toBe('')

    await cardByName(wrapper, 'Persian Wedding').find('[data-testid="invitation-card-use"]').trigger('click')
    await flushPromises()

    expect(onboardingStore.invitationName).toBe('t2')
    expect(onboardingStore.invitationPath).toBe('invitations/persian-wedding')
    const card = cardByName(wrapper, 'Persian Wedding')
    expect(card.attributes('data-selected')).toBe('true')
    const use = card.find('[data-testid="invitation-card-use"]')
    expect(use.attributes('aria-pressed')).toBe('true')
    expect(use.find('svg').exists()).toBe(true)
    expect(card.find('[data-testid="invitation-card-selected"]').text()).toBe(en.onboarding.invitations.selected)
    expect(status.text()).toBe(en.onboarding.invitations.card.selectedStatus.replace('{name}', 'Persian Wedding'))

    const other = cardByName(wrapper, 'Coastal Breeze')
    expect(other.find('[data-testid="invitation-card-use"]').attributes('aria-pressed')).toBe('false')
    expect(other.find('[data-testid="invitation-card-selected"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('"Preview" only looks: it opens the design and leaves the choice as it was', async () => {
    setInvitationName('t1')
    setInvitationPath('invitations/coastal-breeze')
    const wrapper = mountPage()
    await flushPromises()

    await cardByName(wrapper, 'Persian Wedding').find('[data-testid="invitation-card-preview"]').trigger('click')
    await flushPromises()

    // INV-202: in this page, not a new tab.
    expect(openSpy).not.toHaveBeenCalled()
    expect(document.querySelector('[data-testid="template-preview-frame"]').getAttribute('src'))
      .toBe('/en/invitations/persian-wedding')
    expect(onboardingStore.invitationName).toBe('t1')
    expect(onboardingStore.invitationPath).toBe('invitations/coastal-breeze')
    expect(cardByName(wrapper, 'Coastal Breeze').attributes('data-selected')).toBe('true')
    expect(cardByName(wrapper, 'Persian Wedding').attributes('data-selected')).toBe('false')
    expect(wrapper.find('[data-testid="invitation-selected-status"]').text()).toBe('')
    wrapper.unmount()
  })

  it('a click on the picture picks the design as well', async () => {
    const wrapper = mountPage()
    await flushPromises()
    await cardByName(wrapper, 'Coastal Breeze').find('.thumbnail-wrap').trigger('click')
    expect(onboardingStore.invitationName).toBe('t1')
    wrapper.unmount()
  })
})
