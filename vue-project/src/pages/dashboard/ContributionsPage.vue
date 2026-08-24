<template>
  <div class="contributions">
    <PageHeader :title="t('contributions.title')">
      <template #actions>
        <div>
        <p class="sub">{{ t('contributions.subtitle') }}</p>
        </div>
        <a v-if="hasMusic" class="link-btn" :href="musicHref" download>
        {{ t('contributions.exportMusic') }}
        </a>
      </template>
    </PageHeader>

    <!-- Settings first: nothing arrives until something here is switched on,
         so an empty queue with everything off is not a bug. -->
    <section class="settings" :aria-label="t('contributions.settings')">
      <h2>{{ t('contributions.settings') }}</h2>

      <div class="types">
        <label v-for="type in TYPES" :key="type" class="check">
          <input v-model="enabledTypes" type="checkbox" :value="type" @change="saveSettings" />
          {{ t(`contributions.type${type}`) }}
        </label>
      </div>

      <div class="row">
        <label class="field">
          <span>{{ t('contributions.wallDelay') }}</span>
          <input
            v-model.number="settings.wallDelaySeconds"
            type="number"
            min="0"
            @change="saveSettings"
          />
        </label>

        <label class="check">
          <input v-model="settings.autoApproveText" type="checkbox" @change="saveSettings" />
          {{ t('contributions.autoApproveText') }}
        </label>
      </div>

      <p class="hint">{{ t('contributions.delayHint') }}</p>
    </section>

    <nav class="tabs" role="tablist" :aria-label="t('contributions.title')">
      <button
        v-for="tab in TABS"
        :key="tab"
        role="tab"
        :aria-selected="filter === tab"
        :class="{ active: filter === tab }"
        @click="setFilter(tab)"
      >
        {{ t(`contributions.tab${tab}`) }}
        <span v-if="tab === 'PENDING' && pendingCount" class="count">{{ pendingCount }}</span>
      </button>
    </nav>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <ul class="queue">
      <li v-for="item in items" :key="item.id">
        <div class="item-main">
          <span class="badge">{{ t(`contributions.type${item.type}`) }}</span>
          <span class="author">{{ item.authorName || t('contributions.anonymous') }}</span>
          <p v-if="item.text" class="text">{{ item.text }}</p>
          <img v-if="isImage(item)" class="thumb" :src="mediaSrc(item)" :alt="item.authorName || ''" />
          <p v-else-if="item.mediaKey" class="media-note">
            {{ t('contributions.videoAttached') }}
          </p>
        </div>

        <div v-if="item.status === 'PENDING'" class="actions">
          <button class="btn" @click="decide(item, 'APPROVED')">{{ t('contributions.approve') }}</button>
          <button class="link-btn danger" @click="decide(item, 'REJECTED')">
            {{ t('contributions.reject') }}
          </button>
        </div>
        <div v-else class="actions">
          <span class="badge" :class="item.status === 'APPROVED' ? 'ok' : 'bad'">
            {{ t(`contributions.status${item.status}`) }}
          </span>
          <!-- Pulling something back is the reason the delay exists; it has to
               be reachable after approval, not only before. -->
          <button
            v-if="item.status === 'APPROVED'"
            class="link-btn danger"
            @click="decide(item, 'REJECTED')"
          >
            {{ t('contributions.pullDown') }}
          </button>
        </div>
      </li>
    </ul>

    <EmptyState v-if="!items.length" tone="no-results" :title="t('contributions.empty')" />
  </div>
</template>

<script setup>
import EmptyState from '@/components/ui/EmptyState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { contributionsService } from '@/services/contributions.service'
import { useAuthUser } from '@/composables/useAuthUser'
import { baseUrl } from '@/services/baseUrl'

const TYPES = ['MUSIC_REQUEST', 'MESSAGE', 'PHOTO', 'VIDEO']
const TABS = ['PENDING', 'APPROVED', 'REJECTED']

const { t } = useI18n()
const { eventId: currentEventId } = useAuthUser()
const eventId = currentEventId.value

const items = ref([])
const pendingCount = ref(0)
const filter = ref('PENDING')
const error = ref('')

