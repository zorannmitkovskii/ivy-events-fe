import { api } from "@/services/api";

export const tablesService = {
  getTables(eventId) {
    return api.get("/event-tables", { params: { eventId } });
  },

  getById(tableId) {
    return api.get(`/event-tables/${encodeURIComponent(tableId)}`);
  },

  createTable(payload) {
    return api.post("/event-tables", payload);
  },

  updateTable(tableId, payload) {
    return api.put(`/event-tables/${encodeURIComponent(tableId)}`, payload);
  },

  removeTable(tableId) {
    return api.del(`/event-tables/${encodeURIComponent(tableId)}`);
  },

  getSummary(eventId) {
    return api.get("/event-tables/summary", { params: { eventId } });
  },

  getGuests(eventId) {
    return api.get("/guests", { params: { eventId } });
  },

  createGuest(payload) {
    return api.post("/guests", payload);
  },

  assignGuestToTable(guestId, payload) {
    return api.put(`/guests/${encodeURIComponent(guestId)}/event-table`, payload);
  },

  removeGuest(guestId) {
    return api.del(`/guests/${encodeURIComponent(guestId)}`);
  }
};
