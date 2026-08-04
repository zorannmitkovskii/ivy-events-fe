import { api } from "@/services/api";

/**
 * The door (IVY-601, IVY-602).
 *
 * <p>Scanning and arriving are separate calls on purpose. A scan is a question
 * — "who is this?" — and answering it changes nothing, so an accidental scan or
 * a curious guest pointing a camera at their own code does not put a name in
 * the headcount.
 */
export const checkinService = {
  /** Resolves a scanned code. Read-only. */
  scan(eventId, token) {
    return api.post(`/events/${encodeURIComponent(eventId)}/check-in/scan`, { token });
  },

  /**
   * Records arrivals.
   *
   * @param arrivals each carries the device's own `clientActionId`, which is
   *   what makes draining an offline queue safe — the server records the first
   *   and reports every repeat as a replay.
   */
  record(eventId, arrivals) {
    return api.post(`/events/${encodeURIComponent(eventId)}/check-in/arrivals`, { arrivals });
  },

  undo(eventId, checkInId) {
    return api.del(`/events/${encodeURIComponent(eventId)}/check-in/arrivals/${encodeURIComponent(checkInId)}`);
  },

  summary(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/check-in/summary`);
  },

  // ── credentials (IVY-601) ────────────────────────────────────────────

  /**
   * Issues a credential and returns the token.
   *
   * <p>The token comes back here and nowhere else — nothing stores it, and
   * asking again mints a new one that kills this one. That is the cost of not
   * keeping a copy, and it is the right cost: a token held in a database is a
   * token that leaks with the database.
   */
  issueCredential(eventId, { guestId, householdKey, scope = 'CHECKIN' }) {
    return api.post(`/events/${encodeURIComponent(eventId)}/credentials`,
      { guestId, householdKey, scope });
  },

  /** @return how many live credentials were withdrawn — "0" and "1" are
   *  different answers to "is the lost code dead now". */
  revokeCredential(eventId, { guestId, householdKey, scope = 'CHECKIN', reason }) {
    return api.post(`/events/${encodeURIComponent(eventId)}/credentials/revoke`,
      { guestId, householdKey, scope, reason });
  },

  credentials(eventId, scope) {
    const query = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return api.get(`/events/${encodeURIComponent(eventId)}/credentials${query}`);
  },
};
