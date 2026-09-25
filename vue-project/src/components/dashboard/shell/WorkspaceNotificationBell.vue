<template>
  <div ref="root" class="wbell">
    <button class="icon-btn" type="button" :aria-expanded="open" :aria-label="t('common.notifications')" @click="toggle">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" />
      </svg>
      <span v-if="unread > 0" class="dot"></span>
    </button>

    <div v-if="open" class="wbell-panel">
      <div class="wbell-head">
        <b>{{ t('notifications.title') }}</b>
        <button v-if="unread > 0" type="button" @click="onMarkAllRead">{{ t('notifications.markAllRead') }}</button>
      </div>

      <p v-if="loading && !items.length" class="wbell-note">{{ t('common.loading') }}</p>
      <p v-else-if="!items.length" class="wbell-note">{{ t('notifications.empty') }}</p>

      <ul v-else class="wbell-list">
        <li v-for="item in items" :key="item.id" :class="{ 'wbell-unread': !item.read }" @click="onItemClick(item)">
          <span class="ok-dot" :class="{ 'warn-dot': isWarning(item) }"></span>
          <div>
            <p>{{ titleOf(item) }}</p>
            <small>{{ formatTime(item.createdAt) }}</small>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { unwrapData, workspaceInboxService } from '@/services/workspaceInbox.service'

/**
 * The bell of the agency and vendor consoles.
 *
 * <p>The event workspace's bell is about one event and has nothing to say
 * where no event is selected. This one reads the notices addressed to the
 * person, their agency or their vendor — bookings, overdue tasks, a new
 * inquiry — each titled here from its template, in the viewer's language.
 */

const MINUTE_MS = 60000
const HOUR_MIN = 60
const DAY_HOURS = 24
const POLL_MS = 60000
/** The templates that mean something went wrong, drawn with the warning dot. */
const WARNINGS = ['BOOKING_CANCELLED_CRITICAL_', 'AGENCY_TASKS_OVERDUE', 'AGENCY_EVENT_DEADLINE']

const { t, te } = useI18n()

const root = ref(null)
const open = ref(false)
const items = ref([])
const unread = ref(0)
const loading = ref(false)
let poll = null

async function loadCount() {
  try {
    unread.value = unwrapData(await workspaceInboxService.unreadCount())?.count ?? 0
  } catch {
    // A missed count is retried on the next tick; the bell is not worth an error.
  }
}

async function loadPage() {
  loading.value = true
  try {
    const page = unwrapData(await workspaceInboxService.page())
    items.value = Array.isArray(page?.items) ? page.items : []
    unread.value = page?.unread ?? unread.value
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) loadPage()
}

async function onItemClick(item) {
  if (item.read) return
  try {
    await workspaceInboxService.markRead(item.id)
    item.read = true
    unread.value = Math.max(0, unread.value - 1)
  } catch {
    // Left unread; the next click tries again.
  }
}

async function onMarkAllRead() {
  try {
    await workspaceInboxService.markAllRead()
    items.value.forEach((item) => (item.read = true))
    unread.value = 0
  } catch {
    // Nothing changed on the server, so nothing changes here.
  }
}

/** The template's sentence with its facts filled in; a template this build does not know reads generically. */
function titleOf(item) {
  const key = `workspaceInbox.templates.${item.template}`
  return te(key) ? t(key, item.params || {}) : t('workspaceInbox.fallback')
}

function isWarning(item) {
  return WARNINGS.some((prefix) => String(item.template).startsWith(prefix))
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

function onClickOutside(event) {
  if (root.value && !root.value.contains(event.target)) open.value = false
}

function onKeydown(event) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  loadCount()
  poll = setInterval(loadCount, POLL_MS)
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  clearInterval(poll)
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* `.icon-btn`, its `.dot` and `.ok-dot` are the design's, in `ivy/dash.css`.
   The panel mirrors the event bell's; prefixed, as the design's names are global. */
.wbell {
  position: relative;
}

.wbell-panel {
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

.wbell-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
}

.wbell-head button {
  font-size: 13.5px;
  color: var(--ink-2);
}

.wbell-head button:hover {
  color: var(--ivy);
}

.wbell-note {
  padding: 28px 16px;
  text-align: center;
  font-size: 14.5px;
  color: var(--ink-3);
}

.wbell-list {
  margin: 0;
  padding: 6px;
  list-style: none;
}

.wbell-list li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: start;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
}

.wbell-list li:hover {
  background: var(--mist-2);
}

.wbell-list li.wbell-unread {
  background: var(--mist);
}

.wbell-list p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.4;
}

.wbell-list small {
  font-size: 12.5px;
  color: var(--ink-3);
}

.wbell-list .ok-dot {
  margin-top: 6px;
}
</style>
