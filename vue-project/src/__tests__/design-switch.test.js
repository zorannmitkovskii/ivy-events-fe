import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory, useRoute } from 'vue-router'
import { computed, defineComponent, h, watch } from 'vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-203 — changing the design after editing has started.
 *
 * A design is only the look. Names, date, place, details, programme, story,
 * photos and RSVP settings stay; content the new design has no place for is
 * kept and named; the change shows at once and is marked unsaved. Only leaving
 * one's own (builder) design asks first — it is the one change that cannot be
 * undone.
 */

vi.mock('@/services/auth.service', () => ({
  isAuthenticated: () => false,
  getUsername: () => '',
  getEventId: () => null,
}))

const {
  hiddenContentFor, ownStoryCounts, switchableDesigns, countOwnSlots, designName, isSampleStoryImage,
} = await import('@/utils/designSwitch')
const DesignSwitcher = (await import('@/components/invitations/shared/DesignSwitcher.vue')).default
const { DESIGN_PRESETS } = await import('@/config/designPresets/index.js')

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })

beforeEach(() => {
  localStorage.clear()
  i18n.global.locale.value = 'en'
  document.body.innerHTML = ''
})

/* ------------------------------------------------------------------ */
/*  What a design does not draw                                        */
/* ------------------------------------------------------------------ */

describe('content a design has no place for', () => {
  const own = { storyPhotos: 3, chapterPhotos: 2, storyDates: 1, collagePhotos: 4 }

  it('a gallery-story design (coastal) has no story photos; collage photos need the gallery opening', () => {
    expect(hiddenContentFor({ storyFamily: 'coastal', entryType: 'envelop' }, own)).toEqual([
      { kind: 'storyPhotos', count: 3, shown: 0 },
      { kind: 'collagePhotos', count: 4 },
    ])
  })

  it('Parisian shows one story photo, no chapter photos or dates', () => {
    expect(hiddenContentFor({ storyFamily: 'parisian', entryType: 'gallery' }, own)).toEqual([
      { kind: 'storyPhotos', count: 3, shown: 1 },
      { kind: 'chapterPhotos', count: 2 },
      { kind: 'storyDates', count: 1 },
    ])
  })

  it('Editorial shows story photos and dates, not chapter photos; a hidden gallery opening hides collage photos', () => {
    expect(hiddenContentFor({ storyFamily: 'editorial', entryType: 'gallery', entryVisible: false }, own)).toEqual([
      { kind: 'chapterPhotos', count: 2 },
      { kind: 'collagePhotos', count: 4 },
    ])
  })

  it('nothing to say when the person added nothing of that kind', () => {
    expect(hiddenContentFor({ storyFamily: 'coastal', entryType: 'envelop' }, {})).toEqual([])
  })

  it("a design's example chapters are not the person's photos or dates", () => {
    const example = DESIGN_PRESETS['coastal-breeze'].defaultItems.ourStory[0]
    expect(ownStoryCounts([{ ...example, id: '_local_1' }])).toEqual({ chapterPhotos: 0, storyDates: 0 })
    expect(ownStoryCounts([
      { type: 'HOW_WE_MET', description: 'Our own words', storyDate: '2019', imageUrl: 'https://cdn.ivy/our-story/1.jpg' },
      { type: 'PROPOSAL', description: 'Under the stars, own', storyDate: '', imageUrl: example.imageUrl },
    ])).toEqual({ chapterPhotos: 1, storyDates: 1 })
    expect(isSampleStoryImage('')).toBe(true)
  })

  it('counts a slot once whether the photo was picked now or saved before', () => {
    expect(countOwnSlots(4, { 0: 'blob:a', 2: 'blob:c' }, ['https://cdn/x', 'https://cdn/y'])).toBe(3)
    expect(countOwnSlots(6, {}, [])).toBe(0)
  })
})

