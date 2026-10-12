/**
 * The steps of making an invitation (INV-102), in the order INV-104 settled:
 * Event (type + basics) → Design → Details → RSVP → Preview.
 *
 * Nothing here is stored. Every status is worked out from the data the flow
 * already keeps — the onboarding store, the local draft, or the editor's live
 * state — so the stepper can never disagree with what is actually saved, and
 * there is no second "progress" record to drift out of step with it.
 */
import { coupleNameKeys, rsvpDeadlineProblem, validateBasics } from "@/utils/eventBasics";
import { DESIGN_PRESETS } from "@/config/designPresets/index.js";

export const CREATION_STEPS = Object.freeze([
  { key: "event", required: true },
  { key: "design", required: true },
  { key: "details", required: false },
  { key: "rsvp", required: false },
  { key: "preview", required: false },
]);

export const STEP_STATUS = Object.freeze({
  COMPLETE: "complete",
  ERROR: "error",
  INCOMPLETE: "incomplete",
  OPTIONAL: "optional",
  SKIPPED: "skipped",
});

/** Basics field → the label the stepper names it by (the form's own label). */
const BASICS_FIELD_LABELS = {
  brideName: "onboarding.eventBasics.fields.brideName",
  groomName: "onboarding.eventBasics.fields.groomName",
  title: "onboarding.eventBasics.fields.title",
  date: "onboarding.eventBasics.fields.date",
  time: "onboarding.eventBasics.fields.time",
  timezone: "onboarding.eventBasics.fields.timezone",
  location: "onboarding.eventBasics.fields.venue",
};

/** In the order the basics form shows them, so "first problem" is the first field. */
const BASICS_ORDER = ["brideName", "groomName", "title", "date", "time", "timezone", "location"];

/**
 * What stops the Event step from being done: [{ field, labelKey }], first
 * field first. Empty when the type is chosen and the basics are valid.
 */
export function eventStepProblems({ category, typeRequired = false, typeCode = "", basics, now = Date.now() } = {}) {
  if (!category) return [{ field: "category", labelKey: "creationSteps.fields.category" }];
  const problems = [];
  if (typeRequired && !typeCode) problems.push({ field: "type", labelKey: "creationSteps.fields.type" });
  const errors = validateBasics(basics, category, now);
  // The names are called what the form calls them for this category (INV-101).
  const words = coupleNameKeys(category);
  const labels = {
    ...BASICS_FIELD_LABELS,
    brideName: `onboarding.eventBasics.fields.${words.first}`,
    groomName: `onboarding.eventBasics.fields.${words.second}`,
  };
  for (const field of BASICS_ORDER) {
    if (errors[field]) problems.push({ field, labelKey: labels[field] });
  }
  return problems;
}

/**
 * Every step with its status.
 *
 * @param {object} ctx
 * @param {string} ctx.current          the step the person is on
 * @param {string} ctx.category         chosen event category
 * @param {boolean} [ctx.typeRequired]  the category asks for a finer type
 * @param {string} [ctx.typeCode]
 * @param {object} ctx.basics           names/title, date, time, timezone, location
 * @param {boolean} ctx.hasDesign       a design is chosen
 * @param {boolean} [ctx.hasDetails]    any detail, programme or story entry
 * @param {string} [ctx.rsvpDeadline]   YYYY-MM-DD or ""
 * @param {number} [ctx.now]
 * @returns {{key, index, required, current, status, problems}[]}
 */
export function computeCreationSteps(ctx = {}) {
  const now = ctx.now ?? Date.now();
  const currentIndex = Math.max(0, CREATION_STEPS.findIndex((s) => s.key === ctx.current));
  const b = ctx.basics || {};

  const problemsByStep = {
    event: eventStepProblems({ ...ctx, now }),
    design: ctx.hasDesign ? [] : [{ field: "design", labelKey: "creationSteps.fields.design" }],
    details: [],
    rsvp: [],
    preview: [],
  };
  const deadlineProblem = rsvpDeadlineProblem(ctx.rsvpDeadline, b.date, b.time, b.timezone, now);
  if (deadlineProblem) {
    problemsByStep.rsvp.push({ field: "rsvpDeadline", labelKey: "creationSteps.fields.rsvpDeadline", reason: deadlineProblem });
  }

  return CREATION_STEPS.map((step, index) => {
    const problems = problemsByStep[step.key];
    const current = index === currentIndex;
    const passed = index < currentIndex;
    let status;
    if (problems.length) {
      // A required step left behind unfinished is an error; one not reached
      // yet is only unfinished. A wrong value (an RSVP deadline already
      // past) is an error wherever it is.
      status = step.required && !passed ? STEP_STATUS.INCOMPLETE : STEP_STATUS.ERROR;
    } else if (step.required) {
      status = STEP_STATUS.COMPLETE;
    } else if (step.key === "details") {
      status = ctx.hasDetails ? STEP_STATUS.COMPLETE : passed ? STEP_STATUS.SKIPPED : STEP_STATUS.OPTIONAL;
    } else if (step.key === "rsvp") {
      status = ctx.rsvpDeadline ? STEP_STATUS.COMPLETE : passed ? STEP_STATUS.SKIPPED : STEP_STATUS.OPTIONAL;
    } else {
      status = STEP_STATUS.OPTIONAL;
    }
    return { key: step.key, index, required: step.required, current, status, problems };
  });
}

