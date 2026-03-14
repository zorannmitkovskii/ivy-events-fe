<template>
  <div v-if="visible" class="entry-overlay" :class="{ 'entry-fading': fading }">
    <slot name="edit-button" />
    <div class="envelop-wrap" @click="enterSite">
      <!-- Floating particles -->
      <div class="particles">
        <span v-for="i in 6" :key="i" class="particle" :style="particleStyle(i)" />
      </div>

      <div class="envelop" :class="{ opened: opened }">
        <!-- Shadow underneath -->
        <div class="envelop-shadow" :class="{ 'shadow-shrink': opened }" />

        <!-- Back of envelope -->
        <div class="envelop-back">
          <div class="envelop-liner" />
        </div>

        <!-- Card inside -->
        <div class="envelop-card" :class="{ 'card-rising': opened }">
          <div class="card-inner">
            <p class="card-invite">You are invited</p>
            <div class="card-ornament">&#10045;</div>
            <h1 class="card-names">{{ brideName }} & {{ groomName }}</h1>
            <div class="card-divider" />
            <p class="card-date">{{ weddingDate }}</p>
          </div>
        </div>

        <!-- Front of envelope (bottom half) -->
        <div class="envelop-front">
          <div class="envelop-front-fold" />
        </div>

        <!-- Wax seal -->
        <div class="envelop-seal" :class="{ 'seal-break': opened }">
          <svg viewBox="0 0 40 40" class="seal-svg">
            <circle cx="20" cy="20" r="16" fill="#8b2942" />
            <circle cx="20" cy="20" r="12" fill="none" stroke="#a0354f" stroke-width="0.8" />
            <path d="M20 10l2.5 5 5.5.8-4 3.9.9 5.3-4.9-2.6-4.9 2.6.9-5.3-4-3.9 5.5-.8z" fill="#c9506a" opacity="0.6" />
          </svg>
        </div>

        <!-- Flap (top triangle) -->
        <div class="envelop-flap" :class="{ 'flap-open': opened }">
          <div class="envelop-flap-inner" />
        </div>
      </div>

      <div class="envelop-tap" :class="{ 'envelop-tap-hidden': opened }">
        <p class="envelop-tap-text">{{ tapLabel }}</p>
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

function particleStyle(i) {
  const left = 10 + (i * 15) % 80;
  const delay = (i * 0.7) % 4;
  const size = 4 + (i % 3) * 3;
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    width: `${size}px`,
    height: `${size}px`,
  };
}

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
  /* Wooden background */
  background:
    repeating-linear-gradient(
      90deg,
      transparent 0, transparent 40px,
      rgba(0,0,0,0.03) 40px, rgba(0,0,0,0.03) 42px
    ),
    linear-gradient(
      180deg,
      #c4a882 0%, #b89b74 20%, #c9a57a 40%, #bfa078 60%, #c4a882 80%, #b89468 100%
    );
  transition: opacity 0.8s ease;
}
.entry-overlay.entry-fading {
  opacity: 0;
  pointer-events: none;
}

/* Floating particles */
.particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.particle {
  position: absolute;
  top: -10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: particle-fall 8s linear infinite;
}
@keyframes particle-fall {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
  10% { opacity: 0.6; }
  90% { opacity: 0.2; }
  100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
}

.envelop-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.envelop {
  position: relative;
  width: 300px;
  height: 210px;
  perspective: 1200px;
  transform-style: preserve-3d;
}

/* Shadow under the envelope */
.envelop-shadow {
  position: absolute;
  bottom: -15px;
  left: 10%;
  right: 10%;
  height: 30px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%);
  border-radius: 50%;
  transition: all 1.2s ease;
}
.shadow-shrink {
  left: 20%;
  right: 20%;
  opacity: 0.5;
}

