<template>
  <div v-if="visible" class="entry-overlay" :class="{ 'entry-fading': entryFading }">
    <slot name="edit-button" />
    <div class="collage-grid" :class="{ 'collage-zooming': collageZooming }">
      <div
        v-for="(photo, i) in photos"
        :key="i"
        class="collage-item"
        @click="enterSite"
      >
        <img :src="photo.thumbUrl || photo.url" :alt="photo.alt" loading="eager" />
      </div>
    </div>

    <div class="entry-card" :class="{ 'entry-card-fading': collageZooming }">
      <h1 class="entry-names">{{ brideName }} & {{ groomName }}</h1>
      <p class="entry-date">{{ weddingDate }}</p>
      <div class="entry-bounce">
        <p class="entry-hint">{{ tapLabel }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: true },
  photos: { type: Array, default: () => [] },
  brideName: { type: String, required: true },
  groomName: { type: String, required: true },
  weddingDate: { type: String, required: true },
  tapLabel: { type: String, default: 'Tap to enter' },
});

const emit = defineEmits(['enter']);

const collageZooming = ref(false);
const entryFading = ref(false);

function enterSite() {
  collageZooming.value = true;
  setTimeout(() => {
    entryFading.value = true;
    setTimeout(() => {
      emit('enter');
    }, 800);
  }, 600);
}

defineExpose({ enterSite });
</script>

<style scoped>
.entry-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: #1c1917;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.8s ease;
}
.entry-overlay.entry-fading {
  opacity: 0;
  pointer-events: none;
}

.collage-grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 4px;
  padding: 4px;
  background: #f5f5f4;
  transition: transform 0.8s ease-in-out, opacity 0.8s ease;
}
.collage-grid.collage-zooming {
  transform: scale(1.5);
  opacity: 0;
}

@container (min-width: 768px) {
  .collage-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 8px;
    padding: 8px;
  }
}

.collage-item {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
  background: #e7e5e4;
  transition: transform 0.5s ease, filter 0.5s ease;
}
.collage-item:hover {
  transform: scale(1.03);
  filter: brightness(1.1);
  z-index: 10;
}
.collage-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.entry-card {
  position: absolute;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  box-shadow: 0 4px 20px -2px rgba(150, 140, 130, 0.1);
  max-width: 420px;
  margin: 0 16px;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.entry-card-fading {
  opacity: 0;
}
.entry-names {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 40px;
  color: #1c1917;
  margin: 0 0 8px;
  letter-spacing: 0.5px;
}
.entry-date {
  font-family: var(--font-body, 'Lato', sans-serif);
  font-size: 18px;
  color: #57534e;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0 0 24px;
}
.entry-bounce {
  animation: bounce-entry 2s ease infinite;
}
.entry-hint {
  font-family: var(--font-body, 'Lato', sans-serif);
  font-size: 14px;
  color: #78716c;
  font-style: italic;
  margin: 0;
}
@keyframes bounce-entry {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@container (min-width: 768px) {
  .entry-names { font-size: 48px; }
}

@container (max-width: 767px) {
  .entry-names { font-size: 32px; }
  .entry-card { padding: 24px 20px; }
}
</style>
