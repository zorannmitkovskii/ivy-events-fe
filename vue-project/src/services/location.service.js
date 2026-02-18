import { api } from "@/services/api";

export const locationService = {
  list() {
    return api.get("/locations");
  },

  getById(id) {
    return api.get(`/locations/${encodeURIComponent(id)}`);
  },

  create(payload) {
    return api.post("/locations", payload);
  },

  update(id, payload) {
    return api.put(`/locations/${encodeURIComponent(id)}`, payload);
  },

  remove(id) {
    return api.del(`/locations/${encodeURIComponent(id)}`);
  },
};
