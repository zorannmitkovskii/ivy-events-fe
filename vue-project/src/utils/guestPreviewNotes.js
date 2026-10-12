/**
 * INV-602: what the final "preview as a guest" tells the organiser about the
 * invitation in front of them — the parts guests will not see (hidden or
 * empty), the parts still showing a design's example, what is missing, and
 * what only some guests see. Each note names the exact place in the editor
 * where it is fixed.
 *
 * Nothing here is stored or decided anew: every note is read from the state
 * the editor already keeps and the rules the invitation is drawn by (INV-402
 * empty sections, INV-203 content a design does not draw, INV-403 photos).
 */

export const NOTE_KINDS = Object.freeze({
  MISSING: 'missing',
  HIDDEN: 'hidden',
  EMPTY: 'empty',
  EXAMPLE: 'example',
  INFO: 'info',
});

/** What a note's button does: open the editor at a place, or show the private link. */
export const NOTE_ACTIONS = Object.freeze({ EDIT: 'edit', PRIVATE_LINK: 'privateLink' });

// The order the invitation is read in, so the list follows the page.
const ORDER = ['info', 'entry', 'hero', 'details', 'agendaList', 'ourStoryList', 'ourStoryImages', 'collage', 'rsvp', 'design'];

// The Info fields in the order the panel shows them.
const BASICS_ORDER = ['brideName', 'groomName', 'title', 'date', 'time', 'timezone', 'location'];

/**
 * validateBasics(...) errors → [{ field, messageKey }], first field first —
 * the same messages the basics form and the Info panel show.
 */
export function basicsProblems(errors = {}) {
  return BASICS_ORDER.filter((f) => errors[f]).map((field) => ({ field, messageKey: errors[field] }));
}

function note(kind, section, textKey, extra = {}) {
  const field = extra.field || '';
  return {
    id: `${section}:${textKey}${field ? ':' + field : ''}`,
    kind,
    section,
    textKey,
    params: extra.params || {},
    field,
    action: 'action' in extra ? extra.action : NOTE_ACTIONS.EDIT,
  };
}

/**
 * @param {object} s
 * @param {Array<{field,messageKey}>} [s.basicsProblems] what is wrong with the Info fields (basicsProblems)
 * @param {boolean} [s.demoBasics]   names/date/place are still the design's demo
 * @param {string}  [s.nameField]    the Info field the names start with ('brideName' | 'title')
 * @param {object}  [s.visible]      { entry, details, agendaList, ourStoryList, rsvp } — false = hidden
 * @param {object}  [s.hasContent]   { agendaList, ourStoryList } — anything for the guests
 * @param {object}  [s.examples]     { agenda, ourStory } — how many entries are a design's example
 * @param {number}  [s.ownDetails]   the person's own event-detail entries
 * @param {object}  [s.photos]       { heroOwn, storyDrawn, storyOwn, collageDrawn, collageOwn }
 * @param {Array}   [s.designHidden] hiddenContentFor(...) — kept, but this design does not draw it
 * @param {boolean} [s.showAgenda]   the event shows its programme at all
 * @param {boolean} [s.privateLink]  the preview shows the private link
 * @param {object}  [s.rsvp]         { deadlineProblem: 'past'|'afterEvent'|null, notOpen }
 * @returns {Array} notes, in the order of the invitation
 */
export function guestPreviewNotes(s = {}) {
  const visible = { entry: true, details: true, agendaList: true, ourStoryList: true, rsvp: true, ...(s.visible || {}) };
  const hasContent = { agendaList: true, ourStoryList: true, ...(s.hasContent || {}) };
  const examples = s.examples || {};
  const photos = s.photos || {};
  const out = [];

  // Info: the basics the invitation is personalised with.
  for (const p of s.basicsProblems || []) {
    out.push(note(NOTE_KINDS.MISSING, 'info', 'missingField', { field: p.field, params: { messageKey: p.messageKey } }));
  }
  if (s.demoBasics && !(s.basicsProblems || []).length) {
    out.push(note(NOTE_KINDS.EXAMPLE, 'info', 'demoBasics', { field: s.nameField || 'brideName' }));
  }

  // Sections the person switched off: kept, but guests do not see them.
  for (const key of ['entry', 'details', 'agendaList', 'ourStoryList']) {
    if (visible[key] === false) out.push(note(NOTE_KINDS.HIDDEN, key, key === 'entry' ? 'hiddenEntry' : 'hidden'));
  }

  if (photos.heroOwn === false) out.push(note(NOTE_KINDS.EXAMPLE, 'hero', 'heroPhoto'));

  if (visible.details !== false && (s.ownDetails ?? 1) === 0) {
    out.push(note(NOTE_KINDS.EXAMPLE, 'details', 'detailsDefault'));
  }

  for (const [key, list] of [['agendaList', 'agenda'], ['ourStoryList', 'ourStory']]) {
    if (visible[key] === false) continue;
    if (!hasContent[key]) {
      out.push(note(NOTE_KINDS.EMPTY, key, 'empty'));
    } else if ((examples[list] || 0) > 0) {
      out.push(note(NOTE_KINDS.EXAMPLE, key, 'exampleItems', { params: { count: examples[list] } }));
    }
  }

  // The programme is drawn only on the private link (INV-201) — say so, and
  // offer that view rather than leave it looking missing.
  if (visible.agendaList !== false && hasContent.agendaList && s.showAgenda !== false && !s.privateLink) {
    out.push(note(NOTE_KINDS.INFO, 'agendaList', 'privateOnly', { action: NOTE_ACTIONS.PRIVATE_LINK }));
  }

  const storyShown = visible.ourStoryList !== false && hasContent.ourStoryList;
  if (storyShown && (photos.storyDrawn || 0) > 0 && (photos.storyOwn || 0) === 0) {
    out.push(note(NOTE_KINDS.EXAMPLE, 'ourStoryImages', 'storyPhotos'));
  }
  if (photos.collageDrawn && visible.entry !== false && (photos.collageOwn || 0) === 0) {
    out.push(note(NOTE_KINDS.EXAMPLE, 'collage', 'collagePhotos'));
  }

  const rsvp = s.rsvp || {};
  if (visible.rsvp === false) {
    out.push(note(NOTE_KINDS.HIDDEN, 'rsvp', 'rsvpHidden'));
  } else {
    if (rsvp.deadlineProblem) {
      out.push(note(NOTE_KINDS.MISSING, 'rsvp', rsvp.deadlineProblem === 'past' ? 'deadlinePast' : 'deadlineAfterEvent', { field: 'deadline' }));
    }
    if (rsvp.notOpen) out.push(note(NOTE_KINDS.INFO, 'rsvp', 'rsvpNotOpen', { action: null }));
  }

  for (const h of s.designHidden || []) {
    out.push(note(NOTE_KINDS.HIDDEN, 'design', 'designHidden', { field: h.kind, params: { item: h } }));
  }

  const rank = (n) => ORDER.indexOf(n.section);
  return out
    .map((n, i) => ({ n, i }))
    .sort((a, b) => rank(a.n) - rank(b.n) || a.i - b.i)
    .map(({ n }) => n);
}
