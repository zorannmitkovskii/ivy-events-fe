import { api } from "@/services/api";

export const eventDetailsService = {
  create(payload) {
    return api.post("/event-details", payload);
  },

  listAll() {
    return api.get("/event-details");
  },

  getById(id) {
    return api.get(`/event-details/${encodeURIComponent(id)}`);
  },

  listByEvent(eventId) {
    return api.get(`/event-details/event/${encodeURIComponent(eventId)}`);
  },

  update(id, payload) {
    return api.put(`/event-details/${encodeURIComponent(id)}`, payload);
  },

  remove(id) {
    return api.del(`/event-details/${encodeURIComponent(id)}`);
  },
};
