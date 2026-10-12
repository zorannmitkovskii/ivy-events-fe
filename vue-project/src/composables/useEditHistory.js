import { ref, computed, watch, nextTick } from "vue";

/**
 * Undo / redo for the invitation editor, in this visit only (INV-801).
 *
 * The model: a set of named fields (the person's names, the date, the place,
 * RSVP settings, section visibility, colours, fonts, the opening animation,
 * the entries of details / programme / story …). Each field can be read and
 * written back. History keeps the fields a change touched, with their value
 * before and after it — never a copy of the whole invitation — so undoing one
 * change does not take back anything else that changed meanwhile (the event
 * read from the server, a section loaded again).
 *
 * Which changes are the person's:
 *  - a change followed by `noteEdit()` (the editor's `markDirty`) in the same
 *    tick — every synchronous edit handler;
 *  - any change while a `track(fn)` runs — the edits that wait for a request
 *    (an existing event's entry is created / changed / deleted on the server
 *    first and only then in the list).
 * Every other change (the event or a section read from the server, ids taken
 * from a save) is not an edit: it becomes the new starting point, and history
 * steps about the same field are dropped — they would no longer apply.
 *
 * Not part of history: photos (picked files, uploads in progress), the save
 * status, and anything the server decides. Undo is never a saved version: it
 * writes the earlier values back and the editor saves them like any other
 * change (`onRestored`).
 */

/** At most this many steps are kept; the oldest go first. */
export const HISTORY_LIMIT = 50;
/** Changes of the same fields this close together are one step (typing a word). */
export const HISTORY_COALESCE_MS = 1000;

const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

function sameKeys(a, b) {
  return a.length === b.length && a.every((k) => b.includes(k));
}

/**
 * @param {object} opts
 * @param {Record<string, {read: Function, write: Function, content?: Function}>} opts.fields
 *   read() — the current value (plain data); write(value) — puts it back;
 *   content(value) — what counts as a change (default: the value itself), e.g.
 *   a list without the ids the server gives.
 * @param {(key: string) => boolean} [opts.isRestorable] — whether the field may
 *   be written back now (e.g. not while its section failed to load).
 * @param {(step: object, direction: 'undo'|'redo') => void} [opts.onRestored]
 */
