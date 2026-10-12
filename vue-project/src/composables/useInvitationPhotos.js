import { reactive } from 'vue';
import { isNetworkError } from '@/composables/useAutosave';

/**
 * The invitation editor's photo slots (IVY-INV-403): the hero photo, the
 * story photos and the collage photos.
 *
 * A photo picked in the editor is uploaded with the invitation's save
 * (`POST/PUT /events/full`, multipart) — there is no separate upload. So the
 * state of a picked photo follows that save:
 *
 *   checking  → read in this browser (a file it cannot draw is refused)
 *   local     → a draft not in an account yet: kept until the event is created
 *   pending   → waiting for the next save
 *   uploading → part of the save that is running (with its progress)
 *   failed    → that save failed; the photo is kept here for "Try again"
 *   invalid   → refused before sending (not an image, too large, unreadable)
 *
 * and a slot without a pick shows what the event has: `saved` (the server's
 * photo), `removed` (a saved photo taken out, gone with the next save),
 * `example` (the design's demo photo) or `empty`.
 *
 * Nothing picked is shown as saved before the server has answered with
 * success, and a photo the browser cannot draw is never shown at all.
 */

/**
 * The server's limits (ivy-events-be `spring.servlet.multipart`): one file
 * up to 50 MB, one request up to 100 MB. The editor's file inputs take
 * `image/*`; the server does not narrow the image types further.
 */
export const PHOTO_MAX_FILE_BYTES = 50 * 1024 * 1024;
export const PHOTO_MAX_REQUEST_BYTES = 100 * 1024 * 1024;
export const PHOTO_ACCEPT = 'image/*';

/** Slots per kind: the hero, the story (Persian/Collage grids; Parisian uses the first), the collage. */
export const PHOTO_SLOTS = Object.freeze({ hero: 1, story: 4, collage: 6 });

export const PHOTO_STATUS = Object.freeze({
  EMPTY: 'empty',
  EXAMPLE: 'example',
  SAVED: 'saved',
  REMOVED: 'removed',
  CHECKING: 'checking',
  LOCAL: 'local',
  PENDING: 'pending',
  UPLOADING: 'uploading',
  FAILED: 'failed',
  INVALID: 'invalid',
});

/** Why a file is refused before it is sent, or null. */
export function photoProblem(file) {
  if (!file) return 'type';
  if (!String(file.type || '').startsWith('image/')) return 'type';
  if (file.size > PHOTO_MAX_FILE_BYTES) return 'tooLarge';
  return null;
}

/** Why a save carrying photos failed, in words the editor can explain. */
export function uploadFailureReason(err) {
  const status = err?.response?.status ?? err?.status;
  if (status === 413) return 'uploadTooLarge';
  if (isNetworkError(err)) return 'offline';
  return 'failed';
}

/**
 * Whether this browser can draw the file. Where the check is not available
 * (no `createImageBitmap`), the file is taken as it is.
 * @returns {true|Promise<boolean>}
 */
export function defaultCanDecode(file) {
  if (typeof createImageBitmap !== 'function') return true;
  return createImageBitmap(file)
    .then((bitmap) => { bitmap.close?.(); return true; })
    .catch(() => false);
}

function blobUrl(file) {
  try {
    return typeof URL?.createObjectURL === 'function' ? URL.createObjectURL(file) : '';
  } catch {
    return '';
  }
}

function revoke(url) {
  if (url && url.startsWith('blob:') && typeof URL?.revokeObjectURL === 'function') {
    try { URL.revokeObjectURL(url); } catch { /* already gone */ }
  }
}

/**
 * @param {object}   opts
 * @param {Function} opts.onChange    a change to save (marks the invitation unsaved)
 * @param {Function} opts.serverBacked true when saves go to an event in the account
 * @param {Function} [opts.canDecode]
 */
