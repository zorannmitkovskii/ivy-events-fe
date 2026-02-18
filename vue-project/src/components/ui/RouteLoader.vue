<template>
  <Transition name="loader">
    <div v-if="loadingStore.isNavigating" class="route-loader">
      <div class="route-loader__bar"></div>
      <div class="route-loader__overlay">
        <div class="route-loader__spinner"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { loadingStore } from "@/store/loading.store";
</script>

<style scoped>
.route-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

/* Top progress bar */
.route-loader__bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--brand-gold, #c8a24d);
  animation: loader-progress 1.8s ease-in-out infinite;
  transform-origin: left;
  border-radius: 0 2px 2px 0;
}

/* Centered spinner overlay */
.route-loader__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
}

.route-loader__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--neutral-200, #e5e7eb);
  border-top-color: var(--brand-gold, #c8a24d);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes loader-progress {
  0% { transform: scaleX(0); }
  50% { transform: scaleX(0.7); }
  100% { transform: scaleX(1); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transition */
.loader-enter-active { transition: opacity 0.15s ease; }
.loader-leave-active { transition: opacity 0.25s ease; }
.loader-enter-from,
.loader-leave-to { opacity: 0; }
</style>
