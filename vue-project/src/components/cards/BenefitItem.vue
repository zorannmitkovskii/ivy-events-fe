<template>
  <div class="flex items-center gap-12">
    <span class="badge--icon"><slot name="icon">✅</slot></span>
    <div>
      <div class="card__title">{{ title }}</div>
      <div class="card__subtitle"><slot>{{ description }}</slot></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<style scoped>
@import '@/assets/styles/cards.css';
@import '@/assets/styles/utilities.css';
</style>
