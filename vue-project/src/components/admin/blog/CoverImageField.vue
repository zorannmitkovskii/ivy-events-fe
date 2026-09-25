<template>
  <div class="cover-field">
    <img v-if="url" class="cover-preview" :src="url" :alt="t('adminBlog.cover.previewAlt')" />
    <div v-else class="cover-empty">{{ t('adminBlog.cover.empty') }}</div>

    <div class="cover-actions">
      <label class="btn btn-ghost btn-sm" :class="{ busy: uploading }">
        {{ uploading ? t('adminBlog.cover.uploading') : url ? t('adminBlog.cover.replace') : t('adminBlog.cover.upload') }}
        <input
          class="sr-only"
          type="file"
          :accept="ACCEPTED_TYPES.join(',')"
          :disabled="uploading"
          @change="onFile"
        />
      </label>
      <button v-if="url" type="button" class="btn btn-ghost btn-sm" @click="clear">{{ t('adminBlog.cover.remove') }}</button>
    </div>

    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    <p v-else class="hint">{{ t('adminBlog.cover.hint') }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { contentService } from '@/services/content.service'
import { getErrorMessage } from '@/services/apiError'

/**
 * A post's cover image (IVY-906).
 *
 * Checked here as well as on the server so a 40 MB photo straight off a phone
 * is refused before it is uploaded, not after. The server's answer still wins.
 */
const key = defineModel('imageKey', { type: String, default: '' })
const url = defineModel('imageUrl', { type: String, default: '' })

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

const { t } = useI18n()

const uploading = ref(false)
const error = ref('')

async function onFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  if (!ACCEPTED_TYPES.includes(file.type)) {
    error.value = t('adminBlog.cover.wrongType')
    return
  }
  if (file.size > MAX_BYTES) {
    error.value = t('adminBlog.cover.tooLarge')
    return
  }

  uploading.value = true
  try {
    const response = await contentService.uploadImage(file)
    const uploaded = response?.data ?? response
    key.value = uploaded.key
    url.value = uploaded.url
    error.value = ''
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    uploading.value = false
  }
}

function clear() {
  key.value = ''
  url.value = ''
  error.value = ''
}
</script>

<style scoped>
.cover-preview,
.cover-empty {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-width: 100%;
  border-radius: 10px;
  border: 1px solid var(--line);
  object-fit: cover;
}

.cover-empty {
  display: grid;
  place-items: center;
  background: var(--mist-2);
  color: var(--ink-3);
  font-size: 14px;
}

.cover-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.busy {
  opacity: 0.7;
  pointer-events: none;
}

.hint,
.field-error {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ink-3);
}

.field-error {
  color: var(--danger, #b3261e);
}
</style>
