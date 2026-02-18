<template>
  <li class="feature" :class="{ 'feature--disabled': !included }">
    <span class="feature__icon" aria-hidden="true">
      {{ included ? "✓" : "✕" }}
    </span>
    <span class="feature__text">
      <slot />
    </span>
  </li>
</template>

<script setup>
defineProps({
  included: { type: Boolean, default: true }
});
</script>

<style scoped>
.feature {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--brand-main);
}

.feature__icon {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  font-size: 12px;
  font-weight: 800;

  background: rgba(191, 210, 164, 0.65); /* sage */
  color: var(--brand-main);
}

.feature--disabled {
  color: rgba(255, 255, 255, 0.0);
}

.feature--disabled .feature__text {
  color: rgba(51, 67, 56, 0.55);
}

.feature--disabled .feature__icon {
  background: rgba(51, 67, 56, 0.10);
  color: rgba(51, 67, 56, 0.55);
}
</style>
