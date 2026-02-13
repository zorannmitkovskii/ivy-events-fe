<template>
  <div class="card card-pad-lg">
    <div class="gal-head">
      <div style="font-weight: 900;">{{ t("overview.galleryPreview") }}</div>
      <router-link
        :to="`/${lang}/dashboard/events/gallery`"
        class="kpi-sub view-link"
      >
        {{ t("common.viewAll") }} →
      </router-link>
    </div>

    <div v-if="images.length === 0" class="empty">
      {{ t("overview.noPhotosYet") }}
    </div>

    <div v-else class="preview-grid">
      <div v-for="img in images" :key="img.id" class="preview-item">
        <img :src="img.url" :alt="img.name || ''" loading="lazy" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();
const lang = computed(() => route.params.lang || "mk");

defineProps({
  images: { type: Array, default: () => [] }
});
</script>

<style scoped>
.gal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.view-link {
  text-decoration: none;
  font-weight: 800;
  cursor: pointer;
}
.preview-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-top: 14px;
}
.preview-item {
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 1;
  background: var(--neutral-200, #e5e7eb);
}
.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.preview-item:hover img {
  transform: scale(1.05);
}
.empty {
  margin-top: 14px;
  color: var(--neutral-500);
  font-size: 13px;
  text-align: center;
  padding: 24px 0;
}

@media (max-width: 768px) {
  .preview-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
