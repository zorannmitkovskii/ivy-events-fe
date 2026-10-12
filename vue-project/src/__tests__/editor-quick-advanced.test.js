import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { h, reactive, ref } from 'vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-103 — the editor's quick start and advanced settings.
 *
 * Quick start shows Info, the content sections and RSVP; the advanced settings
 * add the entry animation, colours, fonts and (where offered) layouts. The mode
 * only filters controls: the invitation's one state is never copied or reset,
 * on desktop (sidebar) or on a phone (sheet).
 */

const desktop = ref(true)
vi.mock('@/composables/useMediaQuery', () => ({ useMediaQuery: () => desktop }))

const {
  EDITOR_MODES, EDITOR_MODE_STORAGE_KEY, tabsForMode, sectionsForMode, sectionSubTabs,
  isAdvancedSection, useEditorMode, resetEditorModeForTests,
} = await import('@/composables/useEditorMode')
const InvitationEditLayout = (await import('@/components/invitations/shared/InvitationEditLayout.vue')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })

// The same flags as the editor's SIDEBAR_SECTIONS (useWeddingInvitation).
const SECTIONS = [
  { key: 'entry', label: 'Entry', tab: 'sections', group: 'animation', advanced: true, icon: '' },
  { key: 'hero', label: 'Hero', tab: 'sections', group: 'content', mandatory: true, layout: true, icon: '' },
  { key: 'details', label: 'Details', tab: 'sections', group: 'content', layout: true, icon: '' },
  { key: 'agendaList', label: 'Schedule', tab: 'sections', group: 'content', layout: true, icon: '' },
  { key: 'ourStoryList', label: 'Our Story', tab: 'sections', group: 'content', layout: true, icon: '' },
  { key: 'ourStoryImages', label: 'Story Images', tab: 'sections', group: 'content', panel: true, icon: '' },
  { key: 'collage', label: 'Collage', tab: 'sections', group: 'animation', advanced: true, panel: true, icon: '' },
  { key: 'rsvp', label: 'RSVP', tab: 'sections', group: 'rsvp', mandatory: true, icon: '' },
  { key: 'colors', label: 'Colors', tab: 'style', group: 'look', advanced: true, panel: true, icon: '' },
  { key: 'fonts', label: 'Fonts', tab: 'style', group: 'look', advanced: true, icon: '' },
]

/**
 * A stand-in for the editor page: one reactive state, rendered in the preview
 * and edited through the section slots — like UnifiedWeddingInvitation.
 */
function mountEditor({ activeSection = null, showLayoutTab = false } = {}) {
  const state = reactive({ names: 'Ана & Марко', rsvpMax: 4, palette: 'Original', heroLayout: 'coastal' })
  const props = reactive({ activeSection })
  const slots = {
    default: () => h('div', { 'data-testid': 'preview', 'data-palette': state.palette, 'data-hero-layout': state.heroLayout }, state.names),
    'info-panel': () => h('input', {
      'data-testid': 'names', value: state.names,
      onInput: (e) => { state.names = e.target.value },
    }),
    'section-hero': ({ subTab } = {}) => subTab === 'layout'
      ? h('button', { 'data-testid': 'hero-layout-split', onClick: () => { state.heroLayout = 'split' } }, 'Split')
      : subTab === 'content' ? h('p', { 'data-testid': 'hero-content' }, 'hero photo') : null,
    'section-rsvp': ({ subTab } = {}) => subTab === 'content'
      ? h('input', { 'data-testid': 'rsvp-max', value: state.rsvpMax, onInput: (e) => { state.rsvpMax = Number(e.target.value) } })
      : null,
    'section-entry': ({ subTab } = {}) => subTab === 'content' ? h('p', { 'data-testid': 'entry-settings' }, 'entry') : null,
    'section-colors': () => h('button', { 'data-testid': 'palette-dark', onClick: () => { state.palette = 'Dark Luxe' } }, 'Dark Luxe'),
    'section-ourStoryImages': () => h('p', { 'data-testid': 'story-images' }, 'slots'),
  }
  const layout = ref(null)
  const wrapper = mount({
    render: () => h(InvitationEditLayout, {
      ref: layout,
      editMode: true,
      sections: SECTIONS,
      activeSection: props.activeSection,
      showLayoutTab,
      'onToggle-section': (key) => { props.activeSection = props.activeSection === key ? null : key },
    }, slots),
  }, { global: { plugins: [i18n] }, attachTo: document.body })
  return { wrapper, state, props, layout }
}

