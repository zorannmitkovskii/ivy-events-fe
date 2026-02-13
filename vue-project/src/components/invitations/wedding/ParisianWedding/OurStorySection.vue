<template>
  <div class="our-story" :style="cssVars">
    <div class="story-layout">
      <div class="story-image-wrap">
        <div class="image-border-offset"></div>
        <img :src="imageUrl" :alt="title" class="story-image" />
      </div>

      <div class="story-text">
        <h2 class="story-title">{{ title }}</h2>
        <p v-for="(paragraph, idx) in paragraphs" :key="idx" class="story-paragraph">
          {{ paragraph }}
        </p>
        <div v-if="signatureUrl" class="story-signature">
          <img :src="signatureUrl" alt="Signature" class="signature-img" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: 'Our Story' },
  paragraphs: { type: Array, default: () => [] },
  imageUrl: { type: String, required: true },
  signatureUrl: { type: String, default: '' },
  accentColor: { type: String, default: '#dec69a' },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
});

const cssVars = computed(() => ({
  '--os-heading-font': props.headingFont,
  '--os-body-font': props.bodyFont,
  '--os-accent': props.accentColor,
}));
</script>

<style scoped>
.story-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
  max-width: 1200px;
  margin: 0 auto;
}

.story-image-wrap {
  position: relative;
  width: 100%;
}

.image-border-offset {
  position: absolute;
  top: 16px;
  left: -16px;
  width: 100%;
  height: 100%;
  border: 1px solid var(--os-accent);
  border-radius: 4px;
  z-index: 0;
}

.story-image {
  position: relative;
  z-index: 1;
  width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  filter: grayscale(100%);
  transition: filter 0.7s ease;
}

.story-image:hover {
  filter: grayscale(0%);
}

.story-text {
  text-align: center;
}

.story-title {
  font-family: var(--os-heading-font);
  font-size: 40px;
  font-weight: 400;
  color: #1f2937;
  margin: 0 0 32px;
}

.story-paragraph {
  font-family: var(--os-body-font);
  font-size: 20px;
  line-height: 1.7;
  color: #4b5563;
  margin: 0 0 24px;
}

.story-signature {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.signature-img {
  height: 96px;
  opacity: 0.6;
}

@media (min-width: 1024px) {
  .story-layout {
    flex-direction: row;
    gap: 64px;
  }

  .story-image-wrap {
    width: 50%;
    flex-shrink: 0;
  }

  .story-text {
    text-align: left;
  }

  .story-title {
    font-size: 48px;
  }

  .story-signature {
    justify-content: flex-start;
  }
}
</style>
