import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent, h, reactive, ref } from 'vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-501 — basic and advanced controls of the invitation editor.
 *
 * The controls are grouped by task, the same on the desktop sidebar and in the
 * phone sheet: basic tasks first (Info; Content = the invitation's sections,
 * then RSVP; Preview as guest), the rare style controls apart in the advanced
 * Style tab (animation: opening animation + collage photos; colours and fonts;
 * layouts as a section's sub-tab). Built on INV-103's one mode — the grouping
 * never copies or resets a value, and the saved section order is not changed.
 */

const desktop = ref(true)
vi.mock('@/composables/useMediaQuery', () => ({ useMediaQuery: () => desktop }))
vi.mock('@/services/auth.service', () => ({
  isAuthenticated: () => false,
  getUsername: () => '',
  getEventId: () => null,
}))

const {
  EDITOR_GROUPS, groupOf, tabOf, groupedSectionsForMode, sectionsForMode, isAdvancedSection,
  useEditorMode, resetEditorModeForTests, hasVisibilitySwitch,
} = await import('@/composables/useEditorMode')
const InvitationEditLayout = (await import('@/components/invitations/shared/InvitationEditLayout.vue')).default
const { useWeddingInvitation } = await import('@/composables/useWeddingInvitation')
const { DESIGN_PRESETS } = await import('@/config/designPresets/index.js')

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })

/** The editor's real state (useWeddingInvitation) — its SIDEBAR_SECTIONS and section state. */
async function realEditorState() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:lang/invitations/:design', name: 'weddingInvitation', component: { render: () => null } }],
  })
  await router.push('/en/invitations/coastal-breeze?new=1&edit=true')
  let inv
  const Harness = defineComponent({
    setup() {
      inv = useWeddingInvitation(DESIGN_PRESETS['coastal-breeze'])
      return () => h('div')
    },
  })
  const wrapper = mount(Harness, { global: { plugins: [i18n, router] } })
  await flushPromises()
  return { wrapper, inv }
}

function mountLayout(sections, { activeSection = null, dirty = false, visibility = {} } = {}) {
  const props = reactive({ activeSection, sectionVisibility: visibility })
  const events = { preview: 0, visibility: [] }
  const wrapper = mount({
    render: () => h(InvitationEditLayout, {
      editMode: true,
      sections,
      activeSection: props.activeSection,
      sectionVisibility: props.sectionVisibility,
      dirty,
      'onToggle-section': (key) => { props.activeSection = props.activeSection === key ? null : key },
      'onPreview-guest': () => { events.preview += 1 },
      'onToggle-visibility': (key) => { events.visibility.push(key) },
    }, {
      default: () => h('div', { 'data-testid': 'preview' }),
      'info-panel': () => h('input', { 'data-testid': 'names' }),
    }),
  }, { global: { plugins: [i18n] }, attachTo: document.body })
  return { wrapper, props, events }
}

const click = async (el) => { el.click(); await flushPromises() }

/** The groups and their controls on the sidebar: [[group, [section, …]], …]. */
const sidebarGroups = (root) => [...root.querySelectorAll('aside.edit-sidebar .control-group')]
  .map((g) => [g.dataset.group, [...g.querySelectorAll('.accordion-label')].map((l) => l.textContent.trim())])
/** The same in the sheet, by section key. */
const sheetGroups = () => [...document.querySelectorAll('.mobile-sheet__group')]
  .map((g) => [g.dataset.group, [...g.querySelectorAll('.mobile-sheet__item')].map((b) => b.dataset.section)])

beforeEach(() => {
  localStorage.clear()
  resetEditorModeForTests()
  desktop.value = true
  i18n.global.locale.value = 'en'
  document.body.innerHTML = ''
})

describe('grouping rules', () => {
  it('basic task groups first (content, RSVP), then the advanced style groups (animation, colours and fonts)', () => {
    expect(EDITOR_GROUPS.map((g) => [g.key, g.tab, g.advanced])).toEqual([
      ['content', 'sections', false],
      ['rsvp', 'sections', false],
      ['animation', 'style', true],
      ['look', 'style', true],
    ])
  })

  it('a control without a known group falls back on its data tab', () => {
    expect(groupOf({ tab: 'style' }).key).toBe('look')
    expect(groupOf({ tab: 'sections' }).key).toBe('content')
    expect(groupOf({ tab: 'sections', group: 'nonsense' }).key).toBe('content')
    expect(tabOf({ tab: 'sections', group: 'animation' })).toBe('style')
    expect(isAdvancedSection({ tab: 'sections', group: 'animation' })).toBe(true)
  })

  it('groups come in their order whatever the saved section order; within a group the given order stays', () => {
    const sections = [
      { key: 'rsvp', group: 'rsvp' },
      { key: 'entry', group: 'animation', advanced: true },
      { key: 'ourStoryList', group: 'content' },
      { key: 'hero', group: 'content' },
    ]
    expect(groupedSectionsForMode(sections, 'advanced', 'sections').map((g) => [g.key, g.sections.map((s) => s.key)]))
      .toEqual([['content', ['ourStoryList', 'hero']], ['rsvp', ['rsvp']]])
    expect(sectionsForMode(sections, 'advanced', 'sections').map((s) => s.key)).toEqual(['ourStoryList', 'hero', 'rsvp'])
    expect(groupedSectionsForMode(sections, 'quick', 'style')).toEqual([])
  })
})

