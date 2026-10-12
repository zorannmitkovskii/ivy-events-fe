import { reactive } from "vue";
import { clearCreationProgress } from "@/store/onboarding.store";

const STORAGE_KEY = "invitation_draft_v1";
// How long an untouched draft is kept on this device; every change restarts it.
export const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const defaultState = () => ({
  eventDetails: [],
  agenda: [],
  ourStory: [],
  theme: null,
  sectionState: null,
  fullPayload: null,
  // Idempotency key for the POST /events/full this draft becomes (IVY-INV-301).
  // Chosen once per draft and reused by every retry, so a create whose answer
  // was lost cannot make a second event.
  clientRequestId: null,
  // Photos picked as a guest (INV-104). File objects cannot be written to
  // localStorage, so they live only as long as the page; this remembers how
  // many there were, so the editor can ask for them again after sign-in
  // instead of dropping them without a word. { hero, story, collage }.
  pendingFiles: null,
  // INV-303: a create of this draft was sent ({ at, account }) and its outcome
  // is not known yet. Cleared together with the draft once the server answers
  // with the event. A later sign-in of the same account resends it with the
  // same key (the server replays the first event) instead of asking again.
  createSent: null,
  // INV-402: the sections a design's starter entries were already written
  // into ({ agenda: true, … }). Emptying such a section is the person's
  // choice; reopening the editor must not fill it with the examples again.
  seeded: null,
  updatedAt: null,
});

export const draftStore = reactive(defaultState());

export function generateLocalId() {
  return `_local_${crypto.randomUUID()}`;
}

/* ------------------------------------------------------------------ */
/*  What happened to a draft that could not be opened (INV-302)        */
/* ------------------------------------------------------------------ */
// A draft past its TTL is removed, and one that cannot be parsed cannot be
// opened. Either way the person hears about it rather than finding an empty
// form — and is never promised it can be brought back. The note survives a
// reload (the loss happens on load, possibly on a page that does not show it)
// until it is read or the draft is discarded.
//
//  - expired:    older than the TTL; removed. `updatedAt` = its last change.
//  - unreadable: not valid JSON / not a draft; removed.
//  - partial:    opened, but parts of the wrong shape were left out.

const NOTICE_KEY = "invitation_draft_notice_v1";
export const DRAFT_NOTICE = Object.freeze({ EXPIRED: "expired", UNREADABLE: "unreadable", PARTIAL: "partial" });

function rememberNotice(kind, updatedAt = null) {
  try {
    localStorage.setItem(NOTICE_KEY, JSON.stringify({ kind, updatedAt, at: new Date().toISOString() }));
  } catch { /* storage refused: the note is lost, not the handling */ }
}

/** @returns {null | {kind: string, updatedAt: string|null}} */
export function getDraftNotice() {
  try {
    const saved = JSON.parse(localStorage.getItem(NOTICE_KEY) || "null");
    if (!saved || !Object.values(DRAFT_NOTICE).includes(saved.kind)) return null;
    return { kind: saved.kind, updatedAt: typeof saved.updatedAt === "string" ? saved.updatedAt : null };
  } catch {
    return null;
  }
}

export function clearDraftNotice() {
  try { localStorage.removeItem(NOTICE_KEY); } catch { /* ignore */ }
}

/** When a draft last changed at `updatedAt` is removed by the TTL. Null when unknown. */
export function draftExpiresAt(updatedAt) {
  const t = updatedAt ? new Date(updatedAt).getTime() : NaN;
  return Number.isNaN(t) ? null : new Date(t + DRAFT_TTL_MS).toISOString();
}

const isPlainObject = (v) => v != null && typeof v === "object" && !Array.isArray(v);

function itemsOf(value, report) {
  if (value == null) return [];
  if (!Array.isArray(value)) { report.dropped = true; return []; }
  const items = value.filter(isPlainObject);
  if (items.length !== value.length) report.dropped = true;
  return items;
}

function objectOrNull(value, report) {
  if (value == null) return null;
  if (isPlainObject(value)) return value;
  report.dropped = true;
  return null;
}

/**
 * Reads the saved draft. Never throws: an expired draft is removed (with the
 * onboarding progress that belonged to it), an unreadable one is removed, and
 * parts of the wrong shape are left out — each leaves a note (INV-302).
 */
