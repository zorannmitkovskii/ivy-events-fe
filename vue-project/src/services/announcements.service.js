import { api } from "@/services/api";

/**
 * Announcements and the forecast card (IVY-604).
 */
export const announcementsService = {
  list(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/announcements`);
  },

  /**
   * @param urgent asks notification-service to push it. Everything else waits
   *   in the guest hub, which is where most of it belongs — marking everything
   *   urgent is how people turn notifications off.
   */
  publish(eventId, { title, body, titleI18n, bodyI18n, audience = 'EVERYONE', urgent = false, publishAt, expiresAt }) {
    return api.post(`/events/${encodeURIComponent(eventId)}/announcements`,
      { title, body, titleI18n, bodyI18n, audience, urgent, publishAt, expiresAt });
  },

  /** Withdrawn, not deleted: what was said that day stays on record. */
  withdraw(eventId, announcementId) {
    return api.del(`/events/${encodeURIComponent(eventId)}/announcements/${encodeURIComponent(announcementId)}`);
  },

  /** Always answers — an unreachable provider gives a card that says it does
   *  not know rather than failing the page. */
  weather(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/weather`);
  },
};
