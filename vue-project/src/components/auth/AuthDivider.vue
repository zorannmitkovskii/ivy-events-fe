<template>
  <div class="divider">
    <span class="divider__line"></span>
    <span class="divider__text">{{ label }}</span>
    <span class="divider__line"></span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: "Or continue with email" }
});
</script>

<style scoped>
.divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
  margin: 16px 0;
  color: rgba(51, 67, 56, 0.55);
  font-size: 12px;
}

.divider__line {
  height: 1px;
  background: rgba(0,0,0,0.08);
}

.divider__text {
  white-space: nowrap;
}
</style>
