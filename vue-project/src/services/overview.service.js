import { api } from "@/services/api";

/**
 * Expected endpoints (adjust if your BE differs):
 * GET /v1/api/events/{eventId}
 * GET /v1/api/events/{eventId}/overview
 *
 * If your BE has only one endpoint, keep only getOverview().
 */
export const overviewService = {
  getEvent(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}`);
  },

  getOverview(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/overview`);
  }
};
