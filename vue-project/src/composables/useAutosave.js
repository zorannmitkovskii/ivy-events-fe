import { ref, readonly } from "vue";

/**
 * Autosave for the invitation editor (IVY-INV-301).
 *
 * What it promises the person editing:
 *  - Every change is first written to this device (`persistLocal`), so a
 *    failed or impossible server save never loses it.
 *  - Changes are debounced: a burst of keystrokes is one request, not one per
 *    key.
 *  - At most one request is in flight. A change made while a save is running
 *    waits for it and is sent afterwards — two overlapping saves of the same
 *    event are how a section ends up written twice.
 *  - `SYNCED` is only shown after the server answered with success, and only
 *    when nothing changed since the snapshot that was sent.
 *  - A failure leaves the local copy in place and offers `retry()`, which
 *    resends through the same single-flight path. Whether a resend is safe is
 *    the `sync` function's business: the editor sends a full replacement
 *    (PUT) or a create carrying a client-chosen idempotency key.
 */

export const SAVE_STATUS = Object.freeze({
  IDLE: "idle",
  SAVING: "saving",
  LOCAL: "local",
  SYNCED: "synced",
  OFFLINE: "offline",
  ERROR: "error",
});

export const AUTOSAVE_DEBOUNCE_MS = 1500;

/** No response at all — the request never reached the server or its answer never came back. */
// `api.js` turns a failure without a response into a plain Error carrying
// axios' message ("Network Error", "timeout of …ms exceeded") and no status.
export function isNetworkError(err) {
  if (!err) return false;
  if (err.response || err.status || err.name === "ApiError") return false;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  return (
    ["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT"].includes(err.code) ||
    /network|timeout|failed to fetch|aborted/i.test(err.message || "")
  );
}

function defaultIsOnline() {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export function createAutosave({
  snapshot,
  persistLocal = null,
  clearLocal = null,
  sync,
  canSync = () => true,
  onSynced = null,
  debounceMs = AUTOSAVE_DEBOUNCE_MS,
  isOnline = defaultIsOnline,
} = {}) {
  const status = ref(SAVE_STATUS.IDLE);
  const lastSyncedAt = ref(null);
  const lastError = ref(null);

  let revision = 0;
  let timer = null;
  let running = null;
  let again = false;
  let override = null;

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  /** A change happened. Persist/sync it once the edits pause. */
  function schedule() {
    revision += 1;
    status.value = SAVE_STATUS.SAVING;
    clearTimer();
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, debounceMs);
  }

  async function attempt() {
    const rev = revision;
    const custom = override;
    override = null;

    let snap;
    try {
      snap = custom ? custom() : snapshot();
    } catch (err) {
      lastError.value = err;
      status.value = SAVE_STATUS.ERROR;
      return { ok: false, synced: false, error: err };
    }

    let storedLocally = false;
    if (persistLocal && !custom) {
      try {
        persistLocal(snap);
        storedLocally = true;
      } catch (err) {
        console.warn("[autosave] could not keep a local copy", err);
      }
    } else if (custom) {
      storedLocally = true; // it came from the local copy
    }

    if (!canSync()) {
      if (storedLocally) {
        status.value = SAVE_STATUS.LOCAL;
        return { ok: true, synced: false, local: true };
      }
      status.value = SAVE_STATUS.ERROR;
      return { ok: false, synced: false };
    }

    if (!isOnline()) {
      status.value = SAVE_STATUS.OFFLINE;
      return { ok: false, synced: false, offline: true };
    }

    status.value = SAVE_STATUS.SAVING;
    try {
      const result = await sync(snap);
      lastError.value = null;
      lastSyncedAt.value = new Date();
      const current = rev === revision;
      if (current && clearLocal) {
        try { clearLocal(snap); } catch (_) { /* a stale local copy is harmless */ }
      }
      if (onSynced) {
        try { onSynced(result, snap); } catch (err) { console.warn("[autosave] onSynced failed", err); }
      }
      // A newer change is waiting for its own save — "synced" would be a lie.
      status.value = current ? SAVE_STATUS.SYNCED : SAVE_STATUS.SAVING;
      return { ok: true, synced: true, result };
    } catch (err) {
      lastError.value = err;
      status.value = isNetworkError(err) ? SAVE_STATUS.OFFLINE : SAVE_STATUS.ERROR;
      return { ok: false, synced: false, error: err, offline: status.value === SAVE_STATUS.OFFLINE };
    }
  }

  async function loop() {
    let outcome;
    do {
      again = false;
      outcome = await attempt();
    } while (again && outcome.ok);
    return outcome;
  }

  /**
   * Save now. Resolves with `{ ok, synced, local?, offline?, error?, result? }`
   * for the latest state. Calls made while a save is running join it and
   * cause exactly one follow-up save, never a parallel one.
   */
  function flush(opts = {}) {
    clearTimer();
    if (opts.snapshot) override = opts.snapshot;
    if (running) {
      again = true;
      return running;
    }
    running = loop().finally(() => {
      running = null;
    });
    return running;
  }

  /** Resend after a failure. Same single-flight path as any other save. */
  function retry(opts = {}) {
    return flush(opts);
  }

  /** Mark the state as only on this device (e.g. a copy left from an earlier visit). */
  function markLocal() {
    status.value = SAVE_STATUS.LOCAL;
  }

  function onOnline() {
    if (status.value === SAVE_STATUS.OFFLINE || status.value === SAVE_STATUS.ERROR) {
      flush();
    }
  }

  let listening = false;
  function start() {
    if (listening || typeof window === "undefined") return;
    window.addEventListener("online", onOnline);
    listening = true;
  }

  function dispose() {
    clearTimer();
    if (listening) {
      window.removeEventListener("online", onOnline);
      listening = false;
    }
  }

  return {
    status: readonly(status),
    lastSyncedAt: readonly(lastSyncedAt),
    lastError: readonly(lastError),
    schedule,
    flush,
    retry,
    markLocal,
    start,
    dispose,
    isPending: () => !!timer || !!running,
    hasScheduled: () => !!timer,
    /** Resolves when the save running now (if any) is done; starts nothing (INV-502). */
    whenIdle: () => running || Promise.resolve(null),
  };
}
