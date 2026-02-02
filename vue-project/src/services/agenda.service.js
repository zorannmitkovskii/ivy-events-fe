import { api } from "@/services/api";

export const agendaService = {
  list(eventId, date) {
    return api.get(`/events/${encodeURIComponent(eventId)}/agenda`, {
      params: date ? { date } : {}
    });
  },

  update(eventId, itemId, payload) {
    return api.put(`/events/${encodeURIComponent(eventId)}/agenda/${encodeURIComponent(itemId)}`, payload);
  },

  create(eventId, payload) {
    return api.post(`/events/${encodeURIComponent(eventId)}/agenda`, payload);
  },

  remove(eventId, itemId) {
    return api.del(`/events/${encodeURIComponent(eventId)}/agenda/${encodeURIComponent(itemId)}`);
  }
};
