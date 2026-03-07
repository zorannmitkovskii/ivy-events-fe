<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">{{ t("overview.galleryPreview") }}</div>
      <router-link :to="`/${lang}/dashboard/events/gallery`" class="card-action">
        {{ t("common.viewAll") }} &rarr;
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
  background: var(--dash-sage-ghost);
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.preview-item:hover img {
  transform: scale(1.05);
}

.empty {
  margin-top: 14px;
  color: var(--dash-muted);
  font-size: 13px;
  text-align: center;
  padding: 24px 0;
}

@media (max-width: 768px) {
  .preview-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
