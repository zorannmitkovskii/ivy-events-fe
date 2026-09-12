<template>
  <div ref="root" class="bell">
    <button class="icon-btn" type="button" :aria-expanded="open" :aria-label="t('common.notifications')" @click="toggle">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" />
      </svg>
      <span v-if="notificationStore.unreadCount > 0" class="dot"></span>
    </button>

    <div v-if="open" class="panel">
      <div class="panel-head">
        <b>{{ t('notifications.title') }}</b>
        <button v-if="notificationStore.unreadCount > 0" type="button" @click="onMarkAllRead">
          {{ t('notifications.markAllRead') }}
        </button>
      </div>

      <p v-if="notificationStore.loading" class="panel-empty">{{ t('common.loading') }}</p>

      <p v-else-if="!notificationStore.notifications.length" class="panel-empty">
        {{ t('notifications.empty') }}
      </p>

      <ul v-else class="panel-list">
        <li
          v-for="n in notificationStore.notifications"
          :key="n.id"
          :class="{ unread: !n.isRead }"
          @click="onNotifClick(n)"
        >
          <span class="ok-dot" :class="{ 'warn-dot': n.inviteStatus !== 'CONFIRMED' }"></span>
          <div>
            <p>{{ n.message }}</p>
            <small>{{ formatTime(n.createdAt) }}</small>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onboardingStore } from '@/store/onboarding.store'
import {
  notificationStore,
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  startPolling,
  stopPolling,
} from '@/store/notification.store'

/**
 * The bell and its panel, lifted out of the old `TopBar` so all four
 * workspaces share one — the notification store is per-event and global, and
 * three copies of this markup would have meant three unread counts to keep
 * agreeing with each other.
 */

const MINUTE_MS = 60000
const HOUR_MIN = 60
const DAY_HOURS = 24

const { t } = useI18n()

const root = ref(null)
const open = ref(false)

const eventId = computed(() => onboardingStore.eventId)

function toggle() {
  open.value = !open.value
  if (open.value && eventId.value) {
    fetchNotifications(eventId.value)
    if (notificationStore.unreadCount > 0) markAllAsRead(eventId.value)
  }
}

function onNotifClick(n) {
  if (!n.isRead) markAsRead(n.id)
}

function onMarkAllRead() {
  if (eventId.value) markAllAsRead(eventId.value)
}

/** A relative time, coarse: this is a glance, not a log. */
function formatTime(dateStr) {
  if (!dateStr) return ''
  const minutes = Math.floor((Date.now() - new Date(dateStr)) / MINUTE_MS)
  if (minutes < 1) return t('notifications.justNow')
  if (minutes < HOUR_MIN) return `${minutes}m`
  const hours = Math.floor(minutes / HOUR_MIN)
  if (hours < DAY_HOURS) return `${hours}h`
  return new Date(dateStr).toLocaleDateString()
}

function onClickOutside(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false
}

function onKeydown(e) {
  if (e.key === 'Escape') open.value = false
}

watch(
  eventId,
  (id) => {
    stopPolling()
    if (id) {
      fetchUnreadCount(id)
      startPolling(id)
    }
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
  stopPolling()
})
</script>

<style scoped>
/* `.icon-btn`, its `.dot` and `.ok-dot` are the design's, in `ivy/dash.css`.
   The panel is what the mockup has no version of — its bell opens nothing. */
.bell {
  position: relative;
}

.panel {
  position: absolute;
  z-index: 40;
  top: calc(100% + 10px);
  right: 0;
  width: min(360px, calc(100vw - 32px));
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--card);
  box-shadow: var(--shadow);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
}

.panel-head button {
  font-size: 13.5px;
  color: var(--ink-2);
}

.panel-head button:hover {
  color: var(--ivy);
}

.panel-empty {
  padding: 28px 16px;
  text-align: center;
  font-size: 14.5px;
  color: var(--ink-3);
}

.panel-list {
  margin: 0;
  padding: 6px;
  list-style: none;
}

.panel-list li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: start;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
}

.panel-list li:hover {
  background: var(--mist-2);
}

.panel-list li.unread {
  background: var(--mist);
}

.panel-list p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.4;
}

.panel-list small {
  font-size: 12.5px;
  color: var(--ink-3);
}

.panel-list .ok-dot {
  margin-top: 6px;
}
</style>
