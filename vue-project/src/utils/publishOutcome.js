/**
 * INV-701 — what the screen after CPay may say, from what the server knows.
 *
 * The bank sends the browser back through the payment callback, but a redirect
 * is not a confirmation: "published" is shown only when the server answers
 * that the payment SUCCEEDED and the event is ACTIVE
 * (`GET /v1/api/payments/{ref}/publication`). Until then the screen says it is
 * confirming and keeps asking.
 */

/** Payment states that end without publishing anything. */
const FAILED_PAYMENTS = new Set(['FAILED', 'CANCELED', 'EXPIRED'])

/** Event states the callback has not moved on from yet. */
const AWAITING_EVENT = new Set(['DRAFT', 'PENDING'])

/**
 * Waits between checks while confirming (ms) — about 45 s in all. After the
 * last one the screen says the confirmation is late (`slow`) and offers a
 * manual check; it never turns that into success or failure.
 */
export const CONFIRM_POLL_DELAYS = Object.freeze([1500, 2000, 3000, 4000, 5000, 5000, 8000, 8000, 8000])

/** Failed checks in a row before the screen shows an error instead of waiting. */
export const MAX_CHECK_ERRORS = 3

/**
 * The outcome of one server answer:
 * - `published` — payment SUCCESS and the event's invitation ACTIVE (server says so)
 * - `confirming` — payment PENDING, or paid while the event has not turned ACTIVE yet
 * - `failed` — the payment ended without publishing (FAILED / CANCELED / EXPIRED)
 * - `paid` — a successful payment that publishes no invitation (no event, a
 *   gallery, an add-on to an event that is not live)
 */
export function publishOutcome(dto) {
  if (!dto || typeof dto !== 'object') return 'confirming'
  const payment = String(dto.paymentStatus || 'PENDING').toUpperCase()
  if (FAILED_PAYMENTS.has(payment)) return 'failed'
  if (payment !== 'SUCCESS') return 'confirming'
  if (dto.published === true) return 'published'
  const event = dto.eventStatus == null ? null : String(dto.eventStatus).toUpperCase()
  if (dto.eventId && (event == null || AWAITING_EVENT.has(event))) return 'confirming'
  return 'paid'
}

/**
 * The guest link as an absolute URL, or '' when it is not this event's public
 * invitation link — `<origin>/<lang>/invitations/<design>?eventId=<id>`, the
 * shape the server generates (InvitationUrlService) and checks before
 * publishing (EventPublishReadiness). Never the `/private` link, an editor
 * address (`edit=true`), another event's link or a dashboard page; the server
 * already withholds those, this is the client's own check before showing it.
 */
export function safePublicUrl(url, eventId, origin = defaultOrigin()) {
  if (!url || typeof url !== 'string' || !eventId) return ''
  let parsed
  try {
    parsed = new URL(url.trim(), origin)
  } catch {
    return ''
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return ''
  if (parsed.username || parsed.password || parsed.hash) return ''
  if (!/^\/[^/]+\/invitations\/[^/]+$/.test(parsed.pathname)) return ''
  if (parsed.search !== `?eventId=${encodeURIComponent(eventId)}`) return ''
  return parsed.href
}

/** The editor's address for an event's invitation, or '' without a design. */
export function editorLocation(lang, design, eventId) {
  if (!design || !eventId) return ''
  return {
    path: `/${lang}/invitations/${encodeURIComponent(design)}`,
    query: { edit: 'true', eventId },
  }
}

function defaultOrigin() {
  return typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost'
}

/**
 * The order reference of a CPay return — the dashboard overview with
 * `?status=…&ref=<order>`, where the payment callback sends the browser
 * (CPAY_REDIRECT_URL) — or '' for any other visit. Used by the router to take
 * the return to the payment result page.
 */
export function paymentReturnRef(to) {
  if (!to || to.name !== 'dashboard.overview') return ''
  const ref = Array.isArray(to.query?.ref) ? to.query.ref[0] : to.query?.ref
  if (typeof ref !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(ref)) return ''
  return ref
}
