import axios from "axios";
import backendApi from "@/services/backendApi";
import { baseUrl } from "@/services/baseUrl";
import { withRetry, runInBackgroundWithRetry } from "@/utils/retry";

function buildMediaUpload(files, eventId) {
  const fileList = Array.isArray(files) ? files : [files];
  const formData = new FormData();
  fileList.forEach((f) => formData.append("files", f));
  return { formData, fileList };
}

async function postMediaUpload(formData, eventId, fileList) {
  try {
    const res = await axios.post(
      `${baseUrl}/public/media/upload`,
      formData,
      {
        params: { eventId },
        timeout: 5 * 60 * 1000,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data;
  } catch (err) {
    if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
      const totalSize = fileList.reduce((sum, f) => sum + (f.size || 0), 0);
      const sizeMB = (totalSize / (1024 * 1024)).toFixed(1);
      const e = new Error(
        `Upload failed (${sizeMB} MB). Check your internet connection or try uploading fewer/smaller files.`
      );
      e.cause = err;
      throw e;
    }
    if (err.code === "ECONNABORTED") {
      throw new Error("Upload timed out. Try uploading fewer files or use a faster connection.");
    }
    const detail = err.response?.data?.message || err.response?.data?.data?.detail;
    if (detail) {
      const e = new Error(detail);
      e.response = err.response;
      throw e;
    }
    throw err;
  }
}

export const mediaService = {
  async list(eventId, { page = 0, size = 30 } = {}) {
    const res = await backendApi.get("/public/media", {
      params: { eventId, page, size }
    });
    return res.data;
  },

  async upload(files, eventId) {
    const { formData, fileList } = buildMediaUpload(files, eventId);
    return withRetry(() => postMediaUpload(formData, eventId, fileList), { retries: 2 });
  },

  uploadInBackground(files, eventId, { onSuccess, onError } = {}) {
    const { formData, fileList } = buildMediaUpload(files, eventId);
    runInBackgroundWithRetry(() => postMediaUpload(formData, eventId, fileList), {
      onSuccess,
      onError,
      retries: 2,
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
