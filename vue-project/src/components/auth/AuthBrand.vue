<template>
  <div class="brand">
    <div class="brand__dot" aria-hidden="true"></div>
    <span class="brand__text">{{ name }}</span>
  </div>
</template>

<script setup>
defineProps({
  name: { type: String, default: "IvyEvents" }
});
</script>

<style scoped>
.brand {
  width: 100%;
  max-width: 420px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 22px;
}

.brand__dot {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--brand-gold);
  box-shadow: 0 6px 18px rgba(0,0,0,0.14) inset;
}

.brand__text {
  color: var(--neutral-900);
  font-weight: 700;
  font-size: 14px;
}
</style>
