import { api } from "@/services/api";

export const eventsService = {
  getAll() {
    return api.get("/events");
  },

  getById(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}`);
  },

  getOverview(eventId) {
    return api.get("/events/overview", { params: { eventId } });
  },

  create(payload) {
    return api.post("/events", payload);
  },

  update(eventId, payload) {
    return api.patch(`/events/${encodeURIComponent(eventId)}`, payload);
  },

  updateInvitation(eventId, payload) {
    return api.put(`/events/${encodeURIComponent(eventId)}/invitation`, payload);
  },

  remove(eventId) {
    return api.del(`/events/${encodeURIComponent(eventId)}`);
  }
};
