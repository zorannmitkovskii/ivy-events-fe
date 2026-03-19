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

  getAdminDetail(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/admin-detail`);
  },

  create(payload) {
    return api.post("/events", payload);
  },

  createAdmin(payload) {
    return api.post("/events/admin", payload);
  },

  activateEvent(eventId, packageType) {
    return api.put(`/events/${encodeURIComponent(eventId)}/activate`, { packageType });
  },

  update(eventId, payload) {
    return api.put(`/events/${encodeURIComponent(eventId)}`, payload);
  },

  updateInvitation(eventId, payload) {
    return api.put(`/events/${encodeURIComponent(eventId)}/invitation`, payload);
  },

  remove(eventId) {
    return api.del(`/events/${encodeURIComponent(eventId)}`);
  },

  bulkDelete(ids) {
    return api.del("/events/delete", { data: ids });
  }
};
