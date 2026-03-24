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
    try {
      const res = await axios.post(
        `${baseUrl}/public/media/upload`,
        formData,
        {
          params: { eventId },
          timeout: 5 * 60 * 1000, // 5 min for large files on slow mobile
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return res.data;
    } catch (err) {
      // Provide descriptive error for common mobile issues
      if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        const totalSize = fileList.reduce((sum, f) => sum + (f.size || 0), 0);
        const sizeMB = (totalSize / (1024 * 1024)).toFixed(1);
        throw new Error(
          `Upload failed (${sizeMB} MB). Check your internet connection or try uploading fewer/smaller files.`
        );
      }
      if (err.code === "ECONNABORTED") {
        throw new Error("Upload timed out. Try uploading fewer files or use a faster connection.");
      }
      // Preserve backend error message if available
      const detail = err.response?.data?.message || err.response?.data?.data?.detail;
      if (detail) throw new Error(detail);
      throw err;
    }
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
