<template>
  <div v-if="visible" class="entry-overlay" :class="{ 'entry-fading': fading }" @click="enterSite">
    <slot name="edit-button" />
    <video
      ref="videoEl"
      class="entry-video"
      :src="videoSrc"
      muted
      playsinline
      preload="auto"
    />
    <div v-if="!playing" class="tap-overlay">
      <h1 class="entry-names">{{ brideName }} &amp; {{ groomName }}</h1>
      <p v-if="weddingDate" class="entry-date">{{ weddingDate }}</p>
      <p class="tap-text">{{ tapLabel }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue';

/* ── video file map ───────────────────────────────────────── */
const videoModules = import.meta.glob('./*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
});
const v = (name) => videoModules[`./${name}`];

const VIDEO_MAP = {
  // Doors
  'baroque-doors':  v('openart-video_148e9212_1773869441417.mp4'),
  'rustic-doors':   v('openart-video_3210ed8f_1773869833107.mp4'),
  'white-doors':    v('openart-video_814e58ec_1773870781663.mp4'),
  'french-doors':   v('openart-video_d28f0e7c_1773868981426.mp4'),
  // Envelopes
  'blue-red-seal':  v('openart-video_44b1400b_1773867415302.mp4'),
  'white-blue-seal':v('openart-video_4f501a62_1774005803314.mp4'),
  'white-gold-seal':v('openart-video_6da1c98d_1773865981178.mp4'),
  'red-blue-seal':  v('openart-video_d9dacd6d_1773867277123.mp4'),
  'blue-blue-seal': v('openart-video_dc0dba14_1773866968350.mp4'),
  // Curtains
  'red-curtain':    v('openart-video_5ee6cc7a_1773868355150.mp4'),
  'red-curtain-dark':v('openart-video_68bbed7e_1773868136367.mp4'),
};

/* ── props / emits ────────────────────────────────────────── */
defineProps({
  visible: { type: Boolean, default: true },
  brideName: { type: String, required: true },
  groomName: { type: String, required: true },
  weddingDate: { type: String, default: '' },
  tapLabel: { type: String, default: 'Tap to open' },
  photos: { type: Array, default: () => [] },
});

const emit = defineEmits(['enter', 'fading']);

/* ── which video to show (provided by InvitationEntry) ──── */
const entryDesign = inject('entryDesign', ref('1'));

const firstVideo = Object.values(VIDEO_MAP)[0] || '';
const videoSrc = computed(() => VIDEO_MAP[entryDesign.value] || firstVideo);

/* ── state ────────────────────────────────────────────────── */
const videoEl = ref(null);
const playing = ref(false);
const fading = ref(false);

/* ── reset when video changes (edit-mode preview) ────────── */
watch(videoSrc, () => {
  playing.value = false;
  fading.value = false;
  const video = videoEl.value;
  if (video) {
    video.pause();
    video.currentTime = 0;
  }
});

/* ── enter logic ──────────────────────────────────────────── */
function enterSite() {
  if (playing.value) return;
  playing.value = true;

  const video = videoEl.value;
  if (video) {
    video.currentTime = 0;
    video.play().catch(() => {});
  }

  // 3 s of playback, then 1 s fade-out  ≈ 4 s total
  setTimeout(() => {
    fading.value = true;
    emit('fading');
    setTimeout(() => {
      if (video) video.pause();
      emit('enter');
    }, 1000);
  }, 3000);
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
  background: #000;
  transition: opacity 1s ease;
  overflow: hidden;
}
.entry-overlay.entry-fading {
  opacity: 0;
  pointer-events: none;
}

.entry-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tap-overlay {
  position: relative;
  z-index: 1;
  text-align: center;
  color: #fff;
  padding: 0 24px;
}
.entry-names {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 36px;
  margin: 0 0 8px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}
.entry-date {
  font-size: 16px;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0 0 32px;
  opacity: 0.9;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
}
.tap-text {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 18px;
  font-style: italic;
  opacity: 0.8;
  margin: 0;
  animation: float-hint 6s ease-in-out infinite;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

@keyframes float-hint {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@container (min-width: 768px) {
  .entry-names {
    font-size: 48px;
  }
}
</style>
