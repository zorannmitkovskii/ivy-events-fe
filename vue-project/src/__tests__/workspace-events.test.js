import { describe, it, expect, vi, beforeEach } from 'vitest'

const workspace = vi.fn()
const pin = vi.fn()
const unpin = vi.fn()
const getAll = vi.fn()

vi.mock('@/services/events.service', () => ({
  eventsService: {
    workspace: (...args) => workspace(...args),
    pin: (...args) => pin(...args),
    unpin: (...args) => unpin(...args),
    getAll: (...args) => getAll(...args)
  }
}))

const { default: useWorkspaceEvents } = await import('@/composables/useWorkspaceEvents')
const { resolveCurrentEvent } = await import('@/services/eventSelection.service')
const { onboardingStore, setEventId, clearOnboarding } = await import('@/store/onboarding.store')

const row = (id, pinned, extra = {}) => ({ event: { id, name: `Event ${id}`, ...extra }, pinned })

beforeEach(() => {
  vi.clearAllMocks()
  clearOnboarding()
})

describe('useWorkspaceEvents', () => {
  it('sends only the filters that are set', async () => {
    workspace.mockResolvedValue({ data: [] })
    const ws = useWorkspaceEvents()

    ws.filters.status = 'ACTIVE'
    ws.filters.from = '2026-06-01'
    await ws.load()

    expect(workspace).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ACTIVE', from: '2026-06-01', categoryType: '', to: '' })
    )
  })

  it('keeps the order the backend returned instead of re-sorting', async () => {
    workspace.mockResolvedValue({ data: [row('b', true), row('a', false)] })
    const ws = useWorkspaceEvents()

    await ws.load()

    expect(ws.events.value.map(e => e.id)).toEqual(['b', 'a'])
    expect(ws.pinnedEvents.value.map(e => e.id)).toEqual(['b'])
  })

  it('empties the list and records the error when loading fails', async () => {
    workspace.mockRejectedValue(new Error('boom'))
    const ws = useWorkspaceEvents()

    await ws.load()

    expect(ws.rows.value).toEqual([])
    expect(ws.error.value).toBeInstanceOf(Error)
  })

  it('flips the star before the request comes back', async () => {
    workspace.mockResolvedValue({ data: [row('a', false)] })
    let resolvePin
    pin.mockReturnValue(new Promise(resolve => { resolvePin = resolve }))
    const ws = useWorkspaceEvents()
    await ws.load()

    const pending = ws.togglePin('a')
    expect(ws.rows.value[0].pinned).toBe(true)

    resolvePin()
    await pending
    expect(pin).toHaveBeenCalledWith('a')
  })

  it('puts the star back when pinning fails', async () => {
    workspace.mockResolvedValue({ data: [row('a', false)] })
    pin.mockRejectedValue(new Error('nope'))
    const ws = useWorkspaceEvents()
    await ws.load()

    await ws.togglePin('a')

    expect(ws.rows.value[0].pinned).toBe(false)
    expect(ws.error.value).toBeInstanceOf(Error)
  })

  it('unpins what is already pinned', async () => {
    workspace.mockResolvedValue({ data: [row('a', true)] })
    unpin.mockResolvedValue()
    const ws = useWorkspaceEvents()
    await ws.load()

    await ws.togglePin('a')

    expect(unpin).toHaveBeenCalledWith('a')
    expect(ws.rows.value[0].pinned).toBe(false)
  })

  it('resetFilters clears every filter', async () => {
    workspace.mockResolvedValue({ data: [] })
    const ws = useWorkspaceEvents()
    ws.filters.status = 'DRAFT'
    ws.filters.to = '2026-12-31'

    ws.resetFilters()

    expect({ ...ws.filters }).toEqual({ status: '', categoryType: '', from: '', to: '' })
  })
})

describe('resolveCurrentEvent', () => {
  it('selects the only event there is', async () => {
    getAll.mockResolvedValue({ data: [{ id: 'only', categoryType: 'WEDDING', status: 'ACTIVE' }] })

    const result = await resolveCurrentEvent()

    expect(result).toMatchObject({ eventId: 'only', eventCount: 1 })
    expect(onboardingStore.eventId).toBe('only')
    expect(onboardingStore.selectedCategory).toBe('WEDDING')
  })

  it('leaves the choice to the person when there are several', async () => {
    getAll.mockResolvedValue({ data: [{ id: 'a' }, { id: 'b' }] })

    const result = await resolveCurrentEvent()

    expect(result).toMatchObject({ eventId: '', eventCount: 2 })
    expect(onboardingStore.eventId).toBe('')
  })

  it('keeps a stored selection that is still in the list', async () => {
    setEventId('b')
    getAll.mockResolvedValue({ data: [{ id: 'a' }, { id: 'b' }] })

    const result = await resolveCurrentEvent()

    expect(result).toMatchObject({ eventId: 'b', eventCount: 2 })
  })

  it('drops a stored selection the person can no longer open', async () => {
    setEventId('revoked')
    getAll.mockResolvedValue({ data: [{ id: 'a' }, { id: 'b' }] })

    const result = await resolveCurrentEvent()

    expect(result.eventId).toBe('')
    expect(onboardingStore.eventId).toBe('')
  })

  it('reports no event at all when the list is empty', async () => {
    getAll.mockResolvedValue({ data: [] })

    expect(await resolveCurrentEvent()).toMatchObject({ eventId: '', eventCount: 0, failed: false })
  })

  it('does not wipe the selection when the call fails', async () => {
    setEventId('kept')
    getAll.mockRejectedValue(new Error('offline'))

    const result = await resolveCurrentEvent()

    expect(result).toMatchObject({ eventId: 'kept', failed: true })
    expect(onboardingStore.eventId).toBe('kept')
  })
})
