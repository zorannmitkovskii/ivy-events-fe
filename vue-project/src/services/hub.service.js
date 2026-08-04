import { api } from "@/services/api";

/**
 * The guest's day-of hub (IVY-603).
 *
 * <p>A POST for a read, which is unusual and deliberate: a token in a query
 * string ends up in access logs, browser history and referrer headers. It goes
 * in the body.
 */
export const hubService = {
  open(token) {
    return api.post("/public/hub", { token });
  },

  /** The same view, as the organizer sees it for one guest. Built by the same
   *  code path on the server, so a preview cannot drift from the real thing. */
  preview(eventId, guestId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/hub/preview/${encodeURIComponent(guestId)}`);
  },
};
