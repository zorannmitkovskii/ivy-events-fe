import { hasRole } from "@/services/auth.service";
import { resolveCurrentEvent } from "@/services/eventSelection.service";

/**
 * Where a signed-in person belongs, by role.
 *
 * <p>One function rather than a condition repeated at each redirect: the order
 * matters — someone who is both an admin and a vendor lands on the admin — and
 * a second copy of it would eventually disagree with this one.
 */
export function homeForCurrentUser(langParam) {
  const lang = langParam || "mk";
  if (hasRole("ADMIN")) return `/${lang}/admin/dashboard`;
  if (hasRole("VENDOR")) return `/${lang}/vendor/calendar`;
  if (runsAnAgency()) return `/${lang}/org/dashboard`;
  if (runsEvents()) return `/${lang}/organizer`;
  return `/${lang}/dashboard/events/overview`;
}

/**
 * An agency owner, who gets the agency dashboard (IVY-1201).
 *
 * <p>Split out of {@link runsEvents} on 2026-08-08. Until then both roles
 * landed on the same overview and differed only in what the backend let them
 * see — an ORG_ADMIN every event the organization owns, an ORGANIZER the ones
 * they are assigned. That difference is still the backend's to make (see
 * {@code EventAccessService.accessibleEventIds}); what changed is that the
 * agency owner now gets a screen built for the question they are asking.
 */
function runsAnAgency() {
  return hasRole("ORG_ADMIN");
}

/**
 * Whether this person's work spans events rather than being one event.
 *
 * <p>ORG_ADMIN was missing here originally, which was the whole bug: signing up
 * as an agency grants ORG_ADMIN and USER but <em>not</em> ORGANIZER, so an
 * agency owner fell through to the single-event dashboard and saw one event —
 * the page for somebody planning their own wedding, handed to somebody running
 * twenty. They are now caught earlier by {@link runsAnAgency}, and this stays
 * for the individual organizer.
 */
function runsEvents() {
  return hasRole("ORG_ADMIN") || hasRole("ORGANIZER");
}

/**
 * Where to go once the tokens are in hand.
 *
 * <p>Unlike {@link homeForCurrentUser} this one asks the backend which events
 * the person can open, because since IVY-101 the token no longer says. Someone
 * with several events and none chosen is sent to the workspace to choose —
 * including when they were originally headed somewhere else, since an
 * event-scoped page with no event is a blank screen with no explanation.
 */
export async function landingAfterAuth(langParam, redirect) {
  const lang = langParam || "mk";

  if (hasRole("ADMIN")) return `/${lang}/admin/dashboard`;
  if (hasRole("VENDOR")) return `/${lang}/vendor/calendar`;
  if (runsAnAgency()) return `/${lang}/org/dashboard`;

  // Asked before the event lookup, and before honouring `redirect`. Somebody
  // who runs events belongs on the overview even with one event or none: a
  // brand-new agency has zero, and sending them to an event-scoped page means
  // a blank screen on the first thing they ever see.
  if (runsEvents()) return `/${lang}/organizer`;

  const { eventId, eventCount } = await resolveCurrentEvent();
  if (!eventId && eventCount > 1) return `/${lang}/organizer`;
  if (redirect) return redirect;

  return `/${lang}/dashboard/events/overview`;
}
