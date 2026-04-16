<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <div class="page-eyebrow">{{ t("sidebar.navigation") }}</div>
      <h1 class="dash-page-title">{{ t("gallery.title") }}</h1>
      <p class="dash-page-subtitle">{{ t("gallery.subtitle") }}</p>
    </div>

    <!-- No gallery package -->
    <div v-if="!hasGalleryAccess" class="no-access-card">
      <i class="bi bi-lock"></i>
      <h3>Gallery not available</h3>
      <p>You need a Gallery package to use this feature. Upgrade your plan to enable photo uploads and sharing.</p>
      <ButtonMain variant="main" @click="goToPackages">View Packages</ButtonMain>
    </div>

    <DashboardToolbar v-else-if="images.length > 0">
      <template #actions>
        <ButtonMain
          v-if="!selectMode"
          variant="outline"
          :disabled="downloading"
          @click="downloadAll"
        >
          <span v-if="downloading === 'all'" class="dl-spinner"></span>
          <i v-else class="bi bi-download"></i>
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
            <span v-if="downloading === 'selected'" class="dl-spinner dl-spinner--light"></span>
            <i v-else class="bi bi-download"></i>
            {{ downloading === 'selected' ? t("gallery.downloading") : t("gallery.downloadSelected") }}
            <span v-if="selectedIds.size > 0" class="sel-badge">{{ selectedIds.size }}</span>
          </ButtonMain>

          <ButtonMain
            variant="outline"
            class="btn-danger-outline"
            :disabled="selectedIds.size === 0 || deleting"
            @click="deleteSelected"
          >
            <span v-if="deleting === 'selected'" class="dl-spinner"></span>
            <i v-else class="bi bi-trash"></i>
            {{ deleting === 'selected' ? t("gallery.deleting") : t("gallery.deleteSelected") }}
          </ButtonMain>

          <ButtonMain variant="outline" @click="cancelSelection">
            {{ t("gallery.cancelSelect") }}
          </ButtonMain>
        </template>
      </template>
    </DashboardToolbar>

    <div v-if="initialLoading" class="d-card d-card-pad">
      {{ t("gallery.loading") }}
    </div>

    <div v-else-if="error && images.length === 0" class="d-card d-card-pad">
      <div class="empty-title">{{ t("gallery.errorTitle") }}</div>
      <div class="empty-sub">{{ error }}</div>
    </div>

    <template v-else>
      <div v-if="images.length === 0" class="d-card d-card-pad empty-state">
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
          <!-- Video -->
          <template v-if="isVideo(image)">
            <video :src="image.url" :poster="image.thumb !== image.url ? image.thumb : ''" muted playsinline preload="metadata" class="gallery-media" @mouseenter="$event.target.play()" @mouseleave="$event.target.pause(); $event.target.currentTime = 0" />
            <div class="video-badge"><i class="bi bi-play-fill"></i></div>
          </template>
          <!-- Image -->
          <img v-else :src="image.thumb" :alt="image.name || ''" loading="lazy" class="gallery-media" />

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
        <video v-if="isVideo(previewImage)" :src="previewImage.url" controls playsinline class="preview-img" />
        <img v-else :src="previewImage.url" :alt="previewImage.name || ''" class="preview-img" />
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
        <button
          v-if="previewImage.id"
          type="button"
          class="delete-link"
          :disabled="deleting === 'one'"
          @click="deleteCurrent"
        >
          <span v-if="deleting === 'one'" class="dl-spinner"></span>
          <i v-else class="bi bi-trash"></i>
          {{ deleting === 'one' ? t("gallery.deleting") : t("gallery.delete") }}
        </button>
        <ButtonMain variant="outline" @click="previewOpen = false">
          {{ t("common.cancel") }}
        </ButtonMain>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { mediaService } from "@/services/media.service";
import { onboardingStore } from "@/store/onboarding.store";
import { getPackages } from "@/services/auth.service";
import { EventCategoryEnum } from "@/enums/EventCategory.js";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar.vue";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || "mk");

const isGalleryEvent = computed(() => onboardingStore.selectedCategory === EventCategoryEnum.GALLERY);
const hasGalleryAccess = computed(() => {
  // Gallery events always have access (that's their purpose)
  if (isGalleryEvent.value) return true;
  // Other events need a GALLERY_ package
  return getPackages().some(p => p.startsWith("GALLERY_"));
});

