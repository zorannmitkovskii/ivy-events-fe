<template>
  <header class="topbar">
    <div class="topbar-left">
      <button v-if="showHamburger" class="menu-toggle" @click="$emit('toggle-menu')" aria-label="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <span class="topbar-page">{{ title }}</span>
      <span class="live-dot" :title="t('overview.live')"></span>
    </div>

    <div class="topbar-right">
      <router-link
        :to="{ name: 'EventInvitationsPage', params: { lang }, query: { from: 'dashboard' } }"
        class="tb-btn tb-btn-ghost"
      >
        &#9993; {{ t("overview.editInvitation") }}
      </router-link>
      <router-link
        v-if="showUpgrade"
        :to="{ name: 'dashboard.packages', params: { lang } }"
        class="tb-btn tb-btn-gold"
      >
        &#9733; {{ t('cpay.upgrade') }}
      </router-link>

      <!-- Notification bell -->
      <div class="notif-wrapper" ref="notifWrapperRef">
        <button class="notif-bell" @click="toggleNotifPanel" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span v-if="notificationStore.unreadCount > 0" class="notif-badge">
            {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
          </span>
        </button>

        <div v-if="notifOpen" class="notif-panel">
          <div class="notif-panel-header">
            <span class="notif-panel-title">{{ t('notifications.title') }}</span>
            <button
              v-if="notificationStore.unreadCount > 0"
              class="notif-mark-all"
              @click="onMarkAllRead"
            >
              {{ t('notifications.markAllRead') }}
            </button>
          </div>

          <div v-if="notificationStore.loading" class="notif-empty">
            ...
          </div>
          <div v-else-if="notificationStore.notifications.length === 0" class="notif-empty">
            {{ t('notifications.empty') }}
          </div>
          <ul v-else class="notif-list">
            <li
              v-for="n in notificationStore.notifications"
              :key="n.id"
              class="notif-item"
              :class="{ unread: !n.isRead }"
              @click="onNotifClick(n)"
            >
              <div class="notif-icon-circle" :class="n.inviteStatus === 'CONFIRMED' ? 'confirmed' : 'declined'">
                <svg v-if="n.inviteStatus === 'CONFIRMED'" width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
              <div class="notif-body">
                <p class="notif-msg">{{ n.message }}</p>
                <span class="notif-time">{{ formatTime(n.createdAt) }}</span>
              </div>
              <span v-if="!n.isRead" class="notif-dot"></span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { onboardingStore } from "@/store/onboarding.store";
import {
  notificationStore,
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  startPolling,
  stopPolling,
} from "@/store/notification.store";

const { t } = useI18n();

defineProps({
  showHamburger: { type: Boolean, default: false }
});

defineEmits(["toggle-menu"]);

const route = useRoute();
const lang = computed(() => route.params.lang || "mk");
const notifOpen = ref(false);
const notifWrapperRef = ref(null);

const eventId = computed(() => onboardingStore.eventId);

const showUpgrade = computed(() => {
  const s = onboardingStore.eventStatus;
  return s && s !== "ACTIVE";
});

const title = computed(() => {
  const map = {
    "dashboard.overview": t("sidebar.overview"),
    "dashboard.guests": t("sidebar.guests"),
    "dashboard.tasks": t("sidebar.tasks"),
    "dashboard.budget": t("sidebar.budget"),
    "dashboard.tables": t("sidebar.seating"),
    "dashboard.agenda": t("sidebar.agenda"),
    "dashboard.gallery": t("sidebar.gallery"),
    "dashboard.our-story": t("sidebar.ourStory"),
    "dashboard.wedding-details": t("sidebar.weddingDetails"),
    "dashboard.notifications": t("sidebar.notifications"),
    "dashboard.team": t("sidebar.team"),
    "dashboard.settings": t("sidebar.eventSettings"),
    "dashboard.packages": t("sidebar.packages"),
    "dashboard.invitation-links": t("sidebar.invitationLinks"),
    "dashboard.support": t("sidebar.support"),
    "admin.events": "Events",
    "admin.packages": "Packages",
    "admin.users": "Users",
    "admin.reviews": "Reviews",
    "admin.contacts": "Contacts",
    "admin.faq": "FAQ",
    "admin.invitationTemplates": "Invitation Templates",
  };
  return map[String(route.name)] ?? "Dashboard";
});

// Notification logic
function toggleNotifPanel() {
  notifOpen.value = !notifOpen.value;
  if (notifOpen.value && eventId.value) {
    fetchNotifications(eventId.value);
    if (notificationStore.unreadCount > 0) {
      markAllAsRead(eventId.value);
    }
  }
}

function onNotifClick(n) {
  if (!n.isRead) markAsRead(n.id);
}

function onMarkAllRead() {
  if (eventId.value) markAllAsRead(eventId.value);
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t("notifications.justNow");
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

function onClickOutside(e) {
  if (notifWrapperRef.value && !notifWrapperRef.value.contains(e.target)) {
    notifOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", onClickOutside);
  if (eventId.value) startPolling(eventId.value);
});

onUnmounted(() => {
  document.removeEventListener("click", onClickOutside);
  stopPolling();
});

watch(eventId, (newId) => {
  if (newId) startPolling(newId);
  else stopPolling();
});
</script>

<style scoped>
.topbar {
  background: rgba(250, 246, 239, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--dash-cream-border);
  padding: 0 40px;
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.breadcrumb {
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dash-light);
  font-weight: 600;
}

.topbar-divider {
  color: var(--dash-cream-border);
  font-size: 16px;
}

.topbar-page {
  font-size: 13px;
  color: var(--dash-ink);
  font-weight: 500;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dash-sage-mid);
  display: inline-block;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.topbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 9px;
  font-family: 'Outfit', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s;
  letter-spacing: 0.01em;
  text-decoration: none;
  border: none;
}

.tb-btn-ghost {
  background: transparent;
  color: var(--dash-ink);
  border: 1.5px solid var(--dash-cream-border);
}

.tb-btn-ghost:hover {
  border-color: var(--dash-sage-light);
  color: var(--dash-sage-dark);
}

.tb-btn-gold {
  background: linear-gradient(135deg, var(--dash-gold), #9a7a3e);
  color: #fff;
  box-shadow: 0 2px 10px rgba(184, 149, 78, 0.35);
}

.tb-btn-gold:hover {
  box-shadow: 0 4px 16px rgba(184, 149, 78, 0.5);
  transform: translateY(-1px);
}

.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1.5px solid var(--dash-cream-border);
  border-radius: 9px;
  background: transparent;
  color: var(--dash-ink);
  cursor: pointer;
  padding: 0;
}

.menu-toggle:hover {
  border-color: var(--dash-sage-light);
}

/* ── Notification bell ── */
.notif-wrapper {
  position: relative;
}

.notif-bell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1.5px solid var(--dash-cream-border);
  border-radius: 9px;
  background: transparent;
  color: var(--dash-ink);
  cursor: pointer;
  transition: border-color 0.18s;
}

