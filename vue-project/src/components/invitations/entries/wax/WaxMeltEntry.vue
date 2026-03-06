<template>
  <div v-if="visible" class="entry-overlay" :class="{ 'entry-fading': fading }">
    <slot name="edit-button" />
    <div class="melt-wrap" @click="enterSite">
      <div class="melt-seal" :class="{ melting: melting }">
        <div class="melt-circle">
          <span class="melt-initials">{{ brideName.charAt(0) }}&{{ groomName.charAt(0) }}</span>
        </div>
        <div class="melt-drip melt-drip--1"></div>
        <div class="melt-drip melt-drip--2"></div>
        <div class="melt-drip melt-drip--3"></div>
      </div>

      <div class="melt-info" :class="{ 'melt-info-hidden': melting }">
        <h1 class="melt-names">{{ brideName }} & {{ groomName }}</h1>
        <p class="melt-date">{{ weddingDate }}</p>
      </div>

      <div class="melt-tap" :class="{ 'melt-tap-hidden': melting }">
        <p class="melt-tap-text">{{ tapLabel }}</p>
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

const melting = ref(false);
const fading = ref(false);

function enterSite() {
  melting.value = true;
  setTimeout(() => {
    fading.value = true;
    emit('fading');
    setTimeout(() => {
      emit('enter');
    }, 800);
  }, 900);
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
  background: #1a1510;
  transition: opacity 0.8s ease;
}
.entry-overlay.entry-fading {
  opacity: 0;
  pointer-events: none;
}

.melt-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.melt-seal {
  position: relative;
  margin-bottom: 32px;
}

.melt-circle {
  position: relative;
  width: 160px;
  height: 160px;
  background: radial-gradient(circle at 40% 35%, #c9985a, #a67c3f 60%, #8a6530);
  border-radius: 50%;
  box-shadow:
    0 6px 20px rgba(166, 124, 63, 0.4),
    inset 0 2px 6px rgba(255, 255, 255, 0.2),
    inset 0 -4px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  z-index: 2;
}
.melt-circle:hover { transform: scale(1.05); }

.melt-initials {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 28px;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 2px;
}

/* Drips */
.melt-drip {
  position: absolute;
  width: 16px;
  background: #a67c3f;
  border-radius: 0 0 8px 8px;
  height: 0;
  z-index: 1;
  opacity: 0;
}
.melt-drip--1 { bottom: 10px; left: 30%; }
.melt-drip--2 { bottom: 5px; left: 55%; width: 12px; }
.melt-drip--3 { bottom: 15px; left: 75%; width: 10px; }

.melting .melt-circle {
  animation: melt-flatten 0.9s ease-in forwards;
}
.melting .melt-initials {
  animation: fade-out 0.4s ease-out 0.2s forwards;
}
.melting .melt-drip {
  opacity: 1;
  animation: drip-down 0.8s ease-in 0.2s forwards;
}
.melting .melt-drip--2 { animation-delay: 0.35s; }
.melting .melt-drip--3 { animation-delay: 0.5s; }

@keyframes melt-flatten {
  0% { transform: scale(1); border-radius: 50%; opacity: 1; }
  60% { transform: scaleX(1.4) scaleY(0.3); border-radius: 40%; opacity: 0.7; }
  100% { transform: scaleX(2) scaleY(0.05); opacity: 0; }
}
@keyframes drip-down {
  0% { height: 0; }
  60% { height: 60px; }
  100% { height: 80px; opacity: 0; transform: translateY(40px); }
}
@keyframes fade-out {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

.melt-info {
  text-align: center;
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.melt-info-hidden {
  opacity: 0;
  transform: translateY(10px);
}
.melt-names {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 36px;
  color: #f5f0e8;
  margin: 0 0 8px;
}
.melt-date {
  font-size: 15px;
  color: #a8a29e;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0;
}

.melt-tap {
  margin-top: 40px;
  animation: float-hint 6s ease-in-out infinite;
  transition: opacity 0.3s ease;
}
.melt-tap-hidden { opacity: 0; }
.melt-tap-text {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 18px;
  font-style: italic;
  color: #a8a29e;
  margin: 0;
}

@keyframes float-hint {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@media (min-width: 768px) {
  .melt-circle { width: 200px; height: 200px; }
  .melt-initials { font-size: 34px; }
  .melt-names { font-size: 48px; }
}
</style>
