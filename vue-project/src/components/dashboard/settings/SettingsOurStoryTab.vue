<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useOurStory } from "@/composables/useOurStory.js";
import AddOurStoryModal from "@/components/modals/AddOurStoryModal.vue";
import OurStoryHeader from "@/components/dashboard/ourStory/OurStoryHeader.vue";
import DashboardTable from "@/components/dashboard/DashboardTable.vue";
import OurStoryTableRow from "@/components/dashboard/ourStory/OurStoryTableRow.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { onboardingStore } from "@/store/onboarding.store.js";
import { OUR_STORY_FIELD_CONFIG, DEFAULT_FIELD_CONFIG } from "@/config/ourStoryFieldConfig.js";
import { invitationImagesService } from "@/services/invitationImages.service.js";

const { t } = useI18n();

const fieldConfig = computed(() =>
  OUR_STORY_FIELD_CONFIG[onboardingStore.invitationName] || DEFAULT_FIELD_CONFIG
);
const showType = computed(() => !!fieldConfig.value.type?.show);

const {
  loading, error,
  items, images,
  loadStories, createItem, updateItem, deleteItem,
} = useOurStory();

const modalOpen = ref(false);
const editingItem = ref(null);

function openCreateModal() {
  editingItem.value = null;
  modalOpen.value = true;
}

function openEditModal(item) {
  editingItem.value = { ...item };
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  editingItem.value = null;
}

onMounted(() => {
  loadStories();
});

async function onSave(payload, file) {
  if (payload.id) {
    await updateItem(payload.id, payload, file);
  } else {
    payload.displayOrder = items.value.length;
    await createItem(payload, file);
  }
  closeModal();
}

async function onDelete(id) {
  await deleteItem(id);
  closeModal();
}

/* ---- Inline Our Story Images ---- */
const imgFileInput = ref(null);
const imgUploading = ref(false);
const imgDeleting = ref(false);
const imgError = ref("");

async function onImgFileChange(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  imgUploading.value = true;
  imgError.value = "";
  try {
    await invitationImagesService.uploadOurStoryImages(onboardingStore.eventId, files);
    await loadStories();
  } catch (err) {
    imgError.value = err?.message || "Upload failed";
  } finally {
    imgUploading.value = false;
    if (imgFileInput.value) imgFileInput.value.value = "";
  }
}

async function deleteStoryImage(url) {
  imgDeleting.value = true;
  imgError.value = "";
  try {
    await invitationImagesService.deleteOurStoryImage(onboardingStore.eventId, url);
    await loadStories();
  } catch (err) {
    imgError.value = err?.message || "Delete failed";
  } finally {
    imgDeleting.value = false;
  }
}
</script>

<template>
  <div>
    <OurStoryHeader
      :addLabel="t('ourStory.addStory')"
      :imagesLabel="t('ourStory.addImages')"
      :has-items="items.length > 0"
      @add="openCreateModal"
      @add-images="imgFileInput?.click()"
    />

    <div v-if="loading" class="loading-msg">Loading...</div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <div v-else-if="items.length === 0" class="empty-card">
      <div class="empty-title">{{ t('ourStory.emptyTitle') }}</div>
      <div class="empty-sub">{{ t('ourStory.emptyMessage') }}</div>
      <div style="margin-top:12px;">
        <ButtonMain variant="main" @click="openCreateModal">{{ t('ourStory.addStory') }}</ButtonMain>
      </div>
    </div>

    <DashboardTable v-else>
      <template #head>
        <th>{{ t("ourStory.th.description") }}</th>
        <th v-if="showType">{{ t("ourStory.th.type") }}</th>
        <th>{{ t("ourStory.th.actions") }}</th>
      </template>

      <template #body>
        <OurStoryTableRow
          v-for="item in items"
          :key="item.id"
          :item="item"
          :show-type="showType"
          @edit="openEditModal"
          @delete="onDelete"
        />
      </template>

      <template #footer>
        <span>{{ t("ourStory.totalItems", { count: items.length }) }}</span>
      </template>
    </DashboardTable>

    <!-- Our Story Images -->
    <div class="story-images-section">
      <div class="story-images-header">
        <div class="section-label">{{ t("ourStory.addImages") }}</div>
        <input
          ref="imgFileInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden-file"
          @change="onImgFileChange"
        />
        <ButtonMain variant="outline" :disabled="imgUploading" @click="imgFileInput?.click()">
          {{ imgUploading ? t('galleryUpload.uploading') : t('ourStory.addImages') }}
        </ButtonMain>
      </div>

      <div v-if="imgUploading || imgDeleting" class="img-progress">
        <div class="spinner"></div>
        <span>{{ imgDeleting ? t("ourStory.uploadImages.deleting") : t("galleryUpload.uploading") }}</span>
      </div>

      <div v-if="imgError" class="img-error">{{ imgError }}</div>

      <div v-if="images.length" class="story-images-grid">
        <div v-for="(url, idx) in images" :key="url" class="story-image-item">
          <img :src="url" alt="" class="story-image-img" />
          <button
            type="button"
            class="story-image-remove"
            :disabled="imgDeleting"
            @click="deleteStoryImage(url)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-else-if="!imgUploading" class="empty-images">
        {{ t("ourStory.emptyMessage") }}
      </div>
    </div>

    <AddOurStoryModal
      :open="modalOpen"
      :item="editingItem"
      :items="items"
      @close="closeModal"
      @submit="onSave"
      @delete="onDelete"
    />
  </div>
</template>

<style scoped>
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

/* ---- Our Story Images Section ---- */
.story-images-section {
  margin-top: 24px;
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px 24px;
}

.story-images-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-label {
  font-size: 15px;
  font-weight: 700;
  color: var(--neutral-900);
}

.hidden-file { display: none; }

.story-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.story-image-item {
  position: relative;
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  aspect-ratio: 1;
  background: var(--bg-main, #f8f6f1);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.story-image-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.story-image-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.story-image-item:hover .story-image-remove { opacity: 1; }
.story-image-remove:hover { background: rgba(220, 38, 38, 0.85); }
.story-image-remove:disabled { opacity: 0.5; cursor: not-allowed; }

.img-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
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

.img-error {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
}

.empty-images {
  font-size: 13px;
  color: var(--neutral-500);
}
</style>
