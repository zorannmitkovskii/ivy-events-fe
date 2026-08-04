// jsdom has no IndexedDB, and the queue is the thing under test — mocking it
// away would leave nothing worth asserting.
import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * The offline queue (IVY-602).
 *
 * <p>The properties worth testing are the ones that only show up when things go
 * wrong: a queue that drains twice, a queue that never drains, and a device
 * that keeps somebody's guest list after they sign out. Each of those is quiet
 * in production, which is why they get a test rather than a look.
 */

const record = vi.fn()
const summary = vi.fn()
const scan = vi.fn()

vi.mock('@/services/checkin.service', () => ({
  checkinService: {
    record: (...args) => record(...args),
    summary: (...args) => summary(...args),
    scan: (...args) => scan(...args),
    undo: vi.fn(),
  },
}))

const { checkinQueue } = await import('@/services/checkinQueue')
const { default: useCheckIn } = await import('@/composables/useCheckIn')

const EVENT = 'event-1'

/** An error shaped the way ApiError is: a status and a detail. */
function refusal(detail, status = 400) {
  return Object.assign(new Error(detail), { status, detail })
}

function networkFailure() {
  return new Error('Network error')
}

beforeEach(async () => {
  vi.clearAllMocks()
  await checkinQueue.clearAll()
  summary.mockResolvedValue({ data: { arrivedPeople: 0, expectedPeople: 0 } })
  record.mockResolvedValue({ data: [] })
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
})

afterEach(async () => {
  await checkinQueue.clearAll()
})

describe('the queue', () => {
  it('gives every action its own id, so a retry is recognisable as a retry', async () => {
    const a = await checkinQueue.enqueue(EVENT, { guestId: 'g-1' })
    const b = await checkinQueue.enqueue(EVENT, { guestId: 'g-1' })

    expect(a.clientActionId).not.toEqual(b.clientActionId)
  })

  it('holds arrivals for one event apart from another', async () => {
    await checkinQueue.enqueue(EVENT, { guestId: 'g-1' })
    await checkinQueue.enqueue('other-event', { guestId: 'g-2' })

    expect(await checkinQueue.pending(EVENT)).toHaveLength(1)
  })

  it('keeps names and counts, not phone numbers', async () => {
    await checkinQueue.saveRoster(EVENT, [
      { id: 'g-1', name: 'Ана', numOfGuests: 2, phoneNumber: '070111222', email: 'a@b.mk', note: 'кума' },
    ])

    const cached = await checkinQueue.roster(EVENT)

    // A venue tablet left on a table is not a copy of the guest list.
    expect(cached.guests[0]).toEqual({
      id: 'g-1', name: 'Ана', partySize: 2, tableNumber: null, householdName: null,
    })
  })

  it('is emptied on sign-out — the next shift gets a clean device', async () => {
    await checkinQueue.enqueue(EVENT, { guestId: 'g-1' })
    await checkinQueue.saveRoster(EVENT, [{ id: 'g-1', name: 'Ана' }])

    await checkinQueue.clearAll()

    expect(await checkinQueue.pending(EVENT)).toHaveLength(0)
    expect(await checkinQueue.roster(EVENT)).toBeNull()
  })
})

describe('draining', () => {
  it('answers instantly and sends afterwards', async () => {
    const door = useCheckIn(EVENT)

    await (await door.arrive([{ guestId: 'g-1', arrivedCount: 2, guestName: 'Ана' }])).synced

    // The point of the queue: nobody waited for the network.
    expect(record).toHaveBeenCalled()
    expect(await checkinQueue.pending(EVENT)).toHaveLength(0)
  })

  it('keeps an arrival queued when the network is down', async () => {
    record.mockRejectedValue(networkFailure())
    const door = useCheckIn(EVENT)

    await (await door.arrive([{ guestId: 'g-1', arrivedCount: 1, guestName: 'Ана' }])).synced

    expect(await checkinQueue.pending(EVENT)).toHaveLength(1)
  })

  it('sends the same action once even when the queue is drained twice', async () => {
    const door = useCheckIn(EVENT)
    await (await door.arrive([{ guestId: 'g-1', arrivedCount: 1, guestName: 'Ана' }])).synced

    record.mockClear()
    await door.drain()

    // Nothing left to send, so nothing was sent. The server's own idempotency
    // is the backstop; not sending at all is the first line.
    expect(record).not.toHaveBeenCalled()
  })

  it('does not send anything while offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const door = useCheckIn(EVENT)

    await (await door.arrive([{ guestId: 'g-1', arrivedCount: 1, guestName: 'Ана' }])).synced

    expect(record).not.toHaveBeenCalled()
    expect(await checkinQueue.pending(EVENT)).toHaveLength(1)
  })
})

