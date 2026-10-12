import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent, h, nextTick, reactive, ref } from 'vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-503 — keyboard and screen reader support in the invitation editor.
 *
 * Main actions work with the keyboard alone (tabs with arrows, sections as
 * real buttons, Escape closes), focus goes somewhere predictable when a
 * panel, dialog or sheet opens and closes, states are said in words (not only
 * colour), labels and errors are tied to their fields, and the custom colours
 * are checked for readability.
 */

const desktop = ref(true)
vi.mock('@/composables/useMediaQuery', () => ({ useMediaQuery: () => desktop }))
vi.mock('@/services/auth.service', () => ({
  isAuthenticated: () => false,
  getUsername: () => '',
  getEventId: () => null,
}))

const { resetEditorModeForTests } = await import('@/composables/useEditorMode')
const InvitationEditLayout = (await import('@/components/invitations/shared/InvitationEditLayout.vue')).default
const BaseModal = (await import('@/components/ui/BaseModal.vue')).default
const EditInfoPanel = (await import('@/components/invitations/shared/EditInfoPanel.vue')).default
const EditAgendaModal = (await import('@/components/modals/EditAgendaModal.vue')).default
const EditRsvpModal = (await import('@/components/modals/EditRsvpModal.vue')).default
const EditFontsModal = (await import('@/components/modals/EditFontsModal.vue')).default
const EditEntryModal = (await import('@/components/modals/EditEntryModal.vue')).default
const AddOurStoryModal = (await import('@/components/modals/AddOurStoryModal.vue')).default
const DateInput = (await import('@/components/generic/DateInput.vue')).default
const { useWeddingInvitation } = await import('@/composables/useWeddingInvitation')
const { DESIGN_PRESETS } = await import('@/config/designPresets/index.js')
const { readabilityChecks } = await import('@/utils/colorReadability')
const { tabFromKey } = await import('@/utils/tablist')

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })

const SECTIONS = [
  { key: 'hero', label: 'Hero photo', tab: 'sections', group: 'content', mandatory: true, icon: '' },
  { key: 'agendaList', label: 'Programme', tab: 'sections', group: 'content', icon: '' },
  { key: 'ourStoryImages', label: 'Story photos', tab: 'sections', group: 'content', panel: true, switch: false, icon: '' },
  { key: 'rsvp', label: 'RSVP', tab: 'sections', group: 'rsvp', mandatory: true, icon: '' },
  { key: 'colors', label: 'Colors', tab: 'style', group: 'look', advanced: true, panel: true, switch: false, icon: '' },
]

const key = (el, k, opts = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts }))
const click = async (el) => { el.click(); await flushPromises() }

function mountEditor({ activeSection = null } = {}) {
  const props = reactive({ activeSection, visibility: {} })
  const wrapper = mount({
    render: () => h(InvitationEditLayout, {
      editMode: true,
      sections: SECTIONS,
      activeSection: props.activeSection,
      sectionVisibility: props.visibility,
      'onToggle-section': (k) => { props.activeSection = props.activeSection === k ? null : k },
      'onToggle-visibility': (k) => { props.visibility = { ...props.visibility, [k]: props.visibility[k] === false } },
    }, {
      'section-agendaList': () => h(EditAgendaModal, {
        open: true,
        items: [{ id: 'a-1', type: 'CEREMONY', time: '16:30' }],
        onClose: () => { props.activeSection = null },
      }),
      'section-rsvp': () => h('input', { 'data-testid': 'rsvp-field', 'aria-label': 'Deadline' }),
      'section-hero': () => h('button', { 'data-testid': 'hero-pick' }, 'Pick'),
      'section-ourStoryImages': () => h('button', { 'data-testid': 'story-slot' }, 'Photo 1'),
      'info-panel': () => h('input', { 'data-testid': 'info-name', 'aria-label': 'Name' }),
    }),
  }, { global: { plugins: [i18n] }, attachTo: document.body })
  return { wrapper, props }
}

