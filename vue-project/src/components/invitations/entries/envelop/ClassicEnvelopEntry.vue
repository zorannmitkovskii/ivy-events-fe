<template>
  <div v-if="visible" class="entry-overlay" :class="{ 'entry-fading': fading }">
    <slot name="edit-button" />
    <div class="envelop-wrap" @click="enterSite">
      <div class="envelop" :class="{ opened: opened }">
        <div class="envelop-back"></div>
        <div class="envelop-card" :class="{ 'card-rising': opened }">
          <div class="card-inner">
            <p class="card-invite">You are invited</p>
            <h1 class="card-names">{{ brideName }} & {{ groomName }}</h1>
            <div class="card-divider"></div>
            <p class="card-date">{{ weddingDate }}</p>
          </div>
        </div>
        <div class="envelop-front"></div>
        <div class="envelop-flap"></div>
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
  background: #faf5f0;
  transition: opacity 0.8s ease;
}
.entry-overlay.entry-fading {
  opacity: 0;
  pointer-events: none;
}

.envelop-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.envelop {
  position: relative;
  width: 300px;
  height: 200px;
  perspective: 800px;
}

/* Back of envelope */
.envelop-back {
  position: absolute;
  inset: 0;
  background: #d4a574;
  border-radius: 4px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* Card inside */
.envelop-card {
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: 10px;
  height: 180px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 2;
  transition: transform 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform: translateY(0);
}
.envelop-card.card-rising {
  transform: translateY(-220px);
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
  font-size: 11px;
  color: #9f8274;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0 0 8px;
}
.card-names {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 24px;
  color: #1a1a1a;
  margin: 0 0 12px;
  line-height: 1.2;
}
.card-divider {
  width: 40px;
  height: 2px;
  background: #d4a574;
  margin: 0 0 12px;
}
.card-date {
  font-size: 13px;
  color: #78716c;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0;
}

/* Front of envelope (bottom half) */
.envelop-front {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: #e8c9a0;
  border-radius: 0 0 4px 4px;
  z-index: 3;
  clip-path: polygon(0 40%, 50% 0, 100% 40%, 100% 100%, 0 100%);
}

/* Flap (top triangle) */
.envelop-flap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: #c9985a;
  z-index: 4;
  clip-path: polygon(0 0, 50% 100%, 100% 0);
  transform-origin: top center;
  transition: transform 0.6s ease-in-out;
}
.opened .envelop-flap {
  transform: rotateX(180deg);
}

.envelop-tap {
  margin-top: 32px;
  animation: float-hint 6s ease-in-out infinite;
  transition: opacity 0.3s ease;
}
.envelop-tap-hidden { opacity: 0; }
.envelop-tap-text {
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
  .envelop { width: 380px; height: 250px; }
  .envelop-card { height: 230px; }
  .envelop-card.card-rising { transform: translateY(-280px); }
  .card-names { font-size: 30px; }
}
</style>
