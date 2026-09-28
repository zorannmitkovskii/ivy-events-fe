import axios from "axios";
import { decodeJwtPayload } from "@/services/jwt";
import { baseUrl } from "./baseUrl";
import { refreshTokens, SessionExpiredError } from "./tokenRefresh";

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
  const data = await refreshTokens();
  scheduleProactiveRefresh();
  return data.access_token;
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
        // Only a refused refresh token ends the session. A refresh that
        // failed because the network blinked leaves the person signed in;
        // this request fails, and the next one tries again.
        if (!(refreshError instanceof SessionExpiredError)) {
          return Promise.reject(error);
        }
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
  const payload = decodeJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : null; // ms
}

function scheduleProactiveRefresh() {
  clearTimeout(refreshTimer);

  const token = getToken();
  const exp = getTokenExp(token);
  if (!exp) return;

  const now = Date.now();

  // Token already expired — don't proactively refresh.
  // The 401 interceptor will handle it when a real authenticated request is made.
  // This prevents spurious refresh-token calls on public pages (e.g. invitations).
  if (exp <= now) return;

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

// ── Staying signed in ───────────────────────────────────────────────
// The timer above is not enough on its own, and the gap is the ordinary
// case rather than an edge one. A background tab has its timers throttled
// to once a minute; a sleeping laptop has them stopped entirely. Come back
// to the app on Monday and the refresh that was due on Friday evening never
// ran, so the session is gone and the person is looking at a login screen
// they did not ask for.
//
// So the app also refreshes whenever it becomes visible again, and whenever
// the browser says the network came back. Between the two, "still signed in"
// stops depending on the tab having stayed awake.
//
// None of this can outlive the refresh token itself. How long that lives is
// a Keycloak realm setting, not something the frontend can decide — see
// iam-manifest.yml.

/** Leaves a valid token alone; the timer is already handling that one. */
function refreshIfStale() {
  const token = getToken();
  if (!token || !getRefreshToken()) return;

  const exp = getTokenExp(token);
  // Expired, or close enough that the next request would race the refresh.
  if (exp && exp - Date.now() > 60_000) return;

  if (isRefreshing) return;
  refreshAccessToken()
    .then(scheduleProactiveRefresh)
    .catch(() => {
      // Left to the 401 interceptor. Signing somebody out because one
      // refresh failed while the network was still coming up is the
      // behaviour this whole block exists to avoid.
    });
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshIfStale();
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("focus", refreshIfStale);
  window.addEventListener("online", refreshIfStale);
}

import { ApiError, extractApiError } from "./apiError";

// Build an ApiError or a plain Error from an axios failure
function normalizeAxiosError(err) {
  // Try structured backend error first
  const apiErr = extractApiError(err);
  if (apiErr) return apiErr;

  // Fallback: legacy / unstructured responses
  const status = err?.response?.status;
  const data = err?.response?.data;

  if (typeof data === "string" && data.trim()) return withStatus(new Error(data), status);
  if (data?.message) return withStatus(new Error(data.message), status);
  if (data?.error) return withStatus(new Error(data.error), status);
  if (status) return withStatus(new Error(`HTTP ${status}`), status);

  return new Error(err?.message || "Network error");
}

/**
 * Keeps the HTTP status on the fallback error.
 *
 * Without it, an endpoint that answers 404 with an empty body arrives as a
 * plain Error reading "HTTP 404" and the only way to recognise it is to match
 * that string — so callers that want to tell "this article has no Macedonian
 * version" apart from "something broke" end up parsing a message. ApiError
 * already carries `status`; this makes the two shapes agree.
 */
function withStatus(error, status) {
  if (status) error.status = status;
  return error;
}

/**
 * Generic API wrapper.
 * Throws ApiError when the backend returns a structured error,
 * or a plain Error for legacy / network failures.
 */
export const api = {
  async get(path, config = {}) {
    try {
      const res = await apiClient.get(path, config);
      return res.data;
    } catch (err) {
      throw normalizeAxiosError(err);
    }
  },

  async post(path, body, config = {}) {
    try {
      const res = await apiClient.post(path, body, config);
      return res.data;
    } catch (err) {
      throw normalizeAxiosError(err);
    }
  },

  async put(path, body, config = {}) {
    try {
      const res = await apiClient.put(path, body, config);
      return res.data;
    } catch (err) {
      throw normalizeAxiosError(err);
    }
  },

  async patch(path, body, config = {}) {
    try {
      const res = await apiClient.patch(path, body, config);
      return res.data;
    } catch (err) {
      throw normalizeAxiosError(err);
    }
  },

  async del(path, config = {}) {
    try {
      const res = await apiClient.delete(path, config);
      return res.data;
    } catch (err) {
      throw normalizeAxiosError(err);
    }
  }
};

export { scheduleProactiveRefresh };
export default apiClient;
