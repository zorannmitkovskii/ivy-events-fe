<template>
  <div class="se-image">
    <span class="se-label">{{ label }}</span>
    <div class="se-image-row">
      <div class="se-thumb" :style="url ? { backgroundImage: `url(&quot;${url}&quot;)` } : null">
        <span v-if="!url">{{ t('agencySite.editor.noImage') }}</span>
      </div>
      <label class="btn btn-ghost btn-sm se-upload">
        {{ uploading ? t('agencySite.editor.uploading') : t('agencySite.editor.upload') }}
        <input type="file" accept="image/jpeg,image/png,image/webp" :disabled="uploading" @change="pick" />
      </label>
      <button v-if="url" type="button" class="btn btn-ghost btn-sm" @click="$emit('clear')">{{ t('agencySite.editor.remove') }}</button>
    </div>
    <p v-if="error" class="se-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
/**
 * One photo of the site: uploaded to the agency's folder, then referenced by
 * key. The key is what is saved; the URL is only for showing it.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { agencySiteService } from '@/services/agencySite.service'
import { getErrorMessage } from '@/services/apiError'

defineProps({
  label: { type: String, required: true },
  url: { type: String, default: null },
})
const emit = defineEmits(['uploaded', 'clear'])

const { t } = useI18n()
const uploading = ref(false)
const error = ref('')

async function pick(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  uploading.value = true
  error.value = ''
  try {
    const image = await agencySiteService.uploadImage(file)
    emit('uploaded', image)
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.se-label {
  display: block;
  margin-bottom: 5px;
  color: var(--ink-3);
  font-size: 12.5px;
  font-weight: 600;
}

.se-image-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.se-thumb {
  display: grid;
  place-items: center;
  width: 96px;
  height: 64px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  background: var(--paper, #f6f5ef) center / cover no-repeat;
  color: var(--ink-3);
  font-size: 11px;
}

.se-upload {
  position: relative;
  overflow: hidden;
}

.se-upload input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.se-error {
  margin: 6px 0 0;
  color: var(--red, #a33a2b);
  font-size: 12.5px;
}
</style>