describe('the editor\'s real controls (SIDEBAR_SECTIONS)', () => {
  it('Content holds the same basic tasks in both modes; Style has the animation and the colours and fonts', async () => {
    const { wrapper, inv } = await realEditorState()
    const sections = inv.orderedSections.value
    const shape = (mode, tab) => groupedSectionsForMode(sections, mode, tab).map((g) => [g.key, g.sections.map((s) => s.key)])
    const content = [
      ['content', ['hero', 'details', 'agendaList', 'ourStoryList', 'ourStoryImages']],
      ['rsvp', ['rsvp']],
    ]
    expect(shape('quick', 'sections')).toEqual(content)
    expect(shape('advanced', 'sections')).toEqual(content)
    expect(shape('quick', 'style')).toEqual([])
    expect(shape('advanced', 'style')).toEqual([['animation', ['entry', 'collage']], ['look', ['colors', 'fonts']]])
    // The labels are the same nouns the rest of the editor uses.
    expect(sections.map((s) => s.label)).toEqual([
      'Opening animation', 'Cover photo', 'Event details', 'Programme', 'Our story', 'Story photos',
      'Collage photos', 'RSVP', 'Colors', 'Fonts',
    ])
    wrapper.unmount()
  })

  it('a show/hide switch only where the invitation draws that visibility', async () => {
    const { wrapper, inv } = await realEditorState()
    expect(inv.orderedSections.value.filter(hasVisibilitySwitch).map((s) => s.key))
      .toEqual(['entry', 'details', 'agendaList', 'ourStoryList'])
    wrapper.unmount()
  })

  it('the saved section order is not changed by the grouping (entry and collage stay in the data tab)', async () => {
    const { wrapper, inv } = await realEditorState()
    // orderedSections = the saved sectionOrder, then the data tab 'style'.
    expect(inv.orderedSections.value.map((s) => s.key)).toEqual([
      'entry', 'hero', 'details', 'agendaList', 'ourStoryList', 'ourStoryImages', 'collage', 'rsvp', 'colors', 'fonts',
    ])
    expect(inv.SIDEBAR_SECTIONS.filter((s) => s.tab === 'sections').map((s) => s.key))
      .toEqual(['entry', 'hero', 'details', 'agendaList', 'ourStoryList', 'ourStoryImages', 'collage', 'rsvp'])
    wrapper.unmount()
  })

  it('switching modes does not reset hidden advanced values (layout, hidden opening animation, order)', async () => {
    const { wrapper, inv } = await realEditorState()
    const { setEditorMode } = useEditorMode()
    const snapshot = () => JSON.stringify({
      layouts: { ...inv.sectionLayouts },
      visibility: inv.sectionVisibility.value,
      order: inv.orderedSections.value.map((s) => s.key),
    })
    setEditorMode('advanced')
    inv.setLayout('hero', 'split')
    inv.toggleVisibility('entry')
    const before = snapshot()
    setEditorMode('quick')
    await flushPromises()
    expect(snapshot()).toBe(before)
    setEditorMode('advanced')
    await flushPromises()
    expect(snapshot()).toBe(before)
    expect(inv.sectionLayouts.hero).toBe('split')
    expect(inv.isSectionVisible('entry')).toBe(false)
    wrapper.unmount()
  })
})