export function loadDraft() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    saved = undefined;
  }
  if (!isPlainObject(saved)) {
    console.warn("[invitationDraft] the saved draft could not be read; it was removed");
    clearDraft();
    rememberNotice(DRAFT_NOTICE.UNREADABLE);
    return;
  }

  const report = { dropped: false };
  let updatedAt = typeof saved.updatedAt === "string" ? saved.updatedAt : null;
  if (updatedAt && Number.isNaN(new Date(updatedAt).getTime())) {
    updatedAt = null;
    report.dropped = true;
  }

  // TTL check — discard stale drafts
  if (updatedAt && Date.now() - new Date(updatedAt).getTime() > DRAFT_TTL_MS) {
    clearDraft();
    // The type, basics and design chosen for it were part of the same draft:
    // offering them back as "your draft" would resurrect what the TTL removed.
    clearCreationProgress();
    rememberNotice(DRAFT_NOTICE.EXPIRED, updatedAt);
    return;
  }

  draftStore.eventDetails = itemsOf(saved.eventDetails, report);
  draftStore.agenda = itemsOf(saved.agenda, report);
  draftStore.ourStory = itemsOf(saved.ourStory, report);
  draftStore.theme = objectOrNull(saved.theme, report);
  draftStore.sectionState = objectOrNull(saved.sectionState, report);
  draftStore.fullPayload = objectOrNull(saved.fullPayload, report);
  draftStore.clientRequestId = typeof saved.clientRequestId === "string" ? saved.clientRequestId : null;
  draftStore.pendingFiles = objectOrNull(saved.pendingFiles, report);
  draftStore.createSent = createSentOf(saved.createSent, report);
  draftStore.seeded = objectOrNull(saved.seeded, report);
  draftStore.updatedAt = updatedAt;
  if (report.dropped) rememberNotice(DRAFT_NOTICE.PARTIAL, updatedAt);
}

export function saveDraft() {
  draftStore.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    eventDetails: draftStore.eventDetails,
    agenda: draftStore.agenda,
    ourStory: draftStore.ourStory,
    theme: draftStore.theme,
    sectionState: draftStore.sectionState,
    fullPayload: draftStore.fullPayload,
    clientRequestId: draftStore.clientRequestId,
    pendingFiles: draftStore.pendingFiles,
    createSent: draftStore.createSent,
    seeded: draftStore.seeded,
    updatedAt: draftStore.updatedAt,
  }));
}

export function clearDraft() {
  Object.assign(draftStore, defaultState());
  localStorage.removeItem(STORAGE_KEY);
}

export function hasDraft() {
  return (
    draftStore.eventDetails.length > 0 ||
    draftStore.agenda.length > 0 ||
    draftStore.ourStory.length > 0 ||
    draftStore.theme !== null ||
    draftStore.sectionState !== null ||
    draftStore.fullPayload !== null
  );
}

export function getDraftTheme() {
  return draftStore.theme;
}

export function setDraftTheme(theme) {
  draftStore.theme = theme;
  saveDraft();
}

export function getDraftSectionState() {
  return draftStore.sectionState;
}

export function setDraftSectionState(state) {
  draftStore.sectionState = state;
  saveDraft();
}

export function getDraftFullPayload() {
  return draftStore.fullPayload;
}

export function setDraftFullPayload(payload) {
  draftStore.fullPayload = payload;
  saveDraft();
}

/**
 * Puts the event's basics (INV-104) into the draft's info block — the one the
 * editor restores names, date and place from — without touching the rest of
 * the saved design.
 */
export function seedDraftInfo(info) {
  const theme = draftStore.theme || {};
  draftStore.theme = { ...theme, info: { ...(theme.info || {}), ...info } };
  saveDraft();
}

export function getDraftPendingFiles() {
  return draftStore.pendingFiles;
}

/** Counts of guest-picked photos still to be re-added; null/zeros clears it. */
export function setDraftPendingFiles(counts) {
  const total = counts ? (counts.hero || 0) + (counts.story || 0) + (counts.collage || 0) : 0;
  draftStore.pendingFiles = total > 0 ? { hero: counts.hero || 0, story: counts.story || 0, collage: counts.collage || 0 } : null;
  saveDraft();
}

