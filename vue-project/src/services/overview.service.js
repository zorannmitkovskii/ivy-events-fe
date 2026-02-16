import { api } from "@/services/api";

export const overviewService = {
  getEvent(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}`);
  },

  getOverview(eventId) {
    return api.get("/events/overview", { params: { eventId } });
  }
};