export function createEditHistory({
  fields,
  isRestorable = () => true,
  onRestored = null,
  limit = HISTORY_LIMIT,
  coalesceMs = HISTORY_COALESCE_MS,
  now = () => Date.now(),
} = {}) {
  const keys = Object.keys(fields);

  let committed = capture();
  let undoStack = [];
  let redoStack = [];
  let lastStep = null;
  let userPending = 0;
  let restoring = 0;
  const openEdits = ref(0);
  const version = ref(0);
  const bump = () => { version.value += 1; };

  function entryOf(key) {
    const def = fields[key];
    const value = clone(def.read());
    const sig = JSON.stringify(def.content ? def.content(value) : value) ?? "";
    return { value, sig };
  }

  function capture() {
    const out = {};
    keys.forEach((k) => { out[k] = entryOf(k); });
    return out;
  }

  /** Waits until the change just made has been seen (after Vue's flush). */
  function afterFlush(fn) {
    nextTick(() => nextTick(fn));
  }

  /** The person changed something (call right after the change). */
  function noteEdit() {
    userPending += 1;
    afterFlush(() => { userPending = Math.max(0, userPending - 1); });
  }

  /** Every change while `fn` runs is the person's (an edit that waits for a request). */
  async function track(fn) {
    openEdits.value += 1;
    try {
      return await fn();
    } finally {
      sync();
      openEdits.value -= 1;
    }
  }

  function prune(changed) {
    const touches = (step) => step.keys.some((k) => changed.includes(k));
    const before = undoStack.length + redoStack.length;
    undoStack = undoStack.filter((s) => !touches(s));
    redoStack = redoStack.filter((s) => !touches(s));
    if (lastStep && touches(lastStep)) lastStep = null;
    if (undoStack.length + redoStack.length !== before) bump();
  }

  function record(changed, current) {
    const at = now();
    const top = undoStack[undoStack.length - 1];
    if (top && top === lastStep && sameKeys(top.keys, changed) && at - top.at <= coalesceMs) {
      changed.forEach((k) => { top.after[k] = current[k]; });
      top.at = at;
      // Typed and deleted again: nothing left to undo.
      if (top.keys.every((k) => top.before[k].sig === top.after[k].sig)) {
        undoStack.pop();
        lastStep = null;
      }
    } else {
      const step = { keys: changed, before: {}, after: {}, at };
      changed.forEach((k) => {
        step.before[k] = committed[k];
        step.after[k] = current[k];
      });
      undoStack.push(step);
      if (undoStack.length > limit) undoStack.splice(0, undoStack.length - limit);
      lastStep = step;
    }
    // A new change after undo: the steps that were undone no longer lead anywhere.
    redoStack = [];
    bump();
  }

  /** Compares the fields with the last known state and records what changed. */
  function sync() {
    const current = capture();
    const changed = keys.filter((k) => current[k].sig !== committed[k].sig);
    if (changed.length && !restoring) {
      if (userPending > 0 || openEdits.value > 0) record(changed, current);
      else prune(changed);
    }
    // Always the latest values (ids a save gave), even when nothing changed.
    committed = current;
  }

  let stop = null;
  /** Starts watching the fields; the state now is where history begins. */
  function start() {
    if (stop) return;
    committed = capture();
    stop = watch(() => keys.map((k) => JSON.stringify(fields[k].read()) ?? ""), sync);
  }

  function dispose() {
    stop?.();
    stop = null;
  }

  /** History starts again from the state now (e.g. another design). */
  function reset() {
    committed = capture();
    undoStack = [];
    redoStack = [];
    lastStep = null;
    userPending = 0;
    bump();
  }

  /**
   * The state now is the starting point, and steps about these fields go
   * (something replaced them as a whole — another design's look).
   */
  function forget(fieldKeys) {
    committed = capture();
    userPending = 0;
    prune(fieldKeys);
  }

  function restorable(step) {
    return !!step && openEdits.value === 0 && step.keys.every((k) => isRestorable(k));
  }

  function apply(step, side, direction) {
    restoring += 1;
    try {
      step.keys.forEach((k) => fields[k].write(clone(step[side][k].value)));
      committed = capture();
      lastStep = null;
      onRestored?.(step, direction);
    } finally {
      // What the write sets off in the next flush (derived state) is part of it.
      afterFlush(() => { restoring = Math.max(0, restoring - 1); sync(); });
    }
  }

  function undo() {
    if (!restoring) sync();
    const step = undoStack[undoStack.length - 1];
    if (!restorable(step)) return null;
    undoStack.pop();
    redoStack.push(step);
    apply(step, "before", "undo");
    bump();
    return step;
  }

  function redo() {
    if (!restoring) sync();
    const step = redoStack[redoStack.length - 1];
    if (!restorable(step)) return null;
    redoStack.pop();
    undoStack.push(step);
    apply(step, "after", "redo");
    bump();
    return step;
  }

  const nextUndo = computed(() => { void version.value; return undoStack[undoStack.length - 1] || null; });
  const nextRedo = computed(() => { void version.value; return redoStack[redoStack.length - 1] || null; });
  const canUndo = computed(() => restorable(nextUndo.value));
  const canRedo = computed(() => restorable(nextRedo.value));

  return {
    start,
    dispose,
    reset,
    forget,
    noteEdit,
    track,
    sync,
    undo,
    redo,
    canUndo,
    canRedo,
    nextUndo,
    nextRedo,
    /** How many steps can be undone / redone (tests, the limit). */
    sizes: () => ({ undo: undoStack.length, redo: redoStack.length }),
  };
}

/* ------------------------------------------------------------------ */
/*  Keyboard shortcuts                                                 */
/* ------------------------------------------------------------------ */

const TEXT_INPUT_TYPES = new Set([
  "text", "search", "email", "url", "tel", "password", "number",
  "date", "time", "datetime-local", "month", "week", "",
]);

/**
 * True when the key goes to a field that has its own undo (typing in an input
 * or a text area): the browser's undo for that field is left alone.
 */
export function isTextEditingTarget(el) {
  if (!el || typeof el !== "object") return false;
  if (el.isContentEditable) return true;
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "textarea") return true;
  if (tag !== "input") return false;
  return TEXT_INPUT_TYPES.has((el.getAttribute?.("type") || el.type || "").toLowerCase());
}

/**
 * Ctrl/⌘+Z → 'undo'; Ctrl/⌘+Shift+Z or Ctrl+Y → 'redo'; anything else → null.
 * By the physical key as well, so a Cyrillic or Albanian layout works too.
 */
export function historyShortcut(e) {
  if (!e || e.altKey || !(e.ctrlKey || e.metaKey)) return null;
  const key = (e.key || "").toLowerCase();
  // The letter typed wins (QWERTZ swaps the Z and Y keys); the physical key
  // only when the layout types no Latin letter there (Cyrillic).
  const latin = /^[a-z]$/.test(key);
  const isZ = latin ? key === "z" : e.code === "KeyZ";
  const isY = latin ? key === "y" : e.code === "KeyY";
  if (isZ) return e.shiftKey ? "redo" : "undo";
  if (isY && !e.shiftKey && e.ctrlKey) return "redo";
  return null;
}
