import { api } from "@/services/api";

export const emailTemplateService = {
  /** Create a new email template (admin). Pass FormData with HTML file. */
  create(formData) {
    return api.post("/admin/email-templates", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** List all email templates (admin) */
  listAll() {
    return api.get("/admin/email-templates");
  },

  /** Get a single email template by id (admin) */
  getById(id) {
    return api.get(`/admin/email-templates/${encodeURIComponent(id)}`);
  },

  /** Update an email template (admin, JSON payload) */
  update(id, payload) {
    return api.put(`/admin/email-templates/${encodeURIComponent(id)}`, payload);
  },

  /** Upload / replace the HTML file for a template (admin) */
  uploadHtml(id, formData) {
    return api.put(
      `/admin/email-templates/${encodeURIComponent(id)}/upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  /** Delete an email template (admin) */
  remove(id) {
    return api.del(`/admin/email-templates/${encodeURIComponent(id)}`);
  },

  /** Send emails using a template (admin) */
  send(payload) {
    return api.post("/admin/email-templates/send", payload);
  },

  /** Send follow-up demo emails (admin) */
  sendFollowUpDemo(payload) {
    return api.post("/admin/email-templates/send/follow-up-demo", payload);
  },

  /** Get recipients list from the DB (admin). Optional source filter. */
  getRecipients(source) {
    const params = source ? `?source=${encodeURIComponent(source)}` : "";
    return api.get(`/admin/email-templates/recipients${params}`);
  },
};