/* Back of envelope — paper texture */
.envelop-back {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%),
    #f5f0e8;
  border-radius: 3px;
  box-shadow:
    0 2px 4px rgba(0,0,0,0.08),
    0 8px 24px rgba(0,0,0,0.12),
    inset 0 1px 0 rgba(255,255,255,0.5);
}

/* Inner liner pattern */
.envelop-liner {
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  height: 55%;
  background:
    repeating-linear-gradient(
      -45deg,
      transparent 0, transparent 6px,
      rgba(180, 160, 140, 0.08) 6px, rgba(180, 160, 140, 0.08) 7px
    ),
    linear-gradient(180deg, #eee8dc, #f2ece2);
  border-radius: 2px 2px 0 0;
  clip-path: polygon(0 0, 50% 90%, 100% 0);
}

/* Card inside */
.envelop-card {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 12px;
  height: 185px;
  background:
    linear-gradient(180deg, #fffef9, #faf7f0);
  border-radius: 3px;
  box-shadow:
    0 1px 4px rgba(0,0,0,0.06),
    inset 0 0 0 1px rgba(0,0,0,0.04);
  z-index: 2;
  transition: transform 1.4s cubic-bezier(0.22, 1, 0.36, 1);
  transform: translateY(0);
}
.envelop-card.card-rising {
  transform: translateY(-240px);
}
.card-inner {
  padding: 24px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.card-invite {
  font-size: 10px;
  color: #9f8274;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin: 0 0 4px;
}
.card-ornament {
  font-size: 16px;
  color: #c9a06c;
  margin: 0 0 8px;
}
.card-names {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 22px;
  color: #2c2420;
  margin: 0 0 10px;
  line-height: 1.3;
}
.card-divider {
  width: 50px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #c9a06c, transparent);
  margin: 0 0 10px;
}
.card-date {
  font-size: 12px;
  color: #8a7e74;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0;
}

/* Front of envelope (bottom half) — two-tone fold */
.envelop-front {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 58%;
  background:
    linear-gradient(170deg, rgba(255,255,255,0.08) 0%, transparent 60%),
    #ede6d8;
  border-radius: 0 0 3px 3px;
  z-index: 3;
  clip-path: polygon(0 35%, 50% 0, 100% 35%, 100% 100%, 0 100%);
  box-shadow: 0 -1px 3px rgba(0,0,0,0.06);
}
.envelop-front-fold {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(180deg, rgba(0,0,0,0.04), transparent);
  clip-path: polygon(0 0, 50% -35%, 100% 0);
}

/* Wax seal */
.envelop-seal {
  position: absolute;
  bottom: 35%;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  z-index: 5;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));
  transition: all 0.6s ease;
}
.seal-break {
  opacity: 0;
  transform: translateX(-50%) scale(1.3) rotate(30deg);
}
.seal-svg {
  width: 100%;
  height: 100%;
}

/* Flap (top triangle) — realistic fold */
.envelop-flap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 58%;
  z-index: 4;
  clip-path: polygon(0 0, 50% 100%, 100% 0);
  transform-origin: top center;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  background:
    linear-gradient(180deg, #e2d9c8 0%, #d8cdb8 50%, #cec1ab 100%);
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.envelop-flap.flap-open {
  transform: rotateX(180deg);
}
.envelop-flap-inner {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 40%);
  clip-path: polygon(0 0, 50% 100%, 100% 0);
}

.envelop-tap {
  margin-top: 40px;
  animation: float-hint 5s ease-in-out infinite;
  transition: opacity 0.4s ease;
}
.envelop-tap-hidden { opacity: 0; }
.envelop-tap-text {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 17px;
  font-style: italic;
  color: rgba(255,255,255,0.7);
  margin: 0;
  text-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

@keyframes float-hint {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@media (min-width: 640px) {
  .envelop { width: 380px; height: 260px; }
  .envelop-card { height: 240px; }
  .envelop-card.card-rising { transform: translateY(-300px); }
  .card-names { font-size: 28px; }
  .envelop-seal { width: 42px; height: 42px; }
}
</style>
