<template>
  <div v-if="visible" class="entry-overlay" :class="{ 'entry-fading': fading }">
    <slot name="edit-button" />
    <div class="pulse-wrap" @click="enterSite">
      <div class="pulse-circle" :class="{ expanding: expanding }">
        <div class="pulse-ring pulse-ring--1"></div>
        <div class="pulse-ring pulse-ring--2"></div>
        <div class="pulse-inner">
          <svg class="pulse-heart-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      </div>

      <div class="pulse-info" :class="{ 'pulse-info-hidden': expanding }">
        <p class="pulse-initials">{{ brideName.charAt(0) }} & {{ groomName.charAt(0) }}</p>
        <h1 class="pulse-names">{{ brideName }} & {{ groomName }}</h1>
        <p class="pulse-date">{{ weddingDate }}</p>
      </div>

      <div class="pulse-tap" :class="{ 'pulse-tap-hidden': expanding }">
        <p class="pulse-tap-text">{{ tapLabel }}</p>
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

const expanding = ref(false);
const fading = ref(false);

function enterSite() {
  expanding.value = true;
  setTimeout(() => {
    fading.value = true;
    emit('fading');
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fdf2f8 100%);
  transition: opacity 0.8s ease;
}
.entry-overlay.entry-fading {
  opacity: 0;
  pointer-events: none;
}

.pulse-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.pulse-circle {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease;
}
.pulse-circle.expanding {
  transform: scale(12);
  opacity: 0;
}

.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid #fda4af;
  animation: ring-pulse 2.5s ease-out infinite;
}
.pulse-ring--2 {
  animation-delay: 1.25s;
}
@keyframes ring-pulse {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.2); opacity: 0; }
}

.pulse-inner {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 8px 32px rgba(225, 29, 72, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: inner-pulse 2s ease-in-out infinite;
}
.pulse-heart-icon {
  width: 44px;
  height: 44px;
  color: #e11d48;
}
@keyframes inner-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.pulse-info {
  text-align: center;
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.pulse-info-hidden {
  opacity: 0;
  transform: translateY(10px);
}
.pulse-initials {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 14px;
  color: #e11d48;
  letter-spacing: 6px;
  text-transform: uppercase;
  margin: 0 0 8px;
}
.pulse-names {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 36px;
  color: #1a1a1a;
  margin: 0 0 8px;
}
.pulse-date {
  font-size: 15px;
  color: #78716c;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0;
}

.pulse-tap {
  margin-top: 40px;
  animation: float-hint 6s ease-in-out infinite;
  transition: opacity 0.3s ease;
}
.pulse-tap-hidden { opacity: 0; }
.pulse-tap-text {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 18px;
  font-style: italic;
  color: #666;
  margin: 0;
}

@keyframes float-hint {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@media (min-width: 768px) {
  .pulse-names { font-size: 48px; }
  .pulse-circle { width: 160px; height: 160px; }
  .pulse-inner { width: 120px; height: 120px; }
  .pulse-heart-icon { width: 52px; height: 52px; }
}
</style>
