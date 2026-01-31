<template>
  <header class="header">
    <div class="icon" aria-hidden="true">{{ icon }}</div>
    <h2 class="title">{{ title }}</h2>
    <p class="subtitle">{{ subtitle }}</p>
  </header>
</template>

<script setup>
defineProps({
  icon: { type: String, default: "✨" },
  title: { type: String, required: true },
  subtitle: { type: String, required: true }
});
</script>

<style scoped>
.header {
  text-align: center;
  display: grid;
  gap: 8px;
  justify-items: center;
}

.icon {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: rgba(191, 210, 164, 0.25);
  display: grid;
  place-items: center;
  color: var(--brand-main);
  font-size: 16px;
}

.title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--neutral-900);
}

.subtitle {
  margin: 0;
  font-size: 12px;
  color: rgba(51, 67, 56, 0.65);
  max-width: 420px;
}
</style>
