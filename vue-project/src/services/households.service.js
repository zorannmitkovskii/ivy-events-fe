import { api } from "@/services/api";

/** Households — one invitation addressed to a family (IVY-301). */
export const householdsService = {
  create(eventId, { name, primaryGuestId, memberIds, allowance }) {
    return api.post(`/events/${encodeURIComponent(eventId)}/households`,
      { name, primaryGuestId, memberIds, allowance });
  },

  members(eventId, householdKey) {
    return api.get(
      `/events/${encodeURIComponent(eventId)}/households/${encodeURIComponent(householdKey)}`);
  },

  removeMember(eventId, guestId) {
    return api.del(
      `/events/${encodeURIComponent(eventId)}/households/members/${encodeURIComponent(guestId)}`);
  },

  /** The family's own reply, from the invitation link — no account involved. */
  respond(eventId, householdKey, { respondingGuestId, attendingGuestIds }) {
    return api.post(
      `/public/events/${encodeURIComponent(eventId)}/households/${encodeURIComponent(householdKey)}/respond`,
      { respondingGuestId, attendingGuestIds });
  }
};
