<template>
  <div v-if="visible" class="entry-overlay" :class="{ 'entry-fading': fading }">
    <slot name="edit-button" />
    <div class="wax-wrap" @click="enterSite">
      <div class="wax-seal" :class="{ cracking: cracking }">
        <div class="wax-circle">
          <div class="wax-crack wax-crack--1"></div>
          <div class="wax-crack wax-crack--2"></div>
          <div class="wax-crack wax-crack--3"></div>
          <span class="wax-initials">{{ brideName.charAt(0) }}&{{ groomName.charAt(0) }}</span>
        </div>
      </div>

      <div class="wax-info" :class="{ 'wax-info-hidden': cracking }">
        <h1 class="wax-names">{{ brideName }} & {{ groomName }}</h1>
        <p class="wax-date">{{ weddingDate }}</p>
      </div>

      <div class="wax-tap" :class="{ 'wax-tap-hidden': cracking }">
        <p class="wax-tap-text">{{ tapLabel }}</p>
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

const cracking = ref(false);
const fading = ref(false);

function enterSite() {
  cracking.value = true;
  setTimeout(() => {
    fading.value = true;
    emit('fading');
    setTimeout(() => {
      emit('enter');
    }, 800);
  }, 800);
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
  background: #f5f0e8;
  transition: opacity 0.8s ease;
}
.entry-overlay.entry-fading {
  opacity: 0;
  pointer-events: none;
}

.wax-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.wax-seal {
  margin-bottom: 32px;
}
.wax-circle {
  position: relative;
  width: 160px;
  height: 160px;
  background: radial-gradient(circle at 40% 35%, #b22234, #8b1a2b 60%, #6b0f1a);
  border-radius: 50%;
  box-shadow:
    0 6px 20px rgba(139, 26, 43, 0.35),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  overflow: hidden;
}
.wax-circle:hover { transform: scale(1.05); }

.wax-initials {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 28px;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 2px;
  z-index: 2;
  transition: opacity 0.4s ease;
}

/* Crack lines */
.wax-crack {
  position: absolute;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  z-index: 1;
}
.wax-crack--1 {
  width: 2px;
  height: 0;
  top: 20%;
  left: 50%;
  transform: rotate(25deg);
}
.wax-crack--2 {
  width: 2px;
  height: 0;
  top: 30%;
  left: 40%;
  transform: rotate(-35deg);
}
.wax-crack--3 {
  width: 2px;
  height: 0;
  top: 25%;
  left: 60%;
  transform: rotate(55deg);
}

.cracking .wax-circle {
  animation: seal-shake 0.4s ease-in-out, seal-break 0.8s ease-out 0.4s forwards;
}
.cracking .wax-initials {
  opacity: 0;
  transition-delay: 0.3s;
}
.cracking .wax-crack {
  opacity: 1;
  animation: crack-grow 0.5s ease-out 0.1s forwards;
}
.cracking .wax-crack--2 { animation-delay: 0.2s; }
.cracking .wax-crack--3 { animation-delay: 0.3s; }

@keyframes seal-shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
}
@keyframes seal-break {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1.5); opacity: 0; }
}
@keyframes crack-grow {
  0% { height: 0; }
  100% { height: 80%; }
}

.wax-info {
  text-align: center;
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.wax-info-hidden {
  opacity: 0;
  transform: translateY(10px);
}
.wax-names {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 36px;
  color: #1a1a1a;
  margin: 0 0 8px;
}
.wax-date {
  font-size: 15px;
  color: #78716c;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0;
}

.wax-tap {
  margin-top: 40px;
  animation: float-hint 6s ease-in-out infinite;
  transition: opacity 0.3s ease;
}
.wax-tap-hidden { opacity: 0; }
.wax-tap-text {
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
  .wax-circle { width: 200px; height: 200px; }
  .wax-initials { font-size: 34px; }
  .wax-names { font-size: 48px; }
}
</style>
