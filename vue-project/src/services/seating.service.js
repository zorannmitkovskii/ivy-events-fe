import { api } from "@/services/api";

/**
 * Seating and venue layouts (IVY-501, IVY-502, IVY-505).
 *
 * <p>Since the model merge a venue template and an event's tables are the same
 * shape, so one renderer draws both — the editor does not need two code paths.
 */
export const seatingService = {
  tables(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/seating/tables`);
  },

  /** The work that is left. Always shown, so a plan cannot look finished
   *  while twelve people have nowhere to sit. */
  unseated(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/seating/unseated`);
  },

  applyFloorPlan(eventId, floorPlanId) {
    return api.post(
      `/events/${encodeURIComponent(eventId)}/seating/apply-floor-plan/${encodeURIComponent(floorPlanId)}`);
  },

  /**
   * @param expectedVersion the layout version the editor was showing. Send it
   *   and a save that lost a race is refused rather than silently applied.
   * @param allowOverflow the organizer saying they know the table is full.
   */
  seat(eventId, { guestId, tableId, expectedVersion, allowOverflow = false }) {
    return api.post(`/events/${encodeURIComponent(eventId)}/seating/seat`,
      { guestId, tableId, expectedVersion, allowOverflow });
  },

  /** A family moves whole or not at all. */
  seatHousehold(eventId, { householdKey, tableId, expectedVersion, allowOverflow = false }) {
    return api.post(`/events/${encodeURIComponent(eventId)}/seating/seat-household`,
      { householdKey, tableId, expectedVersion, allowOverflow });
  },

  unseat(eventId, guestId) {
    return api.del(`/events/${encodeURIComponent(eventId)}/seating/seat/${encodeURIComponent(guestId)}`);
  },

  /** A proposal. Asking for one changes nothing. */
  suggest(eventId, keepApart = []) {
    return api.post(`/events/${encodeURIComponent(eventId)}/seating/suggestions`, { keepApart });
  },

  // ── the edit lock (IVY-504) ─────────────────────────────────────────

  /**
   * Takes the editor, or reports who has it.
   *
   * Call on opening and again on every interaction — the lock expires in two
   * minutes without a heartbeat, so a pause to answer the phone keeps it and a
   * closed laptop does not. A refusal is not an error: the result carries
   * readOnly true, the holder's name, and how long is left.
   */
  acquireLock(eventId) {
    return api.post(`/events/${encodeURIComponent(eventId)}/seating/lock`);
  },

  currentLock(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/seating/lock`);
  },

  /** Call on navigate-away. Releasing one you no longer hold is not an error. */
  releaseLock(eventId) {
    return api.del(`/events/${encodeURIComponent(eventId)}/seating/lock`);
  },

  /** Administrators only — for an editor left open on a machine nobody can
   *  reach. Audited, because taking somebody's session needs a name on it. */
  forceReleaseLock(eventId) {
    return api.del(`/events/${encodeURIComponent(eventId)}/seating/lock/force`);
  }
};
