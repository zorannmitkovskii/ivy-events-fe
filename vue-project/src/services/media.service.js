import backendApi from "@/services/backendApi";

export const mediaService = {
  async list(eventId, { page = 0, size = 30 } = {}) {
    const res = await backendApi.get("/api/media", {
      params: { eventId, page, size }
    });
    return res.data;
  },

  async upload(files, eventId) {
    const formData = new FormData();
    const fileList = Array.isArray(files) ? files : [files];
    fileList.forEach(f => formData.append("files", f));

    const res = await backendApi.post("/public/media/upload", formData, {
      headers: { "Content-Type": undefined },
      params: { eventId }
    });
    return res.data;
  },

  async remove(path) {
    const res = await backendApi.delete("/api/media", {
      params: { path }
    });
    return res.data;
  },

  async downloadAll(eventId) {
    const res = await backendApi.get("/api/media/download/all", {
      params: { eventId },
      responseType: "blob"
    });
    return res.data;
  },

  async downloadSelected(fileIds) {
    const res = await backendApi.post("/api/media/download/selected", fileIds, {
      responseType: "blob"
    });
    return res.data;
  }
};

export default mediaService;
