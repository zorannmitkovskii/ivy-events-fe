<template>
  <router-link to="/" class="brand-logo">
    IvyEvents
  </router-link>
</template>

<script setup>
</script>

<style scoped>
.brand-logo {
  font-weight: 700;
  font-size: 1.75rem; /* fs-3 equivalent */
  color: var(--primary-main);
  text-decoration: none;
  cursor: pointer;
}

.brand-logo:hover {
  opacity: 0.8;
}
</style>