beforeEach(() => {
  localStorage.clear()
  resetEditorModeForTests()
  desktop.value = true
  i18n.global.locale.value = 'en'
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('tab list keys', () => {
  it('arrows wrap, Home / End go to the ends, other keys do nothing', () => {
    const tabs = ['info', 'sections', 'style']
    expect(tabFromKey('ArrowRight', tabs, 'style')).toBe('info')
    expect(tabFromKey('ArrowLeft', tabs, 'info')).toBe('style')
    expect(tabFromKey('Home', tabs, 'style')).toBe('info')
    expect(tabFromKey('End', tabs, 'info')).toBe('style')
    expect(tabFromKey('a', tabs, 'info')).toBe(null)
  })
})

describe('BaseModal', () => {
  const mounted = []
  afterEach(() => { mounted.splice(0).forEach((w) => w.unmount()) })

  function mountModal(props = {}, { panel = false } = {}) {
    const events = { close: 0 }
    const opener = document.createElement('button')
    opener.textContent = 'Open'
    document.body.appendChild(opener)
    opener.focus()
    const wrapper = mount(BaseModal, {
      props: { open: true, title: 'Programme', ...props, onClose: () => { events.close++ } },
      slots: { default: () => h('input', { 'data-testid': 'first-field' }), footer: () => h('button', { 'data-testid': 'last' }, 'Done') },
      global: { plugins: [i18n], ...(panel ? { provide: { editPanelMode: ref(true) } } : {}) },
      attachTo: document.body,
    })
    mounted.push(wrapper)
    return { wrapper, events, opener }
  }

  it('mounted already open (as the editor mounts it), it is a labelled dialog that answers Escape — the INV-103 bug', async () => {
    const { events } = mountModal()
    await flushPromises()
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent).toBe('Programme')
    expect(document.activeElement.dataset.testid).toBe('first-field')
    expect(document.querySelector('.ivy-modal__close').getAttribute('aria-label')).toBe('Close')
    key(document.activeElement, 'Escape')
    expect(events.close).toBe(1)
  })

  it('Tab stays inside, and focus returns to what opened it on close', async () => {
    const { wrapper, opener } = mountModal()
    await flushPromises()
    document.querySelector('[data-testid="last"]').focus()
    key(document.activeElement, 'Tab')
    expect(document.activeElement.classList.contains('ivy-modal__close')).toBe(true)
    key(document.activeElement, 'Tab', { shiftKey: true })
    expect(document.activeElement.dataset.testid).toBe('last')
    await wrapper.setProps({ open: false })
    await flushPromises()
    expect(document.activeElement).toBe(opener)
    expect(document.body.style.overflow).toBe('')
  })

  it('two open: Escape closes only the top one', async () => {
    const first = mountModal({ title: 'First' })
    await flushPromises()
    const second = mountModal({ title: 'Second' })
    await flushPromises()
    key(document.activeElement, 'Escape')
    expect(second.events.close).toBe(1)
    expect(first.events.close).toBe(0)
  })

  it('inside the sidebar it is not a modal dialog; a sub-form takes the focus and Escape goes back to its list only', async () => {
    const { events } = mountModal({ subModal: true }, { panel: true })
    await flushPromises()
    expect(document.querySelector('[role="dialog"]')).toBe(null)
    expect(document.activeElement.classList.contains('ivy-modal__back')).toBe(true)
    const outer = vi.fn()
    document.body.addEventListener('keydown', outer)
    key(document.activeElement, 'Escape')
    expect(events.close).toBe(1)
    expect(outer).not.toHaveBeenCalled()
    document.body.removeEventListener('keydown', outer)
  })
})

describe('desktop sidebar', () => {
  it('the tabs are a tab list: one tab stop, aria-selected, arrows select and focus', async () => {
    const { wrapper } = mountEditor()
    await flushPromises()
    const tablist = document.querySelector('.edit-sidebar__tabs')
    expect(tablist.getAttribute('role')).toBe('tablist')
    const tab = (k) => document.querySelector(`.tab-btn[data-tab="${k}"]`)
    expect(tab('info').getAttribute('aria-selected')).toBe('true')
    expect(tab('info').tabIndex).toBe(0)
    expect(tab('sections').tabIndex).toBe(-1)
    tab('info').focus()
    key(tab('info'), 'ArrowRight')
    await flushPromises()
    expect(tab('sections').getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tab('sections'))
    const panel = document.getElementById(tab('sections').getAttribute('aria-controls'))
    expect(panel.getAttribute('role')).toBe('tabpanel')
    expect(panel.getAttribute('aria-labelledby')).toBe(tab('sections').id)
    wrapper.unmount()
  })

  it('a section opens from a real button (aria-expanded); Escape in it closes it and focus is back on its button', async () => {
    const { wrapper, props } = mountEditor()
    await flushPromises()
    await click(document.querySelector('.tab-btn[data-tab="sections"]'))
    const trigger = document.querySelector('[data-section-trigger="rsvp"]')
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    await click(trigger)
    expect(props.activeSection).toBe('rsvp')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const region = document.getElementById(trigger.getAttribute('aria-controls'))
    expect(region.getAttribute('aria-labelledby')).toBe(trigger.id)
    region.querySelector('[data-testid="rsvp-field"]').focus()
    key(document.activeElement, 'Escape')
    await flushPromises()
    expect(props.activeSection).toBe(null)
    expect(document.activeElement).toBe(document.querySelector('[data-section-trigger="rsvp"]'))
    wrapper.unmount()
  })

  it('a section that closes by its own Close button gives the focus to its header, not the page', async () => {
    const { wrapper, props } = mountEditor()
    await flushPromises()
    await click(document.querySelector('.tab-btn[data-tab="sections"]'))
    await click(document.querySelector('[data-section-trigger="agendaList"]'))
    const close = [...document.querySelectorAll('.accordion-content button')].find((b) => b.textContent.trim() === 'Close')
    close.focus()
    await click(close)
    expect(props.activeSection).toBe(null)
    expect(document.activeElement).toBe(document.querySelector('[data-section-trigger="agendaList"]'))
    wrapper.unmount()
  })

  it('the visibility switch is a named switch next to the button, "Hidden" in words', async () => {
    const { wrapper, props } = mountEditor()
    await flushPromises()
    await click(document.querySelector('.tab-btn[data-tab="sections"]'))
    const sw = document.querySelector('[data-section-toggle="agendaList"]')
    expect(sw.getAttribute('role')).toBe('switch')
    expect(sw.closest('.accordion-trigger')).toBe(null)
    await click(sw)
    expect(props.visibility.agendaList).toBe(false)
    expect(sw.getAttribute('aria-checked')).toBe('false')
    expect(document.querySelector('[data-section-trigger="agendaList"]').textContent).toContain('Hidden')
    wrapper.unmount()
  })

  it('the preview width buttons have names and say which one is on', async () => {
    const { wrapper } = mountEditor()
    await flushPromises()
    const btn = (d) => document.querySelector(`[data-preview-device="${d}"]`)
    expect(btn('mobile').getAttribute('aria-label')).toBe('Mobile')
    expect(btn('desktop').getAttribute('aria-pressed')).toBe('true')
    expect(btn('mobile').getAttribute('aria-pressed')).toBe('false')
    wrapper.unmount()
  })
})

describe('phone sheet', () => {
  beforeEach(() => { desktop.value = false })
  const customize = () => document.querySelector('[data-testid="mobile-customize"]')

  it('is a dialog: focus starts on Close, Tab stays inside, Escape closes it and focus is back on Customize', async () => {
    const { wrapper } = mountEditor()
    await flushPromises()
    await click(customize())
    await flushPromises()
    const sheet = document.querySelector('[data-testid="mobile-sheet"]')
    expect(sheet.getAttribute('role')).toBe('dialog')
    expect(document.getElementById(sheet.getAttribute('aria-labelledby')).textContent).toBe('Customize')
    expect(document.activeElement.getAttribute('aria-label')).toBe('Close')
    key(document.activeElement, 'Tab', { shiftKey: true })
    expect(sheet.contains(document.activeElement)).toBe(true)
    key(document.activeElement, 'Escape')
    await flushPromises()
    expect(document.querySelector('[data-testid="mobile-sheet"]')).toBe(null)
    expect(document.activeElement).toBe(customize())
    wrapper.unmount()
  })

  it('the sheet tabs use the arrows; a panel takes the focus to its Back button and Escape goes back to the list first', async () => {
    const { wrapper } = mountEditor()
    await flushPromises()
    await click(customize())
    const tab = (k) => document.querySelector(`.mobile-tab-btn[data-tab="${k}"]`)
    expect(tab('info').getAttribute('role')).toBe('tab')
    tab('info').focus()
    key(tab('info'), 'End')
    await flushPromises()
    expect(tab('sections').getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tab('sections'))
    await click(document.querySelector('.mobile-sheet__item[data-section="ourStoryImages"]'))
    await flushPromises()
    expect(document.activeElement.dataset.testid).toBe('mobile-panel-back')
    key(document.activeElement, 'Escape')
    await flushPromises()
    expect(document.querySelector('[data-testid="mobile-sheet"]')).not.toBe(null)
    expect(document.activeElement).toBe(document.querySelector('.mobile-sheet__item[data-section="ourStoryImages"]'))
    wrapper.unmount()
  })

  it('a section dialog opened from the sheet answers Escape, and focus comes back to Customize', async () => {
    const { wrapper, props } = mountEditor()
    await flushPromises()
    await click(customize())
    await click(document.querySelector('.mobile-tab-btn[data-tab="sections"]'))
    await click(document.querySelector('.mobile-sheet__item[data-section="agendaList"]'))
    await flushPromises()
    expect(props.activeSection).toBe('agendaList')
    const dialog = document.querySelector('[role="dialog"].ivy-modal')
    expect(dialog.contains(document.activeElement)).toBe(true)
    key(document.activeElement, 'Escape')
    await flushPromises()
    expect(props.activeSection).toBe(null)
    expect(document.activeElement).toBe(customize())
    wrapper.unmount()
  })
})

describe('labels and errors tied to their fields', () => {
  const describedTexts = (el) => (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent.trim())

  it('Info: a field the stepper reports is invalid says why, and the field is read with it', async () => {
    const w = mount(EditInfoPanel, {
      props: { brideName: '', groomName: 'Марко', weddingDate: '2020-01-01', invalidFields: ['brideName'] },
      global: { plugins: [i18n] },
      attachTo: document.body,
    })
    await flushPromises()
    const bride = w.get('[data-info-field="brideName"]').element
    expect(bride.getAttribute('aria-invalid')).toBe('true')
    expect(describedTexts(bride)[0]).toContain("Enter the bride's name.")
    expect(w.get('[data-info-field="groomName"]').attributes('aria-describedby')).toBeUndefined()
    // The past date warning is read with the date field.
    expect(describedTexts(w.get('[data-info-field="date"]').element).join(' ')).toContain('already passed')
    w.unmount()
  })

  it('programme items: a real toggle button with aria-expanded, a named delete, labelled fields', async () => {
    const w = mount(EditAgendaModal, {
      props: { open: true, items: [{ id: 'a-1', type: 'CEREMONY', time: '16:30' }] },
      global: { plugins: [i18n], provide: { editPanelMode: ref(true) } },
      attachTo: document.body,
    })
    const toggle = w.get('.item-toggle')
    expect(toggle.element.tagName).toBe('BUTTON')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(w.get('.icon-btn--danger').attributes('aria-label')).toBe('Delete: Ceremony')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    const body = document.getElementById(toggle.attributes('aria-controls'))
    const type = body.querySelector('select')
    expect(body.querySelector(`label[for="${type.id}"]`).textContent).toBe('Type')
    const time = body.querySelector('[role="group"]')
    expect(document.getElementById(time.getAttribute('aria-labelledby')).textContent).toBe('Start Time')
    expect([...time.querySelectorAll('select')].map((s) => s.getAttribute('aria-label'))).toEqual(['Hours', 'Minutes'])
    w.unmount()
  })

  it('RSVP: the deadline has its label and is read with its problem; choices are pressed and ticked, not only coloured', async () => {
    const w = mount(EditRsvpModal, {
      props: { open: true, liveEdit: true, rsvpDeadline: '2099-12-31', eventDateTime: '2099-06-01T16:00', contactMethod: 'sms', borderRadius: '12px' },
      global: { plugins: [i18n], provide: { editPanelMode: ref(true) } },
      attachTo: document.body,
    })
    await flushPromises()
    const deadline = w.get('[data-rsvp-field="deadline"] input[type="text"]').element
    expect(document.querySelector(`label[for="${deadline.id}"]`).textContent).toBe('RSVP Deadline')
    expect(deadline.getAttribute('aria-invalid')).toBe('true')
    expect(describedTexts(deadline).join(' ')).toContain(w.get('[data-testid="rsvp-deadline-warning"]').text().replace(/^!\s*/, ''))
    const sms = w.findAll('.chip').find((c) => c.attributes('aria-pressed') === 'true')
    expect(sms.text()).toBe('✓ SMS')
    expect(w.findAll('.chip').filter((c) => c.attributes('aria-pressed') === 'true')).toHaveLength(1)
    const radius = w.findAll('.radius-chip')
    expect(radius.map((r) => r.attributes('aria-label'))).toEqual(['Corners: 4px', 'Corners: 8px', 'Corners: 12px', 'Corners: 24px'])
    expect(radius[2].attributes('aria-pressed')).toBe('true')
    expect(radius[2].find('.radius-check').exists()).toBe(true)
    expect(w.findAll('.stepper-btn').map((b) => b.attributes('aria-label'))).toEqual(['Fewer: Max Guests', 'More: Max Guests'])
    w.unmount()
  })

  it('fonts and opening designs: the chosen one is pressed and ticked', () => {
    const fonts = mount(EditFontsModal, {
      props: { open: true, liveEdit: true, currentHeading: 'Lora', currentBody: 'Lato' },
      global: { plugins: [i18n], provide: { editPanelMode: ref(true) } },
    })
    const pressed = fonts.findAll('.font-btn[aria-pressed="true"]').map((b) => b.text())
    expect(pressed).toEqual(['✓ Lora', '✓ Lato'])
    expect(fonts.findAll('[role="group"]')).toHaveLength(2)
    const entry = mount(EditEntryModal, {
      props: { open: true, liveEdit: true, currentType: 'heart', currentDesign: 'pulse' },
      global: { plugins: [i18n], provide: { editPanelMode: ref(true) } },
    })
    expect(entry.findAll('.design-card[aria-pressed="true"]').map((b) => b.text())).toEqual(['✓ Pulse'])
    const select = entry.get('select').element
    expect(entry.get(`label[for="${select.id}"]`).exists()).toBe(true)
  })

  it('story: the photo picker and "show title" are buttons the keyboard can use', async () => {
    const w = mount(AddOurStoryModal, {
      props: { open: true, subModal: true },
      global: { plugins: [i18n], provide: { editPanelMode: ref(true) } },
      attachTo: document.body,
    })
    await flushPromises()
    expect(w.get('.image-upload-area').element.tagName).toBe('BUTTON')
    const sw = w.get('.toggle-row')
    expect(sw.attributes('role')).toBe('switch')
    const before = sw.attributes('aria-checked')
    await sw.trigger('click')
    expect(sw.attributes('aria-checked')).not.toBe(before)
    w.unmount()
  })

  it('the date field: the hidden native picker is not a tab stop; id and messages reach the visible field', () => {
    const w = mount(DateInput, { props: { modelValue: '', inputId: 'd1', describedBy: 'e1', invalid: true } })
    const [text, picker] = w.findAll('input')
    expect(text.attributes('id')).toBe('d1')
    expect(text.attributes('aria-describedby')).toBe('e1')
    expect(text.attributes('aria-invalid')).toBe('true')
    expect(picker.attributes('tabindex')).toBe('-1')
    expect(picker.attributes('aria-hidden')).toBe('true')
  })
})

describe('readability of the custom colours', () => {
  it('passes the readable pairs (short #fff too), flags the unreadable ones, leaves out what is not a hex', () => {
    const checks = readabilityChecks({
      text: '#1f2937', rootBg: '#fff', sectionBg: '#333333', cardBg: '#f9fafb',
      buttonText: '#ffffff', buttonBg: 'linear-gradient(#000, #fff)',
    })
    expect(checks.map((c) => c.key)).toEqual(['textOnBackground', 'textOnSections', 'textOnCards'])
    expect(checks.find((c) => c.key === 'textOnBackground').passes).toBe(true)
    const sections = checks.find((c) => c.key === 'textOnSections')
    expect(sections.passes).toBe(false)
    expect(sections.ratio).toBeLessThan(4.5)
  })

  it('every preset palette of the editor is readable for body text', async () => {
    // The light/dark palettes offered in the Colors panel (the same values).
    const palettes = [
      ['#F7F2E8', '#111111', '#161616'], ['#F6F1E8', '#1C2520', '#222C25'], ['#F8F5EE', '#1B2432', '#202B3A'],
      ['#322A2C', '#F7EFF1', '#F4E9EC'], ['#3A312F', '#FAF4EE', '#F6EBE4'], ['#31372F', '#F6F5EF', '#EEEDE3'],
      ['#2D3640', '#F4F7FA', '#EBF1F7'], ['#312E38', '#F7F4FA', '#F0EBF6'], ['#3B312D', '#FFF6F0', '#FCEEE4'],
      ['#352E2D', '#F5F2F0', '#F0E8E7'],
    ]
    for (const [text, rootBg, sectionBg] of palettes) {
      const checks = readabilityChecks({ text, rootBg, sectionBg })
      expect(checks.every((c) => c.passes)).toBe(true)
    }
  })
})

describe('the editor\'s control names follow the language (INV-501 known issue)', () => {
  it('SIDEBAR_SECTIONS labels change with the locale, without a reload', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:lang/invitations/:design', name: 'weddingInvitation', component: { render: () => null } }],
    })
    await router.push('/en/invitations/coastal-breeze?new=1&edit=true')
    let inv
    const Harness = defineComponent({
      setup() {
        inv = useWeddingInvitation(DESIGN_PRESETS['coastal-breeze'])
        return () => h('ul', inv.SIDEBAR_SECTIONS.map((s) => h('li', s.label)))
      },
    })
    const w = mount(Harness, { global: { plugins: [i18n, router] } })
    await flushPromises()
    const agenda = () => inv.SIDEBAR_SECTIONS.find((s) => s.key === 'agendaList').label
    expect(agenda()).toBe(en.editSection.controls.agendaList)
    i18n.global.locale.value = 'mk'
    await nextTick()
    expect(agenda()).toBe(mk.editSection.controls.agendaList)
    expect(w.text()).toContain(mk.editSection.controls.agendaList)
    w.unmount()
  })
})

describe('texts', () => {
  it('the new texts exist in all three languages, without vue-i18n special characters', () => {
    const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`]))
    const keys = flat(en.editSection.a11y).sort()
    for (const messages of [mk, sq]) expect(flat(messages.editSection.a11y).sort()).toEqual(keys)
    for (const messages of [en, mk, sq]) {
      for (const k of keys) {
        const value = k.split('.').reduce((o, part) => o[part], messages.editSection.a11y)
        expect(value.replace(/\{[a-z]+\}/g, '')).not.toMatch(/[|@{}]/)
      }
    }
  })

  it('the mode hints are short (two lines at most on a phone)', () => {
    for (const messages of [en, mk, sq]) {
      expect(messages.editSection.editorMode.quickHint.length).toBeLessThanOrEqual(100)
      expect(messages.editSection.editorMode.advancedHint.length).toBeLessThanOrEqual(70)
    }
  })
})
