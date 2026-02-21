<script setup>
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useOurStory } from "@/composables/useOurStory.js";
import OurStoryUploadModal from "@/components/modals/OurStoryUploadModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

const { t } = useI18n();

const {
  loading, error,
  images,
  loadStories,
} = useOurStory();

const uploadModalOpen = ref(false);

function openUploadModal() {
  uploadModalOpen.value = true;
}

function closeUploadModal() {
  uploadModalOpen.value = false;
}

function onUploaded() {
  loadStories();
}

onMounted(() => {
  loadStories();
});
</script>

<template>
  <div>
    <div class="gallery-header">
      <ButtonMain variant="main" @click="openUploadModal">
        {{ t('ourStory.addImages') }}
      </ButtonMain>
    </div>

    <div v-if="loading" class="loading-msg">Loading...</div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <div v-else-if="images.length === 0" class="empty-card">
      <div class="empty-title">{{ t('ourStory.images.title') }}</div>
      <div class="empty-sub">{{ t('ourStory.images.clickToUpload') }}</div>
    </div>

    <div v-else class="gallery-grid">
      <div v-for="img in images" :key="img.id || img.url" class="gallery-item">
        <img :src="img.url || img" :alt="'Story image'" class="gallery-img" />
      </div>
    </div>

    <OurStoryUploadModal
      :open="uploadModalOpen"
      :images="images"
      @close="closeUploadModal"
      @uploaded="onUploaded"
    />
  </div>
</template>

<style scoped>
.gallery-header {
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

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.gallery-item {
  position: relative;
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  aspect-ratio: 1;
  background: var(--bg-main, #f8f6f1);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