describe('desktop sidebar', () => {
  it('Content: two named groups without the advanced badge; Style: the advanced groups, badged in words', async () => {
    const { wrapper: state, inv } = await realEditorState()
    const { wrapper } = mountLayout(inv.orderedSections.value)
    await flushPromises()
    const root = document.body
    expect([...root.querySelectorAll('.edit-sidebar__tabs .tab-btn')].map((b) => b.textContent.trim())).toEqual(['Info', 'Content'])
    await click(root.querySelector('.tab-btn[data-tab="sections"]'))
    expect(sidebarGroups(root)).toEqual([
      ['content', ['Cover photo', 'Event details', 'Programme', 'Our story', 'Story photos']],
      ['rsvp', ['RSVP']],
    ])
    const group = root.querySelector('.control-group[data-group="content"]')
    expect(group.getAttribute('role')).toBe('group')
    expect(document.getElementById(group.getAttribute('aria-labelledby')).textContent.trim()).toBe('Invitation sections')
    expect(root.querySelector('.control-group__badge')).toBe(null)

    await click(root.querySelector('[data-testid="editor-mode"] [data-mode="advanced"]'))
    expect([...root.querySelectorAll('.edit-sidebar__tabs .tab-btn')].map((b) => b.textContent.trim())).toEqual(['Info', 'Content', 'Style'])
    // The basic tasks are not mixed with style controls in the advanced settings either.
    expect(sidebarGroups(root).map(([g]) => g)).toEqual(['content', 'rsvp'])
    await click(root.querySelector('.tab-btn[data-tab="style"]'))
    expect(sidebarGroups(root)).toEqual([
      ['animation', ['Opening animation', 'Collage photos']],
      ['look', ['Colors', 'Fonts']],
    ])
    expect([...root.querySelectorAll('.control-group__title')].map((t) => t.textContent.trim()))
      .toEqual(['Animation Advanced', 'Colors and fonts Advanced'])
    wrapper.unmount()
    state.unmount()
  })

  it('no switch (nor "Hidden") on controls whose visibility the invitation does not draw; the saved value is kept', async () => {
    const { wrapper: state, inv } = await realEditorState()
    const visibility = { collage: false, colors: false, agendaList: false }
    const { wrapper } = mountLayout(inv.orderedSections.value, { visibility })
    await flushPromises()
    await click(document.querySelector('[data-testid="editor-mode"] [data-mode="advanced"]'))
    await click(document.querySelector('.tab-btn[data-tab="sections"]'))
    expect([...document.querySelectorAll('aside [data-section-toggle]')].map((b) => b.dataset.sectionToggle))
      .toEqual(['details', 'agendaList', 'ourStoryList'])
    await click(document.querySelector('.tab-btn[data-tab="style"]'))
    expect([...document.querySelectorAll('aside [data-section-toggle]')].map((b) => b.dataset.sectionToggle)).toEqual(['entry'])
    expect(document.querySelector('aside [data-testid="section-hidden-badge"]')).toBe(null)
    expect(visibility).toEqual({ collage: false, colors: false, agendaList: false })
    wrapper.unmount()
    state.unmount()
  })

  it('the opening animation the editor opens by itself does not move a quick-start person to a hidden tab', async () => {
    const { wrapper: state, inv } = await realEditorState()
    const { wrapper, props } = mountLayout(inv.orderedSections.value)
    await flushPromises()
    props.activeSection = 'entry'
    await flushPromises()
    const active = () => document.querySelector('.edit-sidebar__tabs .tab-btn--active')?.dataset.tab
    expect(active()).toBe('info')
    props.activeSection = null
    await flushPromises()
    // In the advanced settings it shows where it lives: Style.
    await click(document.querySelector('[data-testid="editor-mode"] [data-mode="advanced"]'))
    props.activeSection = 'entry'
    await flushPromises()
    expect(active()).toBe('style')
    wrapper.unmount()
    state.unmount()
  })
})

