/**
 * INV-601: the check before an invitation is published — what must be fixed
 * first (a blocker) and what is only advice (a recommendation).
 *
 * There is no third set of rules here. The editor's notes come from
 * `guestPreviewNotes` (INV-602), which already carries the basics rules of
 * `validateBasics` (INV-104: names or a title by event type, date, time, the
 * event's timezone, place, "already past" in that zone) and the RSVP deadline
 * rule of `rsvpDeadlineProblem` (past / after the event, in that zone). This
 * file only says how heavy each note is. The server repeats the blockers when
 * the publish (the package payment) starts — `serverPublishProblems` turns its
 * answer into the same notes, so both are shown and fixed the same way.
 *
 * Never a blocker: an optional section switched off or left empty, a design's
 * example photo or entry, content a design does not draw.
 */
import { NOTE_ACTIONS, NOTE_KINDS } from '@/utils/guestPreviewNotes';

export const PUBLISH_SEVERITY = Object.freeze({
  BLOCKER: 'blocker',
  RECOMMENDATION: 'recommendation',
});

/** The error code the server answers a publish with when something blocks it. */
export const NOT_READY_ERROR_CODE = 'BR_EVENT_NOT_READY_TO_PUBLISH';

/**
 * How a preview note weighs on publishing: a blocker, a recommendation, or
 * null for a note that only explains the preview (the programme on the
 * private link, replies opening on publish).
 */
export function publishSeverity(note) {
  if (!note) return null;
  if (note.kind === NOTE_KINDS.MISSING) return PUBLISH_SEVERITY.BLOCKER;
  // The design's demo couple and date would be published as the event's own.
  if (note.textKey === 'demoBasics') return PUBLISH_SEVERITY.BLOCKER;
  if (note.kind === NOTE_KINDS.INFO) return null;
  return PUBLISH_SEVERITY.RECOMMENDATION;
}

/**
 * @param {Array} notes guestPreviewNotes(...) or serverPublishProblems(...)
 * @returns {{ blockers: Array, recommendations: Array, ready: boolean }}
 *   each in the order the notes came in (the invitation's order)
 */
export function prePublishCheck(notes = []) {
  const blockers = [];
  const recommendations = [];
  for (const n of notes || []) {
    const severity = publishSeverity(n);
    if (severity === PUBLISH_SEVERITY.BLOCKER) blockers.push(n);
    else if (severity === PUBLISH_SEVERITY.RECOMMENDATION) recommendations.push(n);
  }
  return { blockers, recommendations, ready: blockers.length === 0 };
}

// The server's field → reason (ApiError.validationErrors), in the Info panel's order.
const SERVER_BASICS_ORDER = ['brideName', 'groomName', 'title', 'date', 'time', 'timezone', 'location'];

/** The basics message for a server reason — the ones the Info panel shows. */
function basicsMessageKey(field, reason) {
  if (field === 'date' && reason === 'past') return 'onboarding.eventBasics.errors.past';
  return `onboarding.eventBasics.errors.${field}`;
}

/**
 * The server's "not ready to publish" answer as preview notes (all blockers):
 * `{ brideName: 'missing', date: 'past', rsvpDeadline: 'afterEvent', … }`.
 * Unknown fields are dropped — the server may know more than this client.
 */
export function serverPublishProblems(validationErrors) {
  if (!validationErrors || typeof validationErrors !== 'object') return [];
  const out = [];
  for (const field of SERVER_BASICS_ORDER) {
    const reason = validationErrors[field];
    if (!reason) continue;
    out.push({
      id: `info:missingField:${field}`,
      kind: NOTE_KINDS.MISSING,
      section: 'info',
      textKey: 'missingField',
      params: { messageKey: basicsMessageKey(field, reason) },
      field,
      action: NOTE_ACTIONS.EDIT,
    });
  }
  const deadline = validationErrors.rsvpDeadline;
  if (deadline === 'past' || deadline === 'afterEvent') {
    const textKey = deadline === 'past' ? 'deadlinePast' : 'deadlineAfterEvent';
    out.push({
      id: `rsvp:${textKey}:deadline`,
      kind: NOTE_KINDS.MISSING,
      section: 'rsvp',
      textKey,
      params: {},
      field: 'deadline',
      action: NOTE_ACTIONS.EDIT,
    });
  } else if (deadline === 'invalid') {
    // INV-603: RSVP is on and its deadline can't be read.
    out.push(publishProblem('rsvp', 'deadline', 'rsvpDeadlineInvalid'));
  }
  // INV-603: the event's public guest link — missing, or not this event's
  // guest link. It is made from the design when the invitation is saved, so
  // there is no field to jump to (fixTarget → '').
  const link = validationErrors.invitationUrl;
  if (link === 'missing' || link === 'invalid') {
    out.push(publishProblem('link', 'invitationUrl', link === 'missing' ? 'invitationUrlMissing' : 'invitationUrlInvalid'));
  }
  return out;
}

