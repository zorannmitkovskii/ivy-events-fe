import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * INV-401 (bug carried from INV-203) — an existing event with an empty
 * section shows the design's examples in memory. The autosave PUT is a full
 * replacement, so sending them would make them the event's real programme,
 * story and details. They are left out of the save, the saved rows still get
 * their ids, and once the person adds an entry of their own the examples go
 * from the section (the preview then shows what the guests will see).
 */

const route = { query: { edit: 'true', eventId: 'ev-9' }, params: { design: 'coastal-breeze' } }
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({}) }))
vi.mock('@/services/auth.service', () => ({ isAuthenticated: () => true, getUsername: () => null }))

vi.mock('@/services/agenda.service.js', () => ({
  agendaApi: {
    list: async () => [],
    createItem: async (eventId, payload) => ({ id: 'a-new', ...payload }),
  },
}))
vi.mock('@/services/eventDetails.service.js', () => ({
  eventDetailsService: {
    listByEvent: async () => [],
    create: async (payload) => ({ id: 'd-new', ...payload }),
  },
}))
vi.mock('@/services/ourStory.service.js', () => ({
  ourStoryApi: {
    listWithImages: async () => [],
    create: async (payload) => ({ id: 's-new', ...payload }),
  },
}))

const { useInvitationEditMode } = await import('@/composables/useInvitationEditMode')
const { withoutUnsavedExamples } = await import('@/utils/creationSteps')
const { DESIGN_PRESETS } = await import('@/config/designPresets/index.js')
const EXAMPLES = DESIGN_PRESETS['coastal-breeze'].defaultItems

beforeEach(() => localStorage.clear())

describe('an existing event with empty sections', () => {
  it("shows the design's examples, but none of them is in what a save sends", async () => {
    const edit = useInvitationEditMode()
    await edit.loadEditData()
    expect(edit.agenda.items.value).toHaveLength(EXAMPLES.agenda.length)
    expect(edit.ourStory.items.value).toHaveLength(EXAMPLES.ourStory.length)
    expect(withoutUnsavedExamples(edit.agenda.items.value, 'agenda')).toEqual([])
    expect(withoutUnsavedExamples(edit.eventDetails.items.value, 'eventDetails')).toEqual([])
    expect(withoutUnsavedExamples(edit.ourStory.items.value, 'ourStory')).toEqual([])
  })

  it("adding one's own entry removes the examples from that section only", async () => {
    const edit = useInvitationEditMode()
    await edit.loadEditData()
    await edit.handleAgendaSave({ type: 'CEREMONY', time: '17:00' })
    expect(edit.agenda.items.value).toEqual([expect.objectContaining({ id: 'a-new', type: 'CEREMONY', time: '17:00' })])
    // The story section was not touched: its examples are still shown.
    expect(edit.ourStory.items.value).toHaveLength(EXAMPLES.ourStory.length)

    await edit.handleOurStorySave({ type: 'HOW_WE_MET', description: 'Наши зборови' }, null)
    expect(edit.ourStory.items.value.map((s) => s.id)).toEqual(['s-new'])
  })

  it('the saved rows get their ids; the examples between them stay as they are', () => {
    const edit = useInvitationEditMode()
    const example = { ...EXAMPLES.agenda[0] }
    edit.agenda.items.value = [example, { type: 'CEREMONY', time: '16:30' }]
    edit.ourStory.items.value = [{ ...EXAMPLES.ourStory[0] }, { type: 'PROPOSAL', description: 'Наше' }]
    edit.adoptSavedIds(
      { agendas: [{ id: 'a1', type: 'CEREMONY' }], ourStories: [{ id: 's1', type: 'PROPOSAL', displayOrder: 1 }] },
      { agendas: [{ type: 'CEREMONY' }], ourStories: [{ type: 'PROPOSAL', displayOrder: 1 }] },
    )
    expect(edit.agenda.items.value.map((x) => x.id)).toEqual([undefined, 'a1'])
    expect(edit.agenda.items.value[0]).toEqual(example)
    expect(edit.ourStory.items.value.map((x) => x.id)).toEqual([undefined, 's1'])
  })
})
