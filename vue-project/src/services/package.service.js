import { api } from "@/services/api";
import publicApi from "@/services/backendApi";

export const packageService = {
  list() {
    return api.get("/packages");
  },

  async listByCategory(category) {
    const res = await publicApi.get(`/public/packages/category/${encodeURIComponent(category)}`);
    return res.data;
  },

  getById(id) {
    return api.get(`/packages/${encodeURIComponent(id)}`);
  },

  create(payload) {
    return api.post("/packages", payload);
  },

  update(id, payload) {
    return api.put(`/packages/${encodeURIComponent(id)}`, payload);
  },

  remove(id) {
    return api.del(`/packages/${encodeURIComponent(id)}`);
  },
};