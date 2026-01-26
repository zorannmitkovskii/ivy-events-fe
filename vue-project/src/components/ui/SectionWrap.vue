<template>
  <section :class="['section', alt && 'section--alt']">
    <div class="container">
      <slot />
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  alt: { type: Boolean, default: false }
})
</script>

<style scoped>
@import '@/assets/styles/variables.css';
@import '@/assets/styles/sections.css';
</style>