describe('designs offered', () => {
  it('only templates the renderer can draw, once each, active only', () => {
    const list = switchableDesigns([
      { id: 't1', name: 'Coastal Breeze', path: 'invitations/coastal-breeze', active: true },
      { id: 't2', name: 'Persian', path: 'invitations/persian-wedding' },
      { id: 't3', name: 'Copy', path: 'coastal-breeze' },
      { id: 't4', name: 'Off', path: 'invitations/editorial', active: false },
      { id: 't5', name: 'Birthday balloons', path: 'invitations/balloons' },
    ])
    expect(list.map((d) => [d.presetId, d.templateId])).toEqual([['coastal-breeze', 't1'], ['persian-wedding', 't2']])
    expect(list[1].descriptionKey).toBe('onboarding.invitations.card.designs.persian-wedding')
    expect(designName('persian-wedding', list)).toBe('Persian')
    expect(designName('editorial', list)).toBe('Editorial')
  })
})

/* ------------------------------------------------------------------ */
/*  The switch in the editor                                           */
/* ------------------------------------------------------------------ */

const DESIGNS = [
  { presetId: 'coastal-breeze', templateId: 't1', name: 'Coastal Breeze', descriptionKey: 'onboarding.invitations.card.designs.coastal-breeze', thumbnailUrl: '' },
  { presetId: 'persian-wedding', templateId: 't2', name: 'Persian Wedding', descriptionKey: 'onboarding.invitations.card.designs.persian-wedding', thumbnailUrl: '' },
]

function mountSwitcher(props = {}) {
  return mount(DesignSwitcher, {
    props: { currentId: 'coastal-breeze', currentName: 'Coastal Breeze', designs: DESIGNS, ...props },
    global: { plugins: [i18n] },
    attachTo: document.body,
  })
}

describe('DesignSwitcher', () => {
  it('names the current design; the list opens on request and says the content stays', async () => {
    const w = mountSwitcher()
    expect(w.get('[data-testid="design-switch-current"]').text()).toBe('Coastal Breeze')
    const toggle = w.get('[data-testid="design-switch-toggle"]')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(w.find('.design-switch__list').exists()).toBe(false)

    await toggle.trigger('click')
    expect(w.emitted('open')).toHaveLength(1)
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(w.text()).toContain(en.editSection.designSwitch.keepsContent)
    const current = w.get('[data-design="coastal-breeze"]')
    expect(current.attributes('aria-pressed')).toBe('true')
    expect(current.text()).toContain('Current')
    expect(w.get('[data-design="persian-wedding"]').attributes('aria-pressed')).toBe('false')
  })

  it('choosing another design switches at once — no confirmation between preset designs', async () => {
    const w = mountSwitcher()
    await w.get('[data-testid="design-switch-toggle"]').trigger('click')
    await w.get('[data-design="coastal-breeze"]').trigger('click')
    expect(w.emitted('switch')).toBeUndefined()
    await w.get('[data-design="persian-wedding"]').trigger('click')
    expect(w.emitted('switch')[0][0].presetId).toBe('persian-wedding')
    expect(w.find('[data-testid="design-switch-confirm"]').exists()).toBe(false)
  })

  it('leaving one\'s own design asks first; "keep" switches nothing and returns focus', async () => {
    const w = mountSwitcher({ currentId: 'my-wedding', currentName: 'Your own design', confirmLeaving: true })
    await w.get('[data-testid="design-switch-toggle"]').trigger('click')
    await w.get('[data-design="persian-wedding"]').trigger('click')
    await flushPromises()
    const confirm = w.get('[data-testid="design-switch-confirm"]')
    expect(confirm.attributes('role')).toBe('group')
    expect(confirm.text()).toContain('Persian Wedding')
    expect(document.activeElement).toBe(w.get('[data-testid="design-switch-confirm-yes"]').element)
    expect(w.emitted('switch')).toBeUndefined()

    await w.get('[data-testid="design-switch-confirm-no"]').trigger('click')
    await flushPromises()
    expect(w.emitted('switch')).toBeUndefined()
    expect(document.activeElement).toBe(w.get('[data-design="persian-wedding"]').element)

    await w.get('[data-design="persian-wedding"]').trigger('click')
    await flushPromises()
    await w.get('[data-testid="design-switch-confirm-yes"]').trigger('click')
    expect(w.emitted('switch')[0][0].presetId).toBe('persian-wedding')
  })

  it('names what is kept but not shown, and says nothing was deleted', () => {
    const w = mountSwitcher({ hidden: [{ kind: 'storyPhotos', count: 3, shown: 1 }, { kind: 'collagePhotos', count: 2 }] })
    const box = w.get('[data-testid="design-switch-hidden"]')
    expect(box.text()).toContain('Saved, but not shown in this design')
    expect(box.get('[data-hidden="storyPhotos"]').text()).toBe('Story photos: this design shows 1 of 3')
    expect(box.get('[data-hidden="collagePhotos"]').text()).toBe('Photos for the gallery opening (2)')
    expect(box.text()).toContain('Nothing has been deleted')
  })

  it('an existing event is told its link changes; a load error offers a retry', async () => {
    const w = mountSwitcher({ existingEvent: true, error: true, designs: [] })
    await w.get('[data-testid="design-switch-toggle"]').trigger('click')
    expect(w.get('[data-testid="design-switch-link-note"]').text()).toContain('links you have already sent keep opening the previous design')
    const alert = w.get('[role="alert"]')
    await alert.get('button').trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
  })

  it('announces the change politely', () => {
    const w = mountSwitcher({ announcement: 'Design changed to Persian Wedding. All your content is kept.' })
    const status = w.get('[role="status"]')
    expect(status.attributes('aria-live')).toBe('polite')
    expect(status.text()).toContain('Persian Wedding')
  })

  it('in Macedonian', async () => {
    i18n.global.locale.value = 'mk'
    const w = mountSwitcher({ hidden: [{ kind: 'storyPhotos', count: 2, shown: 0 }] })
    await w.get('[data-testid="design-switch-toggle"]').trigger('click')
    expect(w.text()).toContain('Дизајн')
    expect(w.text()).toContain('Фотографии за приказната (2)')
    expect(w.get('[data-design="coastal-breeze"]').text()).toContain('Тековен')
  })

  it('every new text exists in mk, en and sq', () => {
    const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]))
    const base = keys(en.editSection.designSwitch).sort()
    expect(keys(mk.editSection.designSwitch).sort()).toEqual(base)
    expect(keys(sq.editSection.designSwitch).sort()).toEqual(base)
    for (const lang of [en, mk, sq]) {
      for (const k of base) {
        const v = k.split('.').reduce((o, x) => o[x], lang.editSection.designSwitch)
        expect(typeof v === 'string' && v.trim().length > 0).toBe(true)
      }
    }
  })
})

