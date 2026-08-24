<template>
  <div class="post-event">
    <PageHeader :title="t('postEvent.title')">
      <template #actions>
        <p class="sub">{{ t('postEvent.subtitle') }}</p>
      </template>
    </PageHeader>

    <p v-if="settings.ranAt" class="sent-note" role="status">
      {{ t('postEvent.alreadySent', { n: settings.recipientsNotified ?? 0 }) }}
    </p>
    <p v-else-if="settings.cancelledAt" class="cancelled-note" role="status">
      {{ t('postEvent.cancelled') }}
    </p>

    <fieldset class="config" :disabled="Boolean(settings.ranAt)">
      <legend class="visually-hidden">{{ t('postEvent.title') }}</legend>

      <div class="actions-list">
        <label v-for="action in ACTIONS" :key="action" class="check">
          <input v-model="enabledActions" type="checkbox" :value="action" />
          {{ t(`postEvent.action${action}`) }}
        </label>
      </div>

      <div class="row">
        <label class="field">
          <span>{{ t('postEvent.delayDays') }}</span>
          <input v-model.number="settings.delayDays" type="number" min="0" />
        </label>

        <label class="field">
          <span>{{ t('postEvent.audience') }}</span>
          <select v-model="settings.audience">
            <option v-for="option in AUDIENCES" :key="option" :value="option">
              {{ t(`postEvent.audience${option}`) }}
            </option>
          </select>
        </label>
      </div>

      <div v-if="enabledActions.includes('GALLERY_ACCESS')" class="row">
        <label class="field">
          <span>{{ t('postEvent.galleryExpires') }}</span>
          <input v-model="galleryExpiresDate" type="date" />
        </label>
        <label class="check">
          <input v-model="settings.galleryDownloadsAllowed" type="checkbox" />
          {{ t('postEvent.allowDownloads') }}
        </label>
      </div>

      <div class="buttons">
        <button class="btn" @click="save">{{ t('postEvent.save') }}</button>
        <button class="link-btn" @click="refreshPreview">{{ t('postEvent.previewBtn') }}</button>
        <button v-if="!settings.cancelledAt" class="link-btn danger" @click="cancel">
          {{ t('postEvent.cancelBtn') }}
        </button>
      </div>
    </fieldset>

    <!-- Read before sending, not after. Anything that emails four hundred
         people deserves to be readable in full first. -->
    <section v-if="preview" class="preview" :aria-label="t('postEvent.preview')">
      <h2>{{ t('postEvent.preview') }}</h2>

      <dl>
        <div>
          <dt>{{ t('postEvent.willGoTo') }}</dt>
          <dd>{{ t('postEvent.recipientCount', { n: preview.recipients }) }}</dd>
        </div>
        <div>
          <dt>{{ t('postEvent.reachable') }}</dt>
          <dd :class="{ warn: preview.recipientsWithEmail < preview.recipients }">
            {{ preview.recipientsWithEmail }}
          </dd>
        </div>
        <div v-if="preview.dueAt">
          <dt>{{ t('postEvent.goesOut') }}</dt>
          <dd>{{ formatted(preview.dueAt) }}</dd>
        </div>
      </dl>

      <p v-if="preview.recipientsWithEmail < preview.recipients" class="warn-note">
        {{ t('postEvent.someUnreachable', {
          n: preview.recipients - preview.recipientsWithEmail,
        }) }}
      </p>

      <button
        v-if="!settings.ranAt && preview.recipientsWithEmail > 0"
        class="btn"
        :disabled="busy"
        @click="sendNow"
      >
        {{ t('postEvent.sendNow', { n: preview.recipientsWithEmail }) }}
      </button>
    </section>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { postEventService } from '@/services/postEvent.service'
import { useAuthUser } from '@/composables/useAuthUser'

const ACTIONS = ['THANK_YOU', 'GALLERY_ACCESS', 'VENDOR_REVIEW_REQUEST']
const AUDIENCES = ['CHECKED_IN', 'CONFIRMED', 'EVERYONE']

