/**
 * The offline queue for check-in (IVY-602).
 *
 * <p>An arrival recorded at the door is a fact about the world. If the network
 * is down, the fact does not stop being true — it waits here until it can be
 * told. Everything staff do goes through this queue whether or not there is
 * signal, so there is one code path and not a fragile online one plus a rarely
 * exercised offline one.
 *
 * <p>Every queued action carries a `clientActionId` chosen here. That id is
 * what makes draining the queue safe: the server records the first arrival
 * with a given id and reports every repeat as a replay. Without it, a retry
 * after a timeout that actually succeeded would count the same family twice,
 * and a wrong headcount is worse than a visible failure — nobody goes looking
 * for it.
 *
 * <p>What is deliberately NOT stored: phone numbers, emails, notes. The queue
 * holds guest ids and counts. A tablet left on a table at a venue is not a
 * copy of the guest list.
 */

const DB_NAME = 'ivy-checkin'
const DB_VERSION = 1
const STORE_QUEUE = 'pending-arrivals'
const STORE_ROSTER = 'roster'

let dbPromise = null

function openDb() {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const queue = db.createObjectStore(STORE_QUEUE, { keyPath: 'clientActionId' })
        queue.createIndex('eventId', 'eventId')
      }
      if (!db.objectStoreNames.contains(STORE_ROSTER)) {
        db.createObjectStore(STORE_ROSTER, { keyPath: 'eventId' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

function tx(storeName, mode, work) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    const request = work(store)

    transaction.oncomplete = () => resolve(request?.result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  }))
}

/**
 * A unique id for one action, stable across retries.
 *
 * Prefixed with the device's own session so two tablets cannot collide, and
 * suffixed with a counter so one tablet cannot collide with itself.
 */
let counter = 0
function newActionId() {
  counter += 1
  return `${deviceId()}/${Date.now()}/${counter}`
}

const DEVICE_KEY = 'ivy-checkin-device'

function deviceId() {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = (crypto.randomUUID?.() || String(Math.random()).slice(2)).slice(0, 8)
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export const checkinQueue = {
  /**
   * Records an arrival locally and returns it immediately.
   *
   * <p>The caller does not wait for the network. At a door, a spinner while
   * somebody stands there is the failure — the queue exists so the answer is
   * always instant and the truth catches up.
   */
  async enqueue(eventId, { guestId, arrivedCount = 0, credentialId = null, guestName = '' }) {
    const action = {
      clientActionId: newActionId(),
      eventId,
      guestId,
      guestName,
      arrivedCount,
      credentialId,
      arrivedAt: new Date().toISOString(),
      queuedAt: Date.now(),
    }
    await tx(STORE_QUEUE, 'readwrite', store => store.put(action))
    return action
  },

  /** Waiting to be sent. Excludes anything the server has already refused —
   *  see {@link markFailed}. */
  async pending(eventId) {
    const all = await tx(STORE_QUEUE, 'readonly', store => store.getAll())
    return (all || []).filter(action => action.eventId === eventId && !action.failedReason)
  },

  /** Refused by the server and waiting for a person to decide. */
  async failures(eventId) {
    const all = await tx(STORE_QUEUE, 'readonly', store => store.getAll())
    return (all || []).filter(action => action.eventId === eventId && action.failedReason)
  },

  /**
   * Parks an action the server refused.
   *
   * <p>Without this, one bad action blocks the queue forever: the batch fails,
   * everything stays, and the next attempt fails on the same action. Parking it
   * lets the rest through and puts the problem in front of somebody who can
   * answer it — which is what "shown for resolution" has to mean at a door.
   */
  async markFailed(clientActionId, reason) {
    const existing = await tx(STORE_QUEUE, 'readonly', store => store.get(clientActionId))
    if (!existing) return null
    const parked = { ...existing, failedReason: reason || 'refused', failedAt: Date.now() }
    await tx(STORE_QUEUE, 'readwrite', store => store.put(parked))
    return parked
  },

  async remove(clientActionId) {
    return tx(STORE_QUEUE, 'readwrite', store => store.delete(clientActionId))
  },

  /**
   * The guest list, kept so the door still works with no signal.
   *
   * <p>Names, party sizes and table numbers only — see the note at the top
   * about what a tablet left on a table should not be.
   */
  async saveRoster(eventId, guests) {
    const safe = guests.map(g => ({
      id: g.id,
      name: g.name,
      partySize: g.partySize ?? g.numOfGuests ?? 1,
      tableNumber: g.tableNumber ?? null,
      householdName: g.householdName ?? null,
    }))
    return tx(STORE_ROSTER, 'readwrite', store =>
      store.put({ eventId, guests: safe, cachedAt: Date.now() }))
  },

  async roster(eventId) {
    const row = await tx(STORE_ROSTER, 'readonly', store => store.get(eventId))
    return row || null
  },

  /**
   * Wipes everything this device holds.
   *
   * <p>Called on sign-out. A shared venue tablet passed to the next shift must
   * not still be carrying the last event's guest list — and the queue goes too,
   * because unsent arrivals belong to whoever was signed in.
   */
  async clearAll() {
    await tx(STORE_QUEUE, 'readwrite', store => store.clear())
    await tx(STORE_ROSTER, 'readwrite', store => store.clear())
  },

  /** Exposed for tests and for showing the device id in a support screen. */
  deviceId,
}
