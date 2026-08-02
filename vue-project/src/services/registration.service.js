import { api } from "@/services/api";

/**
 * Corporate self-registration (IVY-205).
 *
 * <p>The public calls take no token: the point of an open corporate event is
 * that an attendee does not need an Ivy account to say they are coming.
 */
export const registrationService = {
  /** Is it open, and is there room — what a visitor sees before the form. */
  info(eventId) {
    return api.get(`/public/events/${encodeURIComponent(eventId)}/registration`);
  },

  register(eventId, payload) {
    return api.post(`/public/events/${encodeURIComponent(eventId)}/registration`, payload);
  },

  /** The organizer's queue. Optionally narrowed to one status. */
  list(eventId, status) {
    const params = {};
    if (status) params.status = status;
    return api.get(`/events/${encodeURIComponent(eventId)}/registrations`, { params });
  },

  settings(eventId, payload) {
    return api.put(`/events/${encodeURIComponent(eventId)}/registration-settings`, payload);
  },

  approve(eventId, registrationId) {
    return api.post(
      `/events/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(registrationId)}/approve`
    );
  },

  reject(eventId, registrationId, note) {
    return api.post(
      `/events/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(registrationId)}/reject`,
      { note: note || null }
    );
  },

  cancel(eventId, registrationId) {
    return api.post(
      `/events/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(registrationId)}/cancel`
    );
  }
};
