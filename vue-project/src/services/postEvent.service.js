import { api } from "@/services/api";

/**
 * The post-event package (IVY-606).
 *
 * <p>Preview and send are separate calls on purpose: a call that emails four
 * hundred people should not be one query parameter away from a call that shows
 * you what it would do.
 */
export const postEventService = {
  settings(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/post-event`);
  },

  configure(eventId, settings) {
    return api.put(`/events/${encodeURIComponent(eventId)}/post-event`, settings);
  },

  /** What would go out, and to whom. Sends nothing. */
  preview(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/post-event/preview`);
  },

  /** Sends now instead of waiting. Still refuses to send twice. */
  sendNow(eventId) {
    return api.post(`/events/${encodeURIComponent(eventId)}/post-event/send`);
  },

  cancel(eventId) {
    return api.del(`/events/${encodeURIComponent(eventId)}/post-event`);
  },
};
