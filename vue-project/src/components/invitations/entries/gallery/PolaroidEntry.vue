<template>
  <div v-if="visible" class="entry-overlay" :class="{ 'entry-fading': entryFading }">
    <slot name="edit-button" />
    <div class="polaroid-stack" :class="{ expanding: polaroidExpanding }" @click="enterSite">
      <div v-if="photos[0]" class="polaroid polaroid-1">
        <img :src="photos[0].thumbUrl || photos[0].url" :alt="photos[0].alt || ''" />
      </div>
      <div v-if="photos[1]" class="polaroid polaroid-2">
        <img :src="photos[1].thumbUrl || photos[1].url" :alt="photos[1].alt || ''" />
      </div>
      <div class="polaroid polaroid-3">
        <img v-if="photos[2]" :src="photos[2].thumbUrl || photos[2].url" :alt="photos[2].alt || ''" />
        <div class="polaroid-label">{{ brideName }} & {{ groomName }}</div>
      </div>
    </div>

    <div class="entry-hint">
      <p class="entry-est">Est. {{ estYear }}</p>
      <p class="entry-tap">{{ tapLabel }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: true },
  photos: { type: Array, default: () => [] },
  brideName: { type: String, required: true },
  groomName: { type: String, required: true },
  estYear: { type: [String, Number], default: () => new Date().getFullYear() },
  tapLabel: { type: String, default: 'Tap to open' },
});

const emit = defineEmits(['enter', 'fading']);

const polaroidExpanding = ref(false);
const entryFading = ref(false);

function enterSite() {
  polaroidExpanding.value = true;
  setTimeout(() => {
    entryFading.value = true;
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-warm, #f9f8f6);
  transition: opacity 0.8s ease, visibility 0.8s;
}
.entry-overlay.entry-fading {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

/* Polaroid Stack */
.polaroid-stack {
  position: relative;
  width: 280px;
  height: 370px;
  cursor: pointer;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.polaroid-stack:hover {
  transform: scale(1.02);
}
.polaroid {
  position: absolute;
  inset: 0;
  background: #fff;
  padding: 14px 14px 56px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center;
}
.polaroid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: sepia(10%);
  display: block;
}
.polaroid-1 { transform: rotate(-6deg) translate(-10px, 5px); z-index: 1; }
.polaroid-2 { transform: rotate(4deg) translate(10px, -5px); z-index: 2; }
.polaroid-3 { transform: rotate(-2deg); z-index: 3; }
.polaroid-label {
  position: absolute;
  bottom: 16px;
  left: 0;
  width: 100%;
  text-align: center;
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 18px;
  font-style: italic;
  color: #1a1a1a;
}

/* Expanding animation */
.expanding .polaroid-1 { transform: translate(-150vw, -50vh) rotate(-45deg); opacity: 0; }
.expanding .polaroid-2 { transform: translate(150vw, -50vh) rotate(45deg); opacity: 0; }
.expanding .polaroid-3 { transform: scale(5); opacity: 0; z-index: 50; }

.entry-hint {
  margin-top: 48px;
  text-align: center;
  pointer-events: none;
  animation: float-hint 6s ease-in-out infinite;
}
.entry-est {
  font-size: 13px;
  color: #666;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0 0 8px;
}
.entry-tap {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 22px;
  font-style: italic;
  color: #1a1a1a;
  margin: 0;
}
@keyframes float-hint {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@container (min-width: 640px) {
  .polaroid-stack { width: 320px; height: 420px; }
}
</style>
