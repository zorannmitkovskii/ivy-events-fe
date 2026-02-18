import { api } from "@/services/api";
import publicApi from "@/services/backendApi";

export const invitationTemplateService = {
  /** Create a new invitation template (admin). Pass config with Content-Type for FormData. */
  create(payload, config = {}) {
    return api.post("/invitation-templates", payload, config);
  },

  /** List all invitation templates (admin) */
  listAll() {
    return api.get("/invitation-templates");
  },

  /** Get a single template by id (admin) */
  getById(id) {
    return api.get(`/invitation-templates/${encodeURIComponent(id)}`);
  },

  /** Update a template (admin). Pass config with Content-Type for FormData. */
  update(id, payload, config = {}) {
    return api.put(`/invitation-templates/${encodeURIComponent(id)}`, payload, config);
  },

  /** Delete a template (admin) */
  remove(id) {
    return api.del(`/invitation-templates/${encodeURIComponent(id)}`);
  },

  /** List templates by category (public, no auth required) */
  async listByCategory(category) {
    const response = await publicApi.get(`/public/invitation-templates/category/${encodeURIComponent(category)}`);
    return response.data;
  },
};
