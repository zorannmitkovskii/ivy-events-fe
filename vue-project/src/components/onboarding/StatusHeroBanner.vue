<template>
  <div class="status-hero" :class="bgClass">
    <div class="status-hero__badge" aria-hidden="true">
      <slot name="icon">✓</slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  bgClass: { type: String, default: "" } // allow custom background class
});
</script>

<style scoped>
.status-hero {
  height: 120px;
  border-radius: 18px 18px 0 0;
  position: relative;
  overflow: hidden;

  /* soft confetti-like look */
  background:
    radial-gradient(circle at 20% 30%, rgba(225, 198, 153, 0.35) 0 18px, transparent 19px),
    radial-gradient(circle at 70% 20%, rgba(191, 210, 164, 0.35) 0 14px, transparent 15px),
    radial-gradient(circle at 85% 70%, rgba(237, 110, 105, 0.25) 0 12px, transparent 13px),
    linear-gradient(180deg, rgba(191, 210, 164, 0.25), rgba(255, 255, 255, 0));
}

.status-hero__badge {
  position: absolute;
  left: 50%;
  bottom: -22px;
  transform: translateX(-50%);

  width: 56px;
  height: 56px;
  border-radius: 999px;

  display: grid;
  place-items: center;

  background: var(--bg-white);
  box-shadow: var(--shadow-md);
  color: var(--success);
  font-weight: 900;
  font-size: 22px;

  border: 1px solid rgba(0,0,0,0.05);
}
</style>
