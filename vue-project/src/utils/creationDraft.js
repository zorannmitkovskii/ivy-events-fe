/**
 * Is there an unfinished invitation on this device to continue (INV-101)?
 *
 * Read from what the flow already keeps — the onboarding store (type, basics,
 * chosen design) and the local invitation draft (INV-301) — never from a
 * separate "has draft" flag that could disagree with them.
 *
 * A draft is:
 *  - any content in the local invitation draft (the editor or the basics page
 *    wrote it), or
 *  - basics typed or a design chosen in the onboarding flow, as long as that
 *    progress is not already an event: once an invitation is saved the draft
 *    is cleared and the store keeps the new event's id, and what is left in
 *    the store then describes that event, not something unfinished.
 *
 * A category on its own is not a draft — it is only the remembered choice.
 */
import { normalizeBasics, basicsDisplayName } from "@/utils/eventBasics";
import { isExampleItem } from "@/utils/creationSteps";
import {
  clearDraft, clearDraftNotice, draftExpiresAt, getDraftNotice, getUnsyncedSnapshot, DRAFT_NOTICE,
} from "@/store/invitationDraft.store";
import { clearCreationProgress, getOnboardingLoadIssue } from "@/store/onboarding.store";
import { eventsService } from "@/services/events.service";

const list = (value) => (Array.isArray(value) ? value : []);