describe('phone sheet', () => {
  beforeEach(() => { desktop.value = false })

  async function openSheet() {
    await flushPromises()
    await click(document.querySelector('.mobile-fab--edit'))
  }

  it('the same tabs, groups, order and labels as the sidebar, in both modes', async () => {
    const { wrapper: state, inv } = await realEditorState()
    const sections = inv.orderedSections.value
    const { wrapper } = mountLayout(sections)
    await openSheet()
    const expectSameAsSidebar = (mode, tab) => {
      const expected = groupedSectionsForMode(sections, mode, tab).map((g) => [g.key, g.sections.map((s) => s.key)])
      expect(sheetGroups()).toEqual(expected)
    }
    expect([...document.querySelectorAll('.mobile-tab-btn')].map((b) => b.textContent.trim())).toEqual(['Info', 'Content'])
    await click(document.querySelector('.mobile-tab-btn[data-tab="sections"]'))
    expectSameAsSidebar('quick', 'sections')
    expect([...document.querySelectorAll('.mobile-sheet__group-title')].map((t) => t.textContent.trim()))
      .toEqual(['Invitation sections', 'Guest replies'])

    await click(document.querySelector('.mobile-sheet [data-mode="advanced"]'))
    expectSameAsSidebar('advanced', 'sections')
    await click(document.querySelector('.mobile-tab-btn[data-tab="style"]'))
    expectSameAsSidebar('advanced', 'style')
    expect([...document.querySelectorAll('.mobile-sheet__group-title')].map((t) => t.textContent.trim()))
      .toEqual(['Animation Advanced', 'Colors and fonts Advanced'])
    wrapper.unmount()
    state.unmount()
  })

  it('show/hide and the "Hidden" word on the phone too, like the sidebar', async () => {
    const { wrapper: state, inv } = await realEditorState()
    const { wrapper, events } = mountLayout(inv.orderedSections.value, { visibility: { agendaList: false } })
    await openSheet()
    await click(document.querySelector('.mobile-tab-btn[data-tab="sections"]'))
    const toggle = document.querySelector('.mobile-sheet [data-section-toggle="agendaList"]')
    expect(toggle.getAttribute('role')).toBe('switch')
    expect(toggle.getAttribute('aria-checked')).toBe('false')
    expect(toggle.getAttribute('aria-label')).toBe('Show “Programme” on the invitation')
    expect(document.querySelector('.mobile-sheet [data-section="agendaList"] [data-testid="section-hidden-badge"]').textContent).toBe('Hidden')
    // Mandatory sections (cover photo, RSVP) have no switch.
    expect(document.querySelector('.mobile-sheet [data-section-toggle="hero"]')).toBe(null)
    expect(document.querySelector('.mobile-sheet [data-section-toggle="rsvp"]')).toBe(null)
    await click(toggle)
    expect(events.visibility).toEqual(['agendaList'])
    wrapper.unmount()
    state.unmount()
  })

  it('Preview as guest is in the sheet (a basic task); Save shows only when there is something to save', async () => {
    const { wrapper: state, inv } = await realEditorState()
    const { wrapper, events } = mountLayout(inv.orderedSections.value)
    await openSheet()
    expect(document.querySelector('.mobile-sheet__save')).toBe(null)
    const preview = document.querySelector('[data-testid="sheet-preview-as-guest"]')
    expect(preview.textContent.trim()).toBe('Preview as guest')
    await click(preview)
    expect(events.preview).toBe(1)
    expect(document.querySelector('.mobile-sheet')).toBe(null)
    wrapper.unmount()

    const dirty = mountLayout(inv.orderedSections.value, { dirty: true })
    await openSheet()
    const footer = [...document.querySelectorAll('.mobile-sheet__footer button')].map((b) => b.textContent.trim())
    expect(footer).toEqual(['Preview as guest', 'Save'])
    dirty.wrapper.unmount()
    state.unmount()
  })
})

describe('labels', () => {
  const GROUP_KEYS = ['content', 'rsvp', 'animation', 'look', 'advancedBadge']
  const CONTROL_KEYS = ['entry', 'hero', 'details', 'agendaList', 'ourStoryList', 'ourStoryImages', 'collage', 'rsvp', 'colors', 'fonts']

  it('every new label exists in mk, en and sq', () => {
    for (const messages of [mk, en, sq]) {
      const e = messages.editSection
      for (const key of GROUP_KEYS) expect(e.editorGroups[key], key).toBeTruthy()
      for (const tab of ['info', 'sections', 'style']) expect(e.editorGroups.tabs[tab], tab).toBeTruthy()
      for (const key of CONTROL_KEYS) expect(e.controls[key], key).toBeTruthy()
      for (const text of [...Object.values(e.controls), ...Object.values(e.editorGroups.tabs)]) {
        expect(text).not.toMatch(/[|@{}]/)
      }
    }
  })

  it('one term per thing: the controls use the editor\'s own names, the hint names the tabs as they are labelled', () => {
    for (const messages of [mk, en, sq]) {
      const e = messages.editSection
      expect(e.controls.details).toBe(e.sectionStates.names.eventDetails)
      expect(e.controls.agendaList).toBe(e.sectionStates.names.agenda)
      expect(e.controls.ourStoryList).toBe(e.sectionStates.names.ourStory)
      expect(e.controls.hero).toBe(e.photos.hero)
      const hint = e.editorMode.quickHint
      for (const tab of Object.values(e.editorGroups.tabs)) expect(hint).toContain(tab)
      expect(hint).toContain(e.previewAsGuest)
      if (messages !== sq) expect(hint).toContain(e.editorMode.advanced) // sq declines it: „Cilësimet e avancuara“
    }
    expect(mk.editSection.editorGroups.tabs).toEqual({ info: 'Инфо', sections: 'Содржина', style: 'Стил' })
  })

  it('renders the groups in Macedonian', async () => {
    i18n.global.locale.value = 'mk'
    const { wrapper } = mountLayout([
      { key: 'hero', label: 'Насловна фотографија', tab: 'sections', group: 'content', mandatory: true, icon: '' },
      { key: 'rsvp', label: 'RSVP', tab: 'sections', group: 'rsvp', mandatory: true, icon: '' },
    ])
    await flushPromises()
    await click(document.querySelector('.tab-btn[data-tab="sections"]'))
    expect([...document.querySelectorAll('.control-group__title')].map((t) => t.textContent.trim()))
      .toEqual(['Делови на поканата', 'Одговори од гостите'])
    expect(document.querySelector('.tab-btn[data-tab="sections"]').textContent.trim()).toBe('Содржина')
    wrapper.unmount()
  })
})
