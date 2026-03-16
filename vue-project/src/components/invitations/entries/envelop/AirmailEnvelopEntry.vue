<template>
  <div v-if="visible" class="entry-overlay" :class="{ 'entry-fading': fading }">
    <slot name="edit-button" />
    <div class="airmail-wrap" @click="enterSite">
      <div class="airmail-envelop" :class="{ opened: opened }">
        <!-- Shadow underneath -->
        <div class="airmail-shadow" :class="{ 'shadow-shrink': opened }" />

        <!-- Back of envelope -->
        <div class="airmail-body">
          <div class="airmail-stripe airmail-stripe--top" />
          <div class="airmail-stripe airmail-stripe--bottom" />
          <div class="airmail-stripe airmail-stripe--left" />
          <div class="airmail-stripe airmail-stripe--right" />
          <!-- Paper grain texture -->
          <div class="airmail-grain" />
          <!-- Par Avion label -->
          <div class="airmail-label">
            <span class="label-text">PAR AVION</span>
          </div>
        </div>

        <!-- Liner inside -->
        <div class="airmail-liner" />

        <!-- Card inside -->
        <div class="airmail-card" :class="{ 'card-rising': opened }">
          <div class="card-inner">
            <div class="card-stamp">
              <div class="stamp-border">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            </div>
            <h1 class="card-names">{{ brideName }} & {{ groomName }}</h1>
            <div class="card-line" />
            <p class="card-date">{{ weddingDate }}</p>
          </div>
        </div>

        <!-- Front fold -->
        <div class="airmail-front">
          <div class="airmail-front-stripe" />
        </div>

        <!-- Flap -->
        <div class="airmail-flap" :class="{ 'flap-open': opened }">
          <div class="airmail-flap-stripe" />
        </div>
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
  if (opened.value) return;
  opened.value = true;
  setTimeout(() => {
    fading.value = true;
    emit('fading');
    setTimeout(() => {
      emit('enter');
    }, 800);
  }, 1800);
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
  /* Soft linen / desk background */
  background:
    radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.15), transparent 70%),
    linear-gradient(160deg, #e8e2d8 0%, #d5cfc5 50%, #c8c2b8 100%);
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
  width: 310px;
  height: 210px;
  perspective: 1200px;
  transform-style: preserve-3d;
}

/* Shadow */
.airmail-shadow {
  position: absolute;
  bottom: -14px;
  left: 8%;
  right: 8%;
  height: 28px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.2) 0%, transparent 70%);
  border-radius: 50%;
  transition: all 1.2s ease;
}
.shadow-shrink {
  left: 18%;
  right: 18%;
  opacity: 0.4;
}

/* Body — white paper with grain */
.airmail-body {
  position: absolute;
  inset: 0;
  background: #fafaf6;
  border-radius: 3px;
  box-shadow:
    0 1px 3px rgba(0,0,0,0.06),
    0 6px 20px rgba(0,0,0,0.1),
    inset 0 1px 0 rgba(255,255,255,0.7);
  overflow: hidden;
}
.airmail-grain {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='1' height='1' x='1' y='1' fill='%23000' fill-opacity='0.02'/%3E%3C/svg%3E");
  pointer-events: none;
}

/* Airmail border stripes — all four edges */
.airmail-stripe {
  position: absolute;
  z-index: 1;
  background: repeating-linear-gradient(
    var(--stripe-angle, 90deg),
    #c03030 0, #c03030 10px,
    #fafaf6 10px, #fafaf6 14px,
    #2554a0 14px, #2554a0 24px,
    #fafaf6 24px, #fafaf6 28px
  );
}
.airmail-stripe--top {
  --stripe-angle: 90deg;
  top: 0; left: 0; right: 0; height: 10px;
}
.airmail-stripe--bottom {
  --stripe-angle: 90deg;
  bottom: 0; left: 0; right: 0; height: 10px;
}
.airmail-stripe--left {
  --stripe-angle: 0deg;
  top: 0; bottom: 0; left: 0; width: 10px;
}
.airmail-stripe--right {
  --stripe-angle: 0deg;
  top: 0; bottom: 0; right: 0; width: 10px;
}

