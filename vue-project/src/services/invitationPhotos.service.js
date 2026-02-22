import { api } from "@/services/api";

export const invitationPhotosApi = {
  list(eventId) {
    return api.get(`/invitation-images/collage/${encodeURIComponent(eventId)}`);
  },

  upload(eventId, files) {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    return api.post(`/invitation-images/collage/${encodeURIComponent(eventId)}`, formData, {
      headers: { "Content-Type": undefined },
    });
  },

  remove(eventId, url) {
    return api.del(`/invitation-images/collage/${encodeURIComponent(eventId)}`, {
      params: { url },
    });
  },
};
