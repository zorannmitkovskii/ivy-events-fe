import { api } from "@/services/api";

/**
 * The bell of the agency and vendor consoles: notices addressed to the caller,
 * their agency or their vendor. Not about one event, so no event id — the
 * event workspace keeps its own per-event bell in `notifications.service`.
 */
export const workspaceInboxService = {
  page(page = 0, size = 20) {
    return api.get("/me/notifications", { params: { page, size } });
  },

  unreadCount() {
    return api.get("/me/notifications/unread-count");
  },

  markRead(id) {
    return api.put(`/me/notifications/${encodeURIComponent(id)}/read`);
  },

  markAllRead() {
    return api.put("/me/notifications/read-all");
  },
};

/** The payload out of an `ApiResponse`, whichever way the client handed it back. */
export function unwrapData(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}
