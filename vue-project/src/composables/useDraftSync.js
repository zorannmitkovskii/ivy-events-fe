import {
  hasDraft, getDraftItems, getDraftFullPayload, getDraftClientRequestId, getDraftPendingFiles, clearDraft,
  draftStore, saveDraft, markDraftCreateSent, getDraftCreateSent, renewDraftClientRequestId,
} from "@/store/invitationDraft.store";
import { eventsService } from "@/services/events.service";
import { onboardingStore, setEventId } from "@/store/onboarding.store";
import { eventFullService } from "@/services/eventFull.service";
import { eventDetailsService } from "@/services/eventDetails.service";
import { agendaApi } from "@/services/agenda.service";
import { ourStoryApi } from "@/services/ourStory.service";
import { decodeJwtPayload } from "@/services/jwt";

/**
 * Syncs localStorage draft to the backend after login/verification.
 * If a full payload exists (unauthenticated user clicked "Create"),
 * calls POST /events/full in one shot and returns the created event.
 * Otherwise falls back to individual item sync (legacy).
 *
 * Legacy entry point: the auth pages use {@link resumeDraftAfterAuth}. Both
 * keep the draft until the server has confirmed it (INV-303).
 */
export async function syncDraftToBackend() {
  if (!hasDraft()) return null;

  try {
    // Full payload path — the same idempotent create as resumeDraftAfterAuth.
    if (getDraftFullPayload()) {
      const { created } = await createEventFromDraft();
      return created;
    }

    // Legacy fallback — sync individual items if eventId exists
    const eventId = onboardingStore.eventId;
    if (!eventId) return null;

    // Each item leaves the draft as soon as the server has it, so a retry
    // after a failure part-way sends only what is still missing — never a
    // second copy of what already arrived (INV-303).
    await sendItems("eventDetails", (payload) => eventDetailsService.create({ ...payload, eventId }));
    await sendItems("agenda", (payload) => agendaApi.createItem(eventId, payload));
    await sendItems("ourStory", (payload) => ourStoryApi.create({ ...payload, eventId }));

    clearDraft();
    return null;
  } catch (e) {
    console.error("[draftSync] failed to sync draft to backend:", e);
    return null;
  }
}

async function sendItems(section, send) {
  for (const item of [...getDraftItems(section)]) {
    const { _localId, id, ...payload } = item;
    await send(payload);
    draftStore[section] = draftStore[section].filter((it) => it !== item);
    saveDraft();
  }
}

/* ------------------------------------------------------------------ */
/*  Resuming a guest's invitation after sign-up / sign-in (INV-104)    */
/* ------------------------------------------------------------------ */

/** A guest built an invitation and pressed Save: there is something to create. */
export function hasPendingDraft() {
  return !!getDraftFullPayload();
}

