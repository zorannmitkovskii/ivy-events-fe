<template>
  <div class="contribute">
    <div v-if="sent" class="thanks">
      <h1>{{ t('contribute.thanksTitle') }}</h1>
      <!-- Says it arrived, not that it will appear. Promising a photo will go
           up and then rejecting it is worse than never promising. -->
      <p>{{ t('contribute.thanksBody') }}</p>
      <button class="link-btn" @click="sendAnother">{{ t('contribute.sendAnother') }}</button>
    </div>

    <form v-else class="form" @submit.prevent="submit">
      <h1>{{ t('contribute.title') }}</h1>

      <p v-if="!available.length" class="closed">{{ t('contribute.closed') }}</p>

      <template v-else>
        <div class="types">
          <button
            v-for="option in available"
            :key="option"
            type="button"
            class="type-btn"
            :class="{ active: type === option }"
            @click="type = option"
          >
            {{ t(`contributions.type${option}`) }}
          </button>
        </div>

        <label class="field">
          <span>{{ t('contribute.yourName') }}</span>
          <input v-model="authorName" type="text" maxlength="120" />
        </label>

        <label v-if="needsText" class="field">
          <span>{{ type === 'MUSIC_REQUEST' ? t('contribute.song') : t('contribute.message') }}</span>
          <textarea v-model="text" rows="4" maxlength="1000"></textarea>
        </label>

        <label v-else class="field">
          <span>{{ t('contribute.chooseFile') }}</span>
          <input type="file" :accept="accept" @change="onFile" />
        </label>

        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <button class="btn" type="submit" :disabled="busy || !canSend">
          {{ t('contribute.send') }}
        </button>
      </template>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { contributionsService } from '@/services/contributions.service'
import { baseUrl } from '@/services/baseUrl'

const { t } = useI18n()
const route = useRoute()

const token = route.query.t || ''
const eventId = route.query.event || ''

const available = ref([])
const type = ref('')
const authorName = ref('')
const text = ref('')
const file = ref(null)
const busy = ref(false)
const sent = ref(false)
const error = ref('')

onMounted(async () => {
  if (!eventId) return
  try {
    const response = await contributionsService.publicSettings(eventId)
    const settings = response?.data ?? response
    available.value = settings?.enabledTypes || []
    type.value = available.value[0] || ''
  } catch {
    // An event that will not say what it accepts is treated as accepting
    // nothing, which is the same as the server's own default.
    available.value = []
  }
})

const needsText = computed(() => type.value === 'MUSIC_REQUEST' || type.value === 'MESSAGE')

const accept = computed(() => (type.value === 'VIDEO' ? 'video/*' : 'image/*'))

const canSend = computed(() =>
  needsText.value ? text.value.trim().length > 0 : Boolean(file.value))

function onFile(event) {
  file.value = event.target.files?.[0] || null
}

/**
 * Sent as multipart because a photo goes the same way as a message, and the
 * token travels in the body rather than the URL — a token in a query string
 * ends up in access logs.
 */
async function submit() {
  busy.value = true
  error.value = ''

  const form = new FormData()
  form.append('token', token)
  form.append('type', type.value)
  if (authorName.value.trim()) form.append('authorName', authorName.value.trim())
  if (needsText.value) form.append('text', text.value.trim())
  if (file.value) form.append('file', file.value)

  try {
    const response = await fetch(`${baseUrl}/v1/api/public/contributions`, {
      method: 'POST',
      body: form,
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.data?.detail || body?.message || t('contribute.failed'))
    }
    sent.value = true
  } catch (e) {
    error.value = e?.message || t('contribute.failed')
  } finally {
    busy.value = false
  }
}

function sendAnother() {
  sent.value = false
  text.value = ''
  file.value = null
}
</script>

<style scoped>
.contribute { max-width: 520px; margin: 0 auto; padding: 24px 16px; }

.form { display: flex; flex-direction: column; gap: 14px; }
.form h1 { margin: 0; font-size: 22px; text-align: center; }

.types { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.type-btn {
  padding: 8px 16px; border: 1px solid #ddd8cf; border-radius: 999px;
  background: #fff; cursor: pointer; font-size: 14px;
}
.type-btn.active { background: #5a7a52; color: #fff; border-color: #5a7a52; }

.field { display: flex; flex-direction: column; gap: 5px; font-size: 13px; }
.field input, .field textarea {
  padding: 10px 12px; border: 1px solid #ddd8cf; border-radius: 8px;
  font-size: 16px; font-family: inherit;
}

.btn { padding: 12px 20px; border: 0; border-radius: 10px; background: #5a7a52; color: #fff; font-size: 16px; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: default; }
.link-btn { border: 0; background: none; color: #5a7a52; cursor: pointer; font-size: 14px; }

.thanks { text-align: center; padding: 60px 0; }
.thanks h1 { font-size: 22px; margin: 0 0 8px; }

.closed { text-align: center; color: #6b6b6b; }
.error { color: #a3271f; font-size: 13px; margin: 0; }
</style>