.notif-bell:hover {
  border-color: var(--dash-sage-light);
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #e74c3c;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  pointer-events: none;
}

/* ── Notification panel ── */
.notif-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 340px;
  max-height: 420px;
  background: #fff;
  border: 1px solid var(--dash-cream-border, #e5e0d8);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 200;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notif-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--dash-cream-border, #e5e0d8);
}

.notif-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--dash-ink, #1a1a1a);
}

.notif-mark-all {
  background: none;
  border: none;
  color: var(--dash-sage-dark, #3a5a40);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}

.notif-mark-all:hover {
  text-decoration: underline;
}

.notif-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--dash-light, #999);
  font-size: 13px;
}

.notif-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  max-height: 360px;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.notif-item:hover {
  background: rgba(0, 0, 0, 0.02);
}

.notif-item.unread {
  background: rgba(58, 90, 64, 0.04);
}

.notif-icon-circle {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.notif-icon-circle.confirmed {
  background: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
}

.notif-icon-circle.declined {
  background: rgba(211, 47, 47, 0.12);
  color: #d32f2f;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-msg {
  margin: 0;
  font-size: 13px;
  color: var(--dash-ink, #1a1a1a);
  line-height: 1.4;
}

.notif-time {
  font-size: 11px;
  color: var(--dash-light, #999);
  margin-top: 2px;
  display: inline-block;
}

.notif-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dash-sage-dark, #3a5a40);
  margin-top: 6px;
}

@media (max-width: 1024px) {
  .topbar {
    padding: 0 16px;
  }
  .menu-toggle {
    display: inline-flex;
  }
  .topbar-right .tb-btn {
    display: none;
  }
  .notif-panel {
    width: 300px;
    right: -8px;
  }
}
</style>
