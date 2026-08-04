import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { seatingService } from '@/services/seating.service'

/** The API returns either an ApiResponse envelope or a bare payload. */
function unwrap(response) {
  return response?.data ?? response ?? null
}

/**
 * The seating editor's state (IVY-503).
 *
 * <p>Holds the plan, the guests nobody has seated, the edit lock, and the
 * selection. Everything that decides whether a move is legal lives on the
 * backend — this asks and reports, it does not re-implement the rules. A second
 * copy of "does this table fit" would eventually disagree with the one that
 * matters.
 */
export default function useSeatingEditor(eventId) {
  const tables = ref([])
  const unseated = ref([])
  const loading = ref(false)
  const error = ref(null)

  /** Guests picked for a move. Multi-select because seating a family one at a
   *  time is how a family ends up split across two tables. */
  const selectedGuestIds = ref([])
  const search = ref('')

  const lock = reactive({ granted: true, readOnly: false, holderName: '', secondsRemaining: 0 })
  let heartbeat = null

  // ── loading ──────────────────────────────────────────────────────────

  async function load() {
    loading.value = true
    error.value = null
    try {
      const [plan, waiting] = await Promise.all([
        seatingService.tables(eventId).then(unwrap),
        seatingService.unseated(eventId).then(unwrap),
      ])
      tables.value = Array.isArray(plan) ? plan : []
      unseated.value = Array.isArray(waiting) ? waiting : []
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  // ── the lock ─────────────────────────────────────────────────────────

  /**
   * Takes the editor and keeps it.
   *
   * <p>The heartbeat is what makes a two-minute lock usable: a pause to answer
   * the phone keeps it, a closed laptop does not. Refused is not an error — it
   * puts the page into read-only with a name and a countdown.
   */
  async function acquireLock() {
    const result = unwrap(await seatingService.acquireLock(eventId))
    applyLock(result)

    if (!heartbeat) {
      heartbeat = setInterval(async () => {
        try {
          applyLock(unwrap(await seatingService.acquireLock(eventId)))
        } catch {
          // A blip must not throw the editor into read-only. The next beat
          // either recovers or the lock lapses on its own.
        }
      }, 45_000)
    }
    return result
  }

  function applyLock(result) {
    lock.granted = result?.granted !== false
    lock.readOnly = result?.readOnly === true
    lock.holderName = result?.lock?.holderName || ''
    lock.secondsRemaining = result?.lock?.expiresAt
      ? Math.max(0, Math.round((new Date(result.lock.expiresAt) - Date.now()) / 1000))
      : 0
  }

  async function releaseLock() {
    clearInterval(heartbeat)
    heartbeat = null
    try {
      await seatingService.releaseLock(eventId)
    } catch {
      // It expires on its own; failing to release is not worth surfacing.
    }
  }

  // Leaving the page frees the plan for whoever is waiting.
  onBeforeUnmount(releaseLock)

  // ── moving guests ────────────────────────────────────────────────────

  /**
   * Seats the current selection at one table.
   *
   * <p>Sends the layout version the editor was showing, so a save that lost a
   * race is refused rather than silently applied. A refusal reloads: the person
   * needs to see what actually happened before deciding again.
   */
  async function seatSelection(tableId, { allowOverflow = false } = {}) {
    if (!selectedGuestIds.value.length) return { moved: 0, failure: null }

    const table = tables.value.find(t => t.id === tableId)
    const expectedVersion = table?.layoutVersion

    let moved = 0
    let failure = null
    try {
      for (const guestId of selectedGuestIds.value) {
        await seatingService.seat(eventId, { guestId, tableId, expectedVersion, allowOverflow })
        moved++
      }
      selectedGuestIds.value = []
    } catch (e) {
      failure = e
    }
    return report(failure, { moved })
  }

  /** A family moves whole or not at all — the backend refuses a partial fit. */
  async function seatHousehold(householdKey, tableId, { allowOverflow = false } = {}) {
    const table = tables.value.find(t => t.id === tableId)
    let failure = null
    try {
      await seatingService.seatHousehold(eventId, {
        householdKey, tableId, expectedVersion: table?.layoutVersion, allowOverflow,
      })
      // Seated people are no longer a pending move; leaving them selected would
      // put the next table choice back on the family that just sat down.
      selectedGuestIds.value = []
    } catch (e) {
      failure = e
    }
    return report(failure)
  }

  async function unseat(guestId) {
    let failure = null
    try {
      await seatingService.unseat(eventId, guestId)
    } catch (e) {
      failure = e
    }
    return report(failure)
  }

  /**
   * Reloads, then reports the failure — in that order.
   *
   * <p>Reloading clears `error`, so a refusal recorded before the reload is
   * erased by it. Setting it afterwards is what puts a full table in front of
   * the organizer instead of silently doing nothing.
   */
  async function report(failure, extra = {}) {
    await load()
    error.value = failure
    return { ...extra, failure }
  }

  // ── selection ────────────────────────────────────────────────────────

  function toggleSelected(guestId) {
    const at = selectedGuestIds.value.indexOf(guestId)
    if (at >= 0) selectedGuestIds.value.splice(at, 1)
    else selectedGuestIds.value.push(guestId)
  }

  function clearSelection() {
    selectedGuestIds.value = []
  }

  // ── derived ──────────────────────────────────────────────────────────

  /** Only real tables can be sat at; a stage is somewhere to look. */
  const seatableTables = computed(() =>
    tables.value.filter(t => t.elementType === 'TABLE' || !t.elementType))

  const fixedElements = computed(() =>
    tables.value.filter(t => t.elementType && t.elementType !== 'TABLE'))

  /** Filtered, but never hidden entirely: the count of what the search is
   *  hiding is shown, so a filtered list cannot look like a finished one. */
  const visibleUnseated = computed(() => {
    const term = search.value.trim().toLowerCase()
    if (!term) return unseated.value
    return unseated.value.filter(g => (g.name || '').toLowerCase().includes(term))
  })

  const hiddenBySearch = computed(() => unseated.value.length - visibleUnseated.value.length)

  /** Seats taken, counting each guest's party — a guest bringing two occupies
   *  three chairs. Mirrors what the backend counts, and is only for the badge. */
  function seatsTaken(table) {
    return (table.guests || []).reduce((sum, g) => sum + partySize(g), 0)
  }

  function partySize(guest) {
    if (guest.adultCount != null || guest.childCount != null) {
      return (guest.adultCount || 0) + (guest.childCount || 0)
    }
    return guest.numOfGuests ?? 1
  }

  function isOverfull(table) {
    return table.maxGuest != null && seatsTaken(table) > table.maxGuest
  }

  return {
    tables, unseated, loading, error,
    seatableTables, fixedElements, visibleUnseated, hiddenBySearch, search,
    selectedGuestIds, toggleSelected, clearSelection,
    lock, acquireLock, releaseLock,
    load, seatSelection, seatHousehold, unseat,
    seatsTaken, partySize, isOverfull,
  }
}