/** The design the draft was made with, to reopen the same editor. */
export function pendingDraftDesign() {
  const name = getDraftFullPayload()?.invitationName || "";
  const slug = String(name).replace(/^\/?invitations\//, "").split("/")[0].trim();
  return /^[a-z0-9-]+$/i.test(slug) ? slug : "my-wedding";
}

/** Who is signed in now (the token's subject), to tell one account's retry from another's. */
export function currentAccount() {
  let token = null;
  try {
    token = localStorage.getItem("access_token");
  } catch {
    return null;
  }
  const claims = decodeJwtPayload(token);
  return claims?.sub || claims?.email || null;
}

/**
 * The server refused the draft's key because an event of another account was
 * made with it (`POST /events/full` → 409, IVY-INV-301): this device's draft
 * was already saved by somebody else who signed in here.
 */
export function isClaimedKeyError(e) {
  return e?.status === 409 || e?.errorCode === "CONFLICT_OBJECT_ALREADY_EXISTS";
}

/**
 * POST /events/full from the draft, with the draft's idempotency key. Unlike
 * {@link syncDraftToBackend} a failure is thrown, and the draft is only
 * cleared once the server has answered with the event.
 *
 * Before sending, the draft records that its create was sent and for whom
 * (INV-303): when the answer never arrives, the same account's next sign-in
 * resends it with the same key instead of treating its own event as a
 * conflict. A key claimed by another account is replaced and the error is
 * marked `claimed`, so the caller can ask instead of retrying forever.
 */
export async function createEventFromDraft() {
  const fullPayload = getDraftFullPayload();
  if (!fullPayload) return null;
  const clientRequestId = fullPayload.clientRequestId || getDraftClientRequestId();
  markDraftCreateSent(currentAccount());
  let response;
  try {
    response = await eventFullService.createFull({ ...fullPayload, clientRequestId });
  } catch (e) {
    if (isClaimedKeyError(e)) {
      renewDraftClientRequestId();
      if (e && typeof e === "object") e.claimed = true;
    }
    throw e;
  }
  const created = response?.data?.data || response?.data;
  const eventId = created?.event?.id || created?.id;
  if (!eventId) throw new Error("The server did not return the created event");
  setEventId(eventId);
  clearDraft();
  return { eventId, created };
}

async function countOwnEvents() {
  const res = await eventsService.getAll();
  const rows = Array.isArray(res) ? res : res?.data ?? res?.content ?? [];
  return Array.isArray(rows) ? rows.length : 0;
}

function pendingPhotoCount() {
  const p = getDraftPendingFiles();
  return p ? (p.hero || 0) + (p.story || 0) + (p.collage || 0) : 0;
}

/** Why the editor asks (`?conflict=`): the account has events, could not be checked, or the draft is another account's. */
export const RESUME_CONFLICT = Object.freeze({ EVENTS: "events", UNCHECKED: "unchecked", CLAIMED: "claimed" });

/**
 * Where to send somebody who just signed up or signed in, when they arrived
 * with an invitation draft. Null when there is no draft — the caller then
 * uses its usual landing.
 *
 *  - No events yet in the account → the event is created from the draft
 *    (idempotent key) and the same design reopens on the new event.
 *  - The account already has events, or that could not be checked → nothing
 *    is created or merged on its own. The editor reopens on the draft and asks.
 *  - The create failed → the draft stays on this device and the editor says
 *    so, with a way to try again. Never a silent loss.
 *  - INV-303: this account already sent the create and never saw the answer
 *    (a lost response, a closed tab) → it is resent with the same key: the
 *    server answers with the event the first attempt made, or makes it now.
 *    The account's events are not counted — one of them may be this draft.
 *  - INV-303: the draft's key belongs to another account's event → it is not
 *    created again on its own; the editor asks.
 *
 * Photos picked as a guest cannot be carried through the redirect; their
 * count travels in the query so the editor can ask for them again.
 */
export async function resumeDraftAfterAuth(lang) {
  if (!hasPendingDraft()) return null;
  const path = `/${lang || "mk"}/invitations/${pendingDraftDesign()}`;
  const photos = pendingPhotoCount();
  const query = (extra) => ({ edit: "true", ...(photos ? { photos: String(photos) } : {}), ...extra });
  const choose = (conflict) => ({ path, query: query({ new: "1", resume: "choose", conflict }) });

  const sent = getDraftCreateSent();
  const account = currentAccount();
  const resend = !!(sent && sent.account && account && sent.account === account);

  if (!resend) {
    let existing;
    try {
      existing = await countOwnEvents();
    } catch {
      existing = null;
    }
    if (existing === null) return choose(RESUME_CONFLICT.UNCHECKED);
    if (existing !== 0) return choose(RESUME_CONFLICT.EVENTS);
  }

  try {
    const { eventId } = await createEventFromDraft();
    return { path, query: query({ eventId }) };
  } catch (e) {
    if (e?.claimed) return choose(RESUME_CONFLICT.CLAIMED);
    console.error("[draftSync] creating the event from the draft failed:", e);
    return { path, query: query({ new: "1", resume: "failed" }) };
  }
}
