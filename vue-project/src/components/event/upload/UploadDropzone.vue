<template>
  <div
    class="dropzone"
    @dragover.prevent
    @drop.prevent="onDrop"
    @click="fileInput.click()"
  >
    <div class="content">
      🖼️ ➕ 🎥
      <p class="main-text">Tap or drag photos & videos here</p>
      <p class="hint">JPG, PNG, MP4, MOV • Max 50MB per file</p>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*,video/*"
      hidden
      @change="onSelect"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import mediaService from '@/services/media.service'

const props = defineProps({
  eventId: String
})

const emit = defineEmits(['uploaded'])
const fileInput = ref(null)

const uploadFiles = async (files) => {
  const formData = new FormData()
  files.forEach(f => formData.append('files', f))

  const response = await mediaService.upload(props.eventId, formData)
  emit('uploaded', response.data)
}

const onDrop = (e) => {
  uploadFiles([...e.dataTransfer.files])
}

const onSelect = (e) => {
  uploadFiles([...e.target.files])
}
</script>

<style scoped>
.dropzone {
  width: 100%;
  max-width: 520px;
  background: white;
  border: 2px dashed #72c99c;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropzone:hover {
  background: #f0faf5;
}

.main-text {
  font-weight: 600;
  margin-top: 12px;
}

.hint {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}
</style>
