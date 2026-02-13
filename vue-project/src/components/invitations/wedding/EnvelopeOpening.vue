<template>
  <div class="envelope-screen" :class="{ hidden: isHidden }">
    <div
      class="envelope-wrapper"
      :class="{ opened: isOpened }"
      @click="openEnvelope"
    >
      <div class="envelope-base"></div>
      <div class="envelope-flap"></div>
      <div class="seal">💕</div>
      <div class="tap-hint">{{ envelopeText }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  envelopeText: {
    type: String,
    default: 'Click to open'
  }
});

const emit = defineEmits(['opened']);

const isOpened = ref(false);
const isHidden = ref(false);

function openEnvelope() {
  isOpened.value = true;

  setTimeout(() => {
    isHidden.value = true;
    emit('opened');
  }, 1000);
}
</script>

<style scoped>
.envelope-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 100;
  background: linear-gradient(135deg, #e8f4f8 0%, #d4e8f0 50%, #e8f4f8 100%);
  transition: opacity 0.5s ease;
}

.envelope-screen.hidden {
  opacity: 0;
  pointer-events: none;
}

.envelope-wrapper {
  position: relative;
  width: 90%;
  max-width: 500px;
  aspect-ratio: 1.5;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.envelope-wrapper:hover {
  transform: scale(1.05);
}

.envelope-base {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #f8f6f1 0%, #ebe8e0 100%);
  border-radius: 3px;
  box-shadow:
    0 25px 70px rgba(0, 0, 0, 0.25),
    inset 0 1px 2px rgba(255, 255, 255, 0.8);
  border: 1px solid #d4cfc4;
}

.envelope-base::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60%;
  height: 45%;
  border: 1px solid rgba(212, 207, 196, 0.4);
  border-radius: 2px;
  pointer-events: none;
}

.envelope-flap {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: linear-gradient(145deg, #e8e5dc 0%, #d6d1c4 100%);
  clip-path: polygon(0 0, 50% 100%, 100% 0);
  transform-origin: 50% 0%;
  transition: transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  z-index: 2;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.envelope-flap::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%);
  clip-path: polygon(0 0, 50% 100%, 100% 0);
}

.envelope-wrapper.opened .envelope-flap {
  transform: rotateX(-180deg);
}

.seal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  background: radial-gradient(circle at 30% 30%, #9d2235 0%, #7a1a28 50%, #5e131f 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 45px;
  box-shadow:
    0 10px 35px rgba(122, 26, 40, 0.6),
    inset -3px -3px 8px rgba(0, 0, 0, 0.4),
    inset 2px 2px 6px rgba(255, 255, 255, 0.1);
  z-index: 3;
  transition: opacity 0.4s ease, transform 0.3s ease;
  border: 3px solid rgba(0, 0, 0, 0.1);
}

.seal::before {
  content: '';
  position: absolute;
  width: 70%;
  height: 70%;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.2);
}

.envelope-wrapper:hover .seal {
  transform: translate(-50%, -50%) scale(1.05);
}

.envelope-wrapper.opened .seal {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}

.tap-hint {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Crimson Text', serif;
  font-size: 20px;
  color: #4a7a95;
  animation: pulse 2s infinite;
  white-space: nowrap;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