/* Par Avion label */
.airmail-label {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 2;
}
.label-text {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 3px;
  color: #2554a0;
  border: 1.5px solid #2554a0;
  padding: 2px 8px;
  text-transform: uppercase;
}

/* Liner inside — visible when flap opens */
.airmail-liner {
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  height: 55%;
  background:
    repeating-linear-gradient(
      -45deg,
      transparent 0, transparent 8px,
      rgba(192, 48, 48, 0.06) 8px, rgba(192, 48, 48, 0.06) 9px,
      transparent 9px, transparent 17px,
      rgba(37, 84, 160, 0.06) 17px, rgba(37, 84, 160, 0.06) 18px
    );
  clip-path: polygon(0 0, 50% 85%, 100% 0);
  border-radius: 2px 2px 0 0;
}

/* Card */
.airmail-card {
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: 18px;
  height: 172px;
  background:
    linear-gradient(180deg, #fffef9, #f8f5ee);
  border: 1px solid #e8e3d8;
  border-radius: 3px;
  z-index: 2;
  transition: transform 1.4s cubic-bezier(0.22, 1, 0.36, 1);
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.airmail-card.card-rising {
  transform: translateY(-250px);
}
.card-inner {
  padding: 18px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.card-stamp {
  margin-bottom: 10px;
}
.stamp-border {
  width: 40px;
  height: 40px;
  padding: 5px;
  border: 2px solid #c8c0b4;
  color: #c03030;
  background:
    radial-gradient(circle at 0 0, transparent 3px, #fafaf6 3.5px) 0 0 / 7px 7px,
    radial-gradient(circle at 7px 0, transparent 3px, #fafaf6 3.5px) 0 0 / 7px 7px;
}
.stamp-border svg { width: 100%; height: 100%; }
.card-names {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 21px;
  color: #2c2420;
  margin: 0 0 8px;
  line-height: 1.3;
}
.card-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #c8c0b4, transparent);
  margin: 0 0 8px;
}
.card-date {
  font-size: 12px;
  color: #8a7e74;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0;
}

/* Front fold */
.airmail-front {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56%;
  background:
    linear-gradient(170deg, rgba(255,255,255,0.1) 0%, transparent 40%),
    #f0ece4;
  border-radius: 0 0 3px 3px;
  z-index: 3;
  clip-path: polygon(0 32%, 50% 0, 100% 32%, 100% 100%, 0 100%);
}
.airmail-front-stripe {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 10px;
  background: repeating-linear-gradient(
    90deg,
    #c03030 0, #c03030 10px,
    #f0ece4 10px, #f0ece4 14px,
    #2554a0 14px, #2554a0 24px,
    #f0ece4 24px, #f0ece4 28px
  );
}

/* Flap */
.airmail-flap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 56%;
  z-index: 4;
  clip-path: polygon(0 0, 50% 100%, 100% 0);
  transform-origin: top center;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  background:
    linear-gradient(180deg, #e6e0d4 0%, #dcd4c6 50%, #d0c8b8 100%);
}
.airmail-flap.flap-open {
  transform: rotateX(180deg);
}
.airmail-flap-stripe {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 10px;
  background: repeating-linear-gradient(
    90deg,
    #c03030 0, #c03030 10px,
    transparent 10px, transparent 14px,
    #2554a0 14px, #2554a0 24px,
    transparent 24px, transparent 28px
  );
}

.airmail-tap {
  margin-top: 40px;
  animation: float-hint 5s ease-in-out infinite;
  transition: opacity 0.4s ease;
}
.airmail-tap-hidden { opacity: 0; }
.airmail-tap-text {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 17px;
  font-style: italic;
  color: #8a8078;
  margin: 0;
}

@keyframes float-hint {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@media (min-width: 640px) {
  .airmail-envelop { width: 390px; height: 260px; }
  .airmail-card { height: 225px; }
  .airmail-card.card-rising { transform: translateY(-300px); }
  .card-names { font-size: 26px; }
  .stamp-border { width: 46px; height: 46px; }
}
</style>