export function createInvitationPhotos({ onChange = () => {}, serverBacked = () => false, canDecode = defaultCanDecode } = {}) {
  const groups = reactive(Object.fromEntries(
    Object.entries(PHOTO_SLOTS).map(([name, size]) => [name, {
      size,
      // URLs of the photos the event has, in order.
      server: [],
      // Picks by slot index: { file, url, status, error, progress }.
      picks: {},
      // Saved photos taken out, by slot index.
      removed: {},
      // Bumped on every change; sent while it differs from `synced`.
      version: 0,
      synced: 0,
    }]),
  ));

  function changed(name) {
    groups[name].version += 1;
    onChange(name);
  }

  function isUsable(pick) {
    return !!pick && pick.status !== PHOTO_STATUS.INVALID && pick.status !== PHOTO_STATUS.CHECKING;
  }

  /** The URLs the event has for this kind (from the server). */
  function setServer(name, urls) {
    const g = groups[name];
    g.server = (Array.isArray(urls) ? urls : []).filter(Boolean);
    g.removed = {};
  }

  /**
   * A file chosen for a slot. Returns the reason it was refused, or null.
   * A refused file is never sent or drawn; the slot says why.
   */
  function pick(name, index, file, { url } = {}) {
    const g = groups[name];
    const before = g.picks[index];
    const hadUsable = isUsable(before);
    if (before) revoke(before.url);

    const problem = photoProblem(file);
    if (problem) {
      g.picks[index] = { file: null, url: '', status: PHOTO_STATUS.INVALID, error: problem, progress: 0 };
      if (hadUsable) changed(name);
      return problem;
    }

    g.picks[index] = { file, url: url || blobUrl(file), status: PHOTO_STATUS.CHECKING, error: null, progress: 0 };
    // The stored (reactive) entry: later checks compare against it.
    const entry = g.picks[index];
    delete g.removed[index];

    const accept = () => {
      if (g.picks[index] !== entry) return;
      entry.status = PHOTO_STATUS.PENDING;
      changed(name);
    };
    const refuse = () => {
      if (g.picks[index] !== entry) return;
      revoke(entry.url);
      g.picks[index] = { file: null, url: '', status: PHOTO_STATUS.INVALID, error: 'unreadable', progress: 0 };
      if (hadUsable) changed(name);
    };

    const ok = canDecode(file);
    if (ok === true) accept();
    else if (ok === false) refuse();
    else Promise.resolve(ok).then((yes) => (yes ? accept() : refuse()), refuse);
    return null;
  }

  /** The image of a picked photo could not be drawn after all. */
  function markBroken(name, index) {
    const g = groups[name];
    const entry = g.picks[index];
    if (!entry || entry.status === PHOTO_STATUS.INVALID) return;
    const wasUsable = isUsable(entry);
    revoke(entry.url);
    g.picks[index] = { file: null, url: '', status: PHOTO_STATUS.INVALID, error: 'unreadable', progress: 0 };
    if (wasUsable) changed(name);
  }

  /**
   * Takes a photo out of a slot: a pick is dropped (the slot shows what the
   * event has again); a saved photo is removed with the next save.
   */
  function remove(name, index) {
    const g = groups[name];
    const entry = g.picks[index];
    if (entry) {
      revoke(entry.url);
      delete g.picks[index];
      if (isUsable(entry)) changed(name);
      return;
    }
    if (g.server[index] && !g.removed[index]) {
      g.removed[index] = true;
      changed(name);
    }
  }

  /** Undoes a removal not saved yet. */
  function restore(name, index) {
    const g = groups[name];
    if (!g.removed[index]) return;
    delete g.removed[index];
    changed(name);
  }

  /** A slot as the editor shows it. `example` is the design's demo photo for it. */
  function slot(name, index, example = '') {
    const g = groups[name];
    const entry = g.picks[index];
    if (entry) {
      let status = entry.status;
      if (status === PHOTO_STATUS.PENDING && !serverBacked()) status = PHOTO_STATUS.LOCAL;
      return {
        index,
        status,
        // Nothing to draw for a refused file.
        url: status === PHOTO_STATUS.INVALID ? '' : entry.url,
        error: entry.error,
        progress: entry.progress,
        own: status !== PHOTO_STATUS.INVALID,
      };
    }
    if (g.server[index]) {
      if (g.removed[index]) return { index, status: PHOTO_STATUS.REMOVED, url: '', error: null, progress: 0, own: false };
      return { index, status: PHOTO_STATUS.SAVED, url: g.server[index], error: null, progress: 0, own: true };
    }
    if (example) return { index, status: PHOTO_STATUS.EXAMPLE, url: example, error: null, progress: 0, own: false };
    return { index, status: PHOTO_STATUS.EMPTY, url: '', error: null, progress: 0, own: false };
  }

  /** What the preview draws for a slot: the pick, the saved photo, or the example. */
  function previewUrl(name, index, example = '') {
    const s = slot(name, index, example);
    return s.status === PHOTO_STATUS.INVALID || s.status === PHOTO_STATUS.REMOVED ? '' : s.url;
  }

  function orderedPicks(name) {
    const g = groups[name];
    return Object.keys(g.picks)
      .map(Number)
      .sort((a, b) => a - b)
      .map((i) => ({ index: i, entry: g.picks[i] }))
      .filter(({ entry }) => isUsable(entry));
  }

  /** Files picked and not refused, per kind (for the draft's "add again" count). */
  function counts() {
    return Object.fromEntries(Object.keys(PHOTO_SLOTS).map((name) => [name, orderedPicks(name).length]));
  }

  /**
   * The photos to send with a save: only kinds changed since the last
   * successful save. With `layout` (an existing event), the story and
   * collage lists are also named slot by slot, so replacing or removing one
   * photo leaves the others as they are (`…ImageSlots`: a saved photo's URL
   * keeps it, null takes the next sent file).
   */
  function snapshot({ layout = false } = {}) {
    const files = {};
    const slots = {};
    const sent = [];
    const versions = {};
    for (const name of Object.keys(PHOTO_SLOTS)) {
      const g = groups[name];
      if (g.version === g.synced) continue;
      versions[name] = g.version;
      const picks = orderedPicks(name);
      picks.forEach(({ index, entry }) => sent.push({ name, index, entry }));
      if (name === 'hero') {
        if (picks[0]) files.heroImage = picks[0].entry.file;
        continue;
      }
      const list = picks.map(({ entry }) => entry.file);
      const key = name === 'story' ? 'ourStoryImages' : 'collageImages';
      if (list.length) files[key] = list;
      if (layout) {
        const order = [];
        const length = Math.max(g.size, g.server.length);
        for (let i = 0; i < length; i++) {
          if (isUsable(g.picks[i])) order.push(null);
          else if (g.server[i] && !g.removed[i]) order.push(g.server[i]);
        }
        slots[name === 'story' ? 'ourStoryImageSlots' : 'collageImageSlots'] = order;
      }
    }
    return { files, slots, sent, versions };
  }

  /** The save carrying these photos started. */
  function markUploading(snap) {
    for (const { entry } of snap?.sent || []) {
      entry.status = PHOTO_STATUS.UPLOADING;
      entry.error = null;
      entry.progress = 0;
    }
  }

  function setProgress(snap, percent) {
    for (const { entry } of snap?.sent || []) {
      if (entry.status === PHOTO_STATUS.UPLOADING) entry.progress = percent;
    }
  }

  /**
   * The save failed: the photos stay here, marked not saved, with the reason.
   * `held` — the save was not sent at all (e.g. a section could not be read):
   * they simply wait for the next one.
   */
  function markFailed(snap, err, { held = false } = {}) {
    const reason = uploadFailureReason(err);
    for (const { entry } of snap?.sent || []) {
      if (entry.status !== PHOTO_STATUS.UPLOADING && entry.status !== PHOTO_STATUS.PENDING) continue;
      entry.progress = 0;
      if (held) {
        entry.status = PHOTO_STATUS.PENDING;
        entry.error = null;
      } else {
        entry.status = PHOTO_STATUS.FAILED;
        entry.error = reason;
      }
    }
  }

  /**
   * The server confirmed the save: the sent photos are the event's now. The
   * server's answer lists them (story/collage with a layout: the whole list);
   * without it the list is worked out from what was sent.
   */
  function markSaved(snap, result) {
    if (!snap?.versions) return;
    for (const name of Object.keys(snap.versions)) {
      const g = groups[name];
      const sentHere = snap.sent.filter((s) => s.name === name);
      let next;
      if (name === 'hero') {
        const url = result?.heroImage?.url || sentHere[0]?.entry.url;
        next = url ? [url] : g.server;
      } else {
        const layoutKey = name === 'story' ? 'ourStoryImageSlots' : 'collageImageSlots';
        const answer = result?.[name === 'story' ? 'ourStoryImages' : 'collageImages'];
        const urls = Array.isArray(answer) ? answer.map((r) => r?.url).filter(Boolean) : [];
        const layout = snap.slots?.[layoutKey];
        let fromSent;
        if (layout) {
          let k = 0;
          fromSent = layout.map((u) => (u === null ? sentHere[k++]?.entry.url : u)).filter(Boolean);
        } else {
          fromSent = sentHere.length ? sentHere.map((s) => s.entry.url) : g.server;
        }
        next = urls.length === fromSent.length && urls.length ? urls : fromSent;
      }
      for (const { index, entry } of sentHere) {
        if (g.picks[index] === entry) {
          // A server URL replaces the local one; keep the local one otherwise.
          if (!next.includes(entry.url)) revoke(entry.url);
          delete g.picks[index];
        }
      }
      g.server = next;
      g.removed = {};
      g.synced = Math.max(g.synced, snap.versions[name]);
    }
  }

  /** True when a kind has photos picked or removed that are not saved yet. */
  function hasUnsaved(name) {
    const g = groups[name];
    return g.version !== g.synced;
  }

  return {
    groups,
    setServer, pick, remove, restore, markBroken,
    slot, previewUrl, counts, hasUnsaved,
    snapshot, markUploading, setProgress, markFailed, markSaved,
  };
}
