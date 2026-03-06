<template>
  <div v-if="visible" class="entry-overlay" :class="{ 'entry-fading': fading }">
    <slot name="edit-button" />
    <div class="curtain-wrap" @click="enterSite">
      <div class="curtain curtain--left" :class="{ 'curtain-open': opened }"></div>
      <div class="curtain curtain--right" :class="{ 'curtain-open': opened }"></div>

      <div class="curtain-valance"></div>

      <div class="curtain-content" :class="{ 'curtain-content-visible': opened }">
        <p class="curtain-label">Together with their families</p>
        <h1 class="curtain-names">{{ brideName }} & {{ groomName }}</h1>
        <div class="curtain-divider"></div>
        <p class="curtain-date">{{ weddingDate }}</p>
      </div>

      <div class="curtain-tap" :class="{ 'curtain-tap-hidden': opened }">
        <p class="curtain-tap-text">{{ tapLabel }}</p>
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
  background: #0f0a05;
  transition: opacity 0.8s ease;
}
.entry-overlay.entry-fading {
  opacity: 0;
  pointer-events: none;
}

.curtain-wrap {
  position: absolute;
  inset: 0;
  cursor: pointer;
  overflow: hidden;
}

.curtain {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 55%;
  z-index: 2;
  transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1);
  background:
    repeating-linear-gradient(
      180deg,
      rgba(139, 0, 0, 0.15) 0px,
      transparent 8px,
      transparent 16px
    ),
    linear-gradient(180deg, #6b0f1a 0%, #8b1a2b 30%, #7a1525 60%, #5c0e18 100%);
}
.curtain--left {
  left: 0;
  border-right: 3px solid #4a0a12;
  box-shadow: inset -20px 0 30px rgba(0, 0, 0, 0.3);
}
.curtain--right {
  right: 0;
  border-left: 3px solid #4a0a12;
  box-shadow: inset 20px 0 30px rgba(0, 0, 0, 0.3);
}
.curtain--left.curtain-open { transform: translateX(-100%); }
.curtain--right.curtain-open { transform: translateX(100%); }

.curtain-valance {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(180deg, #4a0a12, #3a0810);
  z-index: 3;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.curtain-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.6s ease 0.4s;
  padding: 0 24px;
}
.curtain-content-visible { opacity: 1; }
.curtain-label {
  font-size: 12px;
  color: #c9985a;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin: 0 0 16px;
}
.curtain-names {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 36px;
  color: #fff;
  margin: 0 0 16px;
}
.curtain-divider {
  width: 64px;
  height: 2px;
  background: #c9985a;
  margin: 0 auto 16px;
}
.curtain-date {
  font-size: 16px;
  color: #a8a29e;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin: 0;
}

.curtain-tap {
  position: absolute;
  bottom: 64px;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 10;
  animation: float-hint 6s ease-in-out infinite;
  transition: opacity 0.3s ease;
}
.curtain-tap-hidden { opacity: 0; }
.curtain-tap-text {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 18px;
  font-style: italic;
  color: #c9985a;
  margin: 0;
}

@keyframes float-hint {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@media (min-width: 768px) {
  .curtain-names { font-size: 56px; }
}
</style>