/* ------------------------------------------------------------------ */
/*  The editor's state across a design change                          */
/* ------------------------------------------------------------------ */

const { useWeddingInvitation } = await import('@/composables/useWeddingInvitation')
const { loadDraft } = await import('@/store/invitationDraft.store')

const OWN_DRAFT = {
  eventDetails: [{ _localId: '_local_d1', type: 'CHURCH', time: '15:30', eventDate: '2099-06-12', location: { name: 'Св. Софија' } }],
  agenda: [{ _localId: '_local_a1', type: 'CEREMONY', time: '17:00', description: 'Венчавка на брегот' }],
  ourStory: [{ _localId: '_local_s1', type: 'HOW_WE_MET', description: 'Се запознавме во Охрид', storyDate: '2019' }],
  theme: {
    info: { brideName: 'Ана', groomName: 'Марко', weddingDateTime: '2099-06-12T17:30:00', eventTimezone: 'Europe/Skopje', venue: 'Охрид', location: 'Охрид, МК' },
    rsvpConfig: { deadline: '2099-05-30', maxGuests: 3, showDietary: false, borderRadius: '8px' },
  },
  sectionState: { order: [], visibility: { ourStoryList: false }, layouts: {} },
  updatedAt: new Date().toISOString(),
}

async function mountEditorState(design = 'coastal-breeze') {
  localStorage.setItem('invitation_draft_v1', JSON.stringify(OWN_DRAFT))
  loadDraft()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:lang/invitations/:design', name: 'weddingInvitation', component: { render: () => null } }],
  })
  await router.push(`/en/invitations/${design}?new=1&edit=true`)
  let inv
  // The editor page's own wiring (UnifiedWeddingInvitation): the design is the
  // route's :design; a change resets only the look and marks it unsaved.
  const Harness = defineComponent({
    setup() {
      const route = useRoute()
      const preset = computed(() => DESIGN_PRESETS[route.params.design])
      inv = useWeddingInvitation(preset.value)
      watch(() => route.params.design, (to, from) => {
        inv.resetToPreset(preset.value, { from, to })
        inv.markDirty()
      })
      return () => h('div')
    },
  })
  const wrapper = mount(Harness, { global: { plugins: [i18n, router] } })
  await flushPromises()
  return { wrapper, router, inv: () => inv }
}

