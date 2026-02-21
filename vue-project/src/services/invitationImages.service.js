import axios from "axios";
import backendApi from "@/services/backendApi";
import { baseUrl } from "@/services/baseUrl";

export const invitationImagesService = {
  async uploadOurStoryImages(eventId, files) {
    const fd = new FormData();
    for (const file of files) {
      fd.append("files", file);
    }
    // Use plain axios so the browser sets the correct multipart boundary
    const res = await axios.post(`${baseUrl}/public/media/upload`, fd, {
      params: { eventId },
    });
    return res.data;
  },

  async uploadHeroImage(eventId, file) {
    const fd = new FormData();
    fd.append("files", file);
    const res = await axios.post(`${baseUrl}/public/media/upload`, fd, {
      params: { eventId },
    });
    return res.data;
  },

  deleteOurStoryImage(eventId, url) {
    return backendApi.delete("/public/media", { params: { path: url } });
  },

  deleteHeroImage(eventId) {
    return backendApi.delete("/public/media", { params: { eventId } });
  },
};
