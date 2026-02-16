import { api } from "@/services/api";

export const guestsService = {
  list(eventId, tableId) {
    const params = {};
    if (eventId) params.eventId = eventId;
    if (tableId) params.tableId = tableId;
    return api.get("/guests", { params });
  },

  listPerTable(eventId, tableId) {
    const params = {};
    if (eventId) params.eventId = eventId;
    if (tableId) params.tableId = tableId;
    return api.get("/guests/perTable", { params });
  },

  getById(guestId) {
    return api.get(`/guests/${encodeURIComponent(guestId)}`);
  },

  create(payload) {
    return api.post("/guests", payload);
  },

  update(guestId, payload) {
    return api.put(`/guests/${encodeURIComponent(guestId)}`, payload);
  },

  updateTableNumber(guestId, payload) {
    return api.put(`/guests/${encodeURIComponent(guestId)}/table-number`, payload);
  },

  updateEventTable(guestId, payload) {
    return api.put(`/guests/${encodeURIComponent(guestId)}/event-table`, payload);
  },

  updateStatus(guestId, payload) {
    return api.put(`/guests/${encodeURIComponent(guestId)}/status`, payload);
  },

  remove(guestId) {
    return api.del(`/guests/${encodeURIComponent(guestId)}`);
  },

  getStatusCounts(eventId) {
    return api.get("/guests/status", { params: { eventId } });
  },

  getCount(eventId) {
    return api.get("/guests/count", { params: { eventId } });
  },

  sendNotification(eventId, lang) {
    const params = { eventId };
    if (lang) params.lang = lang;
    return api.post("/guests/notification", null, { params });
  }
};