describe('a refused action', () => {
  it('does not hold the rest of the queue hostage', async () => {
    // The batch fails on one entry, then each is retried alone: the good one
    // goes through, the bad one is parked. Without this the queue would fail
    // as a unit and never drain again.
    record
      .mockRejectedValueOnce(refusal('„Ана" е заведен за 2, а пријавуваш 5 пристигнати.'))
      .mockRejectedValueOnce(refusal('„Ана" е заведен за 2, а пријавуваш 5 пристигнати.'))
      .mockResolvedValueOnce({ data: [] })

    const door = useCheckIn(EVENT)
    await (await door.arrive([
      { guestId: 'g-bad', arrivedCount: 5, guestName: 'Ана' },
      { guestId: 'g-ok', arrivedCount: 1, guestName: 'Марко' },
    ])).synced

    const stillWaiting = await checkinQueue.pending(EVENT)
    const parked = await checkinQueue.failures(EVENT)

    expect(stillWaiting).toHaveLength(0)
    expect(parked).toHaveLength(1)
    expect(parked[0].guestName).toBe('Ана')
  })

  it('carries the reason, so somebody at the door can act on it', async () => {
    record.mockRejectedValue(refusal('Гостинот не припаѓа на овој настан.'))
    const door = useCheckIn(EVENT)

    await (await door.arrive([{ guestId: 'g-1', arrivedCount: 1, guestName: 'Ана' }])).synced

    const parked = await checkinQueue.failures(EVENT)
    expect(parked[0].failedReason).toContain('не припаѓа')
  })

  it('is retried when the server is broken rather than objecting', async () => {
    record.mockRejectedValue(refusal('boom', 503))
    const door = useCheckIn(EVENT)

    await (await door.arrive([{ guestId: 'g-1', arrivedCount: 1, guestName: 'Ана' }])).synced

    // A 503 is no answer at all. Parking it would throw away a real arrival.
    expect(await checkinQueue.pending(EVENT)).toHaveLength(1)
    expect(await checkinQueue.failures(EVENT)).toHaveLength(0)
  })

  it('can be discarded by the organizer', async () => {
    record.mockRejectedValue(refusal('nope'))
    const door = useCheckIn(EVENT)
    await (await door.arrive([{ guestId: 'g-1', arrivedCount: 1, guestName: 'Ана' }])).synced

    const [parked] = await checkinQueue.failures(EVENT)
    await door.discardFailure(parked.clientActionId)

    expect(await checkinQueue.failures(EVENT)).toHaveLength(0)
  })
})

describe('scanning', () => {
  it('says it needs a connection rather than guessing', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const door = useCheckIn(EVENT)

    const result = await door.scan('some-token')

    // Verifying a signature on the device would be possible, but it could not
    // know whether the code had been withdrawn — and letting in somebody whose
    // code was cancelled is the failure this is meant to prevent.
    expect(result.outcome).toBe('OFFLINE')
    expect(scan).not.toHaveBeenCalled()
  })

  it('changes nothing on its own', async () => {
    scan.mockResolvedValue({ data: { outcome: 'VALID', guests: [{ guestId: 'g-1' }] } })
    const door = useCheckIn(EVENT)

    await door.scan('token')

    expect(record).not.toHaveBeenCalled()
    expect(await checkinQueue.pending(EVENT)).toHaveLength(0)
  })
})
