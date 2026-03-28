<template>
  <div class="story-gallery" :style="cssVars">
    <div class="gallery-header">
      <h2 class="gallery-title">{{ title }}</h2>
      <div class="gallery-divider"></div>
    </div>

    <div class="gallery-grid">
      <div v-for="(story, idx) in stories" :key="idx" class="story-card">
        <div class="card-image" :class="{ 'card-image--empty': !story.imageUrl }">
          <img v-if="story.imageUrl" :src="story.imageUrl" :alt="story.title || ''" />
          <div v-else class="card-image-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        </div>
        <div class="card-text">
          <p v-if="story.date" class="card-date">{{ story.date }}</p>
          <h3 class="card-title">{{ story.title }}</h3>
          <p v-if="story.description" class="card-description">{{ story.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: 'Our Story' },
  stories: { type: Array, required: true },
  dividerColor: { type: String, default: '#fda4af' },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
});

const cssVars = computed(() => ({
  '--sg-heading-font': props.headingFont,
  '--sg-body-font': props.bodyFont,
  '--sg-divider': props.dividerColor,
}));
</script>

<style scoped>
.gallery-header {
  text-align: center;
  margin-bottom: 64px;
}

.gallery-title {
  font-family: var(--sg-heading-font);
  font-size: 40px;
  font-weight: 400;
  color: var(--theme-text, #1f2937);
  margin: 0 0 16px;
}

.gallery-divider {
  width: 48px;
  height: 1px;
  background: var(--sg-divider);
  margin: 0 auto;
}

.gallery-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.story-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-image {
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.08);
  height: 256px;
}

.card-image--empty {
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image-placeholder {
  color: #d1d5db;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-text {
  text-align: center;
  padding: 0 16px;
}

.card-date {
  font-family: var(--sg-body-font);
  font-size: 13px;
  color: var(--theme-text-muted, #6b7280);
  margin: 0 0 8px;
}

.card-title {
  font-family: var(--sg-heading-font);
  font-size: 22px;
  font-weight: 500;
  color: var(--theme-text, #1f2937);
  margin: 0 0 8px;
}

.card-description {
  font-family: var(--sg-body-font);
  font-size: 14px;
  color: var(--theme-text-muted, #4b5563);
  margin: 0;
  line-height: 1.6;
}

@container (min-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@container (min-width: 1024px) {
  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .gallery-title {
    font-size: 48px;
  }
}
</style>