/** A server blocker with no preview note of its own; its text is `editSection.prePublish.problems.<key>`. */
function publishProblem(section, field, key) {
  return {
    id: `${section}:publishProblem:${field}`,
    kind: NOTE_KINDS.MISSING,
    section,
    textKey: 'publishProblem',
    params: { messageKey: `editSection.prePublish.problems.${key}` },
    field,
    action: NOTE_ACTIONS.EDIT,
  };
}

/** INV-603: a publish for an event already published that holds what was asked for (409). */
export const ALREADY_PUBLISHED_ERROR_CODE = 'CONFLICT_EVENT_ALREADY_PUBLISHED';

/**
 * CPay fix 1: the server prices the packages; when the amount this page showed
 * is not what it would charge it answers 409 with its own amount and currency
 * (`validationErrors.amount|currency`) and nothing is created.
 */
export const PRICE_CHANGED_ERROR_CODE = 'CONFLICT_PRICE_CHANGED';
/** CPay fix 7: a payment of this event was started minutes ago (409, `validationErrors.retryAfter`). */
export const PAYMENT_IN_PROGRESS_ERROR_CODE = 'CONFLICT_PAYMENT_IN_PROGRESS';
/** CPay fix 1: the coupon sent with the payment is not valid on the server (422). */
export const DISCOUNT_INVALID_ERROR_CODE = 'BR_DISCOUNT_CODE_INVALID';

/**
 * INV-603: why a publish (the package payment) did not start — `notReady`
 * (the blockers above), `alreadyPublished` (409, nothing new to buy),
 * `forbidden` (403, not this caller's event), `priceChanged` / `paymentInProgress`
 * (409, CPay fixes 1 and 7), `discountInvalid` (422) or `failed` (network, server…).
 * In every case nothing was charged and the cart and the invitation draft are
 * kept, so trying again is safe: the server never starts a second publish of
 * a published event.
 */
export function publishFailureKind(err) {
  if (err?.errorCode === NOT_READY_ERROR_CODE) return 'notReady';
  if (err?.errorCode === ALREADY_PUBLISHED_ERROR_CODE) return 'alreadyPublished';
  if (err?.errorCode === PRICE_CHANGED_ERROR_CODE) return 'priceChanged';
  if (err?.errorCode === PAYMENT_IN_PROGRESS_ERROR_CODE) return 'paymentInProgress';
  if (err?.errorCode === DISCOUNT_INVALID_ERROR_CODE) return 'discountInvalid';
  if (err?.status === 403 || err?.errorCode === 'AUTHZ_ACCESS_DENIED') return 'forbidden';
  return 'failed';
}

/** The server's price from a 409 CONFLICT_PRICE_CHANGED: `{ amount: Number, currency }`, or null. */
export function serverPrice(err) {
  const v = err?.validationErrors;
  const amount = Number(v?.amount);
  if (!v || v.amount == null || !Number.isFinite(amount)) return null;
  return { amount, currency: v.currency || 'MKD' };
}

/**
 * When a new payment may start, from a 409 CONFLICT_PAYMENT_IN_PROGRESS, as
 * the viewer's local HH:mm (24 h) — or '' when the server did not say.
 */
export function retryAfterTime(err, locale) {
  const raw = err?.validationErrors?.retryAfter;
  const at = raw ? new Date(raw) : null;
  if (!at || Number.isNaN(at.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale || undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
  } catch {
    return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
  }
}

/**
 * The `?fix=` value that opens the editor at a note's control: an Info field,
 * or `rsvpDeadline` for the RSVP deadline.
 */
export function fixTarget(note) {
  if (!note) return '';
  if (note.section === 'rsvp' && note.field === 'deadline') return 'rsvpDeadline';
  if (note.section === 'info') return note.field || '';
  return '';
}

/**
 * The editor's address for an event, from its public invitation URL
 * (`<origin>/<lang>/invitations/<design>?eventId=…`): the same page in edit
 * mode, opened at `fix`. Only the path and query are kept, so the link stays
 * on this site. '' when the URL is not an invitation's.
 */
export function editorFixLocation(invitationUrl, fix = '') {
  if (!invitationUrl || typeof invitationUrl !== 'string') return '';
  let url;
  try {
    url = new URL(invitationUrl, 'http://local.invalid');
  } catch {
    return '';
  }
  if (!/\/invitations\/[^/]+\/?$/.test(url.pathname)) return '';
  const query = { edit: 'true' };
  const eventId = url.searchParams.get('eventId');
  if (eventId) query.eventId = eventId;
  if (fix) query.fix = fix;
  return { path: url.pathname, query };
}
