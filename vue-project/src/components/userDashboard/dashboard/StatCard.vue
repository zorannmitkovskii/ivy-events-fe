<template>
  <div class="stat-card">
    <small class="text-muted">{{ label }}</small>
    <h3 class="mt-2 fw-bold text-brand-dark">{{ value }}</h3>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type:[String,Number], required: true }
})
</script>

<style scoped>
</style>
