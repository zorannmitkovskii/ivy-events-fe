import { api } from "@/services/api";

/** RSVP reminders and the call list (IVY-303, IVY-305). */
export const remindersService = {
  list(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/rsvp-reminders`);
  },

  schedule(eventId, { offsetDays, channel }) {
    return api.post(`/events/${encodeURIComponent(eventId)}/rsvp-reminders`,
      { offsetDays, channel });
  },

  /** Who a reminder would reach, and in what language, before scheduling it. */
  audience(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/rsvp-reminders/audience`);
  },

  callList(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/call-list`);
  },

  funnel(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/rsvp-funnel`);
  },

  /** @param format "csv" or "xlsx" */
  downloadCallList(eventId, format = "xlsx") {
    return api.get(`/events/${encodeURIComponent(eventId)}/call-list.${format}`,
      { responseType: "blob" });
  }
};
