import { api } from "@/services/api";
import backendApi from "@/services/backendApi";

export const invitationImagesService = {
  async uploadOurStoryImages(eventId, files) {
    const fd = new FormData();
    for (const file of files) {
      fd.append("files", file);
    }
    return api.post(`/invitation-images/our-story/${encodeURIComponent(eventId)}`, fd, {
      headers: { "Content-Type": undefined },
    });
  },

  async uploadHeroImage(eventId, file) {
    const fd = new FormData();
    fd.append("file", file);
    return api.post(`/invitation-images/hero/${encodeURIComponent(eventId)}`, fd, {
      headers: { "Content-Type": undefined },
    });
  },

  deleteOurStoryImage(eventId, url) {
    return backendApi.delete("/public/media", { params: { path: url } });
  },

  deleteHeroImage(eventId) {
    return backendApi.delete("/public/media", { params: { eventId } });
  },
};
