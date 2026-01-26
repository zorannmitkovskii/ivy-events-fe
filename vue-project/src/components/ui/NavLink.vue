<template>
  <a :href="href" class="navbar__link"><slot>{{ label }}</slot></a>
</template>

<script setup>
const props = defineProps({
  label: { type: String, default: '' },
  href: { type: String, default: '#' },
})
</script>

<style scoped>
@import '@/assets/styles/navbar.css';
</style>
