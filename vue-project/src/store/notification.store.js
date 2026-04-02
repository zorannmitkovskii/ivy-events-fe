import { reactive } from "vue";
import { notificationsService } from "@/services/notifications.service";

export const notificationStore = reactive({
  notifications: [],
  unreadCount: 0,
  loading: false,
});

let pollTimer = null;
let currentEventId = null;

export async function fetchNotifications(eventId) {
  if (!eventId) return;
  notificationStore.loading = true;
  try {
    const data = await notificationsService.list(eventId);
    notificationStore.notifications = Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn("[notification.store] failed to fetch notifications", e);
  } finally {
    notificationStore.loading = false;
  }
}

export async function fetchUnreadCount(eventId) {
  if (!eventId) return;
  try {
    const data = await notificationsService.getUnreadCount(eventId);
    notificationStore.unreadCount = data?.count ?? 0;
  } catch (e) {
    console.warn("[notification.store] failed to fetch unread count", e);
  }
}

export async function markAsRead(notificationId) {
  try {
    await notificationsService.markAsRead(notificationId);
    const n = notificationStore.notifications.find((n) => n.id === notificationId);
    if (n && !n.isRead) {
      n.isRead = true;
      notificationStore.unreadCount = Math.max(0, notificationStore.unreadCount - 1);
    }
  } catch (e) {
    console.warn("[notification.store] failed to mark as read", e);
  }
}

export async function markAllAsRead(eventId) {
  if (!eventId) return;
  try {
    await notificationsService.markAllAsRead(eventId);
    notificationStore.notifications.forEach((n) => (n.isRead = true));
    notificationStore.unreadCount = 0;
  } catch (e) {
    console.warn("[notification.store] failed to mark all as read", e);
  }
}

export function startPolling(eventId, intervalMs = 30000) {
  stopPolling();
  currentEventId = eventId;
  if (!eventId) return;

  // Initial fetch
  fetchUnreadCount(eventId);

  pollTimer = setInterval(() => {
    fetchUnreadCount(currentEventId);
  }, intervalMs);
}

export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  currentEventId = null;
}
