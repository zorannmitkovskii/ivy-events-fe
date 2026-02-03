<template>
  <div class="row">
    <span class="label">{{ label }}</span>
    <span class="value" :class="valueClass">{{ value }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  valueClass: { type: String, default: "" }
});
</script>

<style scoped>
.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.label {
  font-size: 12px;
  color: rgba(51, 67, 56, 0.70);
}

.value {
  font-size: 12px;
  font-weight: 800;
  color: var(--neutral-900);
}

.value.savings {
  color: var(--brand-gold);
}

.value.total {
  font-size: 16px;
}
</style>
