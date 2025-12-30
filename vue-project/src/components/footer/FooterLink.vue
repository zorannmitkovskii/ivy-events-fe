<template>
  <li class="mb-2">
    <router-link class="nav-link text-brand-dark" :to="to">{{ label }}</router-link>
  </li>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  to: { type: String, required: true }
})
</script>

<style scoped>
</style>
