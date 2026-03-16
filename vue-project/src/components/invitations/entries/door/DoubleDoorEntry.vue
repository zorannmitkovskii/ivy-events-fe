<template>
  <div v-if="visible" class="entry-overlay" :class="{ 'entry-fading': fading }">
    <slot name="edit-button" />
    <div class="doors-wrap" @click="enterSite">
      <div class="door door--left" :class="{ 'door-open': opened }">
        <div class="door-panel">
          <div class="door-ornament">
            <div class="door-handle"></div>
          </div>
        </div>
      </div>
      <div class="door door--right" :class="{ 'door-open': opened }">
        <div class="door-panel">
          <div class="door-ornament">
            <div class="door-handle"></div>
          </div>
        </div>
      </div>

      <div class="doors-content" :class="{ 'doors-content-visible': opened }">
        <h1 class="doors-names">{{ brideName }} & {{ groomName }}</h1>
        <p class="doors-date">{{ weddingDate }}</p>
      </div>

      <div class="doors-tap" :class="{ 'doors-tap-hidden': opened }">
        <p class="doors-tap-text">{{ tapLabel }}</p>
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

const opened = ref(false);
const fading = ref(false);

function enterSite() {
  opened.value = true;
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
  background: #1a1a1a;
  transition: opacity 0.8s ease;
}
.entry-overlay.entry-fading {
  opacity: 0;
  pointer-events: none;
}

.doors-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  cursor: pointer;
  overflow: hidden;
}

.door {
  width: 50%;
  height: 100%;
  perspective: 1200px;
}
.door--left { transform-origin: left center; }
.door--right { transform-origin: right center; }

.door-panel {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #2a2520 0%, #1e1b18 100%);
  border: 1px solid #3d3730;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.9s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: inherit;
}
.door--left .door-panel { transform-origin: left center; }
.door--right .door-panel { transform-origin: right center; }

.door--left.door-open .door-panel {
  transform: perspective(1200px) rotateY(-105deg);
}
.door--right.door-open .door-panel {
  transform: perspective(1200px) rotateY(105deg);
}

.door-ornament {
  width: 60px;
  height: 120px;
  border: 1px solid #4a433c;
  border-radius: 30px 30px 4px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.door-handle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c9985a, #a67c3f);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.doors-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.6s ease 0.3s;
}
.doors-content-visible {
  opacity: 1;
}
.doors-names {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 36px;
  color: #fff;
  margin: 0 0 12px;
  white-space: nowrap;
}
.doors-date {
  font-size: 16px;
  color: #a8a29e;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin: 0;
}

.doors-tap {
  position: absolute;
  bottom: 64px;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 10;
  animation: float-hint 6s ease-in-out infinite;
  transition: opacity 0.3s ease;
}
.doors-tap-hidden { opacity: 0; }
.doors-tap-text {
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
  .doors-names { font-size: 56px; }
  .door-ornament { width: 80px; height: 160px; }
  .door-handle { width: 28px; height: 28px; }
}
</style>
