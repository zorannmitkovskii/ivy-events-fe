<template>
  <div v-if="visible" class="entry-overlay" :class="{ 'entry-fading': fading }">
    <slot name="edit-button" />
    <div class="airmail-wrap" @click="enterSite">
      <div class="airmail-envelop" :class="{ opened: opened }">
        <div class="airmail-body">
          <div class="airmail-stripe airmail-stripe--top"></div>
          <div class="airmail-stripe airmail-stripe--bottom"></div>
        </div>
        <div class="airmail-card" :class="{ 'card-rising': opened }">
          <div class="card-inner">
            <div class="card-stamp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
            </div>
            <h1 class="card-names">{{ brideName }} & {{ groomName }}</h1>
            <p class="card-date">{{ weddingDate }}</p>
          </div>
        </div>
        <div class="airmail-flap"></div>
      </div>

      <div class="airmail-tap" :class="{ 'airmail-tap-hidden': opened }">
        <p class="airmail-tap-text">{{ tapLabel }}</p>
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
  }, 1200);
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
  background: #f0f4f8;
  transition: opacity 0.8s ease;
}
.entry-overlay.entry-fading {
  opacity: 0;
  pointer-events: none;
}

.airmail-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.airmail-envelop {
  position: relative;
  width: 300px;
  height: 200px;
  perspective: 800px;
}

.airmail-body {
  position: absolute;
  inset: 0;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.airmail-stripe {
  position: absolute;
  left: 0;
  right: 0;
  height: 8px;
  background: repeating-linear-gradient(
    90deg,
    #dc2626 0, #dc2626 12px,
    #fff 12px, #fff 16px,
    #2563eb 16px, #2563eb 28px,
    #fff 28px, #fff 32px
  );
}
.airmail-stripe--top { top: 0; }
.airmail-stripe--bottom { bottom: 0; }

.airmail-card {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 16px;
  height: 170px;
  background: #fffbf5;
  border: 1px solid #e5e1d8;
  border-radius: 4px;
  z-index: 2;
  transition: transform 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform: translateY(0);
}
.airmail-card.card-rising {
  transform: translateY(-230px);
}
.card-inner {
  padding: 20px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.card-stamp {
  width: 36px;
  height: 36px;
  color: #dc2626;
  margin-bottom: 12px;
}
.card-stamp svg { width: 100%; height: 100%; }
.card-names {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 22px;
  color: #1a1a1a;
  margin: 0 0 8px;
  line-height: 1.2;
}
.card-date {
  font-size: 13px;
  color: #78716c;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0;
}

.airmail-flap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 55%;
  background: linear-gradient(180deg, #e8e4de, #d8d4ce);
  z-index: 4;
  clip-path: polygon(0 0, 50% 100%, 100% 0);
  transform-origin: top center;
  transition: transform 0.6s ease-in-out;
}
.opened .airmail-flap {
  transform: rotateX(180deg);
}

.airmail-tap {
  margin-top: 32px;
  animation: float-hint 6s ease-in-out infinite;
  transition: opacity 0.3s ease;
}
.airmail-tap-hidden { opacity: 0; }
.airmail-tap-text {
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

@media (min-width: 640px) {
  .airmail-envelop { width: 380px; height: 250px; }
  .airmail-card { height: 220px; }
  .airmail-card.card-rising { transform: translateY(-280px); }
  .card-names { font-size: 28px; }
}
</style>
