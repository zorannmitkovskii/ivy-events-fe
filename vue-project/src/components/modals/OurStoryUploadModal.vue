<template>
  <BaseModal :open="open" :title="t('ourStory.uploadImages.title')" @close="emit('close')">
    <!-- Existing images -->
    <div v-if="images.length" class="existing-section">
      <div class="section-label">{{ t("ourStory.uploadImages.existing") }}</div>
      <div class="images-gallery">
        <div v-for="(url, idx) in images" :key="url" class="image-item">
          <img :src="url" alt="Story image" class="gallery-image" />
          <button
            type="button"
            class="remove-btn"
            :disabled="deleting"
            @click="deleteImage(url)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Upload area -->
    <div class="upload-section">
      <div class="images-gallery">
        <div class="upload-area" @click="fileInput?.click()">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            class="hidden-file"
            @change="onFilesSelected"
          />
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span class="upload-text">{{ t("ourStory.images.clickToUpload") }}</span>
        </div>
      </div>
    </div>

    <!-- Pending files preview -->
    <div v-if="pendingFiles.length" class="pending-section">
      <div class="section-label">{{ t("ourStory.images.pendingFiles", { count: pendingFiles.length }) }}</div>
      <div class="pending-grid">
        <div v-for="(pf, idx) in pendingFiles" :key="idx" class="pending-item">
          <img :src="pf.preview" alt="preview" class="gallery-image" />
          <button type="button" class="remove-btn" @click="removePending(idx)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Progress -->
    <div v-if="uploading || deleting" class="uploading-msg">
      <div class="spinner"></div>
      <span>{{ deleting ? t("ourStory.uploadImages.deleting") : t("ourStory.images.uploading") }}</span>
    </div>

    <!-- Error -->
    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

    <template #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">
        {{ t("common.cancel") }}
      </ButtonMain>
      <ButtonMain
        variant="main"
        type="button"
        :disabled="!pendingFiles.length || uploading"
        @click="uploadAll"
      >
        {{ uploading ? t("ourStory.images.uploading") : t("ourStory.images.upload") }}
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { invitationImagesService } from "@/services/invitationImages.service.js";
import { onboardingStore } from "@/store/onboarding.store.js";

const { t } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  images: { type: Array, default: () => [] },
});

const emit = defineEmits(["close", "uploaded"]);

const pendingFiles = ref([]);
const uploading = ref(false);
const deleting = ref(false);
const errorMsg = ref("");
const fileInput = ref(null);

let objectUrls = [];

watch(
  () => props.open,
  (v) => {
    if (v) {
      pendingFiles.value = [];
      errorMsg.value = "";
      revokeAll();
    }
  }
);

function revokeAll() {
  objectUrls.forEach((u) => URL.revokeObjectURL(u));
  objectUrls = [];
}

onBeforeUnmount(revokeAll);

function onFilesSelected(e) {
  const files = Array.from(e.target.files || []);
  for (const file of files) {
    const preview = URL.createObjectURL(file);
    objectUrls.push(preview);
    pendingFiles.value.push({ file, preview });
  }
  if (fileInput.value) fileInput.value.value = "";
}

function removePending(idx) {
  const removed = pendingFiles.value.splice(idx, 1);
  if (removed[0]?.preview) {
    URL.revokeObjectURL(removed[0].preview);
  }
}

async function deleteImage(url) {
  deleting.value = true;
  errorMsg.value = "";
  try {
    await invitationImagesService.deleteOurStoryImage(onboardingStore.eventId, url);
    emit("uploaded");
  } catch (e) {
    errorMsg.value = e?.message || "Delete failed";
  } finally {
    deleting.value = false;
  }
}

async function uploadAll() {
  if (!pendingFiles.value.length) return;

  uploading.value = true;
  errorMsg.value = "";

  try {
    const files = pendingFiles.value.map((pf) => pf.file);
    await invitationImagesService.uploadOurStoryImages(onboardingStore.eventId, files);

    pendingFiles.value = [];
    revokeAll();
    emit("uploaded");
    emit("close");
  } catch (e) {
    errorMsg.value = e?.message || "Upload failed";
  } finally {
    uploading.value = false;
  }
}
</script>

<style scoped>
.existing-section {
  margin-bottom: 16px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 8px;
}

.images-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item,
.pending-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--neutral-200, #e5e7eb);
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.remove-btn:hover {
  background: rgba(220, 38, 38, 0.9);
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-section {
  margin-bottom: 4px;
}

.upload-area {
  width: 120px;
  height: 120px;
  border: 2px dashed var(--neutral-300, #d1d5db);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  color: var(--neutral-400, #9ca3af);
  transition: border-color 0.2s, color 0.2s;
}

.upload-area:hover {
  border-color: var(--brand-gold, #c8a24d);
  color: var(--brand-gold, #c8a24d);
}

.upload-text {
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  line-height: 1.3;
}

.hidden-file {
  display: none;
}

.pending-section {
  margin-top: 16px;
}

.pending-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.uploading-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 13px;
  color: var(--neutral-500);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--neutral-200);
  border-top-color: var(--brand-main);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-msg {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
}
</style>
