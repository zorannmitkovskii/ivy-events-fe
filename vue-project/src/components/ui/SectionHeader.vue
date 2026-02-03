<template>
  <header class="section-header">
    <h2 class="section-title">{{ title }}</h2>
    <p v-if="subtitle" class="section-subtitle">{{ subtitle }}</p>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" }
});
</script>

<style scoped>
.section-header {
  text-align: center;
  margin-bottom: 40px;
}

.section-title {
  font-family: var(--font-family), serif;
  font-size: 42px;
  font-weight: 500;
  color: var(--brand-main);
  margin: 0 0 10px;
}

.section-subtitle {
  margin: 0;
  color: var(--brand-dark);
  font-size: 16px;
}
</style>
