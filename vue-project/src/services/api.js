import axios from "axios";
import { baseUrl } from "./baseUrl";

function getToken() {
  return localStorage.getItem("access_token");
}

function getRefreshToken() {
  return localStorage.getItem("refresh_token");
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

// Token refresh state – prevents multiple simultaneous refresh calls
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token) {
  refreshQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token);
    }
  });
  refreshQueue = [];
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const res = await axios.post(`${baseUrl}/public/users/refresh-token`, {
    refreshToken
  });

  const data = res.data;
  const accessToken = data.access_token || data.accessToken;
  const newRefresh = data.refresh_token || data.refreshToken;

  if (accessToken) {
    localStorage.setItem("access_token", accessToken);
  }
  if (newRefresh) {
    localStorage.setItem("refresh_token", newRefresh);
  }

  scheduleProactiveRefresh();
  return accessToken;
}

// Response interceptor – refresh token on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("id_token");

        // Redirect to login page
        const lang = window.location.pathname.split("/")[1] || "mk";
        window.location.href = `/${lang}/auth/login`;
        return new Promise(() => {}); // never resolves – page is navigating away
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Proactive token refresh ─────────────────────────────────────────
// Schedules a refresh ~60 s before the access token expires so the
// refresh token stays alive as long as the user has the app open.
let refreshTimer = null;

function getTokenExp(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null; // ms
  } catch {
    return null;
  }
}

function scheduleProactiveRefresh() {
  clearTimeout(refreshTimer);

  const token = getToken();
  const exp = getTokenExp(token);
  if (!exp) return;

  const now = Date.now();
  // Refresh 60 seconds before expiry, minimum 5 seconds from now
  const delay = Math.max(exp - now - 60_000, 5_000);

  refreshTimer = setTimeout(async () => {
    if (isRefreshing) return;
    try {
      await refreshAccessToken();
      scheduleProactiveRefresh(); // reschedule with new token
    } catch {
      // Refresh failed – the 401 interceptor will handle it on next request
    }
  }, delay);
}

// Start scheduling whenever tokens change
function onTokensUpdated() {
  scheduleProactiveRefresh();
}

// Initial schedule on module load
scheduleProactiveRefresh();

// Re-schedule when another tab updates tokens
window.addEventListener("storage", (e) => {
  if (e.key === "access_token") {
    scheduleProactiveRefresh();
  }
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

export { scheduleProactiveRefresh };
export default apiClient;