const tabs = (root) => root.findAll('.edit-sidebar__tabs .tab-btn').map((b) => b.attributes('data-tab'))
const modeBtn = (root, mode) => root.find(`[data-testid="editor-mode"] [data-mode="${mode}"]`)
const sidebarSections = (root) => root.findAll('.accordion-label').map((l) => l.text())

beforeEach(() => {
  localStorage.clear()
  resetEditorModeForTests()
  desktop.value = true
  document.body.innerHTML = ''
})

describe('mode rules', () => {
  it('quick start has Info and content; the advanced settings add Style', () => {
    expect(tabsForMode('quick')).toEqual(['info', 'sections'])
    expect(tabsForMode('advanced')).toEqual(['info', 'sections', 'style'])
  })

  it('quick start keeps the content sections and RSVP, without entry animation, collage, colours or fonts', () => {
    const quick = sectionsForMode(SECTIONS, 'quick', 'sections').map((s) => s.key)
    expect(quick).toEqual(['hero', 'details', 'agendaList', 'ourStoryList', 'ourStoryImages', 'rsvp'])
    expect(sectionsForMode(SECTIONS, 'quick', 'style')).toEqual([])
    // INV-501: the opening animation (and its collage) is a style control: in the Style tab.
    expect(sectionsForMode(SECTIONS, 'advanced', 'sections').map((s) => s.key)).toEqual(quick)
    expect(sectionsForMode(SECTIONS, 'advanced', 'style').map((s) => s.key)).toEqual(['entry', 'collage', 'colors', 'fonts'])
    expect(isAdvancedSection(SECTIONS[0])).toBe(true)
  })

  it('a Layout sub-tab only in the advanced settings and only where layouts are offered', () => {
    const hero = SECTIONS[1]
    expect(sectionSubTabs(hero, { mode: 'quick', layoutsAvailable: true })).toEqual(['content'])
    expect(sectionSubTabs(hero, { mode: 'advanced', layoutsAvailable: false })).toEqual(['content'])
    expect(sectionSubTabs(hero, { mode: 'advanced', layoutsAvailable: true })).toEqual(['content', 'layout'])
    expect(sectionSubTabs(SECTIONS[7], { mode: 'advanced', layoutsAvailable: true })).toEqual(['content'])
  })

  it('starts in quick start, remembers the choice and ignores an unknown stored value', () => {
    const { editorMode, setEditorMode } = useEditorMode()
    expect(editorMode.value).toBe(EDITOR_MODES.QUICK)
    setEditorMode('advanced')
    expect(localStorage.getItem(EDITOR_MODE_STORAGE_KEY)).toBe('advanced')
    resetEditorModeForTests()
    expect(editorMode.value).toBe('advanced')
    localStorage.setItem(EDITOR_MODE_STORAGE_KEY, 'expert')
    resetEditorModeForTests()
    expect(editorMode.value).toBe('quick')
    setEditorMode('nonsense')
    expect(editorMode.value).toBe('quick')
  })

  it('still works when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    const { editorMode, setEditorMode } = useEditorMode()
    setEditorMode('advanced')
    expect(editorMode.value).toBe('advanced')
    spy.mockRestore()
  })
})

