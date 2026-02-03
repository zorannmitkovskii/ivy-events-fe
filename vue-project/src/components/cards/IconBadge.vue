<template>
  <span class="badge--icon">
    <slot name="icon">🔰</slot>
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
const props = defineProps({
  label: { type: String, default: '' },
})
</script>

<style scoped>
@import '@/assets/styles/cards.css';
</style>
