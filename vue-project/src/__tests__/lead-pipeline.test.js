import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * The agency pipeline (IVY-1001).
 *
 * <p>What gets tested is what goes quiet in production: a refusal that reaches
 * the console and never the screen, a "next action" nobody is chasing, and a
 * win that fires twice. Each of those looks like nothing until somebody asks
 * why a client was never called back.
 */

const pipeline = vi.fn()
const createLead = vi.fn()
const win = vi.fn()
const lose = vi.fn()
const moveTo = vi.fn()

vi.mock('@/services/crm.service', () => ({
  crmService: {
    pipeline: (...args) => pipeline(...args),
    createLead: (...args) => createLead(...args),
    win: (...args) => win(...args),
    lose: (...args) => lose(...args),
    moveTo: (...args) => moveTo(...args),
    assign: vi.fn(),
  },
}))

const { default: useLeadPipeline, LEAD_STAGES } = await import('@/composables/useLeadPipeline')

/** Shaped the way ApiError is: a status and a detail. */
function refusal(detail, status = 400) {
  return Object.assign(new Error(detail), { status, detail })
}

const today = () => new Date().toISOString().slice(0, 10)

function lead(overrides = {}) {
  return {
    id: 'lead-1',
    name: 'Свадба Ристески',
    stage: 'INQUIRY',
    nextAction: 'Јави се',
    nextActionAt: '2099-01-01',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  pipeline.mockResolvedValue({ data: [] })
})

describe('the board', () => {
  it('puts every lead in its own stage column', async () => {
    pipeline.mockResolvedValue({
      data: [
        lead({ id: 'a', stage: 'INQUIRY' }),
        lead({ id: 'b', stage: 'PROPOSAL' }),
        lead({ id: 'c', stage: 'PROPOSAL' }),
      ],
    })

    const board = useLeadPipeline()
    await board.load()

    expect(Object.keys(board.byStage.value)).toEqual(LEAD_STAGES)
    expect(board.byStage.value.PROPOSAL).toHaveLength(2)
    expect(board.byStage.value.INQUIRY).toHaveLength(1)
    expect(board.byStage.value.WON).toHaveLength(0)
  })

  it('does not drop a lead whose stage the client does not recognise', async () => {
    pipeline.mockResolvedValue({ data: [lead({ stage: 'NEGOTIATION' })] })

    const board = useLeadPipeline()
    await board.load()

    // It is absent from the columns, which is the honest rendering of a stage
    // this build has no column for — but it is still in `leads`, so a count
    // built from that does not silently lose it.
    expect(board.leads.value).toHaveLength(1)
    expect(Object.values(board.byStage.value).flat()).toHaveLength(0)
  })
})

describe('what nobody is working', () => {
  it('counts leads whose next action is due or past', async () => {
    pipeline.mockResolvedValue({
      data: [
        lead({ id: 'due', nextActionAt: today() }),
        lead({ id: 'late', nextActionAt: '2020-01-01' }),
        lead({ id: 'later', nextActionAt: '2099-01-01' }),
      ],
    })

    const board = useLeadPipeline()
    await board.load()

    expect(board.overdue.value.map((l) => l.id)).toEqual(['due', 'late'])
  })

  it('leaves closed leads out of the overdue count', async () => {
    pipeline.mockResolvedValue({
      data: [
        lead({ id: 'won', stage: 'WON', nextActionAt: '2020-01-01' }),
        lead({ id: 'lost', stage: 'LOST', nextActionAt: '2020-01-01' }),
      ],
    })

    const board = useLeadPipeline()
    await board.load()

    // A won lead with an old reminder on it is not work being dropped.
    expect(board.overdue.value).toHaveLength(0)
  })

  it('flags open leads that have no next action at all', async () => {
    pipeline.mockResolvedValue({
      data: [
        lead({ id: 'blank', nextAction: null }),
        lead({ id: 'chased' }),
        lead({ id: 'closed', stage: 'WON', nextAction: null }),
      ],
    })

    const board = useLeadPipeline()
    await board.load()

    expect(board.missingNextAction.value.map((l) => l.id)).toEqual(['blank'])
  })
})

describe('refusals reach the screen', () => {
  it('keeps the message after the reload that follows a failed action', async () => {
    pipeline.mockResolvedValue({ data: [lead()] })
    win.mockRejectedValue(refusal('Планот дозволува 5 активни настани.', 409))

    const board = useLeadPipeline()
    await board.load()
    await board.win('lead-1')

    // The bug this replaces: the reload succeeded, a `finally` cleared the
    // error, and a capacity refusal was only ever visible in the console.
    expect(board.error.value).toBe('Планот дозволува 5 активни настани.')
    expect(pipeline).toHaveBeenCalledTimes(2)
  })

  it('clears the previous message once an action succeeds', async () => {
    pipeline.mockResolvedValue({ data: [lead()] })
    lose.mockRejectedValue(refusal('Нешто тргна наопаку'))
    moveTo.mockResolvedValue({ data: lead({ stage: 'CONSULTATION' }) })

    const board = useLeadPipeline()
    await board.load()
    await board.lose('lead-1', 'PRICE', '')
    expect(board.error.value).toBeTruthy()

    await board.moveTo('lead-1', 'CONSULTATION')
    expect(board.error.value).toBeNull()
  })

  it('reports a failed create without clearing the board', async () => {
    pipeline.mockResolvedValue({ data: [lead()] })
    createLead.mockRejectedValue(refusal('Името е задолжително'))

    const board = useLeadPipeline()
    await board.load()
    const created = await board.create({ name: '' })

    expect(created).toBeNull()
    expect(board.error.value).toBe('Името е задолжително')
    expect(board.leads.value).toHaveLength(1)
  })
})

describe('winning', () => {
  it('reloads so the created event id is on the card', async () => {
    pipeline
      .mockResolvedValueOnce({ data: [lead()] })
      .mockResolvedValueOnce({ data: [lead({ stage: 'WON', convertedEventId: 'event-9' })] })
    win.mockResolvedValue({ data: lead({ stage: 'WON', convertedEventId: 'event-9' }) })

    const board = useLeadPipeline()
    await board.load()
    await board.win('lead-1')

    expect(board.byStage.value.WON[0].convertedEventId).toBe('event-9')
  })

  it('marks the lead busy while the call is in flight and releases it after', async () => {
    pipeline.mockResolvedValue({ data: [lead()] })
    let release
    win.mockReturnValue(new Promise((resolve) => { release = resolve }))

    const board = useLeadPipeline()
    await board.load()
    const running = board.win('lead-1')

    expect(board.busyLeadId.value).toBe('lead-1')
    release({ data: lead({ stage: 'WON' }) })
    await running
    // Left set, the card's buttons would stay disabled until a reload — which
    // reads as the app having hung.
    expect(board.busyLeadId.value).toBeNull()
  })
})