const settings = reactive({
  enabledTypes: [],
  wallDelaySeconds: 30,
  autoApproveText: false,
  maxPerGuest: 10,
  maxMediaBytes: 26214400,
})

const enabledTypes = ref([])

function unwrap(response) {
  return response?.data ?? response ?? null
}

onMounted(async () => {
  await loadSettings()
  await load()
})

watch(filter, load)

async function loadSettings() {
  try {
    const loaded = unwrap(await contributionsService.settings(eventId))
    if (loaded) {
      Object.assign(settings, loaded)
      enabledTypes.value = loaded.enabledTypes || []
    }
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function saveSettings() {
  error.value = ''
  try {
    const saved = unwrap(await contributionsService.updateSettings(eventId, {
      ...settings,
      enabledTypes: enabledTypes.value,
    }))
    if (saved) Object.assign(settings, saved)
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function load() {
  try {
    items.value = unwrap(await contributionsService.queue(eventId, filter.value)) || []
    if (filter.value === 'PENDING') {
      pendingCount.value = items.value.length
    } else {
      const pending = unwrap(await contributionsService.queue(eventId, 'PENDING')) || []
      pendingCount.value = pending.length
    }
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

function setFilter(tab) {
  filter.value = tab
}

async function decide(item, decision) {
  try {
    await contributionsService.moderate(eventId, item.id, decision)
    await load()
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

const hasMusic = computed(() => enabledTypes.value.includes('MUSIC_REQUEST'))

const musicHref = computed(() =>
  `${baseUrl}/v1/api` + contributionsService.musicExportUrl(eventId))

function isImage(item) {
  return item.mediaContentType?.startsWith('image/')
}

/** Served through the image proxy, so the storage key never becomes a URL a
 *  guest could share around the moderation queue. */
function mediaSrc(item) {
  return `${baseUrl}/v1/api/public/images/${encodeURIComponent(item.mediaKey)}`
}
</script>

<style scoped>
.contributions { display: flex; flex-direction: column; gap: 16px; padding: 4px; }
.page-head h1 { margin: 0; font-size: 22px; }
.sub { margin: 4px 0 0; font-size: 13px; color: #6b6b6b; }

.settings { padding: 16px; border-radius: 10px; background: #fff; border: 1px solid #ece8e0; }
.settings h2 { margin: 0 0 10px; font-size: 15px; }
.types { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
.row { display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; }
.check { display: flex; gap: 8px; align-items: center; font-size: 14px; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.field input { padding: 7px 10px; border: 1px solid #ddd8cf; border-radius: 8px; width: 110px; }
.hint { margin: 10px 0 0; font-size: 11.5px; color: #8a8a8a; }

.tabs { display: flex; gap: 6px; }
.tabs button {
  padding: 7px 14px; border: 1px solid #ece8e0; border-radius: 999px;
  background: #fff; cursor: pointer; font-size: 13px;
}
.tabs button.active { background: var(--brand); color: #fff; border-color: var(--brand); }
.count { margin-left: 6px; font-weight: 600; }

.queue { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.queue li {
  display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  padding: 12px 14px; border-radius: 10px; background: #fff; border: 1px solid #ece8e0;
}
.item-main { flex: 1; min-width: 200px; }
.author { font-weight: 600; margin-left: 8px; }
.text { margin: 6px 0 0; font-size: 14px; }
.thumb { margin-top: 8px; max-width: 180px; border-radius: 8px; }
.media-note { margin: 6px 0 0; font-size: 13px; color: #6b6b6b; }

.actions { display: flex; gap: 10px; align-items: center; }
.badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #f0efe9; }
.badge.ok { background: #e6f2e2; color: #2f6b28; }
.badge.bad { background: #fdeceb; color: #a3271f; }

.error { font-size: 13px; color: #a3271f; }

.btn { padding: 7px 14px; border: 0; border-radius: 8px; background: var(--brand); color: #fff; font-size: 13px; cursor: pointer; }
.link-btn { border: 0; background: none; color: var(--brand); cursor: pointer; font-size: 13px; padding: 0; }
.link-btn.danger { color: #a3271f; }
</style>