/**
 * The step to send somebody to when they ask for `target`: the first earlier
 * required step that is not done (they cannot skip it), else `target` itself.
 * Optional steps never block.
 */
export function blockingStep(steps, target) {
  const targetIndex = steps.findIndex((s) => s.key === target);
  if (targetIndex < 0) return null;
  const blocker = steps.slice(0, targetIndex).find((s) => s.required && s.problems.length);
  return blocker || steps[targetIndex];
}

/** Which step the invitation editor is on, from its own state. */
export function editorCurrentStep({ preview = false, activeSection = null } = {}) {
  if (preview) return "preview";
  if (activeSection === "rsvp") return "rsvp";
  return "details";
}

/**
 * Moves focus to a field the stepper reported, inside `root`: the element
 * marked `[data-info-field=<field>]` (EditInfoPanel) or the first control in
 * it. Returns true when something took focus.
 */
export function focusInfoField(field, root = typeof document !== "undefined" ? document : null) {
  const el = root?.querySelector?.(`[data-info-field="${field}"]`);
  if (!el) return false;
  const target = el.matches("input, select, textarea, button")
    ? el
    : el.querySelector("input, select, textarea, button");
  target?.focus();
  return !!target;
}

/* ------------------------------------------------------------------ */
/*  Details: the person's own entries, not a design's examples         */
/* ------------------------------------------------------------------ */

// Every design fills an empty invitation with example details, programme and
// story entries (useInvitationEditMode.ensureDefaults) and writes them to the
// draft. Those do not make the Details step done; an entry the person added
// or changed does.
const META_KEYS = new Set(["id", "_localId", "sortOrder", "eventId", "createdAt", "updatedAt"]);

const isEmpty = (v) =>
  v === null || v === undefined || v === "" ||
  (typeof v === "object" && Object.values(v).every(isEmpty));

const same = (a, b) => (isEmpty(a) && isEmpty(b)) || JSON.stringify(a) === JSON.stringify(b);

export function isExampleItem(item, section) {
  for (const preset of Object.values(DESIGN_PRESETS)) {
    for (const example of preset.defaultItems?.[section] || []) {
      const keys = Object.keys(example);
      if (!keys.every((k) => same(item?.[k], example[k]))) continue;
      const extra = Object.keys(item || {}).some((k) => !META_KEYS.has(k) && !keys.includes(k) && !isEmpty(item[k]));
      if (!extra) return true;
    }
  }
  return false;
}

/**
 * INV-401: an example that is only on screen. An existing event with an empty
 * section shows the design's examples in memory (useInvitationEditMode
 * `ensureDefaultsInMemory`) — they have neither a server id nor a draft id.
 * Those are never sent as the person's content. An example the person changed
 * is no longer an example; one already saved (it has an id) is the event's
 * content and stays. Draft examples (`_localId`) are a new invitation's
 * starter entries and travel with the draft as before.
 */
export function isUnsavedExample(item, section) {
  if (!item || item.id || item._localId) return false;
  return isExampleItem(item, section);
}

/** The entries to save: everything but untouched, unsaved examples. */
export function withoutUnsavedExamples(items, section) {
  return (items || []).filter((i) => !isUnsavedExample(i, section));
}

/** True when any details, programme or story entry is the person's own. */
export function hasOwnDetails({ eventDetails = [], agenda = [], ourStory = [] } = {}) {
  return (
    eventDetails.some((i) => !isExampleItem(i, "eventDetails")) ||
    agenda.some((i) => !isExampleItem(i, "agenda")) ||
    ourStory.some((i) => !isExampleItem(i, "ourStory"))
  );
}
