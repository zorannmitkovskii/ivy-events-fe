<template>
  <div class="our-story" :style="cssVars">
    <h2 class="story-title">{{ title }}</h2>

    <div class="story-layout">
      <!-- Story cards -->
      <div class="story-cards">
        <div
          v-for="(story, idx) in stories"
          :key="idx"
          class="story-card"
          :style="{ background: story.bgColor || cardColors[idx % cardColors.length] }"
        >
          <h3 class="card-heading">{{ story.title }}</h3>
          <p class="card-text">{{ story.text }}</p>
        </div>
      </div>

      <!-- Photo grid -->
      <div class="photo-grid">
        <img
          v-for="(photo, idx) in photos.slice(0, 4)"
          :key="idx"
          :src="photo.url"
          :alt="photo.alt || 'Couple photo'"
          class="grid-photo"
          :class="gridPhotoClass(idx)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: 'Our Love Story' },
  stories: { type: Array, required: true },
  photos: { type: Array, default: () => [] },
  cardColors: { type: Array, default: () => ['#FFF1F2', '#F5F3FF'] },
  cardShadow: { type: String, default: '0px 4px 20px rgba(200, 180, 220, 0.15)' },
  cardRadius: { type: String, default: '16px' },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
});

const cssVars = computed(() => ({
  '--os-heading-font': props.headingFont,
  '--os-body-font': props.bodyFont,
  '--os-card-shadow': props.cardShadow,
  '--os-card-radius': props.cardRadius,
}));

function gridPhotoClass(idx) {
  if (idx === 1) return 'grid-photo--offset-down';
  if (idx === 2) return 'grid-photo--offset-up';
  return '';
}
</script>

<style scoped>
.our-story {
  width: 100%;
}

.story-title {
  font-family: var(--os-heading-font);
  font-size: 40px;
  font-weight: 500;
  color: #333;
  text-align: center;
  margin: 0 0 48px;
}

.story-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  align-items: center;
  max-width: 1100px;
  margin: 0 auto;
}

.story-cards {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.story-card {
  border-radius: var(--os-card-radius);
  box-shadow: var(--os-card-shadow);
  padding: 28px;
}

.card-heading {
  font-family: var(--os-heading-font);
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
}

.card-text {
  font-family: var(--os-body-font);
  font-size: 16px;
  line-height: 1.7;
  color: #666;
  margin: 0;
}

.photo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.grid-photo {
  width: 100%;
  height: 240px;
  object-fit: cover;
  border-radius: var(--os-card-radius);
  box-shadow: var(--os-card-shadow);
}

.grid-photo--offset-down {
  margin-top: 32px;
}

.grid-photo--offset-up {
  margin-top: -32px;
}

@media (min-width: 1024px) {
  .story-layout {
    grid-template-columns: 1fr 1fr;
    gap: 48px;
  }

  .story-title {
    font-size: 48px;
  }
}

@media (max-width: 640px) {
  .story-title {
    font-size: 32px;
  }

  .grid-photo {
    height: 180px;
  }

  .grid-photo--offset-down,
  .grid-photo--offset-up {
    margin-top: 0;
  }

  .photo-grid {
    max-width: 400px;
    margin: 0 auto;
  }
}
</style>
