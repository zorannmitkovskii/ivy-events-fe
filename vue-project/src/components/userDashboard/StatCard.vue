<template>
  <div class="stat-card p-4 rounded shadow-sm bg-white">
    <h5 class="text-brand-dark">{{ title }}</h5>
    <h2 class="fw-bold mt-2">{{ value }}</h2>
  </div>
</template>


<script setup>
defineProps(['title', 'value'])
</script>


<style scoped>
.stat-card {
  border-left: 6px solid var(--logo-brown);
}
</style>