// The page clears "unsaved" for this navigation (it is not leaving the
// editor, so the leave guard is not asked) and the design watcher marks it
// unsaved again.
const switchTo = async (router, design, inv) => {
  inv.clearDirty()
  await router.replace({ name: 'weddingInvitation', params: { lang: 'en', design }, query: { new: '1', edit: 'true' } })
  await flushPromises()
}

describe('editor state across a design change', () => {
  it('keeps names, details, programme, story, photos, RSVP and visibility; only the look changes', async () => {
    const { router, inv: get } = await mountEditorState()
    const inv = get()
    const photo = new File(['x'], 'hero.jpg', { type: 'image/jpeg' })
    inv.onHeroChange({ heroImageUrl: 'blob:hero', heroFile: photo })
    // INV-403: picked into a story slot (the files are read-only views of the slots).
    inv.pickPhoto('story', 0, new File(['y'], 'story.jpg', { type: 'image/jpeg' }))
    inv.clearDirty()

    expect(inv.config.brideName).toBe('Ана')
    expect(inv.agenda.items.value).toHaveLength(1)

    await switchTo(router, 'persian-wedding', inv)

    const persian = DESIGN_PRESETS['persian-wedding']
    expect(inv.heroFamily.value).toBe(persian.family)
    expect(inv.palette.accent).toBe(persian.palette.accent)
    expect(inv.entryType.value).toBe(persian.entryType)

    expect(inv.config.brideName).toBe('Ана')
    expect(inv.config.groomName).toBe('Марко')
    expect(inv.config.venue).toBe('Охрид')
    expect(inv.config.weddingDateTime).toBe('2099-06-12T17:30:00')
    expect(inv.eventDetails.items.value.map((d) => d.time)).toEqual(['15:30'])
    expect(inv.agenda.items.value.map((a) => a.description)).toEqual(['Венчавка на брегот'])
    expect(inv.ourStory.items.value.map((s) => s.description)).toEqual(['Се запознавме во Охрид'])
    expect(inv.rsvpConfig.maxGuests).toBe(3)
    expect(inv.rsvpConfig.deadline).toBe('2099-05-30')
    expect(inv.sectionVisibility.value.ourStoryList).toBe(false)
    expect(inv.heroFile.value).toBe(photo)
    expect(inv.config.heroPhotoUrl).toBe('blob:hero')
    expect(inv.ourStoryFiles.value).toHaveLength(1)
    // Unsaved until saved.
    expect(inv.dirty.value).toBe(true)
  })

  it('the saved draft carries the new design with all the content — nothing deleted', async () => {
    const { router, inv: get } = await mountEditorState()
    const inv = get()
    await switchTo(router, 'editorial', inv)
    await inv.flushBeforeLeaving()

    const draft = JSON.parse(localStorage.getItem('invitation_draft_v1'))
    expect(draft.fullPayload.invitationName).toBe('editorial')
    expect(draft.eventDetails).toHaveLength(1)
    expect(draft.agenda.map((a) => a.description)).toEqual(['Венчавка на брегот'])
    expect(draft.ourStory.map((s) => s.description)).toEqual(['Се запознавме во Охрид'])
    expect(draft.theme.info.brideName).toBe('Ана')
    expect(draft.theme.rsvpConfig.maxGuests).toBe(3)
    expect(draft.sectionState.visibility.ourStoryList).toBe(false)
    expect(draft.fullPayload.agendas?.length ?? draft.fullPayload.agenda?.length).toBe(1)
  })

  it('switching back brings back the style changed on that design in this visit', async () => {
    const { router, inv: get } = await mountEditorState()
    const inv = get()
    inv.onColorsChange({ accent: '#123456' })
    await switchTo(router, 'parisian-wedding', inv)
    expect(inv.palette.accent).toBe(DESIGN_PRESETS['parisian-wedding'].palette.accent)
    await switchTo(router, 'coastal-breeze', inv)
    expect(inv.palette.accent).toBe('#123456')
    expect(inv.config.brideName).toBe('Ана')
  })
})
