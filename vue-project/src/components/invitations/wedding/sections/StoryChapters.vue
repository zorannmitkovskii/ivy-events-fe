<template>
  <div class="story-chapters" :style="cssVars">
    <div class="chapters-header">
      <h2 class="chapters-title">{{ title }}</h2>
      <div class="chapters-divider"></div>
    </div>
    <div class="chapters-grid">
      <div v-for="(story, idx) in stories" :key="idx" class="chapter-card">
        <h3 class="chapter-heading">{{ story.title }}</h3>
        <p v-if="story.date" class="chapter-date">{{ story.date }}</p>
        <p class="chapter-text">{{ story.description || story.text }}</p>
      </div>
    </div>
    <!-- Photo grid -->
    <div v-if="storyPhotos.length" class="photo-grid">
      <div v-for="(photo, idx) in storyPhotos.slice(0, 4)" :key="idx" class="photo-item">
        <img :src="photo.url || photo.imageUrl || photo" :alt="photo.alt || ''" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: 'Our Story' },
  stories: { type: Array, required: true },
  photos: { type: Array, default: () => [] },
  imageUrl: { type: String, default: '' },
  signatureUrl: { type: String, default: '' },
  paragraphs: { type: Array, default: () => [] },
  dividerColor: { type: String, default: '#c9a96e' },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
});

const cssVars = computed(() => ({
  '--sc-heading-font': props.headingFont,
  '--sc-body-font': props.bodyFont,
  '--sc-divider': props.dividerColor,
}));

/* Collect photos from the photos prop, story imageUrls, or fall back to imageUrl */
const storyPhotos = computed(() => {
  if (props.photos && props.photos.length) return props.photos;
  const fromStories = props.stories
    .filter((s) => s.imageUrl)
    .map((s) => ({ url: s.imageUrl, alt: s.title || '' }));
  if (fromStories.length) return fromStories;
  if (props.imageUrl) return [{ url: props.imageUrl, alt: '' }];
  return [];
});
</script>

<style scoped>
.chapters-header {
  text-align: center;
  margin-bottom: 56px;
}

.chapters-title {
  font-family: var(--font-heading, var(--sc-heading-font));
  font-size: 40px;
  font-weight: 400;
  color: var(--theme-text, #1f2937);
  margin: 0 0 16px;
}

.chapters-divider {
  width: 48px;
  height: 1px;
  background: var(--sc-divider);
  margin: 0 auto;
}

/* ── Chapter cards grid ── */
.chapters-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto 56px;
}

.chapter-card {
  background: var(--card-bg, #ffffff);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.chapter-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.09);
}

.chapter-heading {
  font-family: var(--font-heading, var(--sc-heading-font));
  font-size: 22px;
  font-weight: 500;
  color: var(--theme-text, #1f2937);
  margin: 0 0 8px;
}

.chapter-date {
  font-family: var(--font-body, var(--sc-body-font));
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--theme-accent, var(--sc-divider));
  margin: 0 0 12px;
}

.chapter-text {
  font-family: var(--font-body, var(--sc-body-font));
  font-size: 15px;
  color: var(--theme-text-muted, #4b5563);
  margin: 0;
  line-height: 1.7;
}

/* ── Photo grid ── */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 1000px;
  margin: 0 auto;
}

.photo-item {
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}

.photo-item:hover img {
  transform: scale(1.05);
}

/* ── Desktop: two-column cards, four-column photos ── */
@container (min-width: 768px) {
  .chapters-title {
    font-size: 48px;
  }

  .chapters-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;
  }

  .photo-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
}
</style>