/** The draft's idempotency key, created on first use and kept until the draft is cleared. */
export function getDraftClientRequestId() {
  if (!draftStore.clientRequestId) {
    draftStore.clientRequestId = crypto.randomUUID();
    saveDraft();
  }
  return draftStore.clientRequestId;
}

function createSentOf(value, report) {
  if (value == null) return null;
  if (isPlainObject(value) && typeof value.at === "string") {
    return { at: value.at, account: typeof value.account === "string" ? value.account : null };
  }
  report.dropped = true;
  return null;
}

/**
 * Remembers that the create of this draft is being sent for `account`
 * (INV-303). Written before the request, so an answer lost to a closed tab or
 * a dropped connection still leaves the trace.
 */
export function markDraftCreateSent(account) {
  getDraftClientRequestId();
  draftStore.createSent = { at: new Date().toISOString(), account: account || null };
  saveDraft();
}

export function getDraftCreateSent() {
  return draftStore.createSent;
}

/**
 * A new idempotency key for the draft — only when the server said the old one
 * belongs to an event of another account (a shared device). The draft itself
 * is kept; its payload carries the new key too.
 */
export function renewDraftClientRequestId() {
  draftStore.clientRequestId = crypto.randomUUID();
  draftStore.createSent = null;
  if (draftStore.fullPayload) {
    draftStore.fullPayload = { ...draftStore.fullPayload, clientRequestId: draftStore.clientRequestId };
  }
  saveDraft();
  return draftStore.clientRequestId;
}

/* ------------------------------------------------------------------ */
/*  Unsynced copy of an existing event's edits (IVY-INV-301)           */
/* ------------------------------------------------------------------ */
// When an autosave of an event that already exists fails (offline, server
// error), the payload that did not make it is kept here, per event, until a
// save of that event succeeds. It survives a closed tab, and the editor offers
// to send it on the next visit.

const UNSYNCED_PREFIX = "invitation_unsynced_v1:";

export function saveUnsyncedSnapshot(eventId, payload) {
  if (!eventId) return;
  localStorage.setItem(UNSYNCED_PREFIX + eventId, JSON.stringify({
    payload,
    savedAt: new Date().toISOString(),
  }));
}

export function getUnsyncedSnapshot(eventId) {
  if (!eventId) return null;
  try {
    const raw = localStorage.getItem(UNSYNCED_PREFIX + eventId);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || !saved.payload) return null;
    if (saved.savedAt && Date.now() - new Date(saved.savedAt).getTime() > DRAFT_TTL_MS) {
      clearUnsyncedSnapshot(eventId);
      return null;
    }
    return saved;
  } catch (_) {
    return null;
  }
}

export function clearUnsyncedSnapshot(eventId) {
  if (!eventId) return;
  try { localStorage.removeItem(UNSYNCED_PREFIX + eventId); } catch (_) { /* ignore */ }
}

/** INV-402: the design's starter entries were written into this section once. */
export function isDraftSectionSeeded(section) {
  return draftStore.seeded?.[section] === true;
}

export function markDraftSectionSeeded(section) {
  if (isDraftSectionSeeded(section)) return;
  draftStore.seeded = { ...(draftStore.seeded || {}), [section]: true };
  saveDraft();
}

export function getDraftItems(section) {
  return draftStore[section] || [];
}

export function addDraftItem(section, payload) {
  const localId = payload._localId || generateLocalId();
  const item = { ...payload, _localId: localId };
  draftStore[section].push(item);
  saveDraft();
  return item;
}

export function updateDraftItem(section, localId, payload) {
  const idx = draftStore[section].findIndex((x) => x._localId === localId);
  if (idx !== -1) {
    draftStore[section][idx] = { ...payload, _localId: localId };
    saveDraft();
  }
}

export function deleteDraftItem(section, localId) {
  draftStore[section] = draftStore[section].filter((x) => x._localId !== localId);
  saveDraft();
}

/**
 * The section's entries as a whole, in this order (INV-801: undo / redo puts
 * an earlier list back). Each keeps its local id; one without gets a new one.
 */
export function replaceDraftItems(section, items) {
  draftStore[section] = (items || []).map(({ id, ...rest }) => ({
    ...rest,
    _localId: rest._localId || (typeof id === "string" && id.startsWith("_local_") ? id : generateLocalId()),
  }));
  saveDraft();
}

// Initialize on module load
loadDraft();
