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
  if ((hasRole("VENDOR") || hasRole("VENDOR_MEMBER"))) return `/${lang}/vendor/home`;
  if (worksInAnAgency()) return `/${lang}/agency/dashboard`;
  return `/${lang}/dashboard/events/overview`;
}

/**
 * Somebody who works in an agency, owner or member, who gets the agency
 * workspace (IVY-1201; members since 2026-09).
 *
 * <p>Members used to land on the standalone organiser overview, which has no
 * sidebar — so a member had no way to their calendar, their tasks or the
 * vendor directory. They now share the agency shell and get their own version
 * of it: the backend answers the same routes for them with their own events
 * only (see {@code AgencyWorkspaceReader}), and the sidebar draws their work.
 */
function worksInAnAgency() {
  return hasRole("AGENCY") || hasRole("AGENCY_MEMBER");
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
  if ((hasRole("VENDOR") || hasRole("VENDOR_MEMBER"))) return `/${lang}/vendor/home`;
  // Asked before the event lookup, and before honouring `redirect`. Somebody
  // in an agency belongs on its overview even with one event or none: a
  // brand-new agency has zero, and sending them to an event-scoped page means
  // a blank screen on the first thing they ever see.
  if (worksInAnAgency()) return `/${lang}/agency/dashboard`;

  const { eventId, eventCount, failed } = await resolveCurrentEvent();
  if (!eventId && eventCount > 1) return `/${lang}/organizer`;

  /*
    Nobody's first screen should be a dashboard for an event that does not
    exist. Somebody who has just verified their email has zero events, and the
    overview then draws empty guest, task and budget panels for nothing —
    the blueprint calls for onboarding at zero (§5), and this is that.

    `failed` is deliberately excluded. A lookup that did not answer is not an
    answer of zero, and telling somebody with three weddings to create their
    first one is worse than showing them an empty dashboard for a moment.
  */
  if (!eventId && eventCount === 0 && !failed) return `/${lang}/event-category`;

  if (redirect) return redirect;

  return `/${lang}/dashboard/events/overview`;
}
