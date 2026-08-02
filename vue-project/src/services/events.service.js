import { api } from "@/services/api";

export const eventsService = {
  getAll() {
    return api.get("/events");
  },

  /**
   * The workspace list: the caller's events, filtered, pinned first.
   * Every filter is optional; omitted ones are left off the query entirely.
   */
  workspace({ status, categoryType, from, to } = {}) {
    const params = {};
    if (status) params.status = status;
    if (categoryType) params.categoryType = categoryType;
    if (from) params.from = from;
    if (to) params.to = to;
    return api.get("/events/workspace", { params });
  },

  pin(eventId) {
    return api.put(`/events/${encodeURIComponent(eventId)}/pin`);
  },

  unpin(eventId) {
    return api.del(`/events/${encodeURIComponent(eventId)}/pin`);
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
