import { api } from "@/services/api";

const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

export const invitationImagesService = {
  uploadOurStoryImages(eventId, files) {
    const fd = new FormData();
    for (const file of files) {
      fd.append("files", file);
    }
    return api.post(`/invitation-images/our-story/${eventId}`, fd, MULTIPART);
  },

  uploadHeroImage(eventId, file) {
    const fd = new FormData();
    fd.append("file", file);
    return api.post(`/invitation-images/hero/${eventId}`, fd, MULTIPART);
  },

  deleteOurStoryImage(eventId, url) {
    return api.del(`/invitation-images/our-story/${eventId}`, { params: { url } });
  },

  deleteHeroImage(eventId) {
    return api.del(`/invitation-images/hero/${eventId}`);
  },
};