/** "invitations/coastal-breeze" / "coastal-breeze" → "coastal-breeze"; anything else → "". */
export function designSlug(name) {
  const slug = String(name || "").replace(/^\/?invitations\//, "").split("/")[0].trim();
  return /^[a-z0-9-]+$/i.test(slug) ? slug : "";
}

function draftHasContent(draft) {
  if (!draft) return false;
  return (
    (Array.isArray(draft.eventDetails) && draft.eventDetails.length > 0) ||
    (Array.isArray(draft.agenda) && draft.agenda.length > 0) ||
    (Array.isArray(draft.ourStory) && draft.ourStory.length > 0) ||
    draft.theme != null ||
    draft.sectionState != null ||
    draft.fullPayload != null
  );
}

function basicsTyped(raw) {
  const b = normalizeBasics(raw);
  return !!(
    b.brideName.trim() || b.groomName.trim() || b.title.trim() ||
    b.date || b.time || b.location.name.trim() || b.location.address.trim()
  );
}

/**
 * @param {object} onboarding  the onboarding store's state
 * @param {object} draft       the invitation draft store's state
 * @returns {null | {category: string, typeCode: string, name: string, date: string,
 *   time: string, hasDesign: boolean, updatedAt: string|null}}
 */
export function findResumableDraft(onboarding = {}, draft = {}) {
  const content = draftHasContent(draft);
  const progress = !onboarding.eventId && (basicsTyped(onboarding.eventDetails) || !!onboarding.invitationPath);
  if (!content && !progress) return null;

  const category = onboarding.selectedCategory || "";
  const basics = normalizeBasics(onboarding.eventDetails);
  // The editor's copy of the names (INV-104 seeds it from the basics; the title
  // of a non-couple event goes into the first name) — for a draft whose
  // onboarding state was lost.
  const info = normalizeBasics(draft?.theme?.info);
  const updatedAt = draft.updatedAt || null;
  const ownName = basicsDisplayName(basics, category || undefined);
  return {
    category,
    typeCode: onboarding.selectedTypeCode || "",
    // Without a category the name cannot be told apart from a title; the
    // couple's names are the older drafts' shape.
    name: ownName || basicsDisplayName(info, undefined),
    date: basics.date || info.date,
    time: basics.date ? basics.time : info.time,
    hasDesign: !!onboarding.invitationPath,
    design: designSlug(onboarding.invitationPath) || designSlug(draft?.fullPayload?.invitationName),
    updatedAt,
    // INV-302: when the TTL removes it if nothing changes (null: unknown).
    expiresAt: content ? draftExpiresAt(updatedAt) : null,
    // The person's own entries — the examples a design puts in are not "theirs".
    counts: {
      details: list(draft.eventDetails).filter((i) => !isExampleItem(i, "eventDetails")).length,
      agenda: list(draft.agenda).filter((i) => !isExampleItem(i, "agenda")).length,
      story: list(draft.ourStory).filter((i) => !isExampleItem(i, "ourStory")).length,
    },
    hasSettings: draft.theme != null || draft.sectionState != null,
    content,
  };
}

/* ------------------------------------------------------------------ */
/*  Discarding the draft on this device (INV-302)                      */
/* ------------------------------------------------------------------ */

/**
 * Deletes the invitation being made on this device: the local draft (content,
 * design settings, its idempotency key, the photo count) and the type, basics
 * and design chosen for it. Never touches events saved in the account, nor
 * the unsynced copies of their edits (`invitation_unsynced_v1:<eventId>`).
 * Only ever called after the person confirmed.
 */
export function discardLocalDraft() {
  clearDraft();
  clearCreationProgress();
  clearDraftNotice();
}

/**
 * What happened to a draft that could not be offered (expired, unreadable)
 * or was only partly read. Null when nothing.
 */
export function draftRecoveryNotice() {
  const notice = getDraftNotice();
  if (notice) return notice;
  return getOnboardingLoadIssue() === "unreadable" ? { kind: DRAFT_NOTICE.UNREADABLE, updatedAt: null } : null;
}

export function dismissDraftNotice() {
  clearDraftNotice();
}

/* ------------------------------------------------------------------ */
/*  Drafts saved in the account (INV-302)                              */
/* ------------------------------------------------------------------ */
// An event the person saved and has not activated is a draft on the server
// (status DRAFT). It is listed so it can be continued; it is never deleted from
// here — the account's events are managed in the dashboard.

export const SERVER_DRAFT_LIMIT = 3;

function serverName(event) {
  if (typeof event?.name === "string" && event.name.trim() && event.name !== "New Event") return event.name.trim();
  const inv = event?.invitation || {};
  return [inv.brideName, inv.groomName].filter((n) => typeof n === "string" && n.trim()).map((n) => n.trim()).join(" & ");
}

/** The server's day, kept as it is: its LocalDateTime carries no zone to convert. */
function serverDay(value) {
  const m = typeof value === "string" ? value.match(/^(\d{4}-\d{2}-\d{2})/) : null;
  return m ? m[1] : "";
}

/**
 * The workspace rows (`GET /events/workspace?status=DRAFT`) as drafts to
 * continue: invitations only (a gallery is not one), newest change first.
 */
export function serverDraftsFrom(rows) {
  return list(rows)
    .map((row) => row?.event ?? row)
    .filter((event) => event && event.id && event.status === "DRAFT" && event.categoryType !== "GALLERY")
    .map((event) => ({
      id: String(event.id),
      name: serverName(event),
      category: typeof event.categoryType === "string" ? event.categoryType : "",
      updatedOn: serverDay(event.updatedAt) || serverDay(event.createdAt),
      design: designSlug(event.invitation?.invitationName),
      // INV-301: edits of this event that never reached the server, on this device.
      unsyncedAt: getUnsyncedSnapshot(String(event.id))?.savedAt || null,
    }))
    .sort((a, b) => (b.updatedOn || "").localeCompare(a.updatedOn || ""))
    .slice(0, SERVER_DRAFT_LIMIT);
}

export async function loadServerDrafts() {
  const response = await eventsService.workspace({ status: "DRAFT" });
  return serverDraftsFrom(Array.isArray(response) ? response : response?.data);
}

/* ------------------------------------------------------------------ */
/*  The start choice of this visit                                     */
/* ------------------------------------------------------------------ */
// "Continue the draft" or "Start a new invitation" is asked once per tab: the
// answer is kept in sessionStorage so Back/Forward (and a reload) return to the
// category list instead of asking again. A new visit asks again.

const START_KEY = "invitation_start_choice_v1";
// FRESH: there was no draft when this visit began — whatever is typed now is
// this visit's own invitation, and coming back to the first page must not ask
// whether to continue it.
export const START_CHOICE = Object.freeze({ RESUME: "resume", NEW: "new", FRESH: "fresh" });

export function getStartChoice() {
  try {
    const value = sessionStorage.getItem(START_KEY);
    return Object.values(START_CHOICE).includes(value) ? value : null;
  } catch {
    return null;
  }
}

export function setStartChoice(choice) {
  try {
    if (choice) sessionStorage.setItem(START_KEY, choice);
    else sessionStorage.removeItem(START_KEY);
  } catch {
    /* storage refused: the choice is asked again next time, nothing is lost */
  }
}

/* ------------------------------------------------------------------ */
/*  Dates in the summaries                                             */
/* ------------------------------------------------------------------ */

/** A calendar day ("2099-06-12"), formatted as is — in no zone. */
export function formatCalendarDate(date, locale) {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
      .format(new Date(`${date}T00:00:00Z`));
  } catch {
    return date;
  }
}

/** An instant this device recorded (ISO), in this device's zone. */
export function formatInstant(iso, locale, withTime = true) {
  const when = iso ? new Date(iso) : null;
  if (!when || Number.isNaN(when.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(when);
  } catch {
    return when.toISOString();
  }
}
