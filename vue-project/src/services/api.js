import axios from "axios";
import { baseUrl } from "./baseUrl";

function getToken() {
  return localStorage.getItem("access_token");
}

const apiClient = axios.create({
  baseURL: `${baseUrl}/v1/api`,
  headers: { "Content-Type": "application/json" }
});

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors so services/composables get a readable message
function normalizeAxiosError(err) {
  // Axios error shape
  const status = err?.response?.status;
  const data = err?.response?.data;

  // Prefer BE message if any
  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;

  if (status) return `HTTP ${status}`;
  return err?.message || "Network error";
}

/**
 * Generic API wrapper.
 * Usage examples:
 *  api.get("/events/123/overview")
 *  api.get("/events/123/guests", { params: { q: "john" } })
 *  api.post("/events/123/agenda", payload)
 */
export const api = {
  async get(path, config = {}) {
    try {
      const res = await apiClient.get(path, config);
      return res.data;
    } catch (err) {
      throw new Error(normalizeAxiosError(err));
    }
  },

  async post(path, body, config = {}) {
    try {
      const res = await apiClient.post(path, body, config);
      return res.data;
    } catch (err) {
      throw new Error(normalizeAxiosError(err));
    }
  },

  async put(path, body, config = {}) {
    try {
      const res = await apiClient.put(path, body, config);
      return res.data;
    } catch (err) {
      throw new Error(normalizeAxiosError(err));
    }
  },

  async patch(path, body, config = {}) {
    try {
      const res = await apiClient.patch(path, body, config);
      return res.data;
    } catch (err) {
      throw new Error(normalizeAxiosError(err));
    }
  },

  async del(path, config = {}) {
    try {
      const res = await apiClient.delete(path, config);
      return res.data;
    } catch (err) {
      throw new Error(normalizeAxiosError(err));
    }
  }
};

export default apiClient;
