import { api } from "@/services/api";

/**
 * Adjust endpoints to your BE.
 * Recommended REST:
 *  GET  /events/{eventId}/tables
 *  GET  /events/{eventId}/guests
 *  POST /events/{eventId}/guests
 *  PUT  /events/{eventId}/guests/{guestId}/table
 *  DELETE /events/{eventId}/guests/{guestId}
 */
export const tablesService = {
  getTables(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/tables`);
  },
  getGuests(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/guests`);
  },
  createGuest(eventId, payload) {
    return api.post(`/events/${encodeURIComponent(eventId)}/guests`, payload);
  },
  assignGuestToTable(eventId, guestId, tableId) {
    return api.put(
      `/events/${encodeURIComponent(eventId)}/guests/${encodeURIComponent(guestId)}/table`,
      { tableId }
    );
  },
  removeGuest(eventId, guestId) {
    return api.del(`/events/${encodeURIComponent(eventId)}/guests/${encodeURIComponent(guestId)}`);
  }
};
