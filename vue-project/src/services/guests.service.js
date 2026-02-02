import { api } from "@/services/api";

export const guestsService = {
  list(eventId, params = {}) {
    return api.get(`/events/${encodeURIComponent(eventId)}/guests`, { params });
  },

  updateTable(eventId, guestId, tableId) {
    return api.put(`/events/${encodeURIComponent(eventId)}/guests/${encodeURIComponent(guestId)}/table`, { tableId });
  },

  remove(eventId, guestId) {
    return api.del(`/events/${encodeURIComponent(eventId)}/guests/${encodeURIComponent(guestId)}`);
  }
};