describe('desktop sidebar', () => {
  it('quick start: Info and Sections only, no advanced sections; the switch says which mode is on', async () => {
    const { wrapper } = mountEditor()
    await flushPromises()
    expect(tabs(wrapper)).toEqual(['info', 'sections'])
    expect(modeBtn(wrapper, 'quick').attributes('aria-pressed')).toBe('true')
    expect(modeBtn(wrapper, 'advanced').attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('[data-testid="editor-mode"]').text()).toContain('Style is in Advanced settings')

    await wrapper.find('[data-tab="sections"]').trigger('click')
    expect(sidebarSections(wrapper)).toEqual(['Hero', 'Details', 'Schedule', 'Our Story', 'Story Images', 'RSVP'])
    wrapper.unmount()
  })

  it('a working invitation without the advanced settings: info, content and RSVP all editable', async () => {
    const { wrapper, state } = mountEditor()
    await flushPromises()
    await wrapper.find('[data-testid="names"]').setValue('Ема & Петар')
    await wrapper.find('[data-tab="sections"]').trigger('click')
    const rsvp = wrapper.findAll('.accordion-header').find((h) => h.text().includes('RSVP'))
    await rsvp.trigger('click')
    await wrapper.find('[data-testid="rsvp-max"]').setValue('6')
    expect(state).toMatchObject({ names: 'Ема & Петар', rsvpMax: 6 })
    expect(wrapper.find('[data-testid="preview"]').text()).toBe('Ема & Петар')
    expect(modeBtn(wrapper, 'quick').attributes('aria-pressed')).toBe('true')
    wrapper.unmount()
  })

  it('switching modes keeps every value, and a hidden advanced value stays on the invitation', async () => {
    const { wrapper, state } = mountEditor({ showLayoutTab: true })
    await flushPromises()
    await wrapper.find('[data-testid="names"]').setValue('Ема & Петар')

    await modeBtn(wrapper, 'advanced').trigger('click')
    expect(tabs(wrapper)).toEqual(['info', 'sections', 'style'])
    await wrapper.find('[data-tab="style"]').trigger('click')
    await wrapper.findAll('.accordion-header').find((h) => h.text().includes('Colors')).trigger('click')
    await wrapper.find('[data-testid="palette-dark"]').trigger('click')

    await wrapper.find('[data-tab="sections"]').trigger('click')
    await wrapper.findAll('.accordion-header').find((h) => h.text().includes('Hero')).trigger('click')
    expect(wrapper.findAll('.sub-tab-btn').map((b) => b.attributes('data-sub-tab'))).toEqual(['content', 'layout'])
    await wrapper.find('[data-sub-tab="layout"]').trigger('click')
    await wrapper.find('[data-testid="hero-layout-split"]').trigger('click')

    // Back to quick start: the controls go, the values do not.
    await modeBtn(wrapper, 'quick').trigger('click')
    await flushPromises()
    expect(tabs(wrapper)).toEqual(['info', 'sections'])
    expect(wrapper.find('.sub-tab-bar').exists()).toBe(false)
    expect(wrapper.find('[data-testid="hero-content"]').exists()).toBe(true)
    const preview = wrapper.find('[data-testid="preview"]')
    expect(preview.attributes('data-palette')).toBe('Dark Luxe')
    expect(preview.attributes('data-hero-layout')).toBe('split')
    expect(state).toEqual({ names: 'Ема & Петар', rsvpMax: 4, palette: 'Dark Luxe', heroLayout: 'split' })

    // And back again: still there.
    await modeBtn(wrapper, 'advanced').trigger('click')
    await wrapper.find('[data-tab="info"]').trigger('click')
    expect(wrapper.find('[data-testid="names"]').element.value).toBe('Ема & Петар')
    expect(state.palette).toBe('Dark Luxe')
    wrapper.unmount()
  })

  it('leaving the advanced settings with the Style tab open goes to Sections and closes the advanced section once', async () => {
    const { wrapper, props } = mountEditor()
    await flushPromises()
    await modeBtn(wrapper, 'advanced').trigger('click')
    await wrapper.find('[data-tab="style"]').trigger('click')
    await wrapper.findAll('.accordion-header').find((h) => h.text().includes('Colors')).trigger('click')
    expect(props.activeSection).toBe('colors')
    await modeBtn(wrapper, 'quick').trigger('click')
    await flushPromises()
    expect(props.activeSection).toBe(null)
    expect(wrapper.find('.tab-btn--active').attributes('data-tab')).toBe('sections')
    wrapper.unmount()
  })

  it('an advanced section asked for from outside (Edit entry) turns the advanced settings on and says so', async () => {
    const { wrapper, props, layout } = mountEditor()
    await flushPromises()
    layout.value.requestSection('colors')
    await flushPromises()
    expect(props.activeSection).toBe('colors')
    expect(useEditorMode().editorMode.value).toBe('advanced')
    expect(wrapper.find('.tab-btn--active').attributes('data-tab')).toBe('style')
    expect(wrapper.find('[data-testid="palette-dark"]').exists()).toBe(true)
    expect(wrapper.find('[role="status"].inv-layout__sr-only').text()).toBe('Advanced settings turned on: Colors.')
    wrapper.unmount()
  })

  it('the entry section the editor opens by itself does not switch the mode', async () => {
    const { wrapper, props } = mountEditor()
    await flushPromises()
    props.activeSection = 'entry'
    await flushPromises()
    expect(useEditorMode().editorMode.value).toBe('quick')
    expect(wrapper.find('[data-testid="entry-settings"]').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('phone sheet', () => {
  const sheet = () => document.querySelector('.mobile-sheet')
  const sheetTabs = () => [...document.querySelectorAll('.mobile-tab-btn')].map((b) => b.dataset.tab)
  const sheetItems = () => [...document.querySelectorAll('.mobile-sheet__item')].map((b) => b.dataset.section)
  const click = async (el) => { el.click(); await flushPromises() }

  beforeEach(() => { desktop.value = false })

  async function openSheet(wrapper) {
    await flushPromises()
    await click(document.querySelector('.mobile-fab--edit'))
    expect(sheet()).not.toBe(null)
    await click(document.querySelector('.mobile-tab-btn[data-tab="sections"]'))
    return wrapper
  }

  it('same grouping as the desktop: quick start without Style, advanced with it', async () => {
    const { wrapper } = mountEditor()
    await openSheet(wrapper)
    expect(sheetTabs()).toEqual(['info', 'sections'])
    expect(sheetItems()).toEqual(['hero', 'details', 'agendaList', 'ourStoryList', 'ourStoryImages', 'rsvp'])
    await click(document.querySelector('.mobile-sheet [data-mode="advanced"]'))
    expect(sheetTabs()).toEqual(['info', 'sections', 'style'])
    expect(sheetItems()).not.toContain('entry')
    await click(document.querySelector('.mobile-tab-btn[data-tab="style"]'))
    expect(sheetItems()).toEqual(['entry', 'collage', 'colors', 'fonts'])
    wrapper.unmount()
  })

  it('a section opened from the sheet shows its content (the slot gets the content sub-tab)', async () => {
    const { wrapper, props } = mountEditor()
    await openSheet(wrapper)
    await click(document.querySelector('.mobile-sheet__item[data-section="rsvp"]'))
    expect(props.activeSection).toBe('rsvp')
    expect(wrapper.find('[data-testid="rsvp-max"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('the entry section opened by the editor itself does not cover the phone; Edit entry does open it', async () => {
    const { wrapper, props, layout } = mountEditor({ activeSection: 'entry' })
    await flushPromises()
    expect(wrapper.find('[data-testid="entry-settings"]').exists()).toBe(false)
    expect(useEditorMode().editorMode.value).toBe('quick')
    layout.value.requestSection('entry')
    await flushPromises()
    expect(props.activeSection).toBe('entry')
    expect(useEditorMode().editorMode.value).toBe('advanced')
    expect(wrapper.find('[data-testid="entry-settings"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('a plain panel opens inside the sheet, with the way back to the list', async () => {
    const { wrapper } = mountEditor()
    await openSheet(wrapper)
    await click(document.querySelector('.mobile-sheet__item[data-section="ourStoryImages"]'))
    expect(document.querySelector('[data-testid="mobile-sheet-panel"] [data-testid="story-images"]')).not.toBe(null)
    await click(document.querySelector('[data-testid="mobile-panel-back"]'))
    expect(document.activeElement?.dataset.section).toBe('ourStoryImages')
    wrapper.unmount()
  })

  it('advanced values set on the phone stay after switching back to quick start', async () => {
    const { wrapper, state } = mountEditor({ showLayoutTab: true })
    await openSheet(wrapper)
    expect(document.querySelector('[data-section-layout="hero"]')).toBe(null)
    await click(document.querySelector('.mobile-sheet [data-mode="advanced"]'))
    await click(document.querySelector('[data-section-layout="hero"]'))
    await click(document.querySelector('[data-testid="hero-layout-split"]'))
    await click(document.querySelector('[data-testid="mobile-panel-back"]'))
    await click(document.querySelector('.mobile-tab-btn[data-tab="style"]'))
    await click(document.querySelector('.mobile-sheet__item[data-section="colors"]'))
    await click(document.querySelector('[data-testid="palette-dark"]'))

    await click(document.querySelector('.mobile-sheet [data-mode="quick"]'))
    expect(document.querySelector('[data-testid="mobile-sheet-panel"]')).toBe(null)
    expect(sheetTabs()).toEqual(['info', 'sections'])
    expect(state).toMatchObject({ palette: 'Dark Luxe', heroLayout: 'split' })
    expect(wrapper.find('[data-testid="preview"]').attributes('data-palette')).toBe('Dark Luxe')
    wrapper.unmount()
  })
})

describe('labels', () => {
  it('the mode labels exist in mk, en and sq', () => {
    const keys = ['label', 'quick', 'advanced', 'quickHint', 'advancedHint', 'openedAdvanced', 'back']
    for (const messages of [mk, en, sq]) {
      for (const key of keys) {
        expect(messages.editSection.editorMode[key], key).toBeTruthy()
      }
      expect(messages.editSection.editorMode.openedAdvanced).toContain('{section}')
    }
    expect(mk.editSection.editorMode.quick).toBe('Брз почеток')
    expect(mk.editSection.editorMode.advanced).toBe('Напредни поставки')
  })

  it('renders in Macedonian', async () => {
    i18n.global.locale.value = 'mk'
    const { wrapper } = mountEditor()
    await flushPromises()
    expect(modeBtn(wrapper, 'quick').text()).toBe('Брз почеток')
    expect(modeBtn(wrapper, 'advanced').text()).toBe('Напредни поставки')
    i18n.global.locale.value = 'en'
    wrapper.unmount()
  })
})
