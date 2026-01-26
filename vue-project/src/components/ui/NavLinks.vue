<template>
  <div class="navbar__links">
    <NavLink v-for="(l, i) in links" :key="i" :label="l.label" :href="l.to" />
  </div>
</template>

<script setup>
import NavLink from './NavLink.vue'

const props = defineProps({
  links: { type: Array, default: () => [] }
})
</script>

<style scoped>
@import '@/assets/styles/navbar.css';
</style>
