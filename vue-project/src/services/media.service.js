import axios from "axios";
import backendApi from "@/services/backendApi";
import { baseUrl } from "@/services/baseUrl";

export const mediaService = {
  async list(eventId, { page = 0, size = 30 } = {}) {
    const res = await backendApi.get("/public/media", {
      params: { eventId, page, size }
    });
    return res.data;
  },

  async upload(files, eventId) {
    const formData = new FormData();
    const fileList = Array.isArray(files) ? files : [files];
    fileList.forEach(f => formData.append("files", f));

    // Use plain axios (no default Content-Type header) so the browser
    // sets the correct multipart/form-data boundary on all platforms (iOS Safari included)
    const res = await axios.post(
      `${baseUrl}/public/media/upload`,
      formData,
      { params: { eventId } }
    );
    return res.data;
  },

  async remove(path) {
    const res = await backendApi.delete("/public/media", {
      params: { path }
    });
    return res.data;
  },

  async downloadAll(eventId) {
    const res = await backendApi.get("/public/media/download/all", {
      params: { eventId },
      responseType: "blob"
    });
    return res.data;
  },

  async downloadSelected(fileIds) {
    const res = await backendApi.post("/public/media/download/selected", fileIds, {
      responseType: "blob"
    });
    return res.data;
  }
};

export default mediaService;
