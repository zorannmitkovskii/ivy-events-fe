import { api } from "@/services/api";

export const notificationsService = {
  list(eventId) {
    return api.get("/notifications", { params: { eventId } });
  },

  getUnreadCount(eventId) {
    return api.get("/notifications/unread-count", { params: { eventId } });
  },

  markAsRead(notificationId) {
    return api.put(`/notifications/${encodeURIComponent(notificationId)}/read`);
  },

  markAllAsRead(eventId) {
    return api.put("/notifications/read-all", null, { params: { eventId } });
  }
};