const { t, locale } = useI18n()
const { eventId: currentEventId } = useAuthUser()
const eventId = currentEventId.value

const settings = reactive({
  delayDays: 3,
  audience: 'CHECKED_IN',
  galleryExpiresAt: null,
  galleryDownloadsAllowed: true,
  ranAt: null,
  cancelledAt: null,
  recipientsNotified: null,
})

const enabledActions = ref([])
const preview = ref(null)
const busy = ref(false)
const error = ref('')

function unwrap(response) {
  return response?.data ?? response ?? null
}

onMounted(async () => {
  await load()
  await refreshPreview()
})

async function load() {
  try {
    const loaded = unwrap(await postEventService.settings(eventId))
    if (loaded) {
      Object.assign(settings, loaded)
      enabledActions.value = loaded.enabledActions || []
    }
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

const galleryExpiresDate = computed({
  get: () => (settings.galleryExpiresAt ? settings.galleryExpiresAt.slice(0, 10) : ''),
  set: (value) => {
    settings.galleryExpiresAt = value ? new Date(`${value}T23:59:59Z`).toISOString() : null
  },
})

async function save() {
  error.value = ''
  try {
    const saved = unwrap(await postEventService.configure(eventId, {
      ...settings,
      enabledActions: enabledActions.value,
    }))
    if (saved) Object.assign(settings, saved)
    await refreshPreview()
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function refreshPreview() {
  try {
    preview.value = unwrap(await postEventService.preview(eventId))
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function sendNow() {
  busy.value = true
  error.value = ''
  try {
    await postEventService.sendNow(eventId)
    await load()
    await refreshPreview()
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  } finally {
    busy.value = false
  }
}

async function cancel() {
  try {
    await postEventService.cancel(eventId)
    await load()
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

function formatted(iso) {
  try {
    return new Date(iso).toLocaleString(locale.value, {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}
</script>

<style scoped>
.post-event { display: flex; flex-direction: column; gap: 16px; padding: 4px; max-width: 640px; }
.page-head h1 { margin: 0; font-size: 22px; }
.sub { margin: 4px 0 0; font-size: 13px; color: #6b6b6b; }

.sent-note { padding: 10px 14px; border-radius: 8px; background: #e6f2e2; color: #2f6b28; font-size: 13px; margin: 0; }
.cancelled-note { padding: 10px 14px; border-radius: 8px; background: #f0efe9; color: #6b6b6b; font-size: 13px; margin: 0; }

.config { border: 1px solid #ece8e0; border-radius: 10px; background: #fff; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.config:disabled { opacity: 0.6; }

.actions-list { display: flex; flex-direction: column; gap: 8px; }
.row { display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap; }
.check { display: flex; gap: 8px; align-items: center; font-size: 14px; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.field input, .field select { padding: 8px 10px; border: 1px solid #ddd8cf; border-radius: 8px; font-size: 14px; }

.buttons { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }

.preview { padding: 16px; border-radius: 10px; background: #faf8f4; }
.preview h2 { margin: 0 0 10px; font-size: 15px; }
.preview dl { margin: 0; display: flex; gap: 24px; flex-wrap: wrap; }
.preview dt { font-size: 12px; color: #6b6b6b; }
.preview dd { margin: 2px 0 0; font-size: 18px; font-weight: 600; }
.preview dd.warn { color: #8f6d1f; }
.warn-note { margin: 10px 0 0; font-size: 12.5px; color: #8f6d1f; }

.error { font-size: 13px; color: #a3271f; }

.btn { padding: 9px 16px; border: 0; border-radius: 8px; background: var(--brand); color: #fff; font-size: 14px; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: default; }
.link-btn { border: 0; background: none; color: var(--brand); cursor: pointer; font-size: 13px; padding: 0; }
.link-btn.danger { color: #a3271f; }

.visually-hidden {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}
</style>
