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

    const url = `${baseUrl}/public/media/upload?eventId=${encodeURIComponent(eventId)}`;

    // XMLHttpRequest instead of fetch — iOS Safari has a known bug where
    // fetch() + FormData sometimes drops the multipart boundary from
    // Content-Type, causing the server to reject the request.
    // XHR handles FormData reliably on all platforms including iOS WebKit.
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { resolve(xhr.responseText); }
        } else {
          reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error – check your connection and try again."));
      xhr.send(formData);
    });
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
