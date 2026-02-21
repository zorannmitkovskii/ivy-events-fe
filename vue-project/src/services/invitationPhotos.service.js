import { api } from "@/services/api";

export const invitationPhotosApi = {
  list(eventId) {
    return api.get(`/invitation-photos/${encodeURIComponent(eventId)}`);
  },

  upload(eventId, file, displayOrder = 0) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("displayOrder", displayOrder);
    return api.post(`/invitation-photos/${encodeURIComponent(eventId)}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  remove(eventId, photoId) {
    return api.del(
      `/invitation-photos/${encodeURIComponent(eventId)}/${encodeURIComponent(photoId)}`
    );
  },
};
