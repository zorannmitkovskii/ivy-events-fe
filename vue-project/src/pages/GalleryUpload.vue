<template>
  <div class="gallery-upload">
    <div class="upload-card">
      <div class="header">
        <h1 class="title">{{ t('galleryUpload.title') }}</h1>
        <p class="subtitle">{{ t('galleryUpload.subtitle') }}</p>
      </div>

      <div
        class="dropzone"
        :class="{ active: isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
        @click="fileInput?.click()"
      >
        <svg class="dropzone-icon" width="48" height="48" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p class="dropzone-text">{{ t('galleryUpload.dropzone') }}</p>
        <p class="dropzone-hint">{{ t('galleryUpload.formats') }}</p>
      </div>

      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*,video/*"
        class="hidden"
        @change="onFileSelect"
      />

      <!-- Preview grid -->
      <div v-if="previews.length" class="preview-grid">
        <div v-for="(file, i) in previews" :key="i" class="preview-item">
          <img v-if="file.isImage" :src="file.url" :alt="file.name" class="preview-img" />
          <div v-else class="preview-video">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>{{ file.name }}</span>
          </div>
          <button class="remove-btn" type="button" @click="removeFile(i)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Upload button -->
      <button
        v-if="selectedFiles.length"
        class="upload-btn"
        :disabled="uploading"
        @click="upload"
      >
        <span v-if="uploading" class="spinner"></span>
        {{ uploading ? t('galleryUpload.uploading') : t('galleryUpload.upload', { count: selectedFiles.length }) }}
      </button>

      <!-- Success message -->
      <div v-if="success" class="success-msg">
        {{ t('galleryUpload.success') }}
      </div>

      <!-- Error message -->
      <p v-if="error" class="error-msg">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { mediaService } from '@/services/media.service';

const { t } = useI18n();
const route = useRoute();

const eventId = computed(() => route.query.eventId || '');

const fileInput = ref(null);
const selectedFiles = ref([]);
const previews = ref([]);
const isDragging = ref(false);
const uploading = ref(false);
const success = ref(false);
const error = ref('');

function addFiles(files) {
  const list = Array.from(files);
  list.forEach(f => {
    selectedFiles.value.push(f);
    const isImage = f.type.startsWith('image/');
    previews.value.push({
      name: f.name,
      isImage,
      url: isImage ? URL.createObjectURL(f) : null
    });
  });
  success.value = false;
  error.value = '';
}

function onFileSelect(e) {
  addFiles(e.target.files);
  e.target.value = '';
}

function onDrop(e) {
  isDragging.value = false;
  addFiles(e.dataTransfer.files);
}

function removeFile(index) {
  const preview = previews.value[index];
  if (preview.url) URL.revokeObjectURL(preview.url);
  selectedFiles.value.splice(index, 1);
  previews.value.splice(index, 1);
}

async function upload() {
  if (!selectedFiles.value.length || !eventId.value) return;
  uploading.value = true;
  error.value = '';
  success.value = false;

  try {
    await mediaService.upload(selectedFiles.value, eventId.value);
    // Clean up previews
    previews.value.forEach(p => { if (p.url) URL.revokeObjectURL(p.url); });
    selectedFiles.value = [];
    previews.value = [];
    success.value = true;
  } catch (e) {
    error.value = e?.message || 'Upload failed. Please try again.';
  } finally {
    uploading.value = false;
  }
}
</script>

<style scoped>
.gallery-upload {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f6f1 0%, #ede9df 100%);
  display: grid;
  place-items: center;
  padding: 24px;
}

.upload-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 32px;
  width: 100%;
  max-width: 560px;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: var(--brand-main, #334338);
  margin: 0 0 6px;
}

.subtitle {
  font-size: 14px;
  color: var(--neutral-500, #888);
  margin: 0;
}

.dropzone {
  border: 2px dashed var(--neutral-300, #ccc);
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.dropzone:hover,
.dropzone.active {
  border-color: var(--brand-gold, #C8A24D);
  background: rgba(200, 162, 77, 0.04);
}

.dropzone-icon {
  color: var(--neutral-400, #aaa);
  margin-bottom: 12px;
}

.dropzone-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--neutral-700, #555);
  margin: 0 0 4px;
}

.dropzone-hint {
  font-size: 12px;
  color: var(--neutral-400, #aaa);
  margin: 0;
}

.hidden {
  display: none;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
  margin-top: 20px;
}

.preview-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
  background: var(--neutral-100, #f5f5f5);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-video {
  display: grid;
  place-items: center;
  height: 100%;
  gap: 4px;
  padding: 8px;
  font-size: 10px;
  color: var(--neutral-500);
  text-align: center;
  word-break: break-all;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 0;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
}

.upload-btn {
  margin-top: 20px;
  width: 100%;
  padding: 14px;
  border: 0;
  border-radius: 12px;
  background: var(--brand-gold, #C8A24D);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.2s;
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.success-msg {
  margin-top: 16px;
  padding: 12px;
  border-radius: 10px;
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
}

.error-msg {
  margin-top: 12px;
  color: var(--error, #c62828);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}
</style>
