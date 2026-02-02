import { api } from "@/services/api";

export const eventsService = {
  getOverview(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/overview`);
  },

  // POST /events
  create(payload) {
    return api.post(`/events`, payload);
    // expected response: { id: "evt_123", ... }
  }
};
