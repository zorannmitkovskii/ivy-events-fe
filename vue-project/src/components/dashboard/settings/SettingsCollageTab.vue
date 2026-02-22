<script setup>
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useCollagePhotos } from "@/composables/useCollagePhotos.js";
import { onboardingStore } from "@/store/onboarding.store.js";
import ButtonMain from "@/components/generic/ButtonMain.vue";

const { t } = useI18n();

const eventId = onboardingStore.eventId;
const { photos, loading, error, loadPhotos, uploadPhotos, deletePhoto } = useCollagePhotos();

const fileInput = ref(null);
const uploading = ref(false);

function triggerUpload() {
  fileInput.value?.click();
}

async function onFileChange(e) {
  const files = e.target.files;
  if (!files?.length) return;
  uploading.value = true;
  try {
    await uploadPhotos(eventId, Array.from(files));
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
}

async function onDelete(url) {
  await deletePhoto(eventId, url);
}

onMounted(() => {
  if (eventId) loadPhotos(eventId);
});
</script>

<template>
  <div>
    <div class="collage-header">
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="onFileChange"
      />
      <ButtonMain variant="main" :disabled="uploading" @click="triggerUpload">
        {{ uploading ? t('galleryUpload.uploading') : t('ourStory.addImages') }}
      </ButtonMain>
    </div>

    <div v-if="loading" class="loading-msg">Loading...</div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <div v-else-if="photos.length === 0" class="empty-card">
      <div class="empty-title">{{ t('settings.tabs.collage') }}</div>
      <div class="empty-sub">Upload collage photos for your invitation template.</div>
    </div>

    <div v-else class="collage-grid">
      <div v-for="(photo, idx) in photos" :key="photo.url || idx" class="collage-item">
        <img :src="photo.thumbUrl || photo.url" alt="" class="collage-img" />
        <button class="delete-btn" type="button" @click="onDelete(photo.url)">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.collage-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.loading-msg { padding: 18px 0; color: var(--neutral-500); }
.error-msg { padding: 18px 0; color: #b00020; }

.empty-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px 24px;
}
.empty-title { font-weight: 700; font-size: 15px; color: var(--neutral-900); }
.empty-sub { margin-top: 6px; font-size: 13px; color: var(--neutral-500); }

.collage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.collage-item {
  position: relative;
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  aspect-ratio: 1;
  background: var(--bg-main, #f8f6f1);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.collage-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.collage-item:hover .delete-btn { opacity: 1; }
.delete-btn:hover { background: rgba(180, 35, 24, 0.85); }
</style>
