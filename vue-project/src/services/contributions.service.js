import { api } from "@/services/api";

/**
 * Guest contributions, moderation and the wall (IVY-605).
 */
export const contributionsService = {
  // ── the organizer's side ───────────────────────────────────────────

  queue(eventId, status) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return api.get(`/events/${encodeURIComponent(eventId)}/contributions${query}`);
  },

  moderate(eventId, contributionId, decision, note) {
    return api.post(
      `/events/${encodeURIComponent(eventId)}/contributions/${encodeURIComponent(contributionId)}/moderate`,
      { decision, note });
  },

  settings(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/contributions/settings`);
  },

  updateSettings(eventId, settings) {
    return api.put(`/events/${encodeURIComponent(eventId)}/contributions/settings`, settings);
  },

  musicExportUrl(eventId, format = 'xlsx') {
    return `/events/${encodeURIComponent(eventId)}/contributions/music/export?format=${format}`;
  },

  // ── the wall ───────────────────────────────────────────────────────

  /** Approved and past the delay. Both decided on the server: a client trusted
   *  to hide the recent ones is one refresh from showing something pulled
   *  thirty seconds ago. */
  wall(eventId) {
    return api.get(`/public/events/${encodeURIComponent(eventId)}/wall`);
  },

  publicSettings(eventId) {
    return api.get(`/public/events/${encodeURIComponent(eventId)}/contributions/settings`);
  },
};
