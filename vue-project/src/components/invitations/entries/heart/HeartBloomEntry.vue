<template>
  <div v-if="visible" class="entry-overlay" :class="{ 'entry-fading': fading }">
    <slot name="edit-button" />
    <div class="bloom-wrap" @click="enterSite">
      <div class="bloom-heart" :class="{ splitting: splitting }">
        <svg viewBox="0 0 120 110" class="heart-svg">
          <path class="heart-left" d="M60 100 C60 100, 5 65, 5 35 A27.5 27.5 0 0 1 60 20" fill="currentColor" />
          <path class="heart-right" d="M60 100 C60 100, 115 65, 115 35 A27.5 27.5 0 0 0 60 20" fill="currentColor" />
        </svg>
      </div>

      <div class="bloom-info" :class="{ 'bloom-info-hidden': splitting }">
        <h1 class="bloom-names">{{ brideName }} & {{ groomName }}</h1>
        <p class="bloom-date">{{ weddingDate }}</p>
      </div>

      <div class="bloom-tap">
        <p class="bloom-tap-text">{{ tapLabel }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  visible: { type: Boolean, default: true },
  brideName: { type: String, required: true },
  groomName: { type: String, required: true },
  weddingDate: { type: String, default: '' },
  tapLabel: { type: String, default: 'Tap to open' },
  photos: { type: Array, default: () => [] },
});

const emit = defineEmits(['enter', 'fading']);

const splitting = ref(false);
const fading = ref(false);

function enterSite() {
  splitting.value = true;
  setTimeout(() => {
    fading.value = true;
    emit('fading');
    setTimeout(() => {
      emit('enter');
    }, 800);
  }, 700);
}

defineExpose({ enterSite });
</script>

<style scoped>
.entry-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fdf2f8;
  transition: opacity 0.8s ease;
}
.entry-overlay.entry-fading {
  opacity: 0;
  pointer-events: none;
}

.bloom-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.bloom-heart {
  color: #e11d48;
  width: 180px;
  height: 170px;
  margin-bottom: 32px;
  animation: pulse-heart 2s ease-in-out infinite;
}
.heart-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.heart-left, .heart-right {
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease;
  transform-origin: 60px 60px;
}
.splitting .heart-left {
  transform: translateX(-80px) rotate(-30deg);
  opacity: 0;
}
.splitting .heart-right {
  transform: translateX(80px) rotate(30deg);
  opacity: 0;
}

.bloom-info {
  text-align: center;
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.bloom-info-hidden {
  opacity: 0;
  transform: scale(0.9);
}
.bloom-names {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 36px;
  color: #1a1a1a;
  margin: 0 0 8px;
}
.bloom-date {
  font-size: 16px;
  color: #9f8274;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0;
}

.bloom-tap {
  margin-top: 40px;
  animation: float-hint 6s ease-in-out infinite;
}
.bloom-tap-text {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 18px;
  font-style: italic;
  color: #666;
  margin: 0;
}

@keyframes pulse-heart {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
@keyframes float-hint {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@media (min-width: 768px) {
  .bloom-heart { width: 220px; height: 210px; }
  .bloom-names { font-size: 48px; }
}
</style>
