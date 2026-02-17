import { api } from "@/services/api";

export const ourStoryApi = {
  list(eventId) {
    const params = {};
    if (eventId) params.eventId = eventId;
    return api.get("/our-stories", { params });
  },

  getById(id) {
    return api.get(`/our-stories/${encodeURIComponent(id)}`);
  },

  create(payload) {
    return api.post("/our-stories", payload);
  },

  update(id, payload) {
    return api.put(`/our-stories/${encodeURIComponent(id)}`, payload);
  },

  remove(id) {
    return api.del(`/our-stories/${encodeURIComponent(id)}`);
  },
};
