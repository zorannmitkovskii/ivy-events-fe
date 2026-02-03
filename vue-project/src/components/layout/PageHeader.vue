<template>
  <div class="head">
    <div>
      <h1 class="title">{{ title }}</h1>
      <p v-if="subtitle" class="sub">{{ subtitle }}</p>
    </div>
    <div class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.title {
  margin: 0;
  font-family: var(--font-family), serif;
  color: var(--neutral-900);
}
.sub { margin: 6px 0 0; color: var(--neutral-700); }
.actions { display: flex; gap: 10px; flex-wrap: wrap; }
</style>
