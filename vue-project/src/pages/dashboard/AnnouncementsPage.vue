<template>
  <div class="announcements-page">
    <header class="page-head">
      <h1>{{ t('announcements.title') }}</h1>
      <p class="sub">{{ t('announcements.subtitle') }}</p>
    </header>

    <form class="composer" @submit.prevent="publish">
      <label class="field">
        <span>{{ t('announcements.newTitle') }}</span>
        <input v-model="draft.title" type="text" maxlength="200" required />
      </label>

      <label class="field">
        <span>{{ t('announcements.newBody') }}</span>
        <textarea v-model="draft.body" rows="3"></textarea>
      </label>

      <div class="row">
        <label class="field">
          <span>{{ t('announcements.audience') }}</span>
          <select v-model="draft.audience">
            <option v-for="option in AUDIENCES" :key="option" :value="option">
              {{ t(`announcements.audience${option}`) }}
            </option>
          </select>
        </label>

        <label class="check">
          <input v-model="draft.urgent" type="checkbox" />
          {{ t('announcements.urgent') }}
        </label>
      </div>

      <!-- Said out loud rather than left to be discovered. -->
      <p class="hint">{{ t('announcements.urgentHint') }}</p>

      <button class="btn" type="submit" :disabled="!draft.title.trim() || busy">
        {{ t('announcements.publish') }}
      </button>
    </form>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <ul class="list">
      <li v-for="item in items" :key="item.id" :class="{ inactive: !isLive(item) }">
        <div class="item-head">
          <span class="item-title">{{ item.title }}</span>
          <span class="badges">
            <span v-if="item.urgent" class="badge urgent">{{ t('announcements.urgent') }}</span>
            <span class="badge">{{ t(`announcements.audience${item.audience}`) }}</span>
            <span v-if="item.withdrawnAt" class="badge muted">{{ t('announcements.withdrawn') }}</span>
            <span v-else-if="isScheduled(item)" class="badge">{{ t('announcements.scheduled') }}</span>
            <span v-else-if="isExpired(item)" class="badge muted">{{ t('announcements.expired') }}</span>
            <span v-if="item.notifiedAt" class="badge">{{ t('announcements.notified') }}</span>
          </span>
        </div>
        <p v-if="item.body" class="item-body">{{ item.body }}</p>
        <button v-if="!item.withdrawnAt" class="link-btn" @click="withdraw(item)">
          {{ t('announcements.withdraw') }}
        </button>
      </li>
    </ul>

    <p v-if="!items.length" class="empty">{{ t('announcements.empty') }}</p>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { announcementsService } from '@/services/announcements.service'
import { useAuthUser } from '@/composables/useAuthUser'

const AUDIENCES = ['EVERYONE', 'CONFIRMED', 'AWAITING_REPLY', 'VIP']

const { t } = useI18n()
const { eventId: currentEventId } = useAuthUser()
const eventId = currentEventId.value

const items = ref([])
const busy = ref(false)
const error = ref('')

const draft = reactive({
  title: '',
  body: '',
  audience: 'EVERYONE',
  urgent: false,
})

function unwrap(response) {
  return response?.data ?? response ?? null
}

onMounted(load)

async function load() {
  try {
    items.value = unwrap(await announcementsService.list(eventId)) || []
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function publish() {
  busy.value = true
  error.value = ''
  try {
    await announcementsService.publish(eventId, { ...draft })
    draft.title = ''
    draft.body = ''
    draft.urgent = false
    await load()
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  } finally {
    busy.value = false
  }
}

async function withdraw(item) {
  try {
    await announcementsService.withdraw(eventId, item.id)
    await load()
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

// The same three questions the server asks, only to grey a row out. The
// server's answer is the one that decides what guests see.
function isScheduled(item) {
  return item.publishAt && new Date(item.publishAt) > new Date()
}

function isExpired(item) {
  return item.expiresAt && new Date(item.expiresAt) <= new Date()
}

function isLive(item) {
  return !item.withdrawnAt && !isScheduled(item) && !isExpired(item)
}
</script>

<style scoped>
.announcements-page { display: flex; flex-direction: column; gap: 16px; padding: 4px; }
.page-head h1 { margin: 0; font-size: 22px; }
.sub { margin: 4px 0 0; font-size: 13px; color: #6b6b6b; }

.composer { display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 10px; background: #fff; border: 1px solid #ece8e0; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.field input, .field textarea, .field select {
  padding: 8px 10px; border: 1px solid #ddd8cf; border-radius: 8px; font-size: 14px; font-family: inherit;
}
.row { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
.check { display: flex; gap: 8px; align-items: center; font-size: 14px; }
.hint { margin: 0; font-size: 11.5px; color: #8f6d1f; }

.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.list li { padding: 12px 14px; border-radius: 10px; background: #fff; border: 1px solid #ece8e0; }
.list li.inactive { opacity: 0.55; }
.item-head { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; align-items: baseline; }
.item-title { font-weight: 600; }
.item-body { margin: 6px 0 0; font-size: 14px; color: #4a4a4a; }

.badges { display: flex; gap: 6px; flex-wrap: wrap; }
.badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #f0efe9; }
.badge.urgent { background: #fdeceb; color: #a3271f; }
.badge.muted { background: #eee; color: #777; }

.empty { font-size: 13px; color: #6b6b6b; }
.error { font-size: 13px; color: #a3271f; }

.btn { align-self: flex-start; padding: 9px 16px; border: 0; border-radius: 8px; background: #5a7a52; color: #fff; font-size: 14px; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: default; }
.link-btn { border: 0; background: none; color: #a3271f; cursor: pointer; font-size: 13px; padding: 6px 0 0; }
</style>
