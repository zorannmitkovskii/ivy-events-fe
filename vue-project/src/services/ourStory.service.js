import { api } from "@/services/api";

export const ourStoryApi = {
  list(eventId) {
    const params = {};
    if (eventId) params.eventId = eventId;
    return api.get("/our-stories", { params });
  },

  listWithImages(eventId) {
    return api.get("/our-stories/with-images", { params: { eventId } });
  },

  getById(id) {
    return api.get(`/our-stories/${encodeURIComponent(id)}`);
  },

  create(payload, file) {
    const fd = new FormData();
    fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    if (file) fd.append("file", file);
    return api.post("/our-stories", fd, {
      headers: { "Content-Type": undefined },
    });
  },

  update(id, payload, file) {
    const fd = new FormData();
    fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    if (file) fd.append("file", file);
    return api.put(`/our-stories/${encodeURIComponent(id)}`, fd, {
      headers: { "Content-Type": undefined },
    });
  },

  remove(id) {
    return api.del(`/our-stories/${encodeURIComponent(id)}`);
  },
};
