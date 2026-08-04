import { computed, onBeforeUnmount, ref } from 'vue'
import { checkinService } from '@/services/checkin.service'
import { checkinQueue } from '@/services/checkinQueue'

function unwrap(response) {
  return response?.data ?? response ?? null
}

/**
 * The door, online or not (IVY-602).
 *
 * <p>One path for both. Every arrival is written to the local queue first and
 * answered instantly, then drained to the server when there is signal. Staff at
 * a door should never learn whether the wifi is working from how the app
 * behaves — they learn it from a badge that says how many are waiting to sync.
 *
 * <p>What this deliberately does not do is decide anything. Whether a code is
 * genuine, whether a family already arrived, whether a count is too high — all
 * answered by the server. A second copy of those rules on a tablet would
 * eventually disagree with the one that produced the invoice.
 */
export default function useCheckIn(eventId) {
  const roster = ref([])
  const pending = ref([])
  /** Actions the server refused, waiting for a person to decide. */
  const failures = ref([])
  const summary = ref(null)
  const online = ref(navigator.onLine)
  const syncing = ref(false)
  const error = ref(null)

  /** Names typed at the door when a phone will not wake up. */
  const search = ref('')

  /** The last scan's answer, kept so the door can act on it. */
  const lastScan = ref(null)

  // ── connectivity ─────────────────────────────────────────────────────

  function markOnline() {
    online.value = true
    drain()
  }
  function markOffline() {
    online.value = false
  }

  window.addEventListener('online', markOnline)
  window.addEventListener('offline', markOffline)
  onBeforeUnmount(() => {
    window.removeEventListener('online', markOnline)
    window.removeEventListener('offline', markOffline)
  })

  // ── loading ──────────────────────────────────────────────────────────

  /**
   * Picks up whatever this device is still holding, and the counts if there is
   * signal.
   *
   * <p>The roster comes from the page (see {@link setRoster}) because the page
   * already loads the guest list for other reasons; duplicating that fetch here
   * would mean two lists that can disagree. What this owns is the cached copy —
   * at a door with no signal it is the only copy, and it is why staff can still
   * find "Петровски" by name.
   */
  async function load() {
    error.value = null
    pending.value = await checkinQueue.pending(eventId)
    failures.value = await checkinQueue.failures(eventId)

    const cached = await checkinQueue.roster(eventId)
    if (cached) roster.value = cached.guests

    try {
      summary.value = unwrap(await checkinService.summary(eventId))
      drain()
    } catch (e) {
      // No signal is the case this whole screen is built for, not an error
      // worth interrupting anyone over. It shows through `online` and the
      // pending badge instead.
      if (!cached) error.value = e
    }
  }

  /**
   * Replaces the roster and caches it on the device.
   *
   * <p>Called by the page with the guest list it already has.
   */
  async function setRoster(guests) {
    roster.value = guests || []
    await checkinQueue.saveRoster(eventId, roster.value)
  }

  // ── scanning ─────────────────────────────────────────────────────────

  /**
   * Asks the server who a scanned code belongs to.
   *
   * <p>Needs signal, and says so plainly rather than guessing. Verifying a
   * signature on the device would be possible, but it could not know whether
   * the code had been withdrawn — and letting in somebody whose code was
   * cancelled is the one failure this is meant to prevent.
   */
  async function scan(token) {
    error.value = null
    if (!online.value) {
      lastScan.value = { outcome: 'OFFLINE', guests: [] }
      return lastScan.value
    }

    try {
      lastScan.value = unwrap(await checkinService.scan(eventId, token))
    } catch (e) {
      error.value = e
      lastScan.value = { outcome: 'ERROR', guests: [] }
    }
    return lastScan.value
  }

  // ── arriving ─────────────────────────────────────────────────────────

  /**
   * Marks people as arrived.
   *
   * <p>Returns as soon as the queue has it — a spinner while somebody stands at
   * a door is the failure the queue exists to avoid. The send is started but
   * not awaited.
   *
   * @return {{synced: Promise}} the send, for anyone who does want to wait for
   *   it. The page does not; tests do, and so would a "sync now" button.
   */
  async function arrive(entries) {
    for (const entry of entries) {
      await checkinQueue.enqueue(eventId, entry)
    }
    pending.value = await checkinQueue.pending(eventId)
    return { synced: drain() }
  }

  /**
   * Sends whatever is waiting.
   *
   * <p>Clears an action once the server has it — including when the server says
   * it already had it. A replay is a success: the fact is recorded, which is
   * all the queue was holding it for.
   *
   * <p>Sent as one batch first, because a long offline stretch is a lot of
   * round trips otherwise. If the batch is refused, each action is retried on
   * its own so one bad entry cannot hold the rest hostage — a queue that fails
   * as a unit is a queue that never drains again.
   */
  async function drain() {
    if (syncing.value || !online.value) return
    const waiting = await checkinQueue.pending(eventId)
    if (!waiting.length) return

    syncing.value = true
    try {
      await checkinService.record(eventId, waiting.map(toArrival))
      for (const action of waiting) {
        await checkinQueue.remove(action.clientActionId)
      }
    } catch (e) {
      if (isNetworkFailure(e)) {
        // Stays queued whole. This is the case the design is for.
        error.value = e
        return
      }
      await drainOneByOne(waiting)
    } finally {
      pending.value = await checkinQueue.pending(eventId)
      failures.value = await checkinQueue.failures(eventId)
      syncing.value = false
      await refreshSummary()
    }
  }

  /** Isolates the entry the server objected to, and keeps the rest moving. */
  async function drainOneByOne(waiting) {
    for (const action of waiting) {
      try {
        await checkinService.record(eventId, [toArrival(action)])
        await checkinQueue.remove(action.clientActionId)
      } catch (e) {
        if (isNetworkFailure(e)) {
          error.value = e
          return
        }
        await checkinQueue.markFailed(action.clientActionId, e?.detail || e?.message || '')
      }
    }
  }

  /**
   * A refusal is the server's answer; a network failure is no answer at all.
   *
   * <p>Only the second is worth retrying. Retrying the first forever is how a
   * queue stops draining.
   */
  function isNetworkFailure(e) {
    const status = e?.status
    return !status || status >= 500
  }

  async function refreshSummary() {
    try {
      summary.value = unwrap(await checkinService.summary(eventId))
    } catch {
      // The counts are a nicety; the queue is the point.
    }
  }

  /** Drops a parked action — the organizer deciding it should not be sent. */
  async function discardFailure(clientActionId) {
    await checkinQueue.remove(clientActionId)
    failures.value = await checkinQueue.failures(eventId)
  }

  function toArrival(action) {
    return {
      guestId: action.guestId,
      arrivedCount: action.arrivedCount,
      credentialId: action.credentialId,
      arrivedAt: action.arrivedAt,
      clientActionId: action.clientActionId,
    }
  }

  async function undo(checkInId) {
    try {
      await checkinService.undo(eventId, checkInId)
      summary.value = unwrap(await checkinService.summary(eventId))
    } catch (e) {
      error.value = e
    }
  }

  // ── derived ──────────────────────────────────────────────────────────

  /** Guests whose arrival is queued but not yet sent. */
  const queuedGuestIds = computed(() => new Set(pending.value.map(a => a.guestId)))

  const visibleRoster = computed(() => {
    const term = search.value.trim().toLowerCase()
    if (!term) return roster.value
    return roster.value.filter(guest =>
      (guest.name || '').toLowerCase().includes(term)
      || (guest.householdName || '').toLowerCase().includes(term))
  })

  const hiddenBySearch = computed(() => roster.value.length - visibleRoster.value.length)

  return {
    roster, visibleRoster, hiddenBySearch, search, setRoster,
    pending, failures, queuedGuestIds, summary,
    online, syncing, error, lastScan,
    load, scan, arrive, drain, undo, discardFailure,
  }
}
