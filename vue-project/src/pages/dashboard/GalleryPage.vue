<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <h1 class="dash-page-title">{{ t("gallery.title") }}</h1>
      <p class="dash-page-subtitle">{{ t("gallery.subtitle") }}</p>
    </div>

    <DashboardToolbar v-if="images.length > 0">
      <template #actions>
        <ButtonMain
          v-if="!selectMode"
          variant="outline"
          :disabled="downloading"
          @click="downloadAll"
        >
          <i class="bi bi-download"></i>
          {{ downloading === 'all' ? t("gallery.downloading") : t("gallery.downloadAll") }}
        </ButtonMain>

        <ButtonMain
          v-if="!selectMode"
          variant="outline"
          @click="selectMode = true"
        >
          <i class="bi bi-check2-square"></i>
          {{ t("gallery.selectMode") }}
        </ButtonMain>

        <template v-if="selectMode">
          <ButtonMain
            variant="main"
            :disabled="selectedIds.size === 0 || downloading === 'selected'"
            @click="downloadSelected"
          >
            <i class="bi bi-download"></i>
            {{ downloading === 'selected' ? t("gallery.downloading") : t("gallery.downloadSelected") }}
            <span v-if="selectedIds.size > 0" class="sel-badge">{{ selectedIds.size }}</span>
          </ButtonMain>

          <ButtonMain variant="outline" @click="cancelSelection">
            {{ t("gallery.cancelSelect") }}
          </ButtonMain>
        </template>
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
          :class="{ selected: selectedIds.has(image.id) }"
          @click="onItemClick(image)"
        >
          <img :src="image.thumb" :alt="image.name || ''" loading="lazy" />

          <!-- Select checkbox -->
          <div v-if="selectMode" class="select-check" @click.stop="toggleSelect(image.id)">
            <i :class="selectedIds.has(image.id) ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>
          </div>

          <!-- Fullscreen overlay (only when not selecting) -->
          <div v-if="!selectMode" class="gallery-overlay">
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
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
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

// Selection state
const selectMode = ref(false);
const selectedIds = reactive(new Set());
const downloading = ref(null); // null | 'all' | 'selected'

let observer = null;

function getEventId() {
  return onboardingStore.eventId;
}

async function loadInitial() {
  initialLoading.value = true;
  error.value = null;
  try {
    const data = await mediaService.list(getEventId(), { page: 0, size: INITIAL_SIZE });
    const result = unwrap(data);
    images.value = mapItems(result.content);
    hasMore.value = !result.last;
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
    const result = unwrap(data);
    images.value.push(...mapItems(result.content));
    hasMore.value = !result.last;
    page.value++;
  } catch {
    hasMore.value = false;
  } finally {
    loadingMore.value = false;
  }
}

function unwrap(data) {
  const inner = data?.data ?? data;
  return {
    content: Array.isArray(inner?.content) ? inner.content : Array.isArray(inner) ? inner : [],
    last: inner?.last ?? true
  };
}

function mapItems(list) {
  return list.map(item => ({
    id: item.id,
    url: item.fileUrl || item.url,
    thumb: item.thumbUrl || item.fileUrl || item.url,
    name: item.fileName || item.fileUrl?.split("/").pop()?.split("?")[0] || "",
    fileType: item.fileType,
    fileSize: item.fileSize
  }));
}

function onItemClick(image) {
  if (selectMode.value) {
    toggleSelect(image.id);
  } else {
    openPreview(image);
  }
}

function openPreview(image) {
  previewImage.value = image;
  previewOpen.value = true;
}

function toggleSelect(id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
}

function cancelSelection() {
  selectMode.value = false;
  selectedIds.clear();
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadAll() {
  if (downloading.value) return;
  downloading.value = "all";
  try {
    const blob = await mediaService.downloadAll(getEventId());
    triggerDownload(blob, "gallery.zip");
  } catch (e) {
    error.value = e?.message || "Download failed";
  } finally {
    downloading.value = null;
  }
}

async function downloadSelected() {
  if (downloading.value || selectedIds.size === 0) return;
  downloading.value = "selected";
  try {
    const ids = Array.from(selectedIds);
    const blob = await mediaService.downloadSelected(ids);
    triggerDownload(blob, "gallery-selected.zip");
    cancelSelection();
  } catch (e) {
    error.value = e?.message || "Download failed";
  } finally {
    downloading.value = null;
  }
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

/* Toolbar badge */
.sel-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.25);
  font-size: 12px;
  font-weight: 700;
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

.gallery-item.selected {
  outline: 3px solid var(--brand-gold, #C8A24D);
  outline-offset: -3px;
}

/* Select checkbox */
.select-check {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  font-size: 22px;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
  cursor: pointer;
}

.gallery-item.selected .select-check {
  color: var(--brand-gold, #C8A24D);
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
