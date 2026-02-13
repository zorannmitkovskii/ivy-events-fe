<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <h1 class="dash-page-title">{{ t("gallery.title") }}</h1>
      <p class="dash-page-subtitle">{{ t("gallery.subtitle") }}</p>
    </div>

    <DashboardToolbar>
      <template #actions>
        <!-- future upload button -->
      </template>
    </DashboardToolbar>

    <div v-if="initialLoading" class="g-card g-card-pad">
      {{ t("gallery.loading") }}
    </div>

    <div v-else-if="error && images.length === 0" class="g-card g-card-pad">
      <div class="empty-title">{{ t("gallery.errorTitle") }}</div>
      <div class="empty-sub">{{ error }}</div>
    </div>

    <template v-else>
      <div v-if="images.length === 0" class="g-card g-card-pad empty-state">
        {{ t("gallery.empty") }}
      </div>

      <div v-else class="gallery-grid">
        <div
          v-for="image in images"
          :key="image.id"
          class="gallery-item"
          @click="openPreview(image)"
        >
          <img :src="image.url" :alt="image.name || ''" loading="lazy" />
          <div class="gallery-overlay">
            <i class="bi bi-arrows-fullscreen"></i>
          </div>
        </div>
      </div>

      <div ref="sentinelRef" class="sentinel">
        <div v-if="loadingMore" class="loading-more">
          {{ t("gallery.loadingMore") }}
        </div>
        <div v-else-if="!hasMore && images.length > 0" class="no-more">
          {{ t("gallery.noMore") }}
        </div>
      </div>
    </template>

    <!-- Preview Modal -->
    <BaseModal :open="previewOpen" :title="previewImage.name || ''" @close="previewOpen = false">
      <div class="preview-body">
        <img :src="previewImage.url" :alt="previewImage.name || ''" class="preview-img" />
      </div>

      <template #footer>
        <a
          v-if="previewImage.url"
          :href="previewImage.url"
          download
          class="download-link"
        >
          <i class="bi bi-download"></i> {{ t("gallery.download") }}
        </a>
        <ButtonMain variant="outline" @click="previewOpen = false">
          {{ t("common.cancel") }}
        </ButtonMain>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { mediaService } from "@/services/media.service";
import { onboardingStore } from "@/store/onboarding.store";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar.vue";

const { t } = useI18n();

const images = ref([]);
const initialLoading = ref(false);
const loadingMore = ref(false);
const error = ref(null);
const hasMore = ref(true);
const page = ref(0);

const INITIAL_SIZE = 30;
const LOAD_MORE_SIZE = 10;

const previewOpen = ref(false);
const previewImage = ref({});
const sentinelRef = ref(null);

let observer = null;

function getEventId() {
  return onboardingStore.eventId;
}

async function loadInitial() {
  initialLoading.value = true;
  error.value = null;
  try {
    const data = await mediaService.list(getEventId(), { page: 0, size: INITIAL_SIZE });
    const list = extractList(data);
    images.value = list;
    hasMore.value = list.length >= INITIAL_SIZE;
    page.value = 1;
  } catch (e) {
    error.value = e?.message || "Failed to load images";
  } finally {
    initialLoading.value = false;
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return;
  loadingMore.value = true;
  try {
    const data = await mediaService.list(getEventId(), { page: page.value, size: LOAD_MORE_SIZE });
    const list = extractList(data);
    images.value.push(...list);
    hasMore.value = list.length >= LOAD_MORE_SIZE;
    page.value++;
  } catch {
    hasMore.value = false;
  } finally {
    loadingMore.value = false;
  }
}

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  return [];
}

function openPreview(image) {
  previewImage.value = image;
  previewOpen.value = true;
}

onMounted(async () => {
  await loadInitial();

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        loadMore();
      }
    },
    { rootMargin: "200px", threshold: 0 }
  );

  if (sentinelRef.value) {
    observer.observe(sentinelRef.value);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<style scoped>
.g-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.g-card-pad {
  padding: 20px 24px;
}

.empty-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--neutral-900);
}

.empty-sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--neutral-500);
}

.empty-state {
  text-align: center;
  color: var(--neutral-500);
  font-size: 14px;
  padding: 48px 24px;
}

/* Grid */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.gallery-item {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 3 / 2;
  background: var(--neutral-200);
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery-item:hover img {
  transform: scale(1.08);
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.gallery-item:hover .gallery-overlay {
  opacity: 1;
}

.gallery-overlay i {
  font-size: 22px;
  color: #fff;
}

/* Sentinel */
.sentinel {
  text-align: center;
  padding: 16px 0;
}

.loading-more {
  font-size: 13px;
  color: var(--neutral-500);
}

.no-more {
  font-size: 13px;
  color: var(--neutral-400);
}

/* Preview */
.preview-body {
  text-align: center;
}

.preview-img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: var(--radius-md);
}

.download-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--neutral-300);
  background: #fff;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--brand-main);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.download-link:hover {
  border-color: var(--brand-gold);
  background: rgba(200, 162, 77, 0.06);
}

/* Responsive */
@media (max-width: 900px) {
  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}
</style>
