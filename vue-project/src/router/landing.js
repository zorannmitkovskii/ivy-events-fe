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
  if (hasRole("ADMIN")) return `/${lang}/admin/events`;
  if (hasRole("VENDOR")) return `/${lang}/vendor/calendar`;
  if (hasRole("ORGANIZER")) return `/${lang}/organizer`;
  return `/${lang}/dashboard/events/overview`;
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

  if (hasRole("ADMIN")) return `/${lang}/admin/events`;
  if (hasRole("VENDOR")) return `/${lang}/vendor/calendar`;

  const { eventId, eventCount } = await resolveCurrentEvent();
  if (!eventId && eventCount > 1) return `/${lang}/organizer`;
  if (redirect) return redirect;
  if (hasRole("ORGANIZER")) return `/${lang}/organizer`;

  return `/${lang}/dashboard/events/overview`;
}