function goToPackages() {
  router.push({ name: "dashboard.packages", params: { lang: lang.value } });
}

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
const deleting = ref(null); // null | 'one' | 'selected'

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

const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|avi|mkv|m4v)(\?|$)/i;

function isVideo(item) {
  if (item.fileType?.startsWith('video')) return true;
  if (item.url && VIDEO_EXTENSIONS.test(item.url)) return true;
  if (item.name && VIDEO_EXTENSIONS.test(item.name)) return true;
  return false;
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

async function deleteCurrent() {
  const img = previewImage.value;
  if (!img?.id || deleting.value) return;
  if (!window.confirm(t("gallery.confirmDelete"))) return;
  deleting.value = "one";
  try {
    await mediaService.deleteById(img.id);
    images.value = images.value.filter(i => i.id !== img.id);
    selectedIds.delete(img.id);
    previewOpen.value = false;
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || t("gallery.deleteError");
  } finally {
    deleting.value = null;
  }
}

async function deleteSelected() {
  if (deleting.value || selectedIds.size === 0) return;
  const count = selectedIds.size;
  if (!window.confirm(t("gallery.confirmDeleteMany", { count }))) return;
  deleting.value = "selected";
  try {
    const ids = Array.from(selectedIds);
    await mediaService.deleteSelected(ids);
    const idSet = new Set(ids);
    images.value = images.value.filter(i => !idSet.has(i.id));
    cancelSelection();
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || t("gallery.deleteError");
  } finally {
    deleting.value = null;
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
.no-access-card {
  text-align: center;
  padding: 48px 24px;
  background: var(--dash-cream-card, #fff);
  border: 1px solid var(--dash-cream-border, #e2e8f0);
  border-radius: 16px;
  margin-top: 16px;
}
.no-access-card i {
  font-size: 40px;
  color: #94a3b8;
  margin-bottom: 12px;
  display: block;
}
.no-access-card h3 {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
}
.no-access-card p {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 20px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.d-card {
  background: var(--dash-cream-card);
  border-radius: var(--dash-radius);
  border: 1px solid var(--dash-cream-border);
  box-shadow: var(--dash-shadow-sm);
}

.d-card-pad {
  padding: 24px;
}

.empty-title {
  font-family: 'Playfair Display', serif;
  font-weight: 400;
  font-size: 18px;
  color: var(--dash-charcoal);
}

.empty-sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--dash-muted);
}

.empty-state {
  text-align: center;
  color: var(--dash-muted);
  font-size: 13px;
  padding: 48px 24px;
}

.dl-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-top-color: var(--dash-sage, #334338);
  border-radius: 50%;
  animation: dl-spin 0.7s linear infinite;
  margin-right: 4px;
  vertical-align: -2px;
}

.dl-spinner--light {
  border-color: rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
}

@keyframes dl-spin {
  to { transform: rotate(360deg); }
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
  border-radius: var(--dash-radius);
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 3 / 2;
  background: var(--dash-cream);
}

.gallery-item img,
.gallery-item video,
.gallery-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  background: rgba(0,0,0,0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  pointer-events: none;
}

.gallery-item:hover img {
  transform: scale(1.08);
}

.gallery-item.selected {
  outline: 3px solid var(--dash-gold);
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
  color: var(--dash-gold);
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background: rgba(30, 36, 32, 0.35);
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
  color: var(--dash-muted);
}

.no-more {
  font-size: 13px;
  color: var(--dash-light);
}

/* Preview */
.preview-body {
  text-align: center;
}

.preview-img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: var(--dash-radius);
}

.download-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1.5px solid var(--dash-cream-border);
  background: var(--dash-cream-card);
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  color: var(--dash-sage);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.download-link:hover {
  border-color: var(--dash-sage-light);
  background: var(--dash-sage-ghost);
}

.delete-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1.5px solid #fecaca;
  background: #fff;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  color: #dc2626;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.delete-link:hover:not(:disabled) {
  border-color: #f87171;
  background: #fef2f2;
}

.delete-link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

:deep(.btn-danger-outline) {
  border-color: #fecaca !important;
  color: #dc2626 !important;
}
:deep(.btn-danger-outline:hover:not(:disabled)) {
  background: #fef2f2 !important;
  border-color: #f87171 !important;
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
