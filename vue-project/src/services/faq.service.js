import { api } from "@/services/api";
import publicApi from "@/services/backendApi";

export const faqService = {
  /** Create a new FAQ item */
  create(payload) {
    return api.post("/faq", payload);
  },

  /** List all FAQ items (admin) */
  listAll() {
    return api.get("/faq");
  },

  /** Get a single FAQ by id */
  getById(id) {
    return api.get(`/faq/${encodeURIComponent(id)}`);
  },

  /** Update an FAQ item */
  update(id, payload) {
    return api.put(`/faq/${encodeURIComponent(id)}`, payload);
  },

  /** Delete an FAQ item */
  remove(id) {
    return api.del(`/faq/${encodeURIComponent(id)}`);
  },

  /** List active FAQs (public, no auth required) */
  async listActive() {
    const response = await publicApi.get("/public/faq");
    return response.data;
  },
};
