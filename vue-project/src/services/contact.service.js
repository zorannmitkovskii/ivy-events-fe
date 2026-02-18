import { api } from "@/services/api";

export const contactService = {
  /** Create a contact-us message (BaseController POST) */
  create(payload) {
    return api.post("/contact-us", payload);
  },

  /** Get a single contact-us by id (BaseController GET /:id) */
  getById(id) {
    return api.get(`/contact-us/${encodeURIComponent(id)}`);
  },

  /** List all contact-us messages (BaseController GET) */
  listAll() {
    return api.get("/contact-us");
  },

  /** Update a contact-us message (BaseController PUT /:id) */
  update(id, payload) {
    return api.put(`/contact-us/${encodeURIComponent(id)}`, payload);
  },

  /** Delete a contact-us message (BaseController DELETE /:id) */
  remove(id) {
    return api.del(`/contact-us/${encodeURIComponent(id)}`);
  },

  /** Admin — filter by status (IN_REVIEW / RESOLVED) */
  listByStatus(status) {
    return api.get(`/contact-us/status/${encodeURIComponent(status)}`);
  },

  /** User/Admin/Organizer — list by event id */
  listByEvent(eventId) {
    return api.get(`/contact-us/event/${encodeURIComponent(eventId)}`);
  },
};